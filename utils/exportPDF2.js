import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPDF2 = async (target, filename = "document.pdf") => {
  let root = null;

  if (target && typeof target === "object" && "current" in target) {
    root = target.current;
  } else if (typeof target === "string") {
    root = document.getElementById(target) || document.querySelector(target);
  } else if (target instanceof Element) {
    root = target;
  }

  if (!root) {
    console.error("❌ exportElementToPDF: ไม่พบ element ที่ต้องการ export");
    return;
  }

  // ✅ ปรับฟอนต์ทุก element ให้ใหญ่ขึ้นจริง
  const elements = root.querySelectorAll("*");
  const originalStyles = [];
  elements.forEach((el) => {
    originalStyles.push({ el, fontSize: el.style.fontSize });
    el.style.fontSize = "22px"; // ✅ ขนาดใหญ่ชัด
  });

  // ✅ เตรียม pdf และค่าหน้า
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  // ✅ Capture ทั้ง element ด้วยความละเอียดสูง
  const canvas = await html2canvas(root, {
    scale: 4, // ✅ เพิ่มความคมชัด
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  // ✅ วาดภาพเต็มหน้ากระดาษ (ไม่มีขอบ)
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

  // ✅ คืนค่าฟอนต์เดิม
  originalStyles.forEach(({ el, fontSize }) => (el.style.fontSize = fontSize));

  pdf.save(filename);
  console.log(`✅ Export PDF สำเร็จ: ${filename}`);
};