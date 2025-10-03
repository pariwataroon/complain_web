import React from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Button from "@mui/material/Button";

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
function formatThaiDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
}

const DetailOPMExportPDF = ({
  caseDetails = {},
  operatingsDetails = [],
  accountData = {},
  customerData = {},
}) => {
  const handleExportPDF = async () => {
    // pdfmake@0.2.x - import แบบ dynamic และใช้ addVirtualFileSystem + addFonts
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
    const pdfMake = pdfMakeModule.default || pdfMakeModule;

    // 1. เพิ่มไฟล์ฟอนต์เข้า virtual file system
    pdfMake.addVirtualFileSystem(pdfFontsModule);

    // 2. เพิ่มชุดฟอนต์ Roboto (ใช้ชื่อไฟล์ ไม่ใช่ base64)
    pdfMake.addFonts({
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
    });

    const docDefinition = {
      content: [
        { text: "ระบบการจัดการเรื่องราวร้องทุกข์", fontSize: 18, bold: true },
        {
          text: "สำนักงานปลัดกระทรวงการคลัง",
          fontSize: 16,
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            { text: `รหัสเรื่อง : ${caseDetails.case_code || "-"}` },
            {
              text: `วันที่เปิดคำร้อง : ${formatThaiDate(caseDetails.date_opened)}`,
              alignment: "right",
            },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          columns: [
            { text: `ผู้ยื่นเรื่อง : ${accountData.fullName || "-"}` },
            {
              text: `ประเภท : ${caseDetails.type_text || "-"}`,
              alignment: "right",
            },
          ],
        },
        {
          columns: [{ text: `สถานะ : ${caseDetails.status_text || "-"}` }],
        },
        {
          columns: [
            { text: `วัตถุประสงค์ : ${caseDetails.objective_text || "-"}` },
            {
              text: `ช่องทางรับเรื่อง : ${caseDetails.channel_incoming_text || "-"}`,
              alignment: "right",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          text: "ข้อมูลผู้ยื่นคำร้อง",
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          ul: [
            `ชื่อ-นามสกุล : ${accountData.fullName || "-"}`,
            `เลขบัตรประชาชน : ${accountData.citizenId || "-"}`,
            `อีเมล : ${accountData.contacts?.find((c) => c.detail_type === "E")?.detail || "-"}`,
            `เบอร์โทรศัพท์ : ${accountData.contacts?.filter((c) => c.detail_type === "M").map((c) => c.detail).join(" , ") || "-"}`,
            `ที่อยู่ : ${accountData.address
              ? [
                  accountData.address.address || "",
                  accountData.address.subdistrict || "",
                  accountData.address.district || "",
                  accountData.address.province || "",
                  accountData.address.postcode || "",
                ]
                  .filter(Boolean)
                  .join(" ")
              : "-"}`,
          ],
        },

        customerData.fullName && customerData.fullName !== "-" && {
          text: "ข้อมูลผู้เดือดร้อน",
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        customerData.fullName && customerData.fullName !== "-" && {
          ul: [
            `ชื่อ-นามสกุล : ${customerData.fullName || "-"}`,
            `เลขบัตรประชาชน : ${customerData.citizenId || "-"}`,
            `อีเมล : ${customerData.contacts?.find((c) => c.detail_type === "E")?.detail || "-"}`,
            `เบอร์โทรศัพท์ : ${customerData.contacts?.filter((c) => c.detail_type === "M").map((c) => c.detail).join(" , ") || "-"}`,
            `ที่อยู่ : ${customerData.address
              ? [
                  customerData.address.address || "",
                  customerData.address.subdistrict || "",
                  customerData.address.district || "",
                  customerData.address.province || "",
                  customerData.address.postcode || "",
                ]
                  .filter(Boolean)
                  .join(" ")
              : "-"}`,
          ],
        },

        {
          text: "รายละเอียดและสรุป",
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          text: `รายละเอียด: ${caseDetails.detail || "-"}`,
          margin: [0, 0, 0, 3],
        },
        { text: `สรุป: ${caseDetails.summary || "-"}` },

        {
          text: "ขั้นตอนการดำเนินงาน",
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        {
          table: {
            headerRows: 1,
            widths: [30, "*", 60, 45, 75],
            body: [
              [
                { text: "ลำดับ", style: "tableHeader" },
                { text: "ขั้นตอน", style: "tableHeader" },
                { text: "สถานะ", style: "tableHeader" },
                { text: "วันที่", style: "tableHeader" },
                { text: "ผู้ดำเนินการ", style: "tableHeader" },
              ],
              ...operatingsDetails.map((step, idx) => [
                step.line || idx + 1,
                step.operating_type_text || "-",
                step.status_text || "-",
                step.ShowDateTime || "-",
                step.created_by_text || step.officer_text || "-",
              ]),
            ],
          },
          layout: "lightHorizontalLines",
          fontSize: 12,
        },
      ],
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: "white",
          fillColor: "#2980b9",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    pdfMake.createPdf(docDefinition).download("complaint-details.pdf");
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<PictureAsPdfIcon />}
      onClick={handleExportPDF}
      sx={{ mb: 2 }}
    >
      Export PDF
    </Button>
  );
};

export default DetailOPMExportPDF;