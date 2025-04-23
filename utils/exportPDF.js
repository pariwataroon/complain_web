import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPDF = async (
  elementRef,
  filename = "document.pdf"
) => {
  const element = elementRef?.current;
  if (!element) {
    console.error("exportElementToPDF: ไม่พบ element ที่ต้องการ export");
    return;
  }

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("exportElementToPDF: Export PDF ล้มเหลว", error);
  }
};
