import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export report data to a beautifully formatted A4 PDF
 * @param {Object} options
 * @param {string} options.title - Report title
 * @param {string} options.subtitle - Subtitle line
 * @param {string} options.agency - Agency name
 * @param {Array<{label: string, width: number, align?: string}>} options.columns - Column definitions
 * @param {Array<Object>} options.data - Array of row data objects (keys match column label)
 * @param {string} options.filename - Output filename
 * @param {"portrait"|"landscape"} options.orientation - Page orientation (default: "portrait")
 * @param {number} options.fontSize - Base font size in px (default: 14)
 * @param {Function} [options.getChildRows] - Optional: (parentItem, idx) => array of child row data
 * @param {Array<string>} [options.centerColumns] - Labels of columns to center-align
 */
export const exportReportToPDF = async ({
  title = "",
  subtitle = "",
  agency = "หน่วยงาน กระทรวงการคลัง",
  columns = [],
  data = [],
  filename = "report.pdf",
  orientation = "portrait",
  fontSize = 14,
  getChildRows = null,
  centerColumns = [],
}) => {
  if (!data || data.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ export PDF");
    return;
  }

  // A4 dimensions
  const isLandscape = orientation === "landscape";
  const pageW = isLandscape ? 297 : 210;
  const pageH = isLandscape ? 210 : 297;
  const marginMM = 10;
  const usableW = pageW - marginMM * 2;

  // Container width = A4 usable width in pixels
  const pxPerMM = 3.78;
  const containerW = Math.round(usableW * pxPerMM);

  // Column widths as percentages
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);

  // Build table header
  const headerCells = columns.map((col) => {
    const pct = ((col.width || 100) / totalWidth * 100).toFixed(2);
    return `<th style="
      width: ${pct}%;
      background-color: #D9D9D9;
      font-weight: bold;
      font-size: ${fontSize}px;
      padding: 6px 4px;
      text-align: center;
      border: 1px solid #333;
      vertical-align: middle;
    ">${col.label}</th>`;
  }).join("");

  // Build data rows
  let rowIndex = 0;
  let bodyHTML = "";

  data.forEach((item, idx) => {
    const isEven = rowIndex % 2 === 0;
    const bgColor = isEven ? "#FFFFFF" : "#F5F5F5";
    rowIndex++;

    const cells = columns.map((col) => {
      const align = centerColumns.includes(col.label) ? "center" : (col.align || "left");
      return `<td style="
        font-size: ${fontSize}px;
        padding: 4px 6px;
        text-align: ${align};
        border: 1px solid #333;
        vertical-align: middle;
        background-color: ${bgColor};
      ">${item[col.label] ?? "-"}</td>`;
    }).join("");

    bodyHTML += `<tr>${cells}</tr>`;

    // Child rows
    if (getChildRows) {
      const children = getChildRows(item, idx);
      if (children && children.length > 0) {
        children.forEach((child) => {
          const isChildEven = rowIndex % 2 === 0;
          const childBgColor = isChildEven ? "#FFFFFF" : "#FFFDE7";
          rowIndex++;

          const childCells = columns.map((col) => {
            const align = centerColumns.includes(col.label) ? "center" : (col.align || "left");
            return `<td style="
              font-size: ${fontSize - 1}px;
              padding: 3px 6px;
              text-align: ${align};
              border: 1px solid #333;
              vertical-align: middle;
              background-color: ${childBgColor};
              color: #444;
            ">${child[col.label] ?? ""}</td>`;
          }).join("");

          bodyHTML += `<tr>${childCells}</tr>`;
        });
      }
    }
  });

  // Build full HTML content
  const fullHTML = `
    <div style="text-align: center; padding: 8px 0 4px 0; font-size: ${fontSize + 2}px; font-weight: bold;">
      ${title}
    </div>
    ${subtitle ? `<div style="text-align: center; padding: 2px 0; font-size: ${fontSize}px;">${subtitle}</div>` : ""}
    <div style="text-align: center; padding: 2px 0 8px 0; font-size: ${fontSize}px;">
      ${agency}
    </div>
    <table style="
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    ">
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${bodyHTML}
      </tbody>
    </table>
  `;

  // Create a wrapper div that holds the content
  // Use position: fixed to overlay on top of everything - this ensures html2canvas can see it
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${containerW}px;
    background: white;
    font-family: "Cordia New", "TH Sarabun New", "Sarabun", sans-serif;
    font-size: ${fontSize}px;
    line-height: 1.4;
    color: #000;
    padding: 0;
    margin: 0;
    z-index: 99999;
    overflow: visible;
  `;
  wrapper.innerHTML = fullHTML;

  document.body.appendChild(wrapper);

  // Wait for DOM to fully render
  await new Promise((r) => setTimeout(r, 300));

  try {
    // Capture - use same approach as the working exportElementToPDF
    const canvas = await html2canvas(wrapper, {
      scale: Math.max(window.devicePixelRatio || 1, 2),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      windowWidth: wrapper.scrollWidth,
      windowHeight: wrapper.scrollHeight,
      logging: false,
    });

    // Create PDF and split into A4 pages
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const usableWidthMM = pageW - marginMM * 2;
    const usableHeightMM = pageH - marginMM * 2;
    const mmPerPx = usableWidthMM / canvas.width;
    const pageHeightPx = Math.floor(usableHeightMM / mmPerPx);

    let currentTopPx = 0;
    let pageIndex = 0;

    while (currentTopPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - currentTopPx);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const sctx = sliceCanvas.getContext("2d");
      sctx.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in sctx) sctx.imageSmoothingQuality = "high";
      sctx.drawImage(
        canvas,
        0, currentTopPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );

      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightMM = Math.min(sliceHeightPx * mmPerPx, usableHeightMM);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(sliceData, "PNG", marginMM, marginMM, usableWidthMM, sliceHeightMM);

      currentTopPx += sliceHeightPx;
      pageIndex++;
    }

    pdf.save(filename);
  } catch (err) {
    console.error("exportReportToPDF failed:", err);
  } finally {
    document.body.removeChild(wrapper);
  }
};
