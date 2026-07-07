import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  GetComplaintByID,
  GetComplaintsWithSearch,
  GetAssignmentCompleteByAdmin,
  UpdateAssignmentCompleteByAdmin,
  UpdateComplaint,
  UploadAttachments,
  DeleteComplaintAttachment,
} from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService, {
  ControlledDateThaiPickerService,
} from "@services/DateThaiPickerService/DateThaiPickerService";
import { FormProvider, useForm } from "react-hook-form";
import styles from "./TabNav.module.scss";
import SearchComplaintsPreview from "./SearchComplaintsPreview";
import {
  GetAllSelectComplaintTypes,
  getSubComplaintTypeById,
  GetAllComplaintChannels,
  GetAllOutsideDepartments,
} from "@pages/api/allselect/allselect";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import { alertSuccess, alertError, alertWarning } from "@utils/Alerts";
import InputFile from "@services/InputFile/InputFile";

const breadcrumbItems = [
  {
    label: "จัดการข้อมูลในระบบ",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
  {
    label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์",
    url: "/admin/edit/website-complaints",
  },
  { label: "แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง" },
];

const SearchComplaints = () => {
  const router = useRouter();
  const { id, preview, fromBox, fromExternal } = router.query;

  const hasRedirected = useRef(false);
  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // File attachment states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const generalMethods = useForm({
    mode: "onChange",
  });
  const delegateMethods = useForm({
    mode: "onChange",
  });
  const step2Methods = useForm({
    mode: "onChange",
  });
  const step3Methods = useForm({
    mode: "onChange",
  });
  const step4Methods = useForm({
    mode: "onChange",
  });

  // === Master data state (normalized to { value, label }) ===
  const [complaintTypes, setComplaintTypes] = useState([]); // [{value,label, raw:original}]
  const [subComplaintTypes, setSubComplaintTypes] = useState([]); // [{value,label, raw}]
  const [complaintChannels, setComplaintChannels] = useState([]); // [{value,label, raw}]
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false); // เพิ่ม loading state สำหรับ channels
  const [selectedComplaintType, setSelectedComplaintType] = useState(""); // complaintType id currently selected
  // เก็บค่า complaint type เดิม (ตอนโหลดครั้งแรก) เพื่อเช็คว่าผู้ใช้เปลี่ยนหรือไม่
  const initialComplaintTypeIdRef = useRef(null);

  const isFromExternal =
    fromBox === "1" ||
    fromBox === "true" ||
    fromExternal === "1" ||
    fromExternal === "true" ||
    fromExternal === "box";

  // ---------------- Helper: extract registration_date (officerReceivedDate) with fallbacks ----------------
  const extractOfficerReceivedDate = useCallback((complaintObj, assignmentObj) => {
    const candidates = [
      assignmentObj?.registration_date,
      assignmentObj?.confirmAssignedDate,
      complaintObj?.registration_date,
      complaintObj?.confirmAssignedDate,
      complaintObj?.assignment_form?.registration_date,
      complaintObj?.assignment_form?.confirmAssignedDate,
      // old fallback (assigned_date) if confirm not found
      assignmentObj?.assigned_date,
      complaintObj?.assigned_date,
      complaintObj?.assignment_form?.assigned_date,
    ].filter(Boolean);

    for (const ts of candidates) {
      const d = new Date(ts);
      if (!isNaN(d)) return d; // first valid date
    }
    return ""; // no valid date
  }, []);

  // เพิ่ม refs เพื่อควบคุมการยิง API
  const fetchSubTypesTimeoutRef = useRef(null);
  const currentFetchPromiseRef = useRef(null);
  const lastFetchedIdRef = useRef("");

  const [outsideDepartments, setOutsideDepartments] = useState([]);
  const [loadingOutsideDepartments, setLoadingOutsideDepartments] =
    useState(false);

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

  const formatDateTimeForForm = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date;
  };

  // --- เปลี่ยน useEffect เปิด Dialog ให้ยิง API ---
  useEffect(() => {
    if (openSearchDialog) {
      setSearchText(""); // reset input
      handleSearch(""); // โหลดรายการทั้งหมดทันทีที่เปิด (keyword ว่าง)
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  // ✅ ใช้ useEffect หลักนี้แทน
useEffect(() => {
  async function fetchAll() {
    if (!id) return;
    setLoading(true);
    try {
      // Parallel fetch complaint core + assignment meta
      const [complaintRes, assignmentRes] = await Promise.all([
        GetComplaintByID(id),
        GetAssignmentCompleteByAdmin(id),
      ]);
      const complaint = complaintRes?.res_data || {};
      const assignment = assignmentRes?.res_data?.complaint || {};

      // Fetch master data (types, channels, outside departments)
      const [typesRes, channelsRes, outsideRes] = await Promise.all([
        GetAllSelectComplaintTypes(),
        GetAllComplaintChannels(),
        GetAllOutsideDepartments(),
      ]);

      // Normalize complaint types to {value,label}
      const normTypes = Array.isArray(typesRes?.res_data)
        ? typesRes.res_data.map((t) => ({
            value: t.id,
            label: t.name,
            raw: t,
          }))
        : [];
      setComplaintTypes(normTypes);

      // Normalize channels
      const normChannels = Array.isArray(channelsRes?.res_data?.items)
        ? channelsRes.res_data.items.map((c) => ({
            value: c.id,
            label: c.name,
            raw: c,
          }))
        : [];
      setComplaintChannels(normChannels);

      setOutsideDepartments(outsideRes || []);

      const merged = { ...complaint, assignment_form: assignment };
      setDefaultData(merged);

      // Load existing attachments
      if (complaint?.step3?.general?.attachment) {
        console.log("📎 Loaded attachments:", complaint.step3.general.attachment);
        setExistingAttachments(complaint.step3.general.attachment);
      }

      // === แก้จุดนี้: Map ชื่อ complaintType เป็น id ===
      let complaintTypeId =
        assignment.complaint_type_id ||
        merged?.step3?.general?.complaint_type_id ||
        merged?.step3?.general?.complaintType ||
        "";

      // ถ้าไม่ใช่ UUID ให้ map จาก name → id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(complaintTypeId) && typeof complaintTypeId === "string") {
        const found = normTypes.find((t) => t.label === complaintTypeId);
        complaintTypeId = found ? found.value : "";
      }
      setSelectedComplaintType(String(complaintTypeId || ""));

      // Prefetch sub complaint types if we have an id (UUID เท่านั้น)
      let subTypes = [];
      if (complaintTypeId && uuidRegex.test(complaintTypeId)) {
        try {
          const subRes = await getSubComplaintTypeById(complaintTypeId);
          if (
            subRes?.res_code === "0000" &&
            Array.isArray(subRes?.res_data?.items)
          ) {
            subTypes = subRes.res_data.items.map((s) => ({
              value: s.id,
              label: s.name,
              raw: s,
            }));
          }
        } catch {
          subTypes = [];
        }
      }
      setSubComplaintTypes(subTypes);

      // Reset forms with normalized field names (use complaintType instead of complaintTypeId)
      // ✅ รองรับทุกประเภทผู้ร้อง (individual/corporate/government)
      const s1General = merged?.step1?.general || {};
      const s1Complainant = s1General.corporate || s1General.government || s1General.general || {};
      const s1Delegate = s1General.signer || s1General.delegate || {};
      generalMethods.reset(s1Complainant);
      delegateMethods.reset(s1Delegate);
      // ✅ รองรับทุกประเภทผู้ถูกร้อง
      const s2General = merged?.step2?.general || {};
      const s2Respondent = s2General[s2General.activeType] || s2General.individual || s2General.corporate || s2General.government || {};
      step2Methods.reset(s2Respondent);
      step3Methods.reset({
        ...merged?.step3?.general,
        complaintType: complaintTypeId ? String(complaintTypeId) : "",
        complaintTypeId: complaintTypeId ? String(complaintTypeId) : "",
        complaintSubType:
          assignment.complaint_subtype_id ||
          merged?.step3?.general?.complaint_subtype_id ||
          "",
        complaintChannel:
          assignment.complaint_channel_id ||
          merged?.step3?.general?.complaint_channel_id ||
          "",
        subject: assignment.subject || merged?.step3?.general?.subject || "",
        description: merged?.step3?.general?.description || "",
        incidentDate: merged?.step3?.general?.incidentDate
          ? new Date(merged.step3.general.incidentDate)
          : "",
        referenceNumber1: assignment.reference_number || assignment.reference_number1 || "",
        referenceDate1: assignment.reference_date
          ? new Date(assignment.reference_date)
          : "",
        referenceNumber2: assignment.reference_number2 || "",
        referenceDate2: assignment.reference_date2
          ? new Date(assignment.reference_date2)
          : "",
        referenceNumber3: assignment.reference_number3 || "",
        referenceDate3: assignment.reference_date3
          ? new Date(assignment.reference_date3)
          : "",
        referenceNumber4: assignment.reference_number4 || merged?.complaint_number || "",
        // referenceDate4: assignment.reference_date4
        //   ? new Date(assignment.reference_date4)
        //   : "",
        referenceDate4: assignment.created_at
          ? new Date(assignment.created_at)
          : "",
        documentNumber: assignment.document_number || "",
        documentDate: assignment.document_date
          ? new Date(assignment.document_date)
          : "",
        additionalReference1: assignment.additional_reference_number1 || "",
        additionalReferenceDate1: assignment.additional_reference_date1
          ? new Date(assignment.additional_reference_date1)
          : "",
        additionalReference2: assignment.additional_reference_number2 || "",
        additionalReferenceDate2: assignment.additional_reference_date2
          ? new Date(assignment.additional_reference_date2)
          : "",
        senderAgency: assignment.agency_sender || "",
        securityLevel: assignment.confidentiality_level || "normal",
        urgencyLevel: assignment.urgency_level || "low",
        complaint_filing_type:
          (assignment.complaint_filing_type || merged?.step3?.general?.complaint_filing_type || "new") === "anonymous"
            ? "committee"
            : assignment.complaint_filing_type || merged?.step3?.general?.complaint_filing_type || "new",
        isNewComplaint:
          ["new", null].includes(assignment.complaint_filing_type || merged?.step3?.general?.complaint_filing_type),
        isAdditionalComplaint:
          (assignment.complaint_filing_type || merged?.step3?.general?.complaint_filing_type) === "additional",
        isCommitteeComplaint:
          (assignment.complaint_filing_type || merged?.step3?.general?.complaint_filing_type) === "committee" ||
          assignment.complaint_filing_type === "anonymous",
      });

      const officerDate = extractOfficerReceivedDate(merged, assignment);
      const directorDate =
        assignment.director_submission_date ||
        merged?.director_submission_date ||
        merged?.assignment_form?.director_submission_date;
        step4Methods.reset({
          officerReceivedDate: extractOfficerReceivedDate(merged, assignment),
          directorSubmittedDate: assignment.director_submission_date ? formatDateTimeForForm(assignment.director_submission_date) : "",
          // แก้เป็น incidentDate
          incidentDateTime: assignment.incidentDate 
            ? formatDateTimeForForm(assignment.incidentDate)
            : merged?.step3?.general?.incidentDate 
            ? formatDateTimeForForm(merged.step3.general.incidentDate)
            : "",
        });
    } catch (err) {
      setError("โหลดข้อมูลไม่สำเร็จ");
      setComplaintTypes([]);
      setComplaintChannels([]);
      setOutsideDepartments([]);
      setSubComplaintTypes([]);
    } finally {
      setLoading(false);
    }
  }
  fetchAll();
}, [id]);


  // --- handleSearch ยังคงเดิม (ยิง API search ด้วย keyword) ---

  const handleSearch = async (keyword) => {
    setSearchLoading(true);
    try {
      const response = await GetComplaintsWithSearch({
        skip: 0,
        limit: 10000,
        search: keyword || "",
      });

      // ใช้ complaint_number เป็น label และ value หลัก
      const items = Array.isArray(response?.res_data?.items)
        ? response.res_data.items
        : [];

      const results = items.map((item) => ({
        ...item,
        label: item.complaint_number || "",
        value: item.complaint_number || "",
      }));

      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
      console.error("handleSearch error", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectReference = (ref) => {
    step3Methods.setValue("additionalReference1", ref.complaint_number);
    setOpenSearchDialog(false);
  };

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      handleSearch("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);


  const buddhistYYYYMMDDToDate = (yyyymmddStr) => {
    if (!/^\d{8}$/.test(yyyymmddStr)) return null;
    const yearThai = parseInt(yyyymmddStr.slice(0, 4), 10);
    const month = parseInt(yyyymmddStr.slice(4, 6), 10);
    const day = parseInt(yyyymmddStr.slice(6, 8), 10);

    // ตรวจความสมเหตุสมผลแบบคร่าว ๆ
    if (yearThai < 2400 || yearThai > 2800) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const yearAD = yearThai - 543;
    return new Date(yearAD, month - 1, day, 0, 0, 0);
  };

  const extractYYYYMMDDFromRef = (refNo) => {
    if (!refNo) return null;
    // จับบล็อคเลข 8 หลักแรกที่เจอ
    const m = refNo.match(/(\d{8})/);
    return m ? m[1] : null;
  };

  const refNo4 = step3Methods.watch("referenceNumber4");

  useEffect(() => {
    if (!refNo4) return;

    const yyyymmddThai = extractYYYYMMDDFromRef(refNo4);
    if (!yyyymmddThai) return;

    const parsedDate = buddhistYYYYMMDDToDate(yyyymmddThai);
    if (!parsedDate) return;

    const current = step3Methods.getValues("referenceDate4");
    const sameDay =
      current instanceof Date &&
      current.getFullYear() === parsedDate.getFullYear() &&
      current.getMonth() === parsedDate.getMonth() &&
      current.getDate() === parsedDate.getDate();

    if (!sameDay) {
      step3Methods.setValue("referenceDate4", parsedDate, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [refNo4, step3Methods]);

  useEffect(() => {
    setLoadingOutsideDepartments(true);
    GetAllOutsideDepartments()
      .then((data) => setOutsideDepartments(data))
      .catch(() => setOutsideDepartments([]))
      .finally(() => setLoadingOutsideDepartments(false));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingOptions(true);
      setLoadingChannels(true);

      try {
        // โหลด complaint types และ channels พร้อมกัน
        const [complaintTypesResponse, channelsResponse] = await Promise.all([
          GetAllSelectComplaintTypes(),
          GetAllComplaintChannels(),
        ]);

        // ----- จัดการ complaint types -----
        if (
          complaintTypesResponse?.res_code === "0000" &&
          complaintTypesResponse?.res_data
        ) {
          setComplaintTypes(complaintTypesResponse.res_data);

          // ==== ส่วนสำคัญ: set complaint_type_id ====
          // ดึงชื่อจาก defaultData (กรุณา ensure ว่า defaultData มีอยู่)
          if (
            defaultData?.step3?.general?.complaintType &&
            Array.isArray(complaintTypesResponse.res_data)
          ) {
            const complaintTypeName = defaultData.step3.general.complaintType;
            const matchedType = complaintTypesResponse.res_data.find(
              (type) => type.name === complaintTypeName
            );
            const complaintTypeId = matchedType ? matchedType.id : null;

            // เซ็ตค่าใหม่ให้ defaultData (แนะนำใช้ setState ถ้า defaultData อยู่ใน state)
            if (complaintTypeId) {
              setDefaultData((prev) => ({
                ...prev,
                step3: {
                  ...prev.step3,
                  general: {
                    ...prev.step3.general,
                    complaint_type_id: complaintTypeId,
                  },
                },
              }));
              console.log(
                `Mapped complaintType "${complaintTypeName}" -> id: ${complaintTypeId}`
              );
            }
          }
        } else {
          console.error(
            "Failed to load complaint types:",
            complaintTypesResponse?.res_desc
          );
        }

        // ----- จัดการ complaint channels -----
        if (
          channelsResponse?.res_code === "0000" &&
          channelsResponse?.res_data
        ) {
          const channelsData = channelsResponse.res_data;

          if (channelsData.items && Array.isArray(channelsData.items)) {
            // เอาเฉพาะ id และ name จาก items
            const filteredChannels = channelsData.items.map((item) => ({
              id: item.id,
              name: item.name,
            }));

            setComplaintChannels(filteredChannels);
          } else {
            console.log("No channels items found in response data");
            setComplaintChannels([]);
          }
        } else {
          console.error(
            "Failed to load complaint channels:",
            channelsResponse?.res_message || channelsResponse?.res_desc
          );
          setComplaintChannels([]);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setComplaintTypes([]);
        setComplaintChannels([]);
      } finally {
        setLoadingOptions(false);
        setLoadingChannels(false);
      }
    };

    fetchInitialData();
    // ... (no dependency change, so only runs once on mount)
  }, []);

  // ฟังก์ชันตรวจสอบว่า ID ถูกต้องหรือไม่
  const isValidId = (id) => {
    return (
      id &&
      id !== "" &&
      id !== null &&
      id !== undefined &&
      typeof id === "string" &&
      id.trim() !== ""
    );
  };

  // ฟังก์ชันล้างการโหลด sub types
  const clearSubTypes = () => {
    // ยกเลิก timeout ที่รอค้างอยู่
    if (fetchSubTypesTimeoutRef.current) {
      clearTimeout(fetchSubTypesTimeoutRef.current);
      fetchSubTypesTimeoutRef.current = null;
    }

    // ยกเลิก promise ที่รอค้างอยู่
    if (currentFetchPromiseRef.current) {
      currentFetchPromiseRef.current = null;
    }

    // ล้างข้อมูล
    setSubComplaintTypes([]);
    setLoadingSubTypes(false);
    lastFetchedIdRef.current = "";
  };

  const fetchSubComplaintTypes = useCallback(async (complaintTypeId) => {
    // ตรวจสอบ ID ก่อน ถ้าไม่ถูกต้อง ให้ล้าง subTypes แล้ว return เลย
    if (!isValidId(complaintTypeId)) {
      clearSubTypes();
      return;
    }

    // ยกเลิก API/promise/subTypes ที่อาจรอค้างอยู่ก่อน
    clearSubTypes();

    setLoadingSubTypes(true);
    lastFetchedIdRef.current = complaintTypeId;

    // สร้าง promise อันใหม่สำหรับ fetch นี้
    const fetchPromise = (async () => {
      try {
        const response = await getSubComplaintTypeById(complaintTypeId);

        if (response?.res_code === "0000" && response?.res_data) {
          const responseData = response.res_data;

          if (Array.isArray(responseData.items)) {
            // map เฉพาะ id และ name จาก items
            const filteredSubTypes = responseData.items.map((item) => ({
              id: item.id,
              name: item.name,
            }));
            setSubComplaintTypes(filteredSubTypes);
          } else {
            // กรณีไม่มี items array
            setSubComplaintTypes([]);
            console.log("No items array found in response data");
          }
        } else {
          // กรณี response error code
          setSubComplaintTypes([]);
          console.error(
            "Failed response:",
            response?.res_message || response?.res_desc
          );
        }
      } catch (error) {
        // กรณี error จาก API
        setSubComplaintTypes([]);
        if (error?.response?.status === 404) {
          console.log("404 - No sub types found for this complaint type");
        } else if (error?.response?.status === 400) {
          console.log("400 - Bad request, possibly invalid parent_type_id");
        } else {
          console.error("Error fetching sub complaint types:", error);
        }
      } finally {
        // ตรวจสอบว่า promise นี้ยังเป็น current promise หรือไม่
        if (currentFetchPromiseRef.current === fetchPromise) {
          setLoadingSubTypes(false);
          currentFetchPromiseRef.current = null;
        }
      }
    })();

    // set ให้ currentFetchPromiseRef รอ promise นี้
    currentFetchPromiseRef.current = fetchPromise;
  }, []);

  const handleComplaintTypeSelectChange = (event) => {
    const value = event.target.value;
    // Mirror to both keys for backward compatibility
    step3Methods.setValue("complaintType", value, { shouldDirty: true });
    step3Methods.setValue("complaintTypeId", value, { shouldDirty: true });
    step3Methods.setValue("complaintSubType", "");
    setSelectedComplaintType(value);
    clearSubTypes();
    if (isValidId(value)) {
      fetchSubTypesTimeoutRef.current = setTimeout(() => {
        fetchSubComplaintTypes(value);
      }, 300);
    }
  };

  const defaultGeneralRef = useRef({});
  const defaultDelegateRef = useRef({});
  const defaultStep2Ref = useRef({});
  const defaultStep3Ref = useRef({});
  const defaultStep4Ref = useRef({});

  const [complainantType, setComplainantType] = useState("individual");
  const [delegateType, setDelegateType] = useState("delegate");
  const [respondentType, setRespondentType] = useState("individual");

  const handleComplainantTabChange = (newType) => {
    console.log(`[TabChange] Switching to: ${newType}`);
    const currentData = generalMethods.getValues();
    const baseData = packPerson(currentData);

    // ✅ สร้างข้อมูลตามประเภทที่เลือก
    let newData;
    if (newType === "government") {
      newData = {
        idCard: baseData.idCard || "",
        fullName: baseData.fullName || baseData.name || "",
        agencyName: baseData.agencyName || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    } else if (newType === "corporate") {
      newData = {
        idCard: baseData.idCard || "",
        companyName: baseData.companyName || baseData.name || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    } else {
      newData = {
        idCard: baseData.idCard || "",
        name: baseData.name || baseData.fullName || baseData.companyName || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    }

    // ✅ ใช้ reset ครั้งเดียว (keepDefaultValues: false เพื่อล้าง field เก่า)
    generalMethods.reset(newData, { keepDefaultValues: false });
    setComplainantType(newType);

    // Delegate
    const currentDelegateData = delegateMethods.getValues();
    const baseDelegate = packPerson(currentDelegateData);

    if (newType === "corporate") {
      setDelegateType("signer");
      delegateMethods.reset({
        idCard: baseDelegate.idCard || "",
        signatoryName: baseDelegate.signatoryName || baseDelegate.name || "",
        address: baseDelegate.address || "",
        phone: baseDelegate.phone || "",
        email: baseDelegate.email || "",
        province: baseDelegate.province || null,
        districts: baseDelegate.districts || null,
        subdistricts: baseDelegate.subdistricts || null,
        zipcode: baseDelegate.zipcode || null,
      }, { keepDefaultValues: false });
    } else {
      setDelegateType("delegate");
      delegateMethods.reset({
        idCard: baseDelegate.idCard || "",
        name: baseDelegate.name || baseDelegate.signatoryName || "",
        address: baseDelegate.address || "",
        phone: baseDelegate.phone || "",
        email: baseDelegate.email || "",
        province: baseDelegate.province || null,
        districts: baseDelegate.districts || null,
        subdistricts: baseDelegate.subdistricts || null,
        zipcode: baseDelegate.zipcode || null,
      }, { keepDefaultValues: false });
    }
  };

  const handleRespondentTabChange = (newType) => {
    const currentData = step2Methods.getValues();
    const baseData = packPerson(currentData);

    let newData;
    if (newType === "government") {
      newData = {
        idCard: baseData.idCard || "",
        fullName: baseData.fullName || baseData.name || "",
        agencyName: baseData.agencyName || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    } else if (newType === "corporate") {
      newData = {
        idCard: baseData.idCard || "",
        companyName: baseData.companyName || baseData.name || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    } else {
      newData = {
        idCard: baseData.idCard || "",
        name: baseData.name || baseData.fullName || baseData.companyName || "",
        address: baseData.address || "",
        phone: baseData.phone || "",
        email: baseData.email || "",
        province: baseData.province || null,
        districts: baseData.districts || null,
        subdistricts: baseData.subdistricts || null,
        zipcode: baseData.zipcode || null,
      };
    }

    step2Methods.reset(newData, { keepDefaultValues: false });
    setRespondentType(newType);
  };

  useEffect(() => {
    if (id) {
      fetchComplaints(id);
    }
  }, [id]);

useEffect(() => {
  if (defaultData?.step3?.general || defaultData?.assignment_form) {
    const step3General = defaultData?.step3?.general || {};
    const assignmentForm = defaultData?.assignment_form || {};
    const step4General = defaultData?.step4?.general || {};

    // === Map ช่องทางเรื่องร้องเรียน ===
    let matchedChannelId = "";
    if (step3General.complaint_channel_id) {
      matchedChannelId = step3General.complaint_channel_id;
    } else if (
      step3General.complaint_channel_name &&
      complaintChannels.length > 0
    ) {
      const matched = complaintChannels.find(
        (ch) => ch.name === step3General.complaint_channel_name
      );
      if (matched) matchedChannelId = matched.id;
    } else if (assignmentForm.complaint_channel_id) {
      matchedChannelId = assignmentForm.complaint_channel_id;
    }

    step3Methods.reset({
      // ประเภท
      complaintType:
        step3General.complaint_type_id || assignmentForm.complaint_type_id || "",
      complaintTypeId:
        step3General.complaint_type_id || assignmentForm.complaint_type_id || "",
      complaintSubType:
        step3General.complaint_subtype_id || assignmentForm.complaint_subtype_id || "",
      subject: step3General.subject || assignmentForm.subject || "",
      description: step3General.description || "",
      incidentDate: step3General.incidentDate
        ? new Date(step3General.incidentDate)
        : "",

      // ช่องทางเรื่องร้องเรียน
      complaintChannel: matchedChannelId,

      // === mapping วันที่ ===
      referenceNumber1: assignmentForm.reference_number || "",
      referenceDate1: assignmentForm.reference_date
        ? new Date(assignmentForm.reference_date)
        : "",

      referenceNumber2: assignmentForm.reference_number2 || "",
      referenceDate2: assignmentForm.reference_date2
        ? new Date(assignmentForm.reference_date2)
        : "", // สป.สร.

      referenceNumber3: assignmentForm.reference_number3 || "",
      referenceDate3: assignmentForm.reference_date3
        ? new Date(assignmentForm.reference_date3)
        : "", // สตป.

      referenceNumber4: assignmentForm.reference_number4 || "",
      referenceDate4: assignmentForm.reference_date4
        ? new Date(assignmentForm.reference_date4)
        : "", // สรร.(สารบัญ)

      documentNumber: assignmentForm.document_number || "",
      documentDate: assignmentForm.document_date
        ? new Date(assignmentForm.document_date)
        : "", // เลขที่หนังสือ

      additionalReference1: assignmentForm.additional_reference_number1 || "",
      additionalReferenceDate1: assignmentForm.additional_reference_date1
        ? new Date(assignmentForm.additional_reference_date1)
        : "", // อ้างอิง (สารบัญ)

      additionalReference2: assignmentForm.additional_reference_number2 || "",
      additionalReferenceDate2: assignmentForm.additional_reference_date2
        ? new Date(assignmentForm.additional_reference_date2)
        : "", // อ้างอิง (สานต่อ)

      senderAgency: assignmentForm.agency_sender || "",
      securityLevel: assignmentForm.confidentiality_level || "normal",
      urgencyLevel: assignmentForm.urgency_level || "low",

      // Filing type
      complaint_filing_type:
        (assignmentForm.complaint_filing_type || "new") === "anonymous"
          ? "committee"
          : assignmentForm.complaint_filing_type || "new",
      isNewComplaint: assignmentForm.complaint_filing_type !== "additional" && assignmentForm.complaint_filing_type !== "anonymous",
      isAdditionalComplaint: assignmentForm.complaint_filing_type === "additional",
      isCommitteeComplaint: assignmentForm.complaint_filing_type === "committee" || assignmentForm.complaint_filing_type === "anonymous",
    });

    const officerDate2 = extractOfficerReceivedDate(defaultData, assignmentForm);
    const directorDate2 = assignmentForm.director_submission_date || defaultData?.director_submission_date;
    step4Methods.reset({
      officerReceivedDate: officerDate2,
      directorSubmittedDate: directorDate2 ? formatDateTimeForForm(directorDate2) : "",
      // แก้เป็น incidentDate
      incidentDateTime: assignmentForm.incidentDate
        ? formatDateTimeForForm(assignmentForm.incidentDate)
        : step3General.incidentDate
        ? formatDateTimeForForm(step3General.incidentDate)
        : "",
    });

    // โหลด subtypes
    if (assignmentForm.complaint_type_id) {
      fetchSubComplaintTypes(assignmentForm.complaint_type_id);
      setSelectedComplaintType(assignmentForm.complaint_type_id);
      // บันทึกค่า initial แค่ครั้งแรกเท่านั้น (ไม่ override เมื่อ user เปลี่ยน)
      if (initialComplaintTypeIdRef.current === null) {
        initialComplaintTypeIdRef.current = assignmentForm.complaint_type_id;
      }
    }
  }
}, [defaultData, complaintTypes, complaintChannels]);

// Fallback sync: if complaintTypeId still empty but complaintType has value, synchronize
useEffect(() => {
  const ct = step3Methods.getValues("complaintType");
  const ctid = step3Methods.getValues("complaintTypeId");
  if (ct && !ctid) {
    step3Methods.setValue("complaintTypeId", ct, { shouldDirty: false });
    // also update selectedComplaintType to drive sub-type load
    if (!selectedComplaintType) {
      setSelectedComplaintType(ct);
    }
    console.debug("[fallback-sync] complaintTypeId populated from complaintType", ct);
  }
}, [defaultData, complaintTypes]);


// effect ที่สอง: set ค่า complaintSubType หลัง subComplaintTypes โหลด
useEffect(() => {
  if (!subComplaintTypes.length) return;

  // ถ้าผู้ใช้เปลี่ยนประเภทเรื่องร้องเรียน (selected != initial) ให้คง placeholder = "" เสมอ
  const initialTypeId = initialComplaintTypeIdRef.current;
  if (
    selectedComplaintType &&
    initialTypeId &&
    String(selectedComplaintType) !== String(initialTypeId)
  ) {
    // เคลียร์ค่า (หาก fetch ใหม่แล้ว) เพื่อให้ dropdown แสดง "เลือกประเภทเรื่องย่อย"
    step3Methods.setValue("complaintSubType", "", { shouldDirty: true });
    return;
  }

  // กรณีโหลดครั้งแรก (หรือยังไม่เปลี่ยน main type) -> restore ค่าเดิมถ้ามี
  const subTypeId =
    defaultData?.step3?.general?.complaint_subtype_id ||
    defaultData?.assignment_form?.complaint_subtype_id;
  const subTypeName =
    defaultData?.step3?.general?.complaint_subtype_data?.name ||
    defaultData?.assignment_form?.complaint_subtype_name;

  if (subTypeId) {
    step3Methods.setValue("complaintSubType", subTypeId, { shouldDirty: false });
  } else if (subTypeName) {
    const matched = subComplaintTypes.find((s) => s.name === subTypeName);
    if (matched) {
      step3Methods.setValue("complaintSubType", matched.id, { shouldDirty: false });
    }
  } else {
    // ไม่มีค่าเดิม -> คง placeholder
    step3Methods.setValue("complaintSubType", "", { shouldDirty: false });
  }
}, [subComplaintTypes, defaultData, selectedComplaintType, step3Methods]);


  const fetchComplaints = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);

      // เช็ค general ถ้ามี key government ซ้อน ให้ใช้ data ใน government แทน
      let generalData = data?.step1?.general?.general;

      if (
        generalData &&
        typeof generalData === "object" &&
        Object.keys(generalData).length === 1 &&
        generalData.government &&
        typeof generalData.government === "object"
      ) {
        // กรณี general = { government: {...} }
        console.log("ใช้ข้อมูลจาก general.government", generalData.government);
        generalData = generalData.government;
      } else if (
        !generalData ||
        (typeof generalData === "object" &&
          Object.keys(generalData).length === 0)
      ) {
        // ไม่มีข้อมูล general หรือเป็น object ว่าง
        if (
          data?.step1?.general?.general?.government &&
          Object.keys(data.step1.general.general.government).length > 0
        ) {
          generalData = data.step1.general.general.government;
          setComplainantType("government");
          console.log(
            "Fallback: ใช้ข้อมูลจาก government แทน general",
            generalData
          );
        } else {
          generalData = {};
          console.log("Fallback: general และ government ว่างทั้งคู่");
        }
      } else {
        console.log("ใช้ข้อมูลจาก general", generalData);
      }

      // ตรวจสอบประเภทผู้ร้องทุกข์จากข้อมูล
      // ✅ เช็คที่ step1.general (รองรับทั้งโครงสร้างเก่าและใหม่จาก backend)
      const step1General = data?.step1?.general || {};
      const step1Inner = step1General.general || {};
      if (step1General.corporate && Object.keys(step1General.corporate).length > 0) {
        setComplainantType("corporate");
        setDelegateType("signer");
        defaultDelegateRef.current = step1General.signer || null;
      } else if (step1General.government && Object.keys(step1General.government).length > 0) {
        setComplainantType("government");
        setDelegateType("delegate");
        defaultDelegateRef.current = step1General.delegate || null;
      } else {
        setComplainantType("individual");
        setDelegateType("delegate");
        defaultDelegateRef.current = step1General.delegate || null;
      }

      // ตรวจสอบประเภทผู้ถูกร้องเรียนจากข้อมูล
      const step2General = data?.step2?.general || {};
      if (step2General.activeType) {
        setRespondentType(step2General.activeType);
        defaultStep2Ref.current = step2General[step2General.activeType] || {};
      } else if (step2General.corporate && Object.keys(step2General.corporate).length > 0) {
        setRespondentType("corporate");
        defaultStep2Ref.current = step2General.corporate;
      } else if (step2General.government && Object.keys(step2General.government).length > 0) {
        setRespondentType("government");
        defaultStep2Ref.current = step2General.government;
      } else {
        setRespondentType("individual");
        defaultStep2Ref.current = step2General.individual || {};
      }
      defaultStep3Ref.current = data?.step3?.general || {};
      defaultStep4Ref.current = data?.step4?.general || {};

      // เพิ่ม ref สำหรับ complaint_number
      defaultStep3Ref.current.complaint_number = data?.complaint_number || "";

      console.log("defaultStep3Ref", defaultStep3Ref);

      // ✅ เซ็ต defaultGeneralRef ตามประเภทผู้ร้องที่ตรวจจับได้
      const s1G = data?.step1?.general || {};
      defaultGeneralRef.current = s1G.corporate || s1G.government || s1G.general || {};

      // reset form อื่น (delegate ต้อง reset เสมอ ไม่ว่าจะมีข้อมูลหรือไม่)
      generalMethods.reset(defaultGeneralRef.current);
      delegateMethods.reset(defaultDelegateRef.current || {});
      step2Methods.reset(defaultStep2Ref.current);
      step4Methods.reset(defaultStep4Ref.current);

      // *** อย่า reset step3Methods ตรงนี้ ***
      // รอให้ complaintTypes โหลดเสร็จก่อน (ทำใน useEffect ด้านล่าง)
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
  clearSubTypes();

  generalMethods.reset(defaultGeneralRef.current);
  if (defaultDelegateRef.current)
    delegateMethods.reset(defaultDelegateRef.current);
  step2Methods.reset(defaultStep2Ref.current);
  const step3General = defaultData?.step3?.general || {};
  const assignmentForm = defaultData?.assignment_form || {};
  const typeId =
    step3General.complaint_type_id || assignmentForm.complaint_type_id || "";
  step3Methods.reset({
    ...step3General,
    complaintType: typeId ? String(typeId) : "",
    complaintTypeId: typeId ? String(typeId) : "",
    complaintSubType:
      step3General.complaint_subtype_id || assignmentForm.complaint_subtype_id || "",
    complaintChannel:
      step3General.complaint_channel_id || assignmentForm.complaint_channel_id || "",
  });
  step4Methods.reset(defaultData?.step4?.general || {});

  // Restore original type states from loaded data
  // ✅ เช็คที่ step1.general (รองรับทั้งโครงสร้างเก่าและใหม่)
  const step1G = defaultData?.step1?.general || {};
  const cType = step1G.government && Object.keys(step1G.government).length > 0
    ? "government"
    : step1G.corporate && Object.keys(step1G.corporate).length > 0
    ? "corporate"
    : "individual";
  setComplainantType(cType);
  setDelegateType(cType === "corporate" ? "signer" : "delegate");
  setRespondentType(defaultData?.step2?.general?.activeType || "individual");

  // Reset file attachments
  setUploadedFiles([]);
  if (defaultData?.step3?.general?.attachment) {
    setExistingAttachments(defaultData.step3.general.attachment);
  } else {
    setExistingAttachments([]);
  }
};


  useEffect(() => {
    if (defaultData?.complaint_number) {
      step3Methods.setValue("referenceNumber4", defaultData.complaint_number);
    }
  }, [defaultData?.complaint_number]);

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      clearSubTypes();
    };
  }, []);

  // Helper functions
  const getErrorMessage = (fieldName) => {
    const formError = step3Methods.formState.errors[fieldName];
    return formError ? (
      <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
        {formError.message}
      </div>
    ) : null;
  };

  const getErrorStyle = (fieldName) => {
    const formError = step3Methods.formState.errors[fieldName];
    return formError ? { borderColor: "red", borderWidth: "2px" } : {};
  };

  const handleBackFromPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
    hasRedirected.current = false;
    console.log(
      "handleBackFromPreview called, reset hasRedirected:",
      hasRedirected.current
    );
  };

  // --- Date helpers (แก้ปัญหาวันลดลง 1 วันเมื่อไม่เลือก date picker) ---
  const parseDateFlexible = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      // รูปแบบไม่มี timezone
      const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
      if (m) {
        const [, Y, Mo, D, H = "00", Mi = "00", S = "00"] = m;
        return new Date(Number(Y), Number(Mo) - 1, Number(D), Number(H), Number(Mi), Number(S));
      }
      // แปลงช่องว่างเป็น T เพื่อให้ Date native parse ได้ (กรณีมี Z)
      return new Date(trimmed.replace(/ /, "T"));
    }
    return null;
  };

  const formatDateForAPI = (value) => {
    if (!value) return null;
    const d = parseDateFlexible(value);
    if (!d || isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
  };

  const packPerson = (p = {}) => {
    // ✅ Normalize ชื่อเป็น `name` เดียวทุกประเภท (ใช้ function เดียวกัน)
    const normalizedName = p.name || p.fullName || p.companyName || p.signatoryName || "";
    return {
      idCard: p.idCard || "",
      name: normalizedName,
      fullName: p.fullName || normalizedName,
      agencyName: p.agencyName || "",
      companyName: p.companyName || normalizedName,
      signatoryName: p.signatoryName || normalizedName,
      address: p.address || "",
      phone: p.phone || "",
      province: p.province ?? null,
      districts: p.districts ?? null,
      subdistricts: p.subdistricts ?? null,
      zipcode: p.zipcode ?? null,
      email: p.email || "",
    };
  };

  const hasAnyValue = (obj) =>
    obj && typeof obj === "object" && Object.values(obj).some(v => v !== "" && v !== null && v !== undefined);

  /**
   * สร้าง payload สำหรับ step1 และ step2
   * complainantType: 'individual' | 'corporate' | 'government'
   * delegateType: 'delegate' | 'signer'
   * respondentType: 'individual' | 'corporate' | 'government'
   */
  const buildStep12Payload = ({
    generalData,
    delegateData,
    delegateType = "delegate",
    step2Data,
    respondentType = "individual",
    complainantType = "individual",
  }) => {
    let step1General;

    if (complainantType === "government") {
      step1General = {
        government: packPerson(generalData || {}),
        ...(hasAnyValue(delegateData)
          ? { delegate: packPerson(delegateData) }
          : {}),
      };
    } else if (complainantType === "corporate") {
      step1General = {
        corporate: packPerson(generalData || {}),
        ...(hasAnyValue(delegateData)
          ? { signer: packPerson(delegateData) }
          : {}),
      };
    } else {
      step1General = {
        general: packPerson(generalData || {}),
        ...(hasAnyValue(delegateData)
          ? { [delegateType]: packPerson(delegateData) }
          : {}),
      };
    }

    const step1 = { general: step1General };

    const step2 = {
      general: {
        activeType: respondentType,
        [respondentType]: packPerson(step2Data || {}),
      },
    };

    return { step1, step2 };
  };

  const updateStep12 = async () => {
    if (!defaultData?.id) {
      alertError("ข้อผิดพลาด", "ไม่พบ ID ของเรื่องร้องเรียน");
      return false;
    }

    // ดึงค่าจากฟอร์ม 3 ชุดแรก
    const generalData  = generalMethods.getValues();   // ผู้ร้องทุกข์
    const delegateData = delegateMethods.getValues();  // ผู้รับมอบอำนาจ
    const step2Data    = step2Methods.getValues();     // ผู้ถูกร้องเรียน

    // ส่ง type ที่ถูกต้องตามที่เลือกจาก tab
    const payload = buildStep12Payload({
      generalData,
      delegateData,
      delegateType,
      step2Data,
      respondentType,
      complainantType,
    });

    // ✅ ส่ง step3 จากฟอร์มปัจจุบัน (ไม่ใช่ defaultData เก่า)
    const currentStep3 = step3Methods.getValues();
    payload.step3 = {
      general: {
        ...currentStep3,
        attachment: existingAttachments,
      }
    };

    try {
      const res = await UpdateComplaint(defaultData.id, payload);
      const ok =
        ["0000", "0002"].includes(String(res?.res_code)) ||
        res?.success === true ||
        res?.status === "ok" ||
        /SUCCESS|UPDATED|OK/i.test(String(res?.res_message || ""));

      if (!ok) {
        throw new Error(res?.res_message || res?.message || "อัปเดต Step 1–2 ไม่สำเร็จ");
      }
      return true;
    } catch (err) {
      console.error("UpdateComplaint (step1–2) error:", err);
      alertError("ข้อผิดพลาด", err?.message || "ไม่สามารถอัปเดตข้อมูลผู้ร้อง/ผู้มอบอำนาจ/ผู้ถูกร้องได้");
      return false;
    }
  };

  // File upload handlers
  const handleFileUpload = useCallback((files) => {
    setUploadedFiles(files);
  }, []);

  const buildFileUrl = useCallback((filePath) => {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    const baseUrl = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL?.replace(/\/$/, "") || "";
    return `${baseUrl}/${filePath.replace(/^\//, "")}`;
  }, []);

  const handleDeleteExistingAttachment = useCallback(async (att) => {
    if (!att?.id || !id) {
      console.log("❌ Missing att.id or id:", { att, id });
      return false;
    }

    console.log("🗑️ Deleting attachment:", {
      attachmentId: att.id,
      complaintId: id,
      attachment: att
    });

    try {
      const res = await DeleteComplaintAttachment(id, att.id);
      console.log("✅ Delete response:", res);

      if (res?.success === false && res?.res_code !== "0000") {
        alertWarning("ลบไฟล์ไม่สำเร็จ", res?.res_message || "เกิดข้อผิดพลาด");
        return false;
      }

      // Remove from local state
      setExistingAttachments(prev => prev.filter(x =>
        String(x.id) !== String(att.id) &&
        String(x.fileId) !== String(att.id)
      ));

      // alertSuccess("ทำเครื่องหมายลบไฟล์", "ไฟล์จะถูกลบเมื่อกดปุ่ม 'บันทึก'");
      return true;
    } catch (error) {
      console.error("❌ Error deleting attachment:", error);
      alertWarning("ลบไฟล์ไม่สำเร็จ", error?.response?.data?.res_message || error?.message || "เกิดข้อผิดพลาดในการลบไฟล์");
      return false;
    }
  }, [id]);

const handleSubmit = async () => {
  const ok12 = await updateStep12();
  if (!ok12) return; 
  
  const fieldsToValidate = [
    "complaintTypeId",
    "complaintChannel",
    "subject",
    "referenceNumber1",
    "referenceDate1", // สป.กค.
    "referenceNumber2",
    "referenceDate2", // สป.สร.
    "referenceNumber3",
    "referenceDate3", // สตป.
    "referenceNumber4",
    "referenceDate4", // สรร.
  ];

  // ✅ Validate เฉพาะ Step3 (ข้อมูลเรื่องร้องทุกข์)
  // Backwards compatibility: if complaintType used, map to complaintTypeId for validation list
  const formVals = step3Methods.getValues();
  if (formVals.complaintType && !formVals.complaintTypeId) {
    step3Methods.setValue("complaintTypeId", formVals.complaintType, { shouldDirty: false, shouldValidate: false });
  }
  const isValid = await step3Methods.trigger(fieldsToValidate);
  if (!isValid) {
    const errors = step3Methods.formState.errors;
    const errorMessages = Object.entries(errors).map(([field, error]) => {
      return `• ${error.message}`;
    });

    alertWarning(
      "ข้อมูลไม่ครบถ้วน",
      `กรุณาแก้ไขข้อมูลดังต่อไปนี้:<br/><br/>${errorMessages.join("<br/>")}`,
      true
    );
    return;
  }

  // ✅ ดึงค่าจากทุก Step
  const generalData = generalMethods.getValues();
  const delegateData = delegateMethods.getValues();
  const step2Data = step2Methods.getValues();
  const step3Data = step3Methods.getValues();
  const step4Data = step4Methods.getValues();

  // === Debug log วันที่ก่อนส่ง ===
  console.log("👉 officerReceivedDate:", step4Data.officerReceivedDate);
  console.log("👉 directorSubmittedDate:", step4Data.directorSubmittedDate);

  // === Mapping ประเภท ===
  const selectedComplaintTypeObj =
    complaintTypes.find(
      (t) =>
        String(t.value) === String(step3Data.complaintType) ||
        String(t.value) === String(step3Data.complaintTypeId)
    ) || null;

  const selectedSubComplaintType =
    subComplaintTypes.find(
      (subType) =>
        subType.id === step3Data.complaintSubType ||
        subType.name === step3Data.complaintSubTypeName
    ) || null;

  const selectedComplaintChannel =
    complaintChannels.find(
      (channel) =>
        channel.id === step3Data.complaintChannel ||
        channel.name === step3Data.complaintChannelName
    ) || null;

  const complaintTypeId =
    step3Data.complaintType ||
    step3Data.complaintTypeId ||
    step3Data.complaint_type_id ||
    selectedComplaintTypeObj?.value ||
    defaultData?.assignment_form?.complaint_type_id ||
    defaultData?.step3?.general?.complaint_type_id ||
    "-";
  const complaintTypeName =
    selectedComplaintTypeObj?.label ||
    step3Data.complaintTypeName ||
    step3Data.complaintTypeLabel ||
    "-";
  const complaintTypeData = selectedComplaintTypeObj || null;

  const complaintSubTypeId =
    step3Data.complaintSubType ||
    step3Data.complaint_subtype_id ||
    selectedSubComplaintType?.id ||
    "-";
  const complaintSubTypeName =
    step3Data.complaintSubTypeName ||
    step3Data.complaint_subtype ||
    selectedSubComplaintType?.name ||
    "-";
  const complaintSubTypeData =
    step3Data.complaintSubTypeData ||
    step3Data.complaint_subtype_data ||
    selectedSubComplaintType ||
    null;

  const complaintChannelId =
    step3Data.complaintChannel ||
    step3Data.complaint_channel_id ||
    selectedComplaintChannel?.id ||
    "-";
  const complaintChannelName =
    step3Data.complaintChannelName ||
    step3Data.complaint_channel ||
    selectedComplaintChannel?.name ||
    "-";
  const complaintChannelData =
    step3Data.complaintChannelData ||
    step3Data.complaint_channel_data ||
    selectedComplaintChannel ||
    null;

  // ===== Complaint Filing Type Mapping =====
  // Prefer explicit complaint_filing_type field; otherwise infer from boolean flags
  let complaintFilingType = step3Data.complaint_filing_type;
  if (!complaintFilingType) {
    if (step3Data.isNewComplaint) complaintFilingType = "new";
    else if (step3Data.isAdditionalComplaint) complaintFilingType = "additional";
    else if (step3Data.isCommitteeComplaint) complaintFilingType = "committee"; // alias for group work
    else complaintFilingType = "new";
  }

  const newComplaintFlags = {
    complaintFilingType,
    new_complaint: complaintFilingType === "new",
    add_more_complaint_to_ref: complaintFilingType === "additional",
    group_work: complaintFilingType === "committee",
  };

  // ===== Sender Agency Name (lookup from outsideDepartments list if possible) =====
  let senderAgencyName = "";
  const selectedSender = outsideDepartments.find(
    (d) => String(d.value) === String(step3Data.senderAgency)
  );
  if (selectedSender) {
    senderAgencyName = selectedSender.label || selectedSender.name || "";
  }

  // === Mapper วันที่ ===
  const submitData = {
    id: defaultData?.id,
    step1: {
      general: {
        ...(complainantType === "government"
          ? { government: generalData }
          : complainantType === "corporate"
          ? { corporate: generalData }
          : { general: generalData }),
        ...(complainantType === "corporate"
          ? { signer: delegateData && Object.keys(delegateData).length > 0 ? delegateData : null }
          : { delegate: delegateData && Object.keys(delegateData).length > 0 ? delegateData : null }),
      },
    },
    step2: {
      general: {
        activeType: respondentType,
        [respondentType]: step2Data,
      },
    },
    step3: {
      general: {
        ...step3Data,

        subject: step3Data.subject,
        description: step3Data.description,

        complaintType: complaintTypeName,
        complaintTypeId,
        complaintTypeName,
        complaintTypeData,

        complaintSubType: complaintSubTypeName,
        complaintSubTypeId,
        complaintSubTypeName,
        complaintSubTypeData,

        complaintChannel: complaintChannelName,
        complaintChannelId,
        complaintChannelName,
        complaintChannelData,

        reference_number: step3Data.referenceNumber1,
  reference_date: formatDateForAPI(step3Data.referenceDate1 || defaultData?.assignment_form?.reference_date1),
        reference_number2: step3Data.referenceNumber2,
  reference_date2: formatDateForAPI(step3Data.referenceDate2 || defaultData?.assignment_form?.reference_date2),
        reference_number3: step3Data.referenceNumber3,
  reference_date3: formatDateForAPI(step3Data.referenceDate3 || defaultData?.assignment_form?.reference_date3),
        reference_number4: step3Data.referenceNumber4,
  reference_date4: formatDateForAPI(step3Data.referenceDate4 || defaultData?.assignment_form?.reference_date4),

        document_number: step3Data.documentNumber,
  document_date: formatDateForAPI(step3Data.documentDate || defaultData?.assignment_form?.document_date),

        additional_reference_number1: step3Data.additionalReference1,
        additional_reference_date1: formatDateForAPI(step3Data.additionalReferenceDate1 || defaultData?.assignment_form?.additional_reference_date1),
        additional_reference_number2: step3Data.additionalReference2,
        additional_reference_date2: formatDateForAPI(step3Data.additionalReferenceDate2 || defaultData?.assignment_form?.additional_reference_date2),
        // Filing type & flags
        ...newComplaintFlags,
        senderAgencyName,
        // Include current attachments (after user deletions)
        attachment: existingAttachments,
      },
    },
    step4: {
      general: {
        ...step4Data,
        // officerReceivedDate -> registration_date (ไม่แทน assigned_date)
        // ใช้ค่าใน form (ผู้ใช้แก้) ถ้าไม่มีให้ fallback จาก assignment_form เดิม
        registration_date: formatDateForAPI(
          step4Data.officerReceivedDate ||
          defaultData?.assignment_form?.registration_date ||
          defaultData?.registration_date ||
          null
        ),
        // เก็บ assigned_date ดั้งเดิมไว้ในข้อมูล (ไม่แก้ หาก backend ต้องใช้เทียบ diff)
        assigned_date:
          defaultData?.assignment_form?.assigned_date ||
          defaultData?.assigned_date ||
          null,
        director_submission_date: formatDateForAPI(
          step4Data.directorSubmittedDate || defaultData?.assignment_form?.director_submission_date
        ),
        incident_date: formatDateForAPI(step4Data.incidentDateTime || defaultData?.assignment_form?.incident_date),
      },
    },
    assignment_form: (() => {
      // Final fallback complaint_type_id selection
      const finalComplaintTypeId =
        complaintTypeId !== "-" && complaintTypeId
          ? complaintTypeId
          : defaultData?.assignment_form?.complaint_type_id ||
            defaultData?.step3?.general?.complaint_type_id ||
            null;

      const payload = {
        id: defaultData?.id,  // ✅ เพิ่ม id เพื่อให้ backend รู้ว่าต้อง update ไม่ใช่ insert
        complaint_type_id: finalComplaintTypeId,
        complaint_subtype_id: (complaintSubTypeId && complaintSubTypeId !== "-") ? complaintSubTypeId : "",
        complaint_channel_id: (complaintChannelId && complaintChannelId !== "-") ? complaintChannelId : null,
        // Dates
        registration_date: formatDateForAPI(step4Data.officerReceivedDate || defaultData?.assignment_form?.registration_date || defaultData?.registration_date),
        director_submission_date: formatDateForAPI(step4Data.directorSubmittedDate || defaultData?.assignment_form?.director_submission_date),
        incident_date: formatDateForAPI(step4Data.incidentDateTime || defaultData?.assignment_form?.incident_date),
        assigned_date: defaultData?.assignment_form?.assigned_date || defaultData?.assigned_date || null,
        // Core text fields
        subject: step3Data.subject || defaultData?.assignment_form?.subject || "",
        confidentiality_level: step3Data.securityLevel || defaultData?.assignment_form?.confidentiality_level || "normal",
        urgency_level: step3Data.urgencyLevel || defaultData?.assignment_form?.urgency_level || "low",
        // Agency (backend sample shows assigned_agency, keep both if needed)
        assigned_agency: step3Data.senderAgency || defaultData?.assignment_form?.assigned_agency || "",
        agency_sender: step3Data.senderAgency || defaultData?.assignment_form?.agency_sender || "",
        // References (normalized 1..4)
        reference_number1: step3Data.referenceNumber1 || defaultData?.assignment_form?.reference_number1 || "",
        reference_date1: formatDateForAPI(step3Data.referenceDate1 || defaultData?.assignment_form?.reference_date1),
        reference_number2: step3Data.referenceNumber2 || defaultData?.assignment_form?.reference_number2 || "",
        reference_date2: formatDateForAPI(step3Data.referenceDate2 || defaultData?.assignment_form?.reference_date2),
        reference_number3: step3Data.referenceNumber3 || defaultData?.assignment_form?.reference_number3 || "",
        reference_date3: formatDateForAPI(step3Data.referenceDate3 || defaultData?.assignment_form?.reference_date3),
        reference_number4: step3Data.referenceNumber4 || defaultData?.assignment_form?.reference_number4 || "",
        reference_date4: formatDateForAPI(step3Data.referenceDate4 || defaultData?.assignment_form?.reference_date4),
        // Document
        document_number: step3Data.documentNumber || defaultData?.assignment_form?.document_number || "",
        document_date: formatDateForAPI(step3Data.documentDate || defaultData?.assignment_form?.document_date),
        // Additional references
        additional_reference_number1: step3Data.additionalReference1 || defaultData?.assignment_form?.additional_reference_number1 || "",
        additional_reference_date1: formatDateForAPI(step3Data.additionalReferenceDate1 || defaultData?.assignment_form?.additional_reference_date1),
        additional_reference_number2: step3Data.additionalReference2 || defaultData?.assignment_form?.additional_reference_number2 || "",
        additional_reference_date2: formatDateForAPI(step3Data.additionalReferenceDate2 || defaultData?.assignment_form?.additional_reference_date2),
        // Filing type flags
        complaint_filing_type: complaintFilingType === "committee" ? "anonymous" : complaintFilingType,
        new_complaint: complaintFilingType === "new",
        add_more_complaint_to_ref: complaintFilingType === "additional",
        group_work: complaintFilingType === "committee",
        incidentDate: formatDateForAPI(
          step4Data.incidentDateTime || 
          defaultData?.assignment_form?.incidentDate ||
          defaultData?.step3?.general?.incidentDate),
      };

      // Remove any undefined keys (defensive)
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      return payload;
    })(),
  };

  // ✅ ยิง API เพื่อบันทึกจริง
  try {
    // ถ้า backend ต้องการอย่างน้อย 1 ประเภทการร้องเรียน ให้ตรวจตรงนี้ก่อน
    if (complaintTypeId === "-" || !complaintTypeId) {
      alertWarning(
        "ข้อมูลไม่ครบถ้วน",
        "กรุณาเลือกประเภทเรื่องร้องเรียน (ระบบต้องมีค่า complaint_type_id)",
        true
      );
      return;
    }

    // Update complaint with attachment changes
    // ✅ ส่ง step1+step2 จากฟอร์มปัจจุบัน (ไม่ใช่ defaultData เก่า)
    console.log("📎 Updating attachments:", existingAttachments);
    const currentGeneralData = generalMethods.getValues();
    const currentDelegateData = delegateMethods.getValues();
    const currentStep2Data = step2Methods.getValues();
    const currentStep12 = buildStep12Payload({
      generalData: currentGeneralData,
      delegateData: currentDelegateData,
      delegateType,
      step2Data: currentStep2Data,
      respondentType,
      complainantType,
    });
    // ✅ ส่ง step3 จากฟอร์มปัจจุบัน (ไม่ใช่ defaultData เก่า)
    const currentStep3Data = step3Methods.getValues();
    await UpdateComplaint(defaultData.id, {
      ...currentStep12,
      step3: {
        general: {
          ...currentStep3Data,
          attachment: existingAttachments,
        }
      }
    });

    const res = await UpdateAssignmentCompleteByAdmin(
      defaultData.id,
      submitData.assignment_form
    );

    console.log("✅ UpdateAssignmentCompleteByAdmin response:", res);

  if (["0000", "0002"].includes(res?.res_code)) {
      // Upload new files if any
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData();
          uploadedFiles.forEach((file) => {
            formData.append("file", file, file.name);
          });

          const uploadRes = await UploadAttachments(defaultData.id, formData);
          if (uploadRes?.res_code === "0000" || uploadRes?.success !== false) {
            // Reload attachments after upload
            const updatedComplaint = await GetComplaintByID(id);
            if (updatedComplaint?.res_data?.step3?.general?.attachment) {
              setExistingAttachments(updatedComplaint.res_data.step3.general.attachment);
            }
            setUploadedFiles([]);
            alertSuccess("อัปโหลดไฟล์สำเร็จ", "ไฟล์แนบถูกบันทึกแล้ว");
          } else {
            alertWarning("อัปโหลดไฟล์ไม่สำเร็จ", uploadRes?.res_message || "ข้อมูลถูกบันทึกแล้ว แต่ไฟล์แนบอัปโหลดไม่สำเร็จ");
          }
        } catch (uploadErr) {
          console.error("Error uploading files:", uploadErr);
          alertWarning("อัปโหลดไฟล์ไม่สำเร็จ", uploadErr?.response?.data?.res_message || "ข้อมูลถูกบันทึกแล้ว แต่ไฟล์แนบอัปโหลดไม่สำเร็จ");
        }
      }

      // เก็บ preview ไว้แสดง
      setPreviewData(submitData);
      setShowPreview(true);

      // redirect ไปหน้า Preview
      router.replace(
        {
          pathname: `/admin/edit/website-complaints/${defaultData?.id}`,
          query: { preview: "" },
        },
        undefined,
        { shallow: true }
      );
    } else {
      // แปลง error เฉพาะเคสที่ backend ส่ง error: "กรุณาเลือกประเภทการร้องเรียนอย่างน้อย 1 ประเภท"
      const backendErr = res?.res_data?.error || res?.res_desc || res?.res_message;
      if (backendErr && backendErr.includes("ประเภทการร้องเรียน")) {
        alertWarning("ข้อมูลไม่ครบถ้วน", backendErr, true);
      } else {
        alertError(
          "ข้อผิดพลาด",
          backendErr || "ไม่สามารถบันทึกข้อมูลได้"
        );
      }
    }
  } catch (err) {
    console.error("❌ Error UpdateAssignmentCompleteByAdmin:", err);
    alertError(
      "ข้อผิดพลาด",
      err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
    );
  }
};




  const handleComplaintTypeChange = (type) => {
    step3Methods.setValue("isNewComplaint", false);
    step3Methods.setValue("isAdditionalComplaint", false);
    step3Methods.setValue("isCommitteeComplaint", false);

    if (type === "new") {
      step3Methods.setValue("isNewComplaint", true);
      step3Methods.setValue("additionalReference1", "");
      step3Methods.setValue("additionalReferenceDate1", "");
      step3Methods.setValue("additionalReference2", "");
      step3Methods.setValue("additionalReferenceDate2", "");
    } else if (type === "additional") {
      step3Methods.setValue("isAdditionalComplaint", true);
      step3Methods.setValue("additionalReference2", "");
      step3Methods.setValue("additionalReferenceDate2", "");
    } else if (type === "committee") {
      step3Methods.setValue("isCommitteeComplaint", true);
      step3Methods.setValue("additionalReference1", "");
      step3Methods.setValue("additionalReferenceDate1", "");
    }

    step3Methods.setValue("complaint_filing_type", type);
  };

  const currentComplaintFilingType =
    step3Methods.watch("complaint_filing_type") || "new";

  useEffect(() => {
    console.log(
      "showPreview",
      showPreview,
      "previewData",
      previewData,
      "hasRedirected",
      hasRedirected.current,
      "preview",
      preview
    );
    if (
      showPreview &&
      previewData &&
      defaultData?.id &&
      !hasRedirected.current &&
      !preview
    ) {
      hasRedirected.current = true;
      router.replace(
        {
          pathname: `/admin/edit/website-complaints/${defaultData?.id}`,
          query: {
            preview: "",
            ...(isFromExternal ? { fromBox: "1" } : {}),
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [showPreview, previewData, defaultData?.id, preview, router, isFromExternal]);

  useEffect(() => {
    return () => {
      hasRedirected.current = false; // reset ตอน unmount
    };
  }, []);

  if (preview !== undefined) {
    // ไม่ต้องเช็ค !previewData แล้ว return null
    return (
      <SearchComplaintsPreview
        id={id}
        data={previewData} // อาจเป็น null ได้
        onBack={handleBackFromPreview}
        fromExternal={isFromExternal}
      />
    );
  }

  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div className={styles.container}>
          <div className={styles.headerBar}>
            แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
          </div>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div className={styles.container}>
          <div className={styles.headerBar}>
            แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
          </div>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <p className={styles.errorMessage}>{error}</p>
            <ButtonService
              label="ลองใหม่"
              color="primary"
              variant="contained"
              onClick={() => id && fetchComplaints(id)}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div className={styles.container}>
        <div className={styles.headerBar}>
          แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
        </div>

        {defaultData ? (
          <div className={styles.contentContainer}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <div
                className={`${styles.tab} ${styles.tab0} ${
                  complainantType === "individual" ? styles.active : ""
                }`}
                onClick={() => handleComplainantTabChange("individual")}
                style={{ cursor: "pointer" }}
              >
                บุคคลทั่วไป
              </div>
              <div
                className={`${styles.tab} ${styles.tab1} ${
                  complainantType === "corporate" ? styles.active : ""
                }`}
                onClick={() => handleComplainantTabChange("corporate")}
                style={{ cursor: "pointer" }}
              >
                นิติบุคคล
              </div>
              <div
                className={`${styles.tab} ${styles.tab2} ${
                  complainantType === "government" ? styles.active : ""
                }`}
                onClick={() => handleComplainantTabChange("government")}
                style={{ cursor: "pointer" }}
              >
                หน่วยงานของรัฐ
              </div>
              <div
                className={styles.underlineBar}
                style={{
                  left: complainantType === "corporate"
                    ? "calc(33.33%)"
                    : complainantType === "government"
                    ? "calc(66.66%)"
                    : "0",
                }}
              />
            </div>

            <div className={styles.formWrapper}>
              {/* Section 1: ข้อมูลผู้ร้องทุกข์ */}
              <FormProvider {...generalMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>ข้อมูลผู้ร้องทุกข์</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      key={`complainant-${complainantType}`}
                      data={defaultGeneralRef.current}
                      formType={
                        complainantType === "government"
                          ? "government"
                          : complainantType === "corporate"
                          ? "corporate"
                          : "individual"
                      }
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Section 2: ข้อมูลผู้รับมอบอำนาจร้องทุกข์ */}
              <FormProvider {...delegateMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      {delegateType === "signer"
                        ? "ข้อมูลผู้มีอำนาจลงนาม"
                        : "ข้อมูลผู้รับมอบอำนาจร้องทุกข์"}
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      key={`delegate-form-${delegateType}`}
                      data={defaultDelegateRef.current}
                      formType={delegateType === "signer" ? "signer" : "delegate"}
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Tab Navigation for Step 2 */}
              <div className={styles.tabNav}>
                <div
                  className={`${styles.tab} ${styles.tab0} ${
                    respondentType === "individual" ? styles.active : ""
                  }`}
                  onClick={() => handleRespondentTabChange("individual")}
                  style={{ cursor: "pointer" }}
                >
                  บุคคลทั่วไป
                </div>
                <div
                  className={`${styles.tab} ${styles.tab1} ${
                    respondentType === "corporate" ? styles.active : ""
                  }`}
                  onClick={() => handleRespondentTabChange("corporate")}
                  style={{ cursor: "pointer" }}
                >
                  นิติบุคคล
                </div>
                <div
                  className={`${styles.tab} ${styles.tab2} ${
                    respondentType === "government" ? styles.active : ""
                  }`}
                  onClick={() => handleRespondentTabChange("government")}
                  style={{ cursor: "pointer" }}
                >
                  หน่วยงานของรัฐ
                </div>
                <div
                  className={styles.underlineBar}
                  style={{
                    left:
                      respondentType === "corporate"
                        ? "calc(33.33%)"
                        : respondentType === "government"
                        ? "calc(66.66%)"
                        : "0",
                  }}
                />
              </div>

              {/* Section 3: ข้อมูลผู้ถูกร้องเรียน */}
              <FormProvider {...step2Methods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      ข้อมูลผู้ถูกร้องเรียน
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      key={`respondent-${respondentType}`}
                      data={defaultStep2Ref.current}
                      formType={respondentType}
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Section 4: ข้อมูลเรื่องร้องทุกข์ */}
              <FormProvider {...step3Methods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      ข้อมูลเรื่องร้องทุกข์
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    {/* Row 1: ประเภทเรื่องร้องเรียน, ประเภทเรื่องย่อย, ช่องทางเรื่องร้องเรียน */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องร้องเรียน
                          <span className={styles.required}>*</span>
                        </label>
                        <select
                          {...step3Methods.register("complaintTypeId", {
                            required: "กรุณาเลือกประเภทเรื่องร้องเรียน",
                            onChange: handleComplaintTypeSelectChange,
                          })}
                          style={getErrorStyle("complaintTypeId")}
                          disabled={loadingOptions}
                        >
                          <option value="">เลือกประเภทเรื่องร้องเรียน</option>
                          {complaintTypes.map((type) => (
                            <option key={type.value ?? type.id} value={type.value ?? type.id}>
                              {type.label ?? type.name}
                            </option>
                          ))}
                        </select>
                        {getErrorMessage("complaintTypeId")}
                      </div>

                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องย่อย
                        </label>
                        <select
                          {...step3Methods.register("complaintSubType")}
                          style={getErrorStyle("complaintSubType")}
                          disabled={
                            !isValidId(selectedComplaintType) ||
                            loadingSubTypes
                          }
                        >
                          <option value="">
                            {!isValidId(selectedComplaintType)
                              ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                              : loadingSubTypes
                              ? "กำลังโหลด..."
                              : subComplaintTypes.length === 0
                              ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                              : "เลือกประเภทเรื่องย่อย"}
                          </option>
                          {subComplaintTypes.map((subType) => (
                            <option key={subType.value ?? subType.id} value={subType.value ?? subType.id}>
                              {subType.label ?? subType.name}
                            </option>
                          ))}
                        </select>
                        {getErrorMessage("complaintSubType")}
                      </div>

                      {/* แก้ไขส่วนนี้ - เพิ่ม validation */}
                      <div className={styles.fieldGroup}>
                        <label>
                          ช่องทางเรื่องร้องเรียน
                          <span className={styles.required}>*</span>{" "}
                          {/* เพิ่มเครื่องหมาย * */}
                        </label>
                        <select
                          {...step3Methods.register("complaintChannel", {
                            required: "กรุณาเลือกช่องทางเรื่องร้องเรียน", // เพิ่ม validation rule
                          })}
                          style={getErrorStyle("complaintChannel")} // เพิ่ม error style
                          disabled={loadingChannels}
                        >
                          <option value="">เลือกช่องทางเรื่องร้องเรียน</option>
                          {complaintChannels.map((channel) => (
                            <option key={channel.value ?? channel.id} value={channel.value ?? channel.id}>
                              {channel.label ?? channel.name}
                            </option>
                          ))}
                        </select>
                        {getErrorMessage("complaintChannel")}{" "}
                        {/* เพิ่มการแสดง error message */}
                      </div>
                    </div>

                    {/* ส่วนอื่นๆ ยังคงเดิม... */}
                    {/* Row 2: เรื่อง */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroupFull}>
                        <label>
                          เรื่อง <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("subject", {
                            required: "กรุณากรอกเรื่อง",
                          })}
                          style={getErrorStyle("subject")}
                        />
                        {getErrorMessage("subject")}
                      </div>
                    </div>

                    {/* Row 3: เลข สป.กค., วันที่, เลข สป.สร., วันที่ */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สป.กค. <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber1", {
                            required: "กรุณากรอกเลข สป.กค.",
                          })}
                          style={getErrorStyle("referenceNumber1")}
                        />
                        {getErrorMessage("referenceNumber1")}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <ControlledDateThaiPickerService
                          name="referenceDate1"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                          rules={{ required: "กรุณาเลือกวันที่" }}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>เลข สป.สร.</label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber2")}
                        />
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>วันที่</label>
                        <ControlledDateThaiPickerService
                          name="referenceDate2"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </div>
                    </div>

                    {/* Row 4: เลข สตป., วันที่, เลข สรร. (สานต่อ), วันที่ */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สตป. <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber3", {
                            required: "กรุณากรอกเลข สตป.",
                          })}
                          style={getErrorStyle("referenceNumber3")}
                        />
                        {getErrorMessage("referenceNumber3")}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <ControlledDateThaiPickerService
                          name="referenceDate3"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สรร. (สารบัญ){" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber4", {
                            required: "กรุณากรอกเลข สรร. (สารบัญ)",
                          })}
                          style={getErrorStyle("referenceNumber4")}
                          disabled
                        />
                        {getErrorMessage("referenceNumber4")}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <ControlledDateThaiPickerService
                          name="referenceDate4"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Row 5: เลขที่หนังสือ, วันที่, หน่วยงานอื่นที่ส่งเรื่องมาขึ่ง กค. */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>เลขที่หนังสือ</label>
                        <input
                          type="text"
                          {...step3Methods.register("documentNumber")}
                        />
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>วันที่</label>
                        <ControlledDateThaiPickerService
                          name="documentDate"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>หน่วยงานอื่นที่ส่งเรื่องมาที่ กค.</label>
                        <select
                          {...step3Methods.register("senderAgency")}
                          disabled={loadingOutsideDepartments}
                        >
                          <option value="">
                            {loadingOutsideDepartments
                              ? "กำลังโหลดหน่วยงาน..."
                              : "เลือกหน่วยงาน"}
                          </option>
                          {outsideDepartments.map((dept) => (
                            <option key={dept.value} value={dept.value}>
                              {dept.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 6: ชั้นความลับ, ชั้นความเร่งด่วน */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label>ชั้นความลับ</label>
                        <select {...step3Methods.register("securityLevel")}>
                          <option value="normal">ปกติ</option>
                          <option value="confidential">ลับ</option>
                          <option value="secret">ลับมาก</option>
                          <option value="top_secret">ลับที่สุด</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ชั้นความเร่งด่วน</label>
                        <select {...step3Methods.register("urgencyLevel")}>
                          <option value="low">ปกติ</option>
                          <option value="medium">เร่งด่วน</option>
                          <option value="high">ด่วน</option>
                          <option value="urgent">ด่วนมาก</option>
                          <option value="critical">ด่วนที่สุด</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className={styles.checkboxSection}>
                      <div className={styles.checkboxGroupVertical}>
                        {/* เรื่องร้องเรียนใหม่ */}
                        <div className={styles.checkboxRowSingle}>
                          <label
                            className={`${styles.checkboxItem} ${
                              currentComplaintFilingType === "new"
                                ? styles.checked
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={currentComplaintFilingType === "new"}
                              onChange={() => handleComplaintTypeChange("new")}
                            />
                            เรื่องร้องเรียนใหม่
                          </label>
                        </div>

                        {/* เรื่องร้องเรียนเพิ่มเติม */}
                        <div className={styles.checkboxRowWithFields}>
                          <div className={styles.checkboxColumn}>
                            <label
                              className={`${styles.checkboxItem} ${
                                currentComplaintFilingType === "additional"
                                  ? styles.checked
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  currentComplaintFilingType === "additional"
                                }
                                onChange={() =>
                                  handleComplaintTypeChange("additional")
                                }
                              />
                              เรื่องร้องเรียนเพิ่มเติม
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง (เลข สรร.)</label>
                                <div className={styles.inputWithIcon}>
                                  <input
                                    type="text"
                                    disabled={
                                      currentComplaintFilingType !==
                                      "additional"
                                    }
                                    {...step3Methods.register(
                                      "additionalReference1"
                                    )}
                                  />
                                  <span
                                    className={styles.icon}
                                    onClick={() => {
                                      if (
                                        currentComplaintFilingType ===
                                        "additional"
                                      )
                                        setOpenSearchDialog(true);
                                    }}
                                  >
                                    <SearchIcon />
                                  </span>
                                </div>

                                {/* Dialog สำหรับค้นหาเลข */}
                                <Dialog
                                  open={openSearchDialog}
                                  onClose={() => setOpenSearchDialog(false)}
                                  maxWidth="sm"
                                  fullWidth
                                  PaperProps={{
                                    style: {
                                      borderRadius: 12,
                                      background: "#f7fafd",
                                      height: 500,
                                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                                    },
                                  }}
                                >
                                  <DialogTitle
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <SearchIcon color="primary" />
                                    ค้นหาเลขที่อ้างอิง
                                  </DialogTitle>

                                  <DialogContent>
                                    {/* ช่องค้นหา */}
                                    <TextField
                                      inputRef={inputRef}
                                      fullWidth
                                      size="small"
                                      placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                                      value={searchText}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchText(val);
                                        handleSearch(val);
                                      }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                          </InputAdornment>
                                        ),
                                        endAdornment: searchText ? (
                                          <InputAdornment position="end">
                                            <IconButton
                                              size="small"
                                              onClick={onClear}
                                              aria-label="clear search"
                                              edge="end"
                                            >
                                              <ClearIcon />
                                            </IconButton>
                                          </InputAdornment>
                                        ) : null,
                                        style: {
                                          background: "#fff",
                                          borderRadius: 8,
                                        },
                                      }}
                                      sx={{ mb: 2 }}
                                    />

                                    {/* สถานะโหลด / ไม่พบ / รายการ */}
                                    {searchLoading ? (
                                      <div
                                        style={{
                                          textAlign: "center",
                                          padding: 24,
                                        }}
                                      >
                                        <CircularProgress color="primary" />
                                        <div
                                          style={{
                                            marginTop: 8,
                                            color: "#888",
                                          }}
                                        >
                                          กำลังค้นหา...
                                        </div>
                                      </div>
                                    ) : searchResults.length === 0 ? (
                                      <div
                                        style={{
                                          textAlign: "center",
                                          padding: 32,
                                          color: "#bdbdbd",
                                        }}
                                      >
                                        <DescriptionIcon
                                          sx={{ fontSize: 48, mb: 2 }}
                                          color="disabled"
                                        />
                                        <div>ไม่พบรายการเลขที่อ้างอิง</div>
                                      </div>
                                    ) : (
                                      <>
                                        <List
                                          sx={{
                                            maxHeight: 320,
                                            overflow: "auto",
                                            "&::-webkit-scrollbar": {
                                              width: "8px",
                                              background: "#f0f4fa",
                                              borderRadius: "8px",
                                            },
                                            "&::-webkit-scrollbar-thumb": {
                                              background: "#90caf9",
                                              borderRadius: "8px",
                                            },
                                            "&::-webkit-scrollbar-thumb:hover":
                                              {
                                                background: "#64b5f6",
                                              },
                                          }}
                                        >
                                          {searchResults.map((item) => {
                                            const isMaster = !!item.is_master; // fallback ถ้า undefined
                                            return (
                                              <ListItem
                                                key={item.id}
                                                disablePadding
                                              >
                                                <ListItemButton
                                                  onClick={() =>
                                                    handleSelectReference(item)
                                                  }
                                                  sx={{
                                                    py: 1.5,
                                                    px: 2,
                                                    borderRadius: 2,
                                                    mb: 0.5,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    "&:hover": {
                                                      background: "#e3f2fd",
                                                    },
                                                  }}
                                                >
                                                  {/* จุดสถานะ is_master */}
                                                  <span
                                                    style={{
                                                      width: 12,
                                                      height: 12,
                                                      borderRadius: "50%",
                                                      backgroundColor: isMaster
                                                        ? "#2ecc71"
                                                        : "#bdbdbd",
                                                      border: "2px solid #fff",
                                                      boxShadow:
                                                        "0 0 0 1px rgba(0,0,0,0.15)",
                                                      flexShrink: 0,
                                                    }}
                                                    title={
                                                      isMaster
                                                        ? "Master"
                                                        : "Non-master"
                                                    }
                                                  />
                                                  <DescriptionIcon
                                                    color="info"
                                                    sx={{ mr: 0.5 }}
                                                  />
                                                  <span
                                                    style={{ fontWeight: 500 }}
                                                  >
                                                    {item.complaint_type} -{" "}
                                                    {item.complaint_number}
                                                  </span>
                                                </ListItemButton>
                                              </ListItem>
                                            );
                                          })}
                                        </List>

                                        {/* Legend (ถ้าไม่ต้องการสามารถลบส่วนนี้ออกได้) */}
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: 16,
                                            marginTop: 8,
                                            fontSize: 12,
                                            color: "#555",
                                            padding: "0 4px",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 6,
                                            }}
                                          >
                                            <span
                                              style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: "#2ecc71",
                                                boxShadow:
                                                  "0 0 0 1px rgba(0,0,0,0.15)",
                                              }}
                                            />
                                            Master
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 6,
                                            }}
                                          >
                                            <span
                                              style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: "#bdbdbd",
                                                boxShadow:
                                                  "0 0 0 1px rgba(0,0,0,0.15)",
                                              }}
                                            />
                                            Non-master
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </DialogContent>

                                  <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button
                                      onClick={() => setOpenSearchDialog(false)}
                                      variant="outlined"
                                      color="inherit"
                                    >
                                      ปิด
                                    </Button>
                                  </DialogActions>
                                </Dialog>
                              </div>
                              <div className={styles.fieldWithLabelDate}>
                                <label>วันที่</label>
                                <div className={styles.datePickerWrapper}>
                                  <ControlledDateThaiPickerService
                                    name="additionalReferenceDate1"
                                    control={step3Methods.control}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* รับเรื่องจากคณะทำงานฯ บัตรสนเท่ห์ */}
                        <div className={styles.checkboxRowWithFields}>
                          <div className={styles.checkboxColumn}>
                            <label
                              className={`${styles.checkboxItem} ${
                                currentComplaintFilingType === "committee"
                                  ? styles.checked
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  currentComplaintFilingType === "committee"
                                }
                                onChange={() =>
                                  handleComplaintTypeChange("committee")
                                }
                              />
                              รับเรื่องจากคณะทำงานฯ บัตรสนเท่ห์
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง (เลข สรร.)</label>
                                <input
                                  type="text"
                                  disabled={
                                    currentComplaintFilingType !== "committee"
                                  }
                                  {...step3Methods.register(
                                    "additionalReference2"
                                  )}
                                />
                              </div>
                              <div className={styles.fieldWithLabelDate}>
                                <label>วันที่</label>
                                <div className={styles.datePickerWrapper}>
                                  <ControlledDateThaiPickerService
                                    name="additionalReferenceDate2"
                                    control={step3Methods.control}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormProvider>

              {/* Section 5: ข้อมูลเรื่องร้องทุกข์ (รายละเอียด) */}
              <FormProvider {...step4Methods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      ข้อมูลเรื่องร้องทุกข์{" "}
                      <span className={styles.required}>*</span>
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.complaintDescriptionSection}>
                      {/* Row 1: วันที่รับเรื่องของเจ้าพนักงาน, วันที่เสนองาน ผอ.สรร. */}
                      <div className={styles.fieldRowDate}>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <ControlledDateThaiPickerService
                            label="วันที่รับเรื่องของเจ้าพนักงาน"
                              name="officerReceivedDate"
                              control={step4Methods.control}
                              time={true}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <ControlledDateThaiPickerService
                                label="วันที่เสนองาน ผอ.สรร."
                                name="directorSubmittedDate"
                                control={step4Methods.control}
                                placeholder="กรุณาเลือกวันที่"
                                time={true}
                              />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: วันและเวลาที่เกิดเหตุ */}
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.datePickerWrapper}>
                           <ControlledDateThaiPickerService
                              label="วันและเวลาที่เกิดเหตุ"
                              name="incidentDateTime"
                              control={step4Methods.control}
                              time={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: รายละเอียดเพิ่มเติม */}
                      <div className={styles.fieldGroup}>
                        <label>รายละเอียดเพิ่มเติม</label>
                        <textarea
                          rows={8}
                          disabled
                          className={styles.disabledTextarea}
                          {...step3Methods.register("description")}
                          // dis={false}
                        />
                      </div>

                      {/* เอกสารประกอบการร้องเรียน */}
                      <div className={styles.attachmentSection}>
                        <InputFile
                          label="เอกสารประกอบการร้องเรียน"
                          name="attachment"
                          onChange={handleFileUpload}
                          helperText="หมายเหตุ : หลักฐาน เช่น สำเนาสัญญา ภาพถ่าย หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png .m4a และไม่เกิน 10 MB"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.m4a"
                          maxFiles={5}
                          maxSizeMB={10}
                          multiple={true}
                          existingFiles={existingAttachments}
                          getFileUrl={(att) => buildFileUrl(att.file_url || att.fileUrl || att.file_path)}
                          onDeleteExisting={handleDeleteExistingAttachment}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </FormProvider>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <ButtonService
                  label="ล้าง"
                  color="ล้าง"
                  variant="outlined"
                  onClick={handleReset}
                />
                <ButtonService
                  label="บันทึก"
                  color="ยืนยัน"
                  variant="contained"
                  onClick={handleSubmit}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchComplaints;