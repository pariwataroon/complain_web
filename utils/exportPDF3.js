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
    scale = 2,
    // ✅ ขนาด font สำหรับหัวข้อหลัก (โลโก้ + ชื่อเอกสาร)
    headerFontSizePx = 48,
    // ✅ ขนาด font ที่เล็กลง (สำหรับช่องทางเรื่องร้องเรียน)
    smallTextFontSizePx = 24,
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
    originalStyles.push({
      el,
      fontSize: el.style.fontSize,
      lineHeight: el.style.lineHeight,
      width: el.style.width,
      height: el.style.height,
    });

    // ✅ ถ้าเป็น logo ให้ขยายขนาดรูป
    if (el.classList.contains('pdf-header-logo')) {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img) {
        const scaleRatio = headerFontSizePx / fontSizePx; // 48/32 = 1.5
        const currentWidth = parseInt(img.getAttribute('width') || img.width || 100);
        const currentHeight = parseInt(img.getAttribute('height') || img.height || 100);
        img.style.width = `${currentWidth * scaleRatio}px`;
        img.style.height = `${currentHeight * scaleRatio}px`;
      }
    }

    // ✅ กำหนดขนาด font ตาม class
    let targetFontSize = fontSizePx; // default

    if (el.classList.contains('pdf-header-title')) {
      targetFontSize = headerFontSizePx; // หัวข้อใหญ่ขึ้น
    } else if (el.classList.contains('pdf-small-text')) {
      targetFontSize = smallTextFontSizePx; // ข้อความเล็กลง
    }

    el.style.fontSize = `${targetFontSize}px`;
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

    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.80);
    const sliceHeightMM = Math.min(sliceHeightPx * mmPerPx, usableHeightMM);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, "JPEG", marginLeft, marginTop, usableWidthMM, sliceHeightMM);

    currentTopPx = nextBreakPx;
    pageIndex += 1;
  }

  // restore styles
  originalStyles.forEach(({ el, fontSize, lineHeight: lh, width, height }) => {
    el.style.fontSize = fontSize;
    el.style.lineHeight = lh;
    el.style.width = width;
    el.style.height = height;

    // ✅ restore รูปภาพใน logo
    if (el.classList.contains('pdf-header-logo')) {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img) {
        img.style.width = width;
        img.style.height = height;
      }
    }
  });

  pdf.save(filename);
};
