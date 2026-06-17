import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPDF = async (target, filename = "document.pdf", orientation = "p") => {
  let root = null;
  if (target && typeof target === "object" && "current" in target) {
    root = target.current;
  } else if (typeof target === "string") {
    root = document.getElementById(target) || document.querySelector(target);
  } else if (target instanceof Element) {
    root = target;
  }
  if (!root) {
    console.error("exportElementToPDF: ไม่พบ element ที่ต้องการ export");
    return;
  }

  const pdf = new jsPDF(orientation, "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  const marginMM = 5;
  const usableW = pdfW - marginMM * 2;
  const usableH = pdfH - marginMM * 2;

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    logging: false,
  });

  try {
    const mmPerPx = usableW / canvas.width;
    const pageHeightPx = Math.floor(usableH / mmPerPx);

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

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.80);
      const sliceHeightMM = Math.min(sliceHeightPx * mmPerPx, usableH);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(sliceData, "JPEG", marginMM, marginMM, usableW, sliceHeightMM);

      currentTopPx += sliceHeightPx;
      pageIndex++;
    }

    pdf.save(filename);
  } catch (err) {
    console.error("exportElementToPDF: Export PDF ล้มเหลว", err);
  }
};
