import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * - marginTop เริ่มต้น 10mm
 * - marginBottom เริ่มต้น 10mm
 * - ฟอนต์ทุก element = 22px
 * - หั่น canvas เป็นหน้า ๆ (ไม่ซ้ำ/ไม่เกิดเส้นคั่น)
 * - forcePageBreakSelectors: บล็อกที่ถ้าพื้นที่ไม่พอจะขึ้นหน้าใหม่ทั้งก้อน
 */
export const exportElementToPDF2 = async (
  target,
  filename = "document.pdf",
  options = {
    marginTop: 7,
    marginBottom: 10,
    forcePageBreakSelectors: [
      '[data-pdf-section="complaint-detail"]',
      '#complaint-detail',
    ],
  }
) => {
  let root = null;
  if (target && typeof target === "object" && "current" in target) root = target.current;
  else if (typeof target === "string") root = document.getElementById(target) || document.querySelector(target);
  else if (target instanceof Element) root = target;
  if (!root) { console.error("❌ exportElementToPDF: ไม่พบ element ที่ต้องการ export"); return; }

  // ✅ ฟอนต์ 22px
  const elements = root.querySelectorAll("*");
  const originalStyles = [];
  elements.forEach((el) => {
    originalStyles.push({ el, fontSize: el.style.fontSize });
    el.style.fontSize = "22px";
  });

  const getOffsetTopRelRoot = (el, rootEl) => {
    let y = 0, n = el;
    while (n && n !== rootEl) { y += n.offsetTop; n = n.offsetParent; }
    return y;
  };

  const forceBlocks = [];
  (options.forcePageBreakSelectors || []).forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      const top = getOffsetTopRelRoot(el, root);
      forceBlocks.push({ topPx: top, heightPx: el.offsetHeight });
    });
  });

  const canvas = await html2canvas(root, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    logging: false,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  const marginTop = options.marginTop ?? 10;
  const marginBottom = options.marginBottom ?? 10;

  const usableHeightMM = pdfH - marginTop - marginBottom;     // ✅ พื้นที่ที่วางได้/หน้า
  const mmPerPx = pdfW / canvas.width;
  const pageHeightPx = Math.floor(usableHeightMM / mmPerPx);

  let currentTopPx = 0;
  let pageIndex = 0;

  while (currentTopPx < canvas.height) {
    let nextBreakPx = Math.min(currentTopPx + pageHeightPx, canvas.height);

    // ✅ ดันบล็อกที่ไม่ให้ตัดกลางขึ้นหน้าใหม่ทั้งก้อน
    for (const blk of forceBlocks) {
      const blkStart = blk.topPx;
      const fallsInThisPage = blkStart > currentTopPx && blkStart < nextBreakPx;
      const blockFits = blk.heightPx <= (nextBreakPx - blkStart);
      if (fallsInThisPage && !blockFits) nextBreakPx = blkStart;
    }

    let sliceHeightPx = nextBreakPx - currentTopPx;
    if (sliceHeightPx <= 0) {
      nextBreakPx = Math.min(currentTopPx + pageHeightPx, canvas.height);
      sliceHeightPx = nextBreakPx - currentTopPx;
    }

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const sctx = sliceCanvas.getContext("2d");
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(
      canvas,
      0, currentTopPx, canvas.width, sliceHeightPx,
      0, 0,           canvas.width, sliceHeightPx
    );

    const sliceData = sliceCanvas.toDataURL("image/png");
    const sliceHeightMM = Math.min(sliceHeightPx * mmPerPx, usableHeightMM); // ✅ ไม่ให้เกินพื้นที่ใช้สอย

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, "PNG", 0, marginTop, pdfW, sliceHeightMM);       // ✅ วางที่ y = marginTop

    currentTopPx = nextBreakPx;
    pageIndex += 1;
  }

  // คืนสไตล์เดิม
  originalStyles.forEach(({ el, fontSize }) => (el.style.fontSize = fontSize));
  pdf.save(filename);
};
