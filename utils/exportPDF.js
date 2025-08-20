import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPDF = async (target, filename = "document.pdf") => {
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

  // หา pages ทีละหน้า
  const pages = Array.from(root.querySelectorAll("[data-pdf-page]"));
  if (pages.length === 0) {
    pages.push(root);
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth(); 
  const pdfH = pdf.internal.pageSize.getHeight(); 

  // ฟังก์ชันแคปเจอร์ 1 หน้า
  const capture = async (el) => {
    const canvas = await html2canvas(el, {
      scale: Math.max(window.devicePixelRatio || 1, 2),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      logging: false,
    });
    return canvas;
  };

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await capture(pageEl);

      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const imgData = canvas.toDataURL("image/png");

      if (i > 0) pdf.addPage();

      const h = Math.min(imgH, pdfH);
      const w = (canvas.width * h) / canvas.height; 
      const x = (pdfW - w) / 2;
      const y = 0;

      pdf.addImage(imgData, "PNG", x, y, w, h);
    }

    pdf.save(filename);
  } catch (err) {
    console.error("exportElementToPDF: Export PDF ล้มเหลว", err);
  }
};
