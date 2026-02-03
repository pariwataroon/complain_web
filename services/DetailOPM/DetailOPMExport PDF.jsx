import React from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Button from "@mui/material/Button";
import { getAuthMe } from "@pages/api/role/role";

/* ================= Helpers ================= */

function getThaiMonthName(m) {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  return months[m - 1] || "";
}

function formatThaiDate(dateStr) {
  if (!dateStr || dateStr === "-") return "";
  try {
    let timestamp;
    if (typeof dateStr === "string" && dateStr.startsWith("/Date(")) {
      const match = dateStr.match(/\/Date\((\d+)\)\//);
      if (match) timestamp = parseInt(match[1]);
    } else {
      timestamp = new Date(dateStr).getTime();
    }
    const d = new Date(timestamp);
    if (isNaN(d.getTime()) || timestamp === -62135596800000) return "";
    return `${d.getDate()} ${getThaiMonthName(d.getMonth() + 1)} ${d.getFullYear() + 543}`;
  } catch {
    return "";
  }
}

async function loadFontBase64(publicPath) {
  try {
    const res = await fetch(publicPath);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

async function loadImageBase64(publicPath) {
  try {
    const res = await fetch(publicPath);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ================= Component ================= */

const DetailOPMExportPDF = ({
  caseDetails,
  operatingsDetails = [],
  accountData = {},
  customerData = {},
}) => {
  const handleExportPDF = async () => {
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!caseDetails || (Array.isArray(caseDetails) && caseDetails.length === 0)) {
      alert("ไม่มีข้อมูลคำร้องสำหรับ Export PDF");
      return;
    }

    try {
      // -- getter ฟิลด์จาก caseDetails (รองรับทั้ง object/array ที่ field:value)
      const getFieldValue = (fieldName) => {
        if (Array.isArray(caseDetails)) {
          const f = caseDetails.find((x) => x.field === fieldName);
          return f?.value || "";
        }
        return caseDetails?.[fieldName] || "";
      };

      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // fonts
      const sarabun = await loadFontBase64("/fonts/THSarabunNew.ttf");
      const sarabunBold = await loadFontBase64("/fonts/THSarbunNew-Bold.ttf").then(v => v || loadFontBase64("/fonts/THSarabunNew-Bold.ttf"));
      if (!sarabun || !sarabunBold) {
        alert("ไม่สามารถโหลดฟอนต์ไทยได้ กรุณาตรวจสอบ /public/fonts/THSarabunNew.ttf และ THSarabunNew-Bold.ttf");
        return;
      }
      doc.addFileToVFS("THSarabunNew.ttf", sarabun);
      doc.addFileToVFS("THSarabunNew-Bold.ttf", sarabunBold);
      doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
      doc.addFont("THSarabunNew-Bold.ttf", "THSarabunNew", "bold");
      doc.setFont("THSarabunNew", "normal");

      // constants
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageW - margin * 2;
      let yPos = 15;
      const lineHeight = 5.5;

      const checkNewPage = (requiredSpace = lineHeight) => {
        if (yPos + requiredSpace > pageH - 20) {
          doc.addPage();
          doc.setFont("THSarabunNew", "normal");
          doc.setFontSize(14);
          yPos = 20;
          return true;
        }
        return false;
      };

      // header + logo
      const logoImg = await loadImageBase64("/logo_blue.png");
      if (logoImg) doc.addImage(logoImg, "PNG", margin, yPos, 14, 14);
      doc.setFont("THSarabunNew", "bold");
      doc.setFontSize(16); doc.text("ระบบบริหารจัดการเรื่องราวร้องทุกข์", margin + 22, yPos + 6);
      doc.setFontSize(14); doc.text("สำนักงานปลัดกระทรวงการคลัง", margin + 22, yPos + 12);
      yPos += 22;

      // field values
      const caseCode = getFieldValue("case_code");
      const dateOpened = getFieldValue("date_opened");
      const objectiveText = getFieldValue("objective_text");
      const informToText = getFieldValue("inform_to_text");
      const typeText = getFieldValue("type_text");
      const statusText = getFieldValue("status_text");
      const detailText = getFieldValue("detail");
      const summaryText = getFieldValue("summary");
      const accountObj = getFieldValue("account");
      const customerObj = getFieldValue("customer");

      // เรียน
      doc.setFont("THSarabunNew", "normal");
      doc.setFontSize(14);
      doc.text("เรียน ปลัดกระทรวงการคลัง", margin, yPos);
      yPos += lineHeight + 2;

      // รหัสเรื่อง + วันที่
      doc.text("รหัสเรื่อง :", margin, yPos);
      const dateOpenTxt = formatThaiDate(dateOpened);
      const codeWithDate = dateOpenTxt ? `${caseCode} (วันที่เปิดคำร้อง ${dateOpenTxt})` : caseCode || "-";
      doc.setTextColor(0, 0, 0);
      doc.text(codeWithDate, margin + 16, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += lineHeight + 1;

      // label ดำ + value แดง (บรรทัดของใครของมัน)
      const drawLine = (label, value) => {
        if (!value) return;
        const lbl = `${label}`;
        const val = `${value}`;
        const xVal = margin + doc.getTextWidth(lbl) + 2;
        // จำกัดความกว้างสูงสุดไม่ให้ทับขวา - ใช้ maxWidth แทน
        const maxW = maxWidth - doc.getTextWidth(lbl);
        const lines = doc.splitTextToSize(val, maxW);
        doc.setTextColor(0,0,0); doc.text(lbl, margin, yPos);
        doc.setTextColor(0,0,0); doc.text(lines[0], xVal, yPos);
        for (let i=1;i<lines.length;i++) doc.text(lines[i], xVal, yPos + i*lineHeight);
        doc.setTextColor(0,0,0);
        yPos += Math.max(1, lines.length) * lineHeight;
      };

      const complainantName = accountData.fullName || customerData.fullName;
      drawLine("ผู้เดือดร้อน : ", complainantName);
      drawLine("ประเภทเรื่องร้องทุกข์ : ", typeText);
      drawLine("วัตถุประสงค์ของการแจ้งเรื่อง : ", objectiveText);
      drawLine("สถานะ : ", statusText);

      // ข้อมูลผู้ร้องทุกข์ (2 คอลัมน์เดิม)
      doc.text("ข้อมูลผู้ร้องทุกข์", margin, yPos);
      yPos += lineHeight + 1;
      const col1X = margin;
      const col2X = margin + 95;

      const fullName =
        accountObj?.salutation_th
          ? `${accountObj.salutation_th}${accountObj.firstname_th} ${accountObj.lastname_th}` : "-";
      const citizenId = accountObj?.citizen_id || "-";
      const addressText = accountObj?.address || "-";
      const subdistrictText = accountObj?.subdistrict_text || "-";
      const districtText = accountObj?.district_text || "-";
      const provinceText = accountObj?.province_text || "-";
      const postcodeText = accountObj?.postcode || "-";
      const emailAcc =
        accountObj?.list_account_detail?.find((c) => c.detail_type === "E")?.detail || "-";
      const phonesAcc =
        accountObj?.list_account_detail?.filter((c) => c.detail_type === "M").map((c) => c.detail)?.join(" , ") || "-";

      doc.text("หมายเลขประจำตัวประชาชน :", col1X, yPos);
      doc.text(citizenId, col1X + 44, yPos);
      doc.text("ชื่อ-นามสกุล :", col2X, yPos);
      doc.text(fullName, col2X + 22, yPos);
      yPos += lineHeight;

      // จำกัดที่อยู่สูงสุด 20 ตัวอักษรต่อบรรทัด
      doc.text("ที่อยู่ที่ติดต่อได้ :", col1X, yPos);
      const addressLines = doc.splitTextToSize(addressText, 60); // 60mm ≈ 20-25 ตัวอักษร
      addressLines.forEach((line, i) => {
        doc.text(line, col1X + 26, yPos + (i * lineHeight));
      });
      const addressHeight = addressLines.length * lineHeight;
      doc.text("ตำบล/แขวง :", col2X, yPos);
      doc.text(subdistrictText, col2X + 22, yPos);
      yPos += Math.max(lineHeight, addressHeight);

      doc.text("อำเภอ/เขต :", col1X, yPos);
      doc.text(districtText, col1X + 22, yPos);
      doc.text("จังหวัด :", col2X, yPos);
      doc.text(provinceText, col2X + 16, yPos);
      yPos += lineHeight;

      doc.text("รหัสไปรษณีย์ :", col1X, yPos);
      doc.text(postcodeText, col1X + 28, yPos);
      doc.text("อีเมล :", col2X, yPos);
      doc.text(emailAcc, col2X + 14, yPos);
      yPos += lineHeight;

      doc.text("หมายเลขโทรศัพท์ :", col1X, yPos);
      doc.text(phonesAcc, col1X + 28, yPos);
      yPos += lineHeight;

      // ผู้เดือดร้อน (ถ้าต่างจากผู้ร้อง)
      const custFullName =
        customerObj?.salutation_th
          ? `${customerObj.salutation_th}${customerObj.firstname_th} ${customerObj.lastname_th}` : "-";
      if (custFullName && custFullName !== "-" && custFullName !== fullName) {
        yPos += 2;
        checkNewPage(7);
        doc.setFillColor(255, 255, 0);
        doc.rect(margin, yPos - 4.5, maxWidth, 6, "F");
        doc.setFont("THSarabunNew", "bold");
        doc.text("ข้อมูลผู้เดือดร้อน", margin + 2, yPos);
        yPos += lineHeight + 1;
        doc.setFont("THSarabunNew", "normal");

        const custCitizenId = customerObj?.citizen_id || "-";
        const custGenderText = customerObj?.gender_text || "-";
        const custAddressFull = [
          customerObj?.address || "",
          customerObj?.subdistrict_text || "",
          customerObj?.district_text || "",
          customerObj?.province_text || "",
          customerObj?.postcode || "",
        ].filter(Boolean).join(" ") || "-";
        const custEmailAcc =
          customerObj?.list_customer_detail?.find((c) => c.detail_type === "E")?.detail || "-";
        const custPhonesAcc =
          customerObj?.list_customer_detail?.filter((c) => c.detail_type === "M").map((c) => c.detail)?.join(" , ") || "-";

        doc.text("ชื่อ-นามสกุล :", col1X, yPos);
        doc.text(custFullName, col1X + 28, yPos);
        doc.text("เลขบัตรประชาชน :", col2X, yPos);
        doc.text(custCitizenId, col2X + 38, yPos);
        yPos += lineHeight;

        doc.text("เพศ :", col1X, yPos);
        doc.text(custGenderText, col1X + 10, yPos);
        doc.text("เบอร์โทรศัพท์ :", col2X, yPos);
        doc.text(custPhonesAcc, col2X + 30, yPos);
        yPos += lineHeight;

        doc.text("อีเมล :", col1X, yPos);
        doc.text(custEmailAcc, col1X + 15, yPos);
        yPos += lineHeight;

        doc.text("ที่อยู่ :", col1X, yPos);
        doc.text(custAddressFull, col1X + 15, yPos);
        yPos += lineHeight;
      }

      yPos += 2;

      // สาระสำคัญ/รายละเอียด (แสดงข้อความแบบ wrap ทั้งหมด)
      const drawRedParagraph = (label, text) => {
        if (!text) return;

        const lbl = String(label);
        const val = String(text);

        checkNewPage(lineHeight);

        // พิมพ์หัวข้อ (ดำ) ในบรรทัดแรก
        doc.setTextColor(0, 0, 0);
        doc.text(lbl, margin, yPos);
        yPos += lineHeight;

        // ตัดข้อความทั้งหมดด้วยความกว้างเต็ม แล้วแสดงทุกบรรทัด
        doc.setTextColor(0, 0, 0);
        const allLines = doc.splitTextToSize(val, maxWidth);
        for (const line of allLines) {
          checkNewPage(lineHeight);
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        }

        // รีเซ็ตสี
        doc.setTextColor(0, 0, 0);
      };

    // ใช้เหมือนเดิม
    drawRedParagraph("สาระสำคัญของเรื่อง : ", summaryText);
    drawRedParagraph("รายละเอียดของเรื่อง : ", detailText);

      /* ============ หน่วยงานที่เกี่ยวข้อง (3 คอลัมน์) — กันล้น ============ */
      let orgOwnerList = getFieldValue("list_case_org_owner") || [];
      if (orgOwnerList && orgOwnerList.length > 0) {
        checkNewPage(10);
        const colW1 = 60, colW2 = 60, colW3 = 60;

        doc.text("หน่วยงานที่เกี่ยวข้อง :", margin, yPos);
        doc.text("สถานะการปฏิบัติการ :", margin + colW1, yPos);
        doc.text("ผลการปฏิบัติงานจริงผู้รู้เรื่อง :", margin + colW1 + colW2, yPos);
        yPos += lineHeight;

        orgOwnerList.forEach((org) => {
          const orgLines    = doc.splitTextToSize(org?.org_text || "-", colW1 - 2);
          const statusLines = doc.splitTextToSize(org?.case_org_status_text || "-", colW2 - 2);
          const resultLines = doc.splitTextToSize(org?.case_org_summary_result || "-", colW3 - 2);

          const rowH = Math.max(orgLines.length, statusLines.length, resultLines.length) * lineHeight + 1;
          checkNewPage(rowH);

          let y1 = yPos, y2 = yPos, y3 = yPos;
          doc.setTextColor(0,0,0);
          orgLines.forEach(t => { doc.text(t, margin, y1); y1 += lineHeight; });
          statusLines.forEach(t => { doc.text(t, margin + colW1, y2); y2 += lineHeight; });
          resultLines.forEach(t => { doc.text(t, margin + colW1 + colW2, y3); y3 += lineHeight; });
          doc.setTextColor(0,0,0);

          yPos += rowH;
        });
        yPos += 3;
      }

      /* ============ ข้อมูลเพิ่มเติม (2 คอลัมน์เดิม) — กันล้น ============ */
      
      const midX = margin + (pageW - margin * 2) / 2;
      const rightEdgeOf = (x) => (x < midX ? midX : (pageW - margin));
      
      const measureOne = (x, label, value) => {
        const lbl = `${label}`;
        const val = value == null || value === "" ? "-" : String(value);
        const xVal = x + doc.getTextWidth(lbl) + 2;
        const maxW = Math.max(10, rightEdgeOf(x) - xVal);
        const lines = doc.splitTextToSize(val, maxW);
        return { lbl, lines, xVal, height: Math.max(1, lines.length) * lineHeight };
      };
      const drawMeasured = (x, m) => {
        doc.setTextColor(0,0,0); doc.text(m.lbl, x, yPos);
        doc.setTextColor(0,0,0); doc.text(m.lines[0] || "-", m.xVal, yPos);
        for (let i=1;i<m.lines.length;i++) doc.text(m.lines[i], m.xVal, yPos + i*lineHeight);
        doc.setTextColor(0,0,0);
      };
      const drawPairSafe = (lLabel, lValue, rLabel, rValue) => {
        const L = measureOne(col1X, lLabel, lValue);
        const R = measureOne(col2X, rLabel, rValue);
        checkNewPage(Math.max(L.height, R.height));
        drawMeasured(col1X, L);
        drawMeasured(col2X, R);
        yPos += Math.max(L.height, R.height);
      };
      
      const channelIncoming = getFieldValue("channel_incoming_text") || getFieldValue("channel_text") || getFieldValue("incoming_channel_text");
      const priority   = getFieldValue("priority_text") || getFieldValue("priority");
      const severity   = getFieldValue("severity_text") || getFieldValue("urgency_text") || getFieldValue("urgency");
      const secret     = getFieldValue("secret_text") || getFieldValue("confidential_text") || getFieldValue("secret");
      const caseArea   = [
        getFieldValue("case_area"),
        getFieldValue("subdistrict_text"),
        getFieldValue("district_text"),
        getFieldValue("province_text"),
      ].filter(v => v && v !== "-").join(" ") || "-";
      const timeOcc    = getFieldValue("time_occurrenced") || getFieldValue("period_text");
      const fromRaw    = getFieldValue("date_occurrenced_from") || getFieldValue("date_start") || getFieldValue("occur_from");
      const toRaw      = getFieldValue("date_occurrenced_to") || getFieldValue("date_end") || getFieldValue("occur_to");
      const fromTxt    = formatThaiDate(fromRaw);
      const toTxt      = formatThaiDate(toRaw);
      const dateRange  = (fromTxt && toTxt) ? `${fromTxt} - ${toTxt}` : "-";
      
      let inCourt = getFieldValue("is_in_court_text");
      if (!inCourt || inCourt === "-") {
        const b = getFieldValue("is_in_court");
        inCourt = (b === true || b === "true" || b === 1) ? "ใช่"
        : (b === false || b === "false" || b === 0) ? "ไม่ใช่" : "-";
      }
      const defendant = getFieldValue("defendant") || getFieldValue("defendant_text") || getFieldValue("respondent") || getFieldValue("offender");
      const createdBy = getFieldValue("created_by_text") || getFieldValue("creator_text") || getFieldValue("created_by_name") || getFieldValue("created_by");
      
      doc.text("ข้อมูลเพิ่มเติม", margin, yPos);
      yPos += lineHeight + 1;

      drawPairSafe("ช่องทางการรับเรื่อง : ", channelIncoming, "ระดับความสำคัญ : ",      priority);
      
      drawPairSafe("ระดับความเร่งด่วน : ",   severity, "ระดับความลับ : ",        secret);

      drawPairSafe("พื้นที่เกิดเหตุ : ",      caseArea, "ช่วงเวลาเกิดเหตุ : ",     timeOcc);

      drawPairSafe("วันที่เกิดเหตุ (จาก - ถึง) : ", dateRange, "อยู่ระหว่างการฟ้องร้อง / พิจารณาในชั้นศาล : ", inCourt);

      drawPairSafe("ผู้ถูกร้อง : ",            defendant, "สร้างโดย : ",              createdBy);

      const remark = getFieldValue("remark");
      if (remark) {
        const lbl = "หมายเหตุ : ";
        const x = col1X;
        const xVal = x + doc.getTextWidth(lbl) + 2;
        const maxW = (pageW - margin) - xVal;
        const lines = doc.splitTextToSize(String(remark), maxW);
        checkNewPage(Math.max(1, lines.length) * lineHeight);
        doc.setTextColor(0,0,0); doc.text(lbl, x, yPos);
        doc.setTextColor(0,0,0); doc.text(lines[0], xVal, yPos);
        for (let i=1;i<lines.length;i++) doc.text(lines[i], xVal, yPos + i*lineHeight);
        doc.setTextColor(0,0,0);
        yPos += Math.max(1, lines.length) * lineHeight;
      }

      yPos += 3;

      /* ================= หน้า “ขั้นตอนการดำเนินงาน” ================= */
      doc.addPage();
      yPos = 20;
      doc.setFont("THSarabunNew", "bold"); doc.setFontSize(16);
      doc.text("ขั้นตอนการดำเนินงาน", pageW / 2, yPos, { align: "center" });
      yPos += lineHeight + 5;
      doc.setFont("THSarabunNew", "normal"); doc.setFontSize(14);

      if (operatingsDetails && operatingsDetails.length > 0) {
        operatingsDetails.forEach((step, idx) => {
          checkNewPage(50);

          doc.setFillColor(200, 200, 200);
          doc.rect(margin, yPos - 4.5, maxWidth, 6, "F");
          doc.setFont("THSarabunNew", "bold");
          const stepTitle = `ขั้นตอนที่ ${step?.line || idx + 1} : ${step?.operating_type_text || "ประสานงาน"}`;
          doc.text(stepTitle, margin + 2, yPos);
          yPos += lineHeight + 1;
          doc.setFont("THSarabunNew", "normal");

          const colL = margin, colR = margin + 95;

          const operatingDate = step?.ShowDateTime || formatThaiDate(step?.created_at) || "-";
          const officer       = step?.created_by_text || step?.officer_text || "-";
          const stepStatus    = step?.status_text || "-";
          const orgText       = step?.org_text || "-";
          const operatingObjective = step?.operating_objective_text || "-";
          const operatingChannel   = step?.operating_channel_text || "-";

          doc.text(`ประเภทงาน : ${step?.operating_type_text || "-"}`, colL, yPos);
          doc.text(`หน่วยงาน : ${orgText}`, colR, yPos); yPos += lineHeight;
          doc.text(`วันที่ดำเนินการ : ${operatingDate}`, colL, yPos);
          doc.text(`ผู้ดำเนินการ : ${officer}`, colR, yPos); yPos += lineHeight;
          doc.text(`สถานะ : ${stepStatus}`, colL, yPos);
          doc.text(`วัตถุประสงค์ : ${operatingObjective}`, colR, yPos); yPos += lineHeight;
          doc.text(`ช่องทางการดำเนินการ : ${operatingChannel}`, colL, yPos); yPos += lineHeight;

          const detailOp = step?.detail || "-";
          const detailOpLines = doc.splitTextToSize(`รายละเอียด : ${detailOp}`, maxWidth);
          for (const ln of detailOpLines) { checkNewPage(); doc.text(ln, margin, yPos); yPos += lineHeight; }

          if (step?.attachments && step.attachments.length > 0) {
            yPos += 2;
            doc.setFont("THSarabunNew", "bold");
            doc.text(`ไฟล์แนบ (${step.attachments.length} ไฟล์) :`, margin, yPos);
            yPos += lineHeight;
            doc.setFont("THSarabunNew", "normal");
            step.attachments.forEach((file, i) => {
              const fileName = file?.file_name || `ไฟล์แนบ ${i + 1}`;
              const fileDesc = file?.file_description || "";
              checkNewPage();
              doc.text(`  ${i + 1}. ${fileName}${fileDesc ? ` - ${fileDesc}` : ""}`, margin + 5, yPos);
              yPos += lineHeight;
            });
          }
          yPos += 2;
        });
      } else {
        doc.text("ไม่มีข้อมูลขั้นตอนการดำเนินงาน", margin, yPos);
        yPos += lineHeight;
      }

      /* ================= Footer (เลขหน้าอัตโนมัติทุกหน้า) ================= */
      const now = new Date();
      const currentDate = formatThaiDate(now);
      const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

      // ดึงข้อมูลผู้ใช้จาก getAuthMe
      let userName = "";
      try {
        const authMeRes = await getAuthMe();
        if (authMeRes?.res_code === "0000" && authMeRes?.res_data?.full_name) {
          userName = authMeRes.res_data.full_name;
        }
      } catch (e) {
        console.warn("ไม่สามารถดึงข้อมูลผู้ใช้:", e);
      }

      const total = doc.getNumberOfPages();

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        const footer = (userName ? `ผู้พิมพ์ : ${userName} - ` : "") +
                       `วันที่ระบบพิมพ์: ${currentDate} ${currentTime} | ${i}/${total}`;
        doc.text(footer, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
      }
      doc.setTextColor(0,0,0);

      /* ================= Save ================= */
      doc.save(`complaint-${caseCode || "details"}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + err.message);
    }
  };

  return (
    
    <Button
      variant="outlined"
      startIcon={<PictureAsPdfIcon sx={{ color: "#1a33b0" }} />}
      onClick={handleExportPDF}
      sx={{
        backgroundColor: "#E8E9F6",
            color: "#414DB5",
            border: "2px solid #414DB5",
            borderRadius: "12px",
            fontWeight: "bold",
            px: 3,
            py: 1,
            whiteSpace: "nowrap",
            minWidth: "fit-content", 
            "&:hover": {
              backgroundColor: "#dfe0f0",
            },
      }}
    >
      Export PDF
    </Button>

  );
};

export default DetailOPMExportPDF;