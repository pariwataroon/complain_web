import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPDF3 = async (target, filename = "document.pdf", options = {}) => {
  const {
    marginTop = 10,
    marginBottom = 10,
    marginLeft = 4,
    marginRight = 4,
    fontSizePx = 32,
    lineHeight = 1.7,
    // ปกติ (กรณีไม่มีผู้รับมอบฯ) จะขึ้นหน้าใหม่ก่อน "รายละเอียดเรื่องร้องทุกข์"
    pageBreakBeforeSelectors = ["#complaint-detail-section"],
    // กันการผ่ากลางบล็อก (ไม่ทำให้ขึ้นหน้าใหม่เองถ้าบล็อกทั้งก้อนพอดี)
    forcePageBreakSelectors = ["#complaint-detail", '[data-pdf-section="complaint-detail"]'],
    scale = 3,
  } = options;

  // ---- resolve root ----
  let root = null;
  if (target && typeof target === "object" && "current" in target) root = target.current;
  else if (typeof target === "string") root = document.getElementById(target) || document.querySelector(target);
  else if (typeof window !== "undefined" && target instanceof Element) root = target;
  if (!root) { console.error("❌ exportElementToPDF: ไม่พบ element ที่ต้องการ export"); return; }

  // ---- bump font ----
  const els = root.querySelectorAll("*");
  const originalStyles = [];
  els.forEach((el) => {
    originalStyles.push({ el, fontSize: el.style.fontSize, lineHeight: el.style.lineHeight });
    el.style.fontSize = `${fontSizePx}px`;
    el.style.lineHeight = el.style.lineHeight || String(lineHeight);
  });

  // ---- helpers (CSS px → Canvas px) ----
  const rootRect = root.getBoundingClientRect();
  const toCanvasPx = (cssPx) => Math.round(cssPx * scale);
  const topCanvasPx = (el) => toCanvasPx(el.getBoundingClientRect().top - rootRect.top);
  const heightCanvasPx = (el) => toCanvasPx(el.getBoundingClientRect().height);

  // กันผ่ากลางบล็อก
  const forceBlocks = [];
  (forcePageBreakSelectors || []).forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      forceBlocks.push({ topPx: topCanvasPx(el), heightPx: heightCanvasPx(el) });
    });
  });

  // ---- hard breaks (ขึ้นหน้าใหม่ก่อนบล็อก) ----
  const hardSelectors = new Set(pageBreakBeforeSelectors || []);

  // ✅ กรณีมีผู้รับมอบอำนาจร้องเรียน → บังคับขึ้นหน้าใหม่ก่อน "ข้อมูลเรื่องร้องทุกข์"
  const hasDelegate = !!root.querySelector("#delegate-section");
  if (hasDelegate && root.querySelector("#complaint-info-section")) {
    hardSelectors.add("#complaint-info-section");      // ขึ้นหน้าใหม่ตรงนี้
    hardSelectors.delete("#complaint-detail-section"); // ยกเลิก break ก่อน "รายละเอียด…" เพื่อให้ต่อท้ายได้
  }

  const hardBreaks = [];
  hardSelectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      hardBreaks.push(topCanvasPx(el));
    });
  });
  hardBreaks.sort((a, b) => a - b);

  // ---- render ----
  const canvas = await html2canvas(root, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    logging: false,
  });

  // ---- pdf metrics ----
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const usableWidthMM  = pdfW - marginLeft - marginRight;
  const usableHeightMM = pdfH - marginTop - marginBottom;
  const mmPerPx = usableWidthMM / canvas.width;
  const pageHeightPx = Math.floor(usableHeightMM / mmPerPx);

  // ---- paging loop ----
  let currentTopPx = 0;
  let pageIndex = 0;

  while (currentTopPx < canvas.height) {
    let nextBreakPx = Math.min(currentTopPx + pageHeightPx, canvas.height);

    // hard break อยู่ภายในหน้า → ตัดที่จุดนั้น
    const nextHard = hardBreaks.find((bp) => bp > currentTopPx && bp < nextBreakPx);
    if (typeof nextHard === "number") nextBreakPx = nextHard;

    // กันผ่ากลางก้อน
    for (const blk of forceBlocks) {
      const falls = blk.topPx > currentTopPx && blk.topPx < nextBreakPx;
      const fits  = blk.heightPx <= (nextBreakPx - blk.topPx);
      if (falls && !fits) nextBreakPx = blk.topPx;
    }

    let sliceHeightPx = nextBreakPx - currentTopPx;
    if (sliceHeightPx <= 0) {
      nextBreakPx = Math.min(currentTopPx + pageHeightPx, canvas.height);
      sliceHeightPx = nextBreakPx - currentTopPx;
    }

    // slice
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const sctx = sliceCanvas.getContext("2d");
    sctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in sctx) sctx.imageSmoothingQuality = "high";
    sctx.drawImage(canvas, 0, currentTopPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    const sliceData = sliceCanvas.toDataURL("image/png");
    const sliceHeightMM = Math.min(sliceHeightPx * mmPerPx, usableHeightMM);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, "PNG", marginLeft, marginTop, usableWidthMM, sliceHeightMM);

    currentTopPx = nextBreakPx;
    pageIndex += 1;
  }

  // restore styles
  originalStyles.forEach(({ el, fontSize, lineHeight: lh }) => {
    el.style.fontSize = fontSize;
    el.style.lineHeight = lh;
  });

  pdf.save(filename);
};
