import { useRef, useMemo } from "react";
import { Box, Paper, Typography, Grid, CircularProgress } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import Image from "next/image";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatPhoneNumber_null,
  formatCitizenId_null,
} from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import {
  getSubComplaintTypeById,
  GetAllOutsideDepartments,
} from "@pages/api/allselect/allselect";
import { useState, useEffect } from "react";

const ComplaintIDService = ({ complaint }) => {
  if (!complaint)
    return (
      <Box display="flex" justifyContent="center" my={5}>
        <CircularProgress />
      </Box>
    );

  const step1 = complaint.step1?.general ?? {};
  const generalMain = step1.general ?? {};
  let complainant = {};
  let complainantType = "individual";
  if (generalMain.corporate) {
    // new API: step1.general.general.corporate
    complainant = generalMain.corporate;
    complainantType = "corporate";
  } else {
    complainant = generalMain;
    complainantType = "individual";
  }
  // delegate/ผู้รับมอบอำนาจ
  const delegate = step1.delegate || generalMain.signer || {};

  // ====== STEP2: Dynamic respondent (individual/corporate/government) ======
  const step2 = complaint.step2?.general ?? {};
  const respondentType =
    step2.activeType ||
    (step2.individual
      ? "individual"
      : step2.corporate
      ? "corporate"
      : step2.government
      ? "government"
      : "");
  let respondent = {};
  if (respondentType === "corporate") {
    respondent = step2.corporate || {};
  } else if (respondentType === "government") {
    respondent = step2.government || {};
  } else {
    respondent = step2.individual || {};
  }
  // respondent email: on step2.general.email
  const respondentEmail = step2.email || respondent.email || "-";

  // ====== STEP3: Complaint Detail ======
  const step3 = complaint.step3?.general ?? {};
  const tab31 = complaint.step31?.general ?? {};

  // รวม attachment จากทั้ง step3 และ tab31
  const normalizeArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean);
    return [input].filter(Boolean);
  };

  const step3Files = normalizeArray(step3.attachment);
  const tab31Files = normalizeArray(tab31.attachment);
  const mergedAttachments = [
    ...normalizeArray(complaint.attachments),
    ...normalizeArray(complaint.attachment),
    ...normalizeArray(complaint.evidences),
    ...normalizeArray(complaint.evidence),
    ...normalizeArray(complaint.assignment_form?.attachments),
  ];

  const fileKey = (file) => {
    if (!file || typeof file !== "object") return String(file || "");
    return (
      file.id ||
      file.uuid ||
      file.file_uuid ||
      file.fileId ||
      file.file_id ||
      file.fileUrl ||
      file.file_url ||
      file.file_path ||
      file.path ||
      file.name ||
      JSON.stringify(file)
    );
  };

  const fileCollector = new Map();
  const pushFiles = (arr) => {
    arr.forEach((item) => {
      const key = fileKey(item);
      if (!fileCollector.has(key)) {
        fileCollector.set(key, item);
      }
    });
  };

  [step3Files, tab31Files, mergedAttachments].forEach(pushFiles);

  const files = Array.from(fileCollector.values());

  const [maps, setMaps] = useState({ subtype: {}, agency: {} });

  const isUuid = (s) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ""));

  useEffect(() => {
  const subtypeId = complaint?.complaint_subtype_id ?? tab31?.complaintSubType;
  const agencyId  = complaint?.agency_sender ?? tab31?.senderAgency;

  const needSubtype = isUuid(subtypeId) && !maps.subtype[subtypeId];
  const needAgency  = isUuid(agencyId)  && !maps.agency[agencyId];

  if (!needSubtype && !needAgency) return;

  (async () => {
    try {
      if (needSubtype) {
        const parentTypeId =
          complaint?.complaint_type_id ?? tab31?.complaintTypeId ?? step3?.complaintType;
        if (isUuid(parentTypeId)) {
          const res = await getSubComplaintTypeById(parentTypeId);
          const items = res?.res_data?.items || [];
          const map = items.reduce((acc, it) => {
            const id = it?.id ?? it?.value;
            const label = it?.name ?? it?.label;
            if (id && label) acc[id] = label;
            return acc;
          }, {});
          setMaps((m) => ({ ...m, subtype: { ...m.subtype, ...map } }));
        }
      }

      if (needAgency) {
        const res = await GetAllOutsideDepartments();
        const arr = Array.isArray(res) ? res : (res?.res_data?.items || []);
        const map = arr.reduce((acc, it) => {
          const id = it?.value ?? it?.id;
          const label = it?.label ?? it?.name;
          if (id && label) acc[id] = label;
          return acc;
        }, {});
        setMaps((m) => ({ ...m, agency: { ...m.agency, ...map } }));
      }
    } catch (e) {
      console.error("lookup fetch failed", e);
    }
  })();
}, [
  complaint?.complaint_subtype_id,
  complaint?.agency_sender,
  tab31?.complaintSubType,
  tab31?.senderAgency,
  complaint?.complaint_type_id,
  step3?.complaintType,
  maps.subtype,
  maps.agency,
]);

  const pick = (...vals) =>
    vals.find((v) => v !== undefined && v !== null && String(v).trim?.() !== "");
  const fmtDate = (v) => (v ? formatThaiDate(v) : "-");
  const fmtDateTime = (v) => (v ? formatThaiDateTime(v) : "-");

  const secMap = { normal: "ปกติ", confidential: "ลับ", secret: "ลับมาก", top_secret: "ลับที่สุด" };
  const urgMap = { low: "ปกติ", medium: "เร่งด่วน", high: "ด่วน", urgent: "ด่วนมาก", critical: "ด่วนที่สุด" };

  // ใช้ Tab3-1 ถ้ามีข้อมูลใน step31 หรือเป็นผู้ถูกร้องประเภท government หรือมีฟิลด์ top-level ของแบบ Admin
  const usedTab31 = useMemo(() => {
    const hasStep31 = tab31 && Object.keys(tab31).length > 0;
    const isGov = complaint?.step2?.general?.activeType === "government";
    const hasAdminFields =
      !!(complaint?.director_submission_date ||
        complaint?.registration_date ||
        complaint?.reference_number1 ||
        complaint?.reference_number2 ||
        complaint?.reference_number3 ||
        complaint?.document_number ||
        complaint?.complaint_type_id ||
        complaint?.complaint_subtype_id ||
        complaint?.complaint_channel_id ||
        complaint?.agency_sender ||
        complaint?.confidentiality_level ||
        complaint?.urgency_level);

    console.log('=== USEDTAB31 DEBUG ===');
    console.log('hasStep31:', hasStep31);
    console.log('isGov:', isGov);
    console.log('hasAdminFields:', hasAdminFields);
    console.log('final usedTab31:', hasStep31 || isGov || hasAdminFields);
        
    return hasStep31 || isGov || hasAdminFields;
  }, [tab31, complaint]);

  // Helper function สำหรับ lookup label จาก options
const getLabelFromOptions = (value, optionArray) => {
  if (!value || !optionArray) return "-";
  const found = optionArray.find(item => item.value === value);
  return found ? found.label : value;
};

// เติม map จาก options ถ้ามี (บางระบบส่ง subtypes/agency มาด้วย)
useEffect(() => {
  const next = { subtype: {}, agency: {} };

  // รวม subtypes จาก complaint_types.children/subtypes ถ้ามี
  const types = complaint?.options?.complaint_types || [];
  types.forEach((t) => {
    const subs = Array.isArray(t?.subtypes) ? t.subtypes
               : Array.isArray(t?.children) ? t.children
               : [];
    subs.forEach((s) => {
      const id = s?.value ?? s?.id;
      const label = s?.label ?? s?.name;
      if (id && label) next.subtype[id] = label;
    });
  });

  // ตัวเลือกชื่อคีย์ที่เป็นไปได้สำหรับหน่วยงาน
  const agencyArrays = [
    complaint?.options?.agencies,
    complaint?.options?.outside_departments,
    complaint?.options?.departments,
    complaint?.options?.sender_agencies,
    complaint?.options?.outside_agencies,
  ].filter(Array.isArray);

  agencyArrays.forEach((arr) =>
    arr.forEach((a) => {
      const id = a?.value ?? a?.id;
      const label = a?.label ?? a?.name;
      if (id && label) next.agency[id] = label;
    })
  );

  // merge ทับ (กัน state เดิมหาย)
  setMaps((m) => ({
    subtype: { ...m.subtype, ...next.subtype },
    agency: { ...m.agency, ...next.agency },
  }));
}, [complaint?.options]);

const tryGetLabel = (value, ...candidates) => {
  if (!value) return "-";
  for (const arr of candidates) {
    if (Array.isArray(arr)) {
      const found = arr.find((x) => (x?.value ?? x?.id) === value);
      if (found) return found.label ?? found.name ?? value;
    }
  }
  if (!/^[0-9a-f-]{36}$/i.test(String(value))) return String(value);
  return String(value);
};

const flattenSubtypesFromTypes = (types) => {
  if (!Array.isArray(types)) return [];
  return types.flatMap((t) => Array.isArray(t?.subtypes) ? t.subtypes
    : Array.isArray(t?.children) ? t.children
    : []);
};

const pickAgencyOptionArrays = (options) => {
  const cands = [
    options?.agencies,
    options?.outside_departments,
    options?.departments,
    options?.sender_agencies,
    options?.outside_agencies,
  ];
  return cands.filter(Array.isArray);
};

// รวมค่าไว้ใช้ตอน render (ให้ priority กับข้อมูลจาก API response)
const merged = {
 complaintTypeId: tryGetLabel(
   pick(complaint?.complaint_type_id, tab31?.complaintTypeId, step3?.complaintType),
   complaint?.options?.complaint_types || []
 ),
 complaintSubTypeId: tryGetLabel(
   pick(complaint?.complaint_subtype_id, tab31?.complaintSubType),
   complaint?.options?.complaint_subtypes || [],
   flattenSubtypesFromTypes(complaint?.options?.complaint_types)
 ),
 complaintChannel: tryGetLabel(
   pick(
     tab31?.complaintChannel,
     tab31?.complaintChannelName,
     step3?.complaintChannel,
     step3?.complaintChannelName,
     complaint?.complaint_channel_name,
     complaint?.complaint_channel_id
   ),
   complaint?.options?.complaint_channels || []
 ),

  // เรื่อง/รายละเอียด - ให้ priority กับข้อมูลจาก API
  subject: pick(complaint?.subject, step3?.subject, tab31?.subject),
  description: pick(complaint?.description, step3?.description, tab31?.description),

  // วันเวลาเกิดเหตุ - ใช้ field จาก API response เป็นหลัก
  incidentDateTime: pick(
    complaint?.incident_datetime,
    complaint?.incident_date,
    step3?.incidentDate,
    tab31?.incidentDateTime
  ),

  // เอกสาร / อ้างอิง 1-4 - ใช้ข้อมูลจาก API response
  ref1: pick(complaint?.reference_number1, complaint?.reference_number, tab31?.referenceNumber1),
  ref1Date: pick(complaint?.reference_date1, complaint?.reference_date, tab31?.referenceDate1),
  ref2: pick(complaint?.reference_number2, tab31?.referenceNumber2),
  ref2Date: pick(complaint?.reference_date2, tab31?.referenceDate2),
  ref3: pick(complaint?.reference_number3, tab31?.referenceNumber3),
  ref3Date: pick(complaint?.reference_date3, tab31?.referenceDate3),
  ref4: pick(complaint?.reference_number4, tab31?.referenceNumber4),
  ref4Date: pick(complaint?.reference_date4, tab31?.referenceDate4),
  
  docNo: pick(complaint?.document_number, tab31?.documentNumber),
  docDate: pick(complaint?.document_date, tab31?.documentDate),

  // ระดับความลับ/เร่งด่วน - ใช้ข้อมูลจาก API response
  securityLevel: pick(complaint?.confidentiality_level, tab31?.securityLevel),
  urgencyLevel: pick(complaint?.urgency_level, tab31?.urgencyLevel),

  // หน่วยงานที่ส่ง - lookup จาก options
  senderAgency: tryGetLabel(
    pick(complaint?.agency_sender, tab31?.senderAgency),
    ...pickAgencyOptionArrays(complaint?.options || {})
  ),

  // ประเภทการรับเรื่อง
  filingType: pick(complaint?.complaint_filing_type, tab31?.complaint_filing_type),

  // อ้างอิงเพิ่มเติม - ใช้ structure จาก API response
  addRef1: pick(
    complaint?.additional_reference_number1,
    complaint?.additional_references?.additional_reference_number1,
    tab31?.additionalReference1
  ),
  addRef1Date: pick(
    complaint?.additional_reference_date1,
    complaint?.additional_references?.additional_reference_date1,
    tab31?.additionalReferenceDate1
  ),
  addRef2: pick(
    complaint?.additional_reference_number2,
    complaint?.additional_references?.additional_reference_number2,
    tab31?.additionalReference2
  ),
  addRef2Date: pick(
    complaint?.additional_reference_date2,
    complaint?.additional_references?.additional_reference_date2,
    tab31?.additionalReferenceDate2
  ),

  officerReceivedDate: pick(
    complaint?.registration_date,
    complaint?.officer_received_date,
    tab31?.officerReceivedDate
  ),
  directorSubmittedDate: pick(
    complaint?.director_submission_date,
    complaint?.director_submitted_date,
    tab31?.directorSubmittedDate
  ),
};

  const label = (obj) =>
    typeof obj === "object" ? obj?.label || "-" : obj || "-";

  const pdfRef = useRef();

  const InfoItem = ({ labelText, value }) => (
    <Grid item xs={12} sm={6}>
      <Typography fontSize={16}>
        <Box component="span" fontWeight="bold">
          {labelText}:
        </Box>{" "}
        {value}
      </Typography>
    </Grid>
  );

  const getFileIcon = (ext) => {
    switch (ext.toLowerCase()) {
      case ".pdf":
        return <PictureAsPdfIcon sx={{ color: "#d32f2f", mr: 1 }} />;
      case ".doc":
      case ".docx":
        return <DescriptionIcon sx={{ color: "#1976d2", mr: 1 }} />;
      case ".jpg":
      case ".jpeg":
      case ".png":
        return <ImageIcon sx={{ color: "#388e3c", mr: 1 }} />;
      default:
        return <DescriptionIcon sx={{ color: "#757575", mr: 1 }} />;
    }
  };

  const getFileExt = (filename) =>
    (filename || "").slice((filename || "").lastIndexOf(".")).toLowerCase();

  // Join base and path safely
  const joinUrl = (base, path) => {
    if (!base) return path;
    const b = base.replace(/\/$/, "");
    const p = (path || "").startsWith("/") ? path : `/${path || ""}`;
    return `${b}${p}`;
  };

  const resolveFileUrl = (raw) => {
    const url =
      raw?.fileUrl ||
      raw?.url ||
      raw?.file_url ||
      raw?.path ||
      raw?.file_path ||
      raw?.file ||
      raw; // allow raw string

    if (!url) return "";
    const s = typeof url === "string" ? url : String(url);
    if (/^https?:\/\//i.test(s)) return s;
    // Special handling for static uploads paths
    // Desired: https://<origin>/api/uploads/.... (not /api/v1/uploads)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    const originFromBase = (() => {
      try {
        return apiBase ? new URL(apiBase).origin : "";
      } catch {
        return "";
      }
    })();
    const origin = originFromBase || (typeof window !== "undefined" ? window.location.origin : "");

    if (s.startsWith("/uploads/")) {
      if (origin) return `${origin}/api${s}`;
      // SSR fallback
      return s;
    }
    if (s.startsWith("/api/uploads/")) {
      if (origin) return `${origin}${s}`;
      return s;
    }

    // Generic join: prefer apiBase; fallback to origin
    if (apiBase) return joinUrl(apiBase, s);
    if (origin) return joinUrl(origin, s);
    return s;
  };

  // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
  const handleDownloadFile = (fileInput, fileName) => {
    const downloadUrl = resolveFileUrl(fileInput);
    if (!downloadUrl) return;

    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      // Keep default filename if server sets it; otherwise hint
      if (fileName) link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      // graceful fallback: open new tab
      window.open(downloadUrl, "_blank");
    }
  };

  // ====== Render Respondent By Type ======
  const renderRespondentFields = () => {
    if (respondentType === "individual") {
      return (
        <>
          <InfoItem
            labelText="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem labelText="ชื่อ - นามสกุล" value={respondent.name} />
          <InfoItem
            labelText="ที่อยู่ที่สามารถติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    if (respondentType === "corporate") {
      return (
        <>
          <InfoItem labelText="เลขทะเบียนนิติบุคคล" value={respondent.idCard} />
          <InfoItem
            labelText="ชื่อบริษัท/องค์กร"
            value={respondent.companyName}
          />
          <InfoItem
            labelText="ชื่อผู้มีอำนาจลงนาม"
            value={respondent.signatoryName}
          />
          <InfoItem
            labelText="ที่อยู่บริษัท/องค์กรที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    if (respondentType === "government") {
      return (
        <>
          <InfoItem
            labelText="หมายเลขบัตรประชาชน"
            value={formatCitizenId_null(respondent.idCard)}
          />
          <InfoItem labelText="หน่วยงาน" value={respondent.agencyName} />
          <InfoItem
            labelText="ชื่อ - นามสกุล ผู้ติดต่อ"
            value={respondent.fullName}
          />
          <InfoItem
            labelText="ที่อยู่หน่วยงานที่ติดต่อได้"
            value={respondent.address}
          />
          <InfoItem labelText="จังหวัด" value={label(respondent.province)} />
          <InfoItem labelText="อำเภอ/เขต" value={label(respondent.districts)} />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(respondent.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={respondent.zipcode?.label || "-"}
          />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(respondent.phone)}
          />
          <InfoItem labelText="อีเมล" value={respondentEmail} />
        </>
      );
    }
    return null;
  };

  // ====== Render Complainant By Type ======
  const renderComplainantFields = () => {
    if (complainantType === "corporate") {
      return (
        <>
          <InfoItem
            labelText="เลขทะเบียนนิติบุคคล"
            value={complainant.idCard}
          />
          <InfoItem labelText="ชื่อบริษัท/องค์กร" value={complainant.name} />
          <InfoItem labelText="ที่อยู่นิติบุคคล" value={complainant.address} />
          <InfoItem labelText="จังหวัด" value={label(complainant.province)} />
          <InfoItem
            labelText="อำเภอ/เขต"
            value={label(complainant.districts)}
          />
          <InfoItem
            labelText="ตำบล/แขวง"
            value={label(complainant.subdistricts)}
          />
          <InfoItem
            labelText="รหัสไปรษณีย์"
            value={complainant.zipcode?.label || "-"}
          />
          <InfoItem labelText="อีเมล" value={complainant.email} />
          <InfoItem
            labelText="หมายเลขโทรศัพท์"
            value={formatPhoneNumber_null(complainant.phone)}
          />
        </>
      );
    }
    // individual/default
    return (
      <>
        <InfoItem
          labelText="หมายเลขประจำตัวประชาชน"
          value={formatCitizenId_null(complainant.idCard)}
        />
        <InfoItem labelText="ชื่อ - นามสกุล" value={complainant.name} />
        <InfoItem
          labelText="ที่อยู่ที่สามารถติดต่อได้"
          value={complainant.address}
        />
        <InfoItem labelText="จังหวัด" value={label(complainant.province)} />
        <InfoItem labelText="อำเภอ/เขต" value={label(complainant.districts)} />
        <InfoItem
          labelText="ตำบล/แขวง"
          value={label(complainant.subdistricts)}
        />
        <InfoItem
          labelText="รหัสไปรษณีย์"
          value={complainant.zipcode?.label || "-"}
        />
        <InfoItem labelText="อีเมล" value={complainant.email} />
        <InfoItem
          labelText="หมายเลขโทรศัพท์"
          value={formatPhoneNumber_null(complainant.phone)}
        />
      </>
    );
  };

  // ====== Render Delegate (ใช้ได้ทั้งบุคคล/นิติบุคคล) ======
  const renderDelegateFields = () => {
    // show only if at least 1 field exists
    const hasData = delegate && Object.keys(delegate).some((k) => delegate[k]);
    if (!hasData) return null;
    return (
      <>
        <Section title="ผู้รับมอบอำนาจร้องเรียน">
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="หมายเลขประจำตัวประชาชน"
              value={formatCitizenId_null(delegate.idCard)}
            />
            <InfoItem
              labelText="ชื่อ - นามสกุล"
              value={delegate.name || delegate.signatoryName}
            />
            <InfoItem labelText="ที่อยู่" value={delegate.address} />
            <InfoItem labelText="จังหวัด" value={label(delegate.province)} />
            <InfoItem labelText="อำเภอ/เขต" value={label(delegate.districts)} />
            <InfoItem
              labelText="ตำบล/แขวง"
              value={label(delegate.subdistricts)}
            />
            <InfoItem
              labelText="รหัสไปรษณีย์"
              value={delegate.zipcode?.label || "-"}
            />
            <InfoItem labelText="อีเมล" value={delegate.email} />
            <InfoItem
              labelText="โทรศัพท์"
              value={formatPhoneNumber_null(delegate.phone)}
            />
          </Grid>
        </Section>
      </>
    );
  };

  return (
    <Box>
      <div ref={pdfRef}>
        <Box
          sx={{
            height: 40,
            background: "linear-gradient(to right, #EDC458, #FEFAEF)",
            borderTopRightRadius: 8,
            borderTopLeftRadius: 8,
          }}
        />
        <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
          {/* Header & Logo */}
          <Box display="flex" alignItems="center" mb={3}>
            <Image
              src="/logo_blue.png"
              alt="โลโก้"
              width={100}
              height={100}
              style={{ objectFit: "contain" }}
            />
            <Typography variant="h6" fontWeight="bold" ml={2}>
              แบบรับคำร้องเรียน / ร้องทุกข์กระทรวงการคลัง
            </Typography>
          </Box>

          {/* ข้อมูลคำร้อง */}
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="วันที่ร้องทุกข์"
              value={formatThaiDate(complaint.created_at)}
            />
            <InfoItem
              labelText="เลขที่คำร้อง"
              value={complaint.complaint_number || "-"}
            />
            <InfoItem
              labelText="ประเภทเรื่องร้องทุกข์"
              value={usedTab31 ? merged.complaintTypeId : label(step3.complaintType)}
            />
            <InfoItem labelText="เรื่อง" value={merged.subject || step3.subject || "-"}  />
            <InfoItem
              labelText="วันเวลาที่เกิดเหตุ"
              value={
                step3.incidentDate
                  ? formatThaiDateTime(step3.incidentDate)
                  : tab31.incidentDateTime
                  ? formatThaiDateTime(tab31.incidentDateTime)
                  : merged.incidentDateTime
                  ? formatThaiDateTime(merged.incidentDateTime)
                  : "-"
              }
            />
          </Grid>
          <Divider />

          {/* ผู้ร้องทุกข์ */}
          <Section title="ข้อมูลผู้ร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              {renderComplainantFields()}
            </Grid>
          </Section>

          {/* ผู้รับมอบอำนาจ (ถ้ามี) */}
          {renderDelegateFields()}

          {/* ผู้ถูกร้องทุกข์ */}
          <Section title="ข้อมูลผู้ถูกร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              {renderRespondentFields()}
            </Grid>
          </Section>

          {/* รายละเอียดเรื่องร้องทุกข์ */}
          <Section title="รายละเอียดเรื่องร้องทุกข์">
            <Grid container spacing={2} mb={3}>
              {usedTab31 ? (
                // กรณี Tab31 - แสดงข้อมูลแบบละเอียด
                <>
                  <InfoItem labelText="ช่องทางร้องทุกข์" value={merged.complaintChannel || "-"} />
                  <InfoItem labelText="ประเภทเรื่องร้องทุกข์" value={merged.complaintTypeId || "-"} />

                  <InfoItem labelText="ชื่อเรื่อง" value={merged.subject || step3.subject || "-"} />
                  <InfoItem
                    labelText="วันและเวลาที่เกิดเหตุ"
                    value={
                      tab31.incidentDateTime
                        ? fmtDateTime(tab31.incidentDateTime)
                        : merged.incidentDateTime
                        ? fmtDateTime(merged.incidentDateTime)
                        : "-"
                    }
                  />
                 <InfoItem
                    labelText="ประเภทเรื่องย่อย"
                    value={
                      maps.subtype[complaint?.complaint_subtype_id ?? tab31?.complaintSubType] ||
                      merged.complaintSubTypeId || "-"
                    }
                  />
                  
                  <Grid item xs={12}>
                    <Typography fontSize={16}>
                      <Box component="span" fontWeight="bold">รายละเอียดเหตุการณ์:</Box>
                    </Typography>
                    <Typography sx={{ mt: 1 }}>{merged.description || step3.description || "-"}</Typography>
                  </Grid>

                  {/* <Grid item xs={12}>
                    <Typography fontSize={16} fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                      เอกสารประกอบการร้องเรียน
                    </Typography>
                  </Grid> */}

                  <InfoItem labelText="เลข สป.กค." value={merged.ref1 || "-"} />
                  <InfoItem labelText="วันที่ (สป.กค.)" value={fmtDate(merged.ref1Date)} />
                  <InfoItem labelText="เลข สป.สร." value={merged.ref2 || "-"} />
                  <InfoItem labelText="วันที่ (สป.สร.)" value={fmtDate(merged.ref2Date)} />
                  <InfoItem labelText="เลข สตป." value={merged.ref3 || "-"} />
                  <InfoItem labelText="วันที่ (สตป.)" value={fmtDate(merged.ref3Date)} />
                  {/* <InfoItem labelText="เลข สรร." value={merged.ref4 || "-"} />
                  <InfoItem labelText="วันที่ (สรร.)" value={fmtDate(merged.ref4Date)} /> */}

                  <InfoItem labelText="เลขที่หนังสือ" value={merged.docNo || "-"} />
                  <InfoItem labelText="วันที่หนังสือ" value={fmtDate(merged.docDate)} />

                  <InfoItem labelText="ชั้นความลับ" value={secMap[merged.securityLevel] || merged.securityLevel || "-"} />
                  <InfoItem labelText="ชั้นความเร่งด่วน" value={urgMap[merged.urgencyLevel] || merged.urgencyLevel || "-"} />
                  <InfoItem
                    labelText="หน่วยงานอื่นที่ส่ง"
                    value={
                      maps.agency[complaint?.agency_sender ?? tab31?.senderAgency] ||
                      merged.senderAgency || "-"
                    }
                  />

                  {/* <InfoItem
                    labelText="ประเภทการรับเรื่อง"
                    value={
                      merged.filingType === "additional"
                        ? "เรื่องร้องเรียนเพิ่มเติม"
                        : merged.filingType === "committee"
                        ? "รับเรื่องจากคณะทำงานนักตรวจสอบ"
                        : merged.filingType || "เรื่องร้องเรียนใหม่"
                    }
                  /> */}

                  {/* <InfoItem labelText="เลขอ้างอิงเพิ่มเติม 1" value={merged.addRef1 || "-"} />
                  <InfoItem labelText="วันที่อ้างอิงเพิ่มเติม 1" value={fmtDate(merged.addRef1Date)} />
                  <InfoItem labelText="เลขอ้างอิงเพิ่มเติม 2" value={merged.addRef2 || "-"} />
                  <InfoItem labelText="วันที่อ้างอิงเพิ่มเติม 2" value={fmtDate(merged.addRef2Date)} /> */}

                  {/* <InfoItem labelText="วันที่รับงานของเจ้าหน้าที่" value={fmtDateTime(merged.officerReceivedDate)} />
                  <InfoItem labelText="วันที่เสนองาน ผอ.สรร." value={fmtDateTime(merged.directorSubmittedDate)} /> */}
                </>
              ) : (
                // กรณี Tab3 - แสดงข้อมูลพื้นฐาน
                <>
                  <InfoItem
                    labelText="ช่องทางร้องทุกข์"
                    value={label(step3.complaintChannel || step3.complaintChannelName || merged.complaintChannel)}
                  />
                  <InfoItem labelText="ประเภทเรื่องร้องทุกข์" value={label(step3.complaintType)} />
                  <InfoItem
                    labelText="วันและเวลาที่เกิดเหตุ"
                    value={
                      step3.incidentDate
                        ? formatThaiDateTime(step3.incidentDate)
                        : merged.incidentDateTime
                        ? formatThaiDateTime(merged.incidentDateTime)
                        : "-"
                    }
                  />
                  
                  <Grid item xs={12}>
                    <Typography fontSize={16}>
                      <Box component="span" fontWeight="bold">รายละเอียดเหตุการณ์:</Box>
                    </Typography>
                    <Typography sx={{ mt: 1 }}>{step3.description || "-"}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Section>

          {/* เอกสารแนบ */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            เอกสารประกอบการร้องทุกข์
          </Typography>
          <Box mb={3}>
            {files.length > 0 ? (
              files.map((file, idx) => {
                const fileName = file?.fileName || file?.name || `ไฟล์แนบ ${idx + 1}`;
                const fileUrl = resolveFileUrl(file);
                const ext = getFileExt(fileName);

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      px: 2,
                      py: 1,
                      mb: 1,
                      cursor: file.fileUrl ? "pointer" : "default",
                      "&:hover": file.fileUrl
                        ? {
                            backgroundColor: "#f5f5f5",
                            borderColor: "#999",
                          }
                        : {},
                    }}
                    onClick={() => fileUrl && handleDownloadFile(fileUrl, fileName)}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", flex: 1 }}
                    >
                      {getFileIcon(ext)}
                      <Typography fontSize={14} color="text.secondary">
                        {fileName}
                      </Typography>
                    </Box>

                    {fileUrl && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", ml: 2 }}
                      >
                        <DownloadIcon
                          sx={{
                            color: "#1976d2",
                            fontSize: 20,
                            "&:hover": {
                              color: "#1565c0",
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              <Typography fontSize={14} color="text.secondary">
                ไม่มีไฟล์แนบ
              </Typography>
            )}
          </Box>

          {/* รับรอง */}
          <Typography fontSize={16} mb={1}>
            ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
          </Typography>
          <Typography fontSize={16} mb={3}>
            หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
          </Typography>

          <Divider />

          {/* ลายเซ็น */}
          <Grid container spacing={2} mb={3}>
            <InfoItem
              labelText="ลงชื่อผู้ร้องทุกข์"
              value={complainant.name || complainant.companyName || "-"}
            />
            <InfoItem
              labelText="ลงชื่อผู้รับมอบอำนาจ"
              value={delegate.name || delegate.signatoryName || "-"}
            />
            <InfoItem labelText="วันที่" value={formatThaiDate()} />
            <InfoItem labelText="วันที่" value={formatThaiDate()} />
          </Grid>
        </Paper>
      </div>

      {/* ปุ่ม Action */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
        <ButtonService
          label="ส่งออก"
          color="ส่งออก"
          variant="outlined"
          onClick={() => exportElementToPDF(pdfRef, "แบบฟอร์มร้องทุกข์.pdf")}
          iconRight={<UploadOutlinedIcon />}
        />
      </Box>
    </Box>
  );
};

const Section = ({ title, children }) => (
  <>
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      fontSize={20}
      gutterBottom
    >
      {title}
    </Typography>
    {children}
    <Divider />
  </>
);

const Divider = () => (
  <Box
    component="hr"
    sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }}
  />
);

export default ComplaintIDService;
