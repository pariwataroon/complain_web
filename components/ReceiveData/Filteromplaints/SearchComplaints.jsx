import { useRouter } from "next/router";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  InputAdornment,
  TextField,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  GetComplaintByID,
  GetComplaintsWithSearch,
  UpdateComplaint,
  UpdateAssignmentCompleteByAdmin,
} from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import {
  GetAllSelectComplaintTypes,
  UsersSearchByRole,
  getSubComplaintTypeById,
  GetAllComplaintChannels,
} from "@pages/api/allselect/allselect";
import { ControlledDateThaiPickerService } from "@services/DateThaiPickerService/DateThaiPickerService";
import { getDepartments } from "@pages/api/department/department";
import { GetAllOutsideDepartments } from "@pages/api/allselect/allselect";
import { FormProvider, useForm } from "react-hook-form";
import { alertError, alertSuccess } from "@utils/Alerts";
import styles from "./TabNav.module.scss";
import SearchComplaintsPreview from "@components/ReceiveData/Filteromplaints/SearchComplaintsPreview";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

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
    label: "สืบค้นเรื่องร้องเรียน",
    url: "/admin/edit/search",
  },
  {
    label: "คัดกรองเรื่องร้องเรียน",
    url: "/admin/edit/search/Filteromplaints",
  },
  { label: "รายละเอียด" },
];

const getComplainantTypeAndData = (data) => {
  if (data?.corporate) return { type: "corporate", data: data.corporate };
  if (data?.individual) return { type: "individual", data: data.individual };
  if (data?.idCard && data?.name) return { type: "individual", data };
  return { type: "unknown", data: data || {} };
};

const getDelegateTypeAndData = (data) => {
  if (data?.signer) return { type: "signer", data: data.signer };
  if (data?.delegate) return { type: "delegate", data: data.delegate };
  if (data?.idCard && (data?.name || data?.signatoryName))
    return { type: "delegate", data };
  return { type: "unknown", data: data || {} };
};

const getRespondentTypeAndData = (step2) => {
  const activeType = step2?.activeType;
  if (activeType) {
    if (step2[activeType]) return { type: activeType, data: step2[activeType] };
  }
  if (step2?.individual) return { type: "individual", data: step2.individual };
  if (step2?.corporate) return { type: "corporate", data: step2.corporate };
  if (step2?.government) return { type: "government", data: step2.government };
  return { type: "unknown", data: {} };
};

const SearchComplaints = () => {
  const router = useRouter();

  const id = useMemo(() => {
    if (router.query.id) {
      return router.query.id;
    }
    if (router.query.data) {
      try {
        const parsedData = JSON.parse(router.query.data);
        return parsedData.id;
      } catch (error) {
        console.error("Error parsing query data:", error);
        return null;
      }
    }
    return null;
  }, [router.query.id, router.query.data]);

  const [inputValue, setInputValue] = useState("");
  // State variables
  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [complaintFilingType, setComplaintFilingType] = useState("new");
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [complaintChannels, setComplaintChannels] = useState([]); // ช่องทางเรื่องร้องเรียน
  const [complaintChannelsLoading, setComplaintChannelsLoading] = useState(false);
  const [positions, setPositions] = useState([]);

  const [staffUsers, setStaffUsers] = useState([]);

  // Form methods
  const generalMethods = useForm({ mode: "onChange", defaultValues: {} });
  const delegateMethods = useForm({ mode: "onChange", defaultValues: {} });
  const step2Methods = useForm({ mode: "onChange", defaultValues: {} });
  const step3Methods = useForm({ mode: "onChange", defaultValues: {} });
  const step4Methods = useForm({ mode: "onChange", defaultValues: {} });

  // Default value refs
  const defaultGeneralRef = useRef({});
  const defaultDelegateRef = useRef({});
  const defaultStep2Ref = useRef({});
  const defaultStep3Ref = useRef({});
  const defaultStep4Ref = useRef({});

  // Dynamic parse for complainant/delegate/respondent
  const [complainantType, setComplainantType] = useState("individual");
  const [complainantData, setComplainantData] = useState({});
  const [delegateType, setDelegateType] = useState("delegate");
  const [delegateData, setDelegateData] = useState({});
  const [respondentType, setRespondentType] = useState("individual");
  const [respondentData, setRespondentData] = useState({});
  const [groupedStaffUsers, setGroupedStaffUsers] = useState({});
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (router.query.preview === "true" || router.query.preview === "") {
      setPreviewMode(true);
    } else {
      setPreviewMode(false);
    }
  }, [router.query.preview]);

  const [subComplaintTypes, setSubComplaintTypes] = useState([]);
  const [subComplaintTypesLoading, setSubComplaintTypesLoading] =
    useState(false);

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]); 
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await GetAllOutsideDepartments();
        // console.log('API Response:', res);

        if (Array.isArray(res)) {
          const mapped = res.map((p) => {
            const baseName =
              p.name ?? p.position_name ?? p.label ?? String(p.id);
            const levelText = p.level ? ` (${p.level})` : "";
            const displayName = `${baseName}${levelText}`;

            return {
              id: p.id ?? p.value,
              name: displayName,
              originalData: p,
            };
          });

          setPositions(mapped);
          // console.log('Set positions:', mapped);
        } else {
          console.warn("API did not return array data:", res);
          setPositions([]);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        setPositions([]);
      }
    };

    fetchPositions();
  }, []);

  const handleSearch = async (keyword) => {
    setSearchLoading(true);
    try {
      // เรียก API จริง
      const response = await GetComplaintsWithSearch({
        skip: 0,
        limit: 100,
        search: keyword || "",
      });

      // สมมติ API ส่งมาแบบ response.res_data.items
      const items = Array.isArray(response?.res_data?.items)
        ? response.res_data.items
        : [];

      // แปลงผลลัพธ์ให้เหมาะกับการแสดงผล
      const results = items.map((item) => ({
        id: item.complaint_number || item.id,
        label: `${item.complaint_number} - ${item.subject}`,
        ...item,
      }));

      setSearchResults(results);
      // console.log("results", results);
    } catch (error) {
      setSearchResults([]);
      console.error("handleSearch error", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectReference = (ref) => {
    step3Methods.setValue(
      "additionalReference1",
      ref.complaint_number || ref.id
    );
    setOpenSearchDialog(false);
  };

  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    if (openSearchDialog) {
      setSearchText(""); // reset input
      handleSearch(""); // แสดงข้อมูลทั้งหมด (search ด้วย keyword ว่าง)
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [openSearchDialog]);

  const onClear = () => {
    setSearchText("");
    handleSearch("");
    inputRef.current?.focus();
  };

  // Fetch complaint types
  useEffect(() => {
    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000") {
          const activeTypes = response.res_data
            .filter((t) => t.is_active)
            .map((t) => ({ value: t.id, label: t.name }));
          setComplaintTypes(activeTypes);
        }
      } catch (err) {
        console.error("Error fetching complaint types:", err);
      }
    };
    fetchComplaintTypes();
  }, []);

  // Fetch complaint channels (active only) - pattern แบบย่อ
  useEffect(() => {
    let mounted = true;
    const fetchChannels = async () => {
      try {
        setComplaintChannelsLoading(true);
        const res = await GetAllComplaintChannels();
        if (!mounted) return;
        if (res?.res_code === "0000") {
          const items = Array.isArray(res?.res_data?.items)
            ? res.res_data.items
            : Array.isArray(res?.res_data)
            ? res.res_data // fallback กรณี backend เก่ายังส่ง array ตรงๆ
            : [];
          setComplaintChannels(
            items
              .filter((c) => c?.is_active !== false)
              .map((c) => ({ id: c.id, name: c.name }))
          );
        } else setComplaintChannels([]);
      } catch (e) {
        if (mounted) setComplaintChannels([]);
        console.error("[complaintChannels] fetch error", e);
      } finally {
        if (mounted) setComplaintChannelsLoading(false);
      }
    };
    fetchChannels();
    return () => { mounted = false; };
  }, []);

  // Append missing complaint_type_id (inactive) if not present so dropdown can show selected value
  useEffect(() => {
    const neededId = defaultData?.assignment_form?.complaint_type_id;
    if (!neededId) return;
    setComplaintTypes((prev) => {
      if (prev.some((t) => String(t.value) === String(neededId))) return prev;
      const label =
        defaultData?.assignment_form?.complaint_type_name ||
        defaultData?.step3?.general?.complaint_type_data?.name ||
        "(ไม่พบชื่อ)";
      return [
        ...prev,
        { value: neededId, label: label + " (นอกชุดปัจจุบัน)" },
      ];
    });
  }, [defaultData?.assignment_form?.complaint_type_id]);

  // Append missing complaint_channel_id (inactive) if not present so dropdown can show selected value
  useEffect(() => {
    const channelId =
      defaultData?.assignment_form?.complaint_channel_id ||
      defaultData?.step3?.general?.complaint_channel_id;
    if (!channelId) return;
    setComplaintChannels((prev) => {
      if (prev.some((ch) => ch.id === channelId)) return prev;
      const channelName =
        defaultData?.assignment_form?.complaint_channel_name ||
        defaultData?.step3?.general?.complaint_channel_name ||
        defaultData?.step3?.general?.complaintChannel ||
        "ไม่ทราบช่องทาง";
      return [
        ...prev, // ไม่เติม suffix แล้ว เพราะ backend ให้ครบอยู่แล้ว
        { id: channelId, name: channelName },
      ];
    });
  }, [
    defaultData?.assignment_form?.complaint_channel_id,
    defaultData?.step3?.general?.complaint_channel_id,
  ]);

  // Prefill complaintChannel select value
  useEffect(() => {
    if (!defaultData) return;
    const currentVal = step3Methods.getValues("complaintChannel");
    if (currentVal) return; // already set by user or earlier effect
    const prefillId =
      defaultData?.assignment_form?.complaint_channel_id ||
      defaultData?.step3?.general?.complaint_channel_id;
    if (!prefillId) return;
    if (!complaintChannels.some((c) => c.id === prefillId)) {
      const channelName =
        defaultData?.assignment_form?.complaint_channel_name ||
        defaultData?.step3?.general?.complaint_channel_name ||
        defaultData?.step3?.general?.complaintChannel ||
        "ไม่ทราบช่องทาง";
      setComplaintChannels((prev) => [
        ...prev,
        { id: prefillId, name: channelName },
      ]);
    }
    step3Methods.setValue("complaintChannel", prefillId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultData, complaintChannels, step3Methods]);

  // Fetch staff users
  useEffect(() => {
    const fetchStaffUsers = async () => {
      try {
        const users = await UsersSearchByRole();

        // กรองออก "กลุ่มที่ 1 : ประชาชน"
        const filteredUsers = users.filter((user) => {
          const roleDescription = user.roles?.[0]?.role_description;
          return roleDescription !== "กลุ่มที่ 1 : ประชาชน";
        });

        // จัดกลุ่มตาม role_description
        const groupedUsers = filteredUsers.reduce((groups, user) => {
          const roleDescription =
            user.roles?.[0]?.role_description || "ไม่ระบุกลุ่ม";

          if (!groups[roleDescription]) {
            groups[roleDescription] = [];
          }
          groups[roleDescription].push(user);
          return groups;
        }, {});

        // เรียงลำดับกลุ่มตาม role_description
        const sortedGroups = Object.keys(groupedUsers)
          .sort()
          .reduce((obj, key) => {
            obj[key] = groupedUsers[key].sort((a, b) =>
              a.label.localeCompare(b.label)
            );
            return obj;
          }, {});

        setStaffUsers(filteredUsers); // เก็บข้อมูลที่กรองแล้วสำหรับ logic อื่น
        setGroupedStaffUsers(sortedGroups); // เพิ่ม state สำหรับข้อมูลที่จัดกลุ่มแล้ว
        // console.log({ users: filteredUsers, groupedUsers: sortedGroups });
      } catch (err) {
        console.error("Error fetching staff users:", err);
      }
    };
    fetchStaffUsers();
  }, []);

  // Prefill responsible officer from last saved value (assigned_officer_id)
  useEffect(() => {
    const assignedId =
      defaultData?.assignment_form?.assigned_to ??
      defaultData?.assignment_form?.assigned_officer_id;
    if (!assignedId) return;

    const value = String(assignedId);
    // Find officer details for name mapping
    const selectedOfficer = (staffUsers || []).find(
      (u) => String(u.value) === value
    );

    // Set select value
    step4Methods.setValue("responsibleOfficer", value, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });

    // Also set helper fields if used elsewhere
    if (selectedOfficer) {
      step4Methods.setValue("responsibleOfficerId", selectedOfficer.value);
      step4Methods.setValue(
        "responsibleOfficerName",
        selectedOfficer.label || selectedOfficer.fullName || ""
      );
    }
  }, [defaultData?.assignment_form?.assigned_officer_id, staffUsers]);

  // Fetch complaint data when ID changes
  useEffect(() => {
    if (id && complaintTypes.length > 0) {
      fetchComplaints(id);
    }
  }, [id, complaintTypes]);

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        if (res?.res_code === "0000" && Array.isArray(res.res_data)) {
          setDepartments(res.res_data);
        } else {
          setDepartments([]);
        }
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const subtypeId = defaultData?.step3?.general?.complaint_subtype_id;
    if (subtypeId && subComplaintTypes.length > 0) {
      // บังคับ cast เป็น string ให้ตรงกับ <option value="...">
      step3Methods.setValue("complaintSubType", String(subtypeId));
    }
  }, [
    defaultData?.step3?.general?.complaint_subtype_id,
    subComplaintTypes,
    step3Methods,
  ]);

  const fetchComplaints = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);

      // Step 1: Complainant
      const general = data?.step1?.general?.general || {};
      const delegate = data?.step1?.general?.delegate || {};
      const { type: cType, data: cData } = getComplainantTypeAndData(general);
      setComplainantType(cType);
      setComplainantData(cData);
      defaultGeneralRef.current = cData;

      // Step 1: Delegate
      const { type: dType, data: dData } = getDelegateTypeAndData(delegate);
      setDelegateType(dType);
      setDelegateData(dData);
      defaultDelegateRef.current = dData;

      // Step 2: Respondent
      const step2General = data?.step2?.general || {};
      const { type: rType, data: rData } =
        getRespondentTypeAndData(step2General);
      setRespondentType(rType);
      setRespondentData(rData);
      defaultStep2Ref.current = rData;

      // Step 3: Complaint Details
      const step3Data = data?.step3?.general || {};
      const assignmentForm = data?.assignment_form || {};
      const step4Data = data?.step4?.general || {};
      const step4DataMerged = {
        ...step4Data,
        officerReceivedDate:
          step4Data.officerReceivedDate ||
          assignmentForm.registration_date ||
          null,
        directorSubmittedDate:
          step4Data.directorSubmittedDate ||
          assignmentForm.director_submission_date ||
          null,
      };

      // === เพิ่ม logic ตรงนี้เพื่อหา complaintTypeId จาก label ===
      let complaintTypeId = "";

      // Priority: assignment_form id -> map legacy label -> blank
      if (assignmentForm.complaint_type_id) {
        complaintTypeId = assignmentForm.complaint_type_id;
      } else if (step3Data.complaintType && complaintTypes.length > 0) {
        const foundType = complaintTypes.find(
          (t) => t.label === step3Data.complaintType
        );
        complaintTypeId = foundType?.value || "";
      }

      // === END เพิ่ม logic ===

      const getComplaintTypeText = (id) => {
        if (!id || !complaintTypes.length) return "";
        const type = complaintTypes.find((t) => t.value === id);
        return type ? type.label : "";
      };

      const complaintTypeText = getComplaintTypeText(complaintTypeId);

      const step3DataWithDefaults = {
        ...step3Data,
        referenceNumber1:
          assignmentForm.reference_number || step3Data.referenceNumber1 || "",
        referenceDate1:
          assignmentForm.reference_date || step3Data.referenceDate1 || "",
        referenceNumber2:
          assignmentForm.reference_number2 || step3Data.referenceNumber2 || "",
        referenceDate2:
          assignmentForm.reference_date2 || step3Data.referenceDate2 || "",
        referenceNumber3:
          assignmentForm.reference_number3 || step3Data.referenceNumber3 || "",
        referenceDate3:
          assignmentForm.reference_date3 || step3Data.referenceDate3 || "",
        referenceNumber4:
          assignmentForm.reference_number4 ||
          step3Data.referenceNumber4 || assignmentForm.complaint_number ||
          "",
        referenceDate4:
          assignmentForm.reference_date4 || step3Data.referenceDate4 || assignmentForm.created_at || "",
        documentNumber:
          assignmentForm.document_number || step3Data.documentNumber || "",
        documentDate:
          assignmentForm.document_date || step3Data.documentDate || "",
        senderAgency:
          assignmentForm.agency_sender || step3Data.senderAgency || "",
        securityLevel:
          assignmentForm.confidentiality_level ||
          step3Data.securityLevel ||
          "normal",
        urgencyLevel:
          assignmentForm.urgency_level || step3Data.urgencyLevel || "low",

        // ใช้ id แทน label
        complaintType: complaintTypeId,
        complaintTypeName: complaintTypeText,
        complaintTypeData: {
          id: complaintTypeId,
          name: complaintTypeText,
          ...(complaintTypes.find((t) => t.value === complaintTypeId) || {}),
        },

        // ประเภทเรื่องย่อย: ใช้ complaint_subtype_id (ใหม่) ถ้าไม่มี fallback ไปค่าเดิมที่เคยใช้ผิดคือ complaint_type
        complaintSubType:
          assignmentForm.complaint_subtype_id ||
          assignmentForm.complaint_type ||
          step3Data.complaintSubType ||
          "",
        additionalReference1:
          assignmentForm.additional_reference_number1 ||
          step3Data.additionalReference1 ||
          "",
        additionalReferenceDate1:
          assignmentForm.additional_reference_date1 ||
          step3Data.additionalReferenceDate1 ||
          "",
        additionalReference2:
          assignmentForm.additional_reference_number2 ||
          step3Data.additionalReference2 ||
          "",
        additionalReferenceDate2:
          assignmentForm.additional_reference_date2 ||
          step3Data.additionalReferenceDate2 ||
          "",
        subject: assignmentForm.subject || step3Data.subject || "",
  // complaint channel: จะพยายาม map ภายหลังหากมี assignment_form (TODO future). ตอนนี้ให้ค่าว่างเพื่อให้เลือกได้
  complaintChannel: step3Data.complaintChannel || assignmentForm.complaint_channel_id || "",
      };

      if (assignmentForm.complaint_filing_type) {
        const typeMap = {
          new: "new",
          additional: "additional",
          anonymous: "committee",
        };
        setComplaintFilingType(
          typeMap[assignmentForm.complaint_filing_type] || "new"
        );
      }

      defaultStep3Ref.current = step3DataWithDefaults;
      // defaultStep4Ref.current = step4Data;
      defaultStep4Ref.current = step4DataMerged;

      generalMethods.reset(cData);
      delegateMethods.reset(dData);
      step2Methods.reset(rData);
      step3Methods.reset(step3DataWithDefaults);
      // step4Methods.reset(step4Data);
      step4Methods.reset(step4DataMerged);

      // === โหลดประเภทเรื่องย่อยหลัง reset (ถ้ามี complaintTypeId) ===
      if (complaintTypeId) {
        setSubComplaintTypesLoading(true);
        try {
          const resSub = await getSubComplaintTypeById(complaintTypeId);
          if (
            resSub?.res_code === "0000" &&
            resSub.res_data &&
            Array.isArray(resSub.res_data.items)
          ) {
            setSubComplaintTypes(
              resSub.res_data.items.map((item) => ({
                value: item.id,
                label: item.name,
              }))
            );
          } else {
            setSubComplaintTypes([]);
          }
          // ถ้าไม่มีค่าเดิมของ complaintSubType (ตรวจทั้ง complaint_subtype_id และ complaint_type เพื่อ backward compat) ให้ reset เป็นค่าว่าง
          if (!(
            assignmentForm.complaint_subtype_id ||
            assignmentForm.complaint_type ||
            step3Data.complaintSubType
          )) {
            step3Methods.setValue("complaintSubType", "");
          }
        } catch (e) {
          setSubComplaintTypes([]);
        } finally {
          setSubComplaintTypesLoading(false);
        }
      } else {
        setSubComplaintTypes([]);
        step3Methods.setValue("complaintSubType", "");
        setSubComplaintTypesLoading(false);
      }
      // === END โหลดประเภทเรื่องย่อย ===
    } catch (error) {
      console.error("Load complaints failed", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const extractDateFromSarabun = (text) => {
    if (!text) return null;

    const m = text.match(/(\d{4})[-/ ]?(\d{2})[-/ ]?(\d{2})/);
    if (!m) return null;

    let year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    // ถ้าเป็นปี พ.ศ. แปลงเป็น ค.ศ.
    if (year >= 2400) year -= 543;

    const dt = new Date(year, month - 1, day);

    // ตรวจซ้ำให้ชัวร์
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    ) {
      return null;
    }
    return dt;
  };

  const onRefNo4Change = (e) => {
    handleFieldChange("referenceNumber4");
    const v = e && e.target ? e.target.value : "";
    const dt = extractDateFromSarabun(v);
    if (dt) {
      step3Methods.setValue("referenceDate4", dt, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValidationErrors((prev) => {
        if (!prev || !prev.referenceDate4) return prev || {};
        const n = { ...prev };
        delete n.referenceDate4;
        return n;
      });
    }
  };

  useEffect(() => {
  const v = step3Methods.getValues("referenceNumber4");
  const dt = extractDateFromSarabun(v);
  if (dt) {
    step3Methods.setValue("referenceDate4", dt);
  }
}, [defaultData, previewData]);

  const validateForm = () => {
    const errors = {};
    let hasErrors = false;

    const step3Data = step3Methods.getValues();
    const step4Data = step4Methods.getValues();

    // ประเภทเรื่องร้องเรียน *
    if (
      !step3Data.complaintType ||
      (typeof step3Data.complaintType === "string" &&
        step3Data.complaintType.trim() === "")
    ) {
      errors.complaintType = "กรุณาเลือกประเภทเรื่องร้องเรียน";
      hasErrors = true;
    }

    // // ประเภทเรื่องย่อย *
    // if (
    //   !step3Data.complaintSubType ||
    //   (typeof step3Data.complaintSubType === "string" &&
    //     step3Data.complaintSubType.trim() === "")
    // ) {
    //   errors.complaintSubType = "กรุณาเลือกประเภทเรื่องย่อย";
    //   hasErrors = true;
    // }

    // // เรื่อง *
    // if (
    //   !step3Data.subject ||
    //   (typeof step3Data.subject === "string" && step3Data.subject.trim() === "")
    // ) {
    //   errors.subject = "กรุณากรอกเรื่อง";
    //   hasErrors = true;
    // }

    // เลข สป.กค. *
    if (
      !step3Data.referenceNumber1 ||
      (typeof step3Data.referenceNumber1 === "string" &&
        step3Data.referenceNumber1.trim() === "")
    ) {
      errors.referenceNumber1 = "กรุณากรอกเลข สป.กค.";
      hasErrors = true;
    }

    // วันที่ (referenceDate1) *
    if (
      !step3Data.referenceDate1 ||
      (typeof step3Data.referenceDate1 === "string" &&
        step3Data.referenceDate1.trim() === "")
    ) {
      errors.referenceDate1 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    // เลข สตป. *
    if (
      !step3Data.referenceNumber3 ||
      (typeof step3Data.referenceNumber3 === "string" &&
        step3Data.referenceNumber3.trim() === "")
    ) {
      errors.referenceNumber3 = "กรุณากรอกเลข สตป.";
      hasErrors = true;
    }

    // วันที่ (referenceDate3) *
    if (
      !step3Data.referenceDate3 ||
      (typeof step3Data.referenceDate3 === "string" &&
        step3Data.referenceDate3.trim() === "")
    ) {
      errors.referenceDate3 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    // เลข สรร. (สารบัญ) *
    if (
      !step3Data.referenceNumber4 ||
      (typeof step3Data.referenceNumber4 === "string" &&
        step3Data.referenceNumber4.trim() === "")
    ) {
      errors.referenceNumber4 = "กรุณากรอกเลข สรร. (สารบัญ)";
      hasErrors = true;
    }

    // วันที่ (referenceDate4) *
    if (
      !step3Data.referenceDate4 ||
      (typeof step3Data.referenceDate4 === "string" &&
        step3Data.referenceDate4.trim() === "")
    ) {
      errors.referenceDate4 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    // เจ้าหน้าที่ผู้รับผิดชอบ *
    let responsibleOfficerValue = "";
    if (typeof step4Data.responsibleOfficer === "string") {
      responsibleOfficerValue = step4Data.responsibleOfficer;
    } else if (
      typeof step4Data.responsibleOfficer === "object" &&
      step4Data.responsibleOfficer !== null
    ) {
      // กรณี object (เช่น { id: "...", ... })
      responsibleOfficerValue = step4Data.responsibleOfficer.id || "";
    }

    if (!responsibleOfficerValue || responsibleOfficerValue.trim() === "") {
      errors.responsibleOfficer = "กรุณาเลือกเจ้าหน้าที่ผู้รับผิดชอบ";
      hasErrors = true;
    }

    setValidationErrors(errors);
    setShowValidation(hasErrors);

    return !hasErrors;
  };

  const handleReset = () => {
    generalMethods.reset(defaultGeneralRef.current);
    if (defaultDelegateRef.current) {
      delegateMethods.reset(defaultDelegateRef.current);
    }
    step2Methods.reset(defaultStep2Ref.current);
    step3Methods.reset(defaultStep3Ref.current);
    step4Methods.reset(defaultStep4Ref.current);

    setValidationErrors({});
    setShowValidation(false);
    setComplaintFilingType("new");
  };

  // ฟังก์ชันใหม่สำหรับการอัปเดตข้อมูล step 1 และ step 2 พร้อมไป preview
  const handleUpdateSteps = async () => {
    try {
      if (!defaultData?.id) {
        alertError("ข้อผิดพลาด", "ไม่พบ ID ของเรื่องร้องเรียน");
        return;
      }

      const generalData = generalMethods.getValues();
      const delegateData = delegateMethods.getValues();
      const step2Data = step2Methods.getValues();
      const step3Data = step3Methods.getValues();
      const step4Data = step4Methods.getValues();

      // หา senderAgencyName ตาม id ที่เลือก (อิงชุดเดียวกับ dropdown คือ positions)
      let senderAgencyName = "";
      const selectedAgencyId = step3Data.senderAgency;
      if (selectedAgencyId !== undefined && selectedAgencyId !== null && selectedAgencyId !== "") {
        // ค้นหาใน positions ก่อน (ข้อมูลจาก GetAllOutsideDepartments ที่ใช้ใน select)
        const foundPos = positions.find(
          (pos) => String(pos.id) === String(selectedAgencyId)
        );
        if (foundPos) {
          senderAgencyName = foundPos.name || foundPos.label || "";
        } else {
          // เผื่อกรณีมีข้อมูลจาก getDepartments เดิม ให้ลองค้นหา fallback
          const foundDept = departments.find(
            (dept) => String(dept.id) === String(selectedAgencyId)
          );
          senderAgencyName =
            (foundDept && (foundDept.name || foundDept.department_name || foundDept.label)) || "";
        }
      }

      const selectedOfficer = staffUsers.find(
        (user) => user.value === step4Data.responsibleOfficer
      );

      const responsibleOfficerData = selectedOfficer
        ? {
            id: selectedOfficer.value,
            name: selectedOfficer.label,
            fullName: selectedOfficer.fullName || "",
            email: selectedOfficer.email || "",
            roles: selectedOfficer.roles || [],
          }
        : {
            id: step4Data.responsibleOfficer || "",
            name: "",
            fullName: "",
            email: "",
            roles: [],
          };

      const enhancedStep4Data = {
        ...step4Data,
        responsibleOfficer: responsibleOfficerData,
        responsibleOfficerId: step4Data.responsibleOfficer,
      };

      const complaintFilingData = {
        new_complaint: complaintFilingType === "new",
        add_more_complaint_to_ref: complaintFilingType === "additional",
        group_work: complaintFilingType === "committee",
        additional_reference_number1: step3Data.additionalReference1 || "",
        additional_reference_date1: step3Data.additionalReferenceDate1 || "",
        additional_reference_number2: step3Data.additionalReference2 || "",
        additional_reference_date2: step3Data.additionalReferenceDate2 || "",
      };

      // เตรียมข้อมูลในรูปแบบเดียวกับ handleSubmit
      const updatePayload = {
        step1: {
          general: {
            general: generalData,
            delegate: defaultDelegateRef.current && Object.keys(delegateData).length > 0 ? delegateData : null,
          },
        },
        step2: {
          general: {
            individual: step2Data,
          },
        },
        step3: {
          general: {
            ...step3Data,
            senderAgencyName,
            complaintType: step3Data.complaintType,
            complaintFilingType: complaintFilingType,
            ...complaintFilingData,
          },
        },
        step4: {
          general: enhancedStep4Data,
        },
      };

      console.log("UpdateAssignmentCompleteByAdmin payload:", updatePayload);

      // ใช้ UpdateAssignmentCompleteByAdmin แทนเพราะรองรับข้อมูลครบถ้วน
      const result = await UpdateAssignmentCompleteByAdmin(defaultData.id, updatePayload);

      if (result && result.success) {
        alertSuccess("อัปเดตสำเร็จ", "ข้อมูลผู้ร้องทุกข์ และผู้ถูกร้องเรียน ได้รับการอัปเดตแล้ว");

        // ส่งไป preview หลังจากอัปเดตสำเร็จ
        setTimeout(() => {
          handleSubmit();
        }, 1500);
      } else {
        throw new Error("การอัปเดตไม่สำเร็จ");
      }

    } catch (error) {
      console.error("Error updating complaint data:", error);
      alertError("ข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleSubmit = () => {
    const isValid = validateForm();
    if (!isValid) {
      alertError(
        "ข้อมูลไม่ครบถ้วน",
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ฟิลด์ที่มีเครื่องหมาย *)"
      );
      return;
    }

    const generalData = generalMethods.getValues();
    const delegateData = delegateMethods.getValues();
    const step2Data = step2Methods.getValues();
    const step3Data = step3Methods.getValues();
    const step4Data = step4Methods.getValues();
    // console.log({ step4Data });

    // หา senderAgencyName ตาม id ที่เลือก (อิงชุดเดียวกับ dropdown คือ positions)
    let senderAgencyName = "";
    const selectedAgencyId = step3Data.senderAgency;
    if (selectedAgencyId !== undefined && selectedAgencyId !== null && selectedAgencyId !== "") {
      // ค้นหาใน positions ก่อน (ข้อมูลจาก GetAllOutsideDepartments ที่ใช้ใน select)
      const foundPos = positions.find(
        (pos) => String(pos.id) === String(selectedAgencyId)
      );
      if (foundPos) {
        senderAgencyName = foundPos.name || foundPos.label || "";
      } else {
        // เผื่อกรณีมีข้อมูลจาก getDepartments เดิม ให้ลองค้นหา fallback
        const foundDept = departments.find(
          (dept) => String(dept.id) === String(selectedAgencyId)
        );
        senderAgencyName =
          (foundDept && (foundDept.name || foundDept.department_name || foundDept.label)) || "";
      }
    }

    const selectedOfficer = staffUsers.find(
      (user) => user.value === step4Data.responsibleOfficer
    );

    const responsibleOfficerData = selectedOfficer
      ? {
          id: selectedOfficer.value,
          name: selectedOfficer.label,
          fullName: selectedOfficer.fullName || "",
          email: selectedOfficer.email || "",
          roles: selectedOfficer.roles || [],
        }
      : {
          id: step4Data.responsibleOfficer || "",
          name: "",
          fullName: "",
          email: "",
          roles: [],
        };

    const enhancedStep4Data = {
      ...step4Data,
      responsibleOfficer: responsibleOfficerData,
      responsibleOfficerId: step4Data.responsibleOfficer,
    };

    const complaintFilingData = {
      new_complaint: complaintFilingType === "new",
      add_more_complaint_to_ref: complaintFilingType === "additional",
      group_work: complaintFilingType === "committee",
      additional_reference_number1: step3Data.additionalReference1 || "",
      additional_reference_date1: step3Data.additionalReferenceDate1 || "",
      additional_reference_number2: step3Data.additionalReference2 || "",
      additional_reference_date2: step3Data.additionalReferenceDate2 || "",
    };

    const submitData = {
      id: defaultData?.id,
      step1: {
        general: {
          general: generalData,
          delegate: defaultDelegateRef.current ? delegateData : null,
        },
      },
      step2: {
        general: {
          individual: step2Data,
        },
      },
      step3: {
        general: {
          ...step3Data,
          senderAgencyName, // <= เพิ่มตรงนี้!
          complaintType: step3Data.complaintType,
          complaintFilingType: complaintFilingType,
          ...complaintFilingData,
        },
      },
      step4: {
        general: enhancedStep4Data,
      },
    };

    router.push(
      `/admin/edit/search/Filteromplaints/${defaultData?.id}?preview`,
      undefined,
      { shallow: true }
    );
    setPreviewData(submitData);
  };

  // เปลี่ยนชื่อฟังก์ชันเพื่อแยกจาก dropdown
  const handleComplaintFilingTypeChange = (type) => {
    setComplaintFilingType(type);

    // Clear validation errors when changing
    if (showValidation) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.complaintType;
        return newErrors;
      });
    }

    // Clear other radio buttons when one is selected
    if (type === "new") {
      step3Methods.setValue("isAdditionalComplaint", false);
      step3Methods.setValue("isCommitteeComplaint", false);
    } else if (type === "additional") {
      step3Methods.setValue("isNewComplaint", false);
      step3Methods.setValue("isCommitteeComplaint", false);
    } else if (type === "committee") {
      step3Methods.setValue("isNewComplaint", false);
      step3Methods.setValue("isAdditionalComplaint", false);
    }
  };

  // Helper functions
  const getFieldError = (fieldName) => {
    return showValidation ? validationErrors[fieldName] : "";
  };

  const hasFieldError = (fieldName) => {
    return showValidation && !!validationErrors[fieldName];
  };

  const handleFieldChange = (fieldName) => {
    if (showValidation && validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // useEffect subComplaintTypes
  useEffect(() => {
    const complaintTypeId = step3Methods.watch("complaintType");
    if (complaintTypeId) {
      setSubComplaintTypesLoading(true);
      getSubComplaintTypeById(complaintTypeId)
        .then((res) => {
          if (
            res?.res_code === "0000" &&
            res.res_data &&
            Array.isArray(res.res_data.items)
          ) {
            setSubComplaintTypes(
              res.res_data.items.map((item) => ({
                value: item.id,
                label: item.name,
              }))
            );
          } else {
            setSubComplaintTypes([]);
          }
          step3Methods.setValue("complaintSubType", "");
        })
        .catch(() => setSubComplaintTypes([]))
        .finally(() => setSubComplaintTypesLoading(false));
    } else {
      setSubComplaintTypes([]);
      step3Methods.setValue("complaintSubType", "");
      setSubComplaintTypesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3Methods.watch("complaintType")]);

  const complaintType = step3Methods.watch("complaintType");

  useEffect(() => {
    if (previewData) {
      generalMethods.reset(previewData?.step1?.general?.general || {});
      delegateMethods.reset(previewData?.step1?.general?.delegate || {});
      step2Methods.reset(previewData?.step2?.general?.individual || {});
      step3Methods.reset(previewData?.step3?.general || {});

      // Fix responsibleOfficer to be id only
      const previewStep4 = previewData?.step4?.general || {};
      let responsibleOfficerValue = "";
      if (typeof previewStep4.responsibleOfficer === "string") {
        responsibleOfficerValue = previewStep4.responsibleOfficer;
      } else if (
        previewStep4.responsibleOfficer &&
        typeof previewStep4.responsibleOfficer === "object"
      ) {
        responsibleOfficerValue =
          previewStep4.responsibleOfficer.id ||
          previewStep4.responsibleOfficer.value ||
          "";
      }

      step4Methods.reset({
        ...previewStep4,
        responsibleOfficer: responsibleOfficerValue,
      });

      setComplaintFilingType(
        previewData?.step3?.general?.complaintFilingType || "new"
      );
    }
  }, [previewData]);

  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div className={styles.container}>
          <div className={styles.headerBar}>
            แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง
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
            แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง
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

  if (previewMode) {
    if (!defaultData && !previewData) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      );
    }

    const baseData = previewData || defaultData;
    const complaintTypeId = baseData?.step3?.general?.complaintType || "";
    const complaintTypeLabel =
      complaintTypes.find((t) => t.value === complaintTypeId)?.label || "";

    // ดึงข้อมูลประเภทเรื่องย่อย (subType)
    const complaintSubTypeId = baseData?.step3?.general?.complaintSubType || "";
    const complaintSubTypeLabel =
      subComplaintTypes.find((t) => t.value === complaintSubTypeId)?.label ||
      "";

    const previewPayload = {
      ...baseData,
      complaintTypeId,
      complaintTypeLabel,
      complaintSubTypeId,
      complaintSubTypeLabel,
    };
    return (
      <SearchComplaintsPreview
        data={previewPayload}
        onBack={() => {
          setPreviewData(null);
          router.replace(
            `/admin/edit/search/Filteromplaints/${defaultData?.id}`,
            undefined,
            { shallow: true }
          );
        }}
      />
    );
  }
  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div className={styles.container}>
        <div className={styles.headerBar}>
          แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง
        </div>

        {defaultData ? (
          <div className={styles.contentContainer}>
            {/* Tab Navigation - แสดงเพื่อความสวยงาม */}
            
            <div className={styles.tabNav}>
              <div
                className={`${styles.tab} ${styles.tab0} ${
                  complainantType === "individual" ? styles.active : ""
                }`}
              >
                บุคคลทั่วไป
              </div>
              <div
                className={`${styles.tabV2} ${
                  complainantType === "corporate" ? styles.activeV2 : ""
                }`}
              >
                นิติบุคคล
              </div>
              <div
                className={`${styles.tabV2} ${
                  complainantType === "government" ? styles.activeV2 : ""
                }`}
              >
                หน่วยงานของรัฐ
              </div>
              <div
                className={styles.underlineBarV2}
                style={{
                  background:
                    complainantType === "corporate"
                      ? "linear-gradient(90deg, #3FA9F5 0%, #0f67b1 100%)"
                      : complainantType === "government"
                      ? "linear-gradient(90deg, #edc458 0%, #e3ebf7 100%)"
                      : "linear-gradient(90deg, #2196f3 0%, #0f67b1 100%)",
                }}
              />
            </div>

            <div className={styles.formWrapper}>
              {/* Section 1: ข้อมูลผู้ร้องทุกข์ */}
              <FormProvider {...generalMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      {complainantType === "corporate"
                        ? "ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)"
                        : "ข้อมูลผู้ร้องทุกข์"}
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      data={complainantData}
                      formType={
                        complainantType === "corporate"
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
                      data={delegateData}
                      formType={
                        delegateType === "signer" ? "signer" : "delegate"
                      }
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
                >
                  บุคคลทั่วไป
                </div>
                <div
                  className={`${styles.tab} ${styles.tab1} ${
                    respondentType === "corporate" ? styles.activeV2 : ""
                  }`}
                >
                  นิติบุคคล
                </div>
                <div
                  className={`${styles.tab} ${styles.tab2} ${
                    respondentType === "government" ? styles.activeV2 : ""
                  }`}
                >
                  หน่วยงานของรัฐ
                </div>
                <div
                  className={styles.underlineBarV2}
                  style={{
                    background:
                      respondentType === "corporate"
                        ? "linear-gradient(90deg, #3FA9F5 0%, #0f67b1 100%)"
                        : respondentType === "government"
                        ? "linear-gradient(90deg, #edc458 0%, #e3ebf7 100%)"
                        : "linear-gradient(90deg, #2196f3 0%, #0f67b1 100%)",
                  }}
                />
              </div>

              {/* Section 3: ข้อมูลผู้ถูกร้องเรียน */}
              <FormProvider {...step2Methods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      {respondentType === "corporate"
                        ? "ข้อมูลผู้ถูกร้องเรียน (นิติบุคคล)"
                        : respondentType === "government"
                        ? "ข้อมูลหน่วยงานของรัฐที่ถูกร้องเรียน"
                        : "ข้อมูลผู้ถูกร้องเรียน"}
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      data={respondentData}
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
                          ประเภทเรื่องร้องเรียน{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <select
                          {...step3Methods.register("complaintType", {
                            onChange: (e) => {
                              handleFieldChange("complaintType");
                            },
                          })}
                          className={
                            hasFieldError("complaintType")
                              ? styles.errorField
                              : ""
                          }
                          // ไม่ควรมี defaultValue เป็น label ให้ใช้ id เสมอ
                        >
                          <option value="">เลือกประเภทเรื่องร้องเรียน</option>
                          {complaintTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {hasFieldError("complaintType") && (
                          <span className={styles.errorText}>
                            {getFieldError("complaintType")}
                          </span>
                        )}
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ประเภทเรื่องย่อย</label>
                        <select
                          {...step3Methods.register("complaintSubType")}
                          disabled={!complaintType || subComplaintTypesLoading}
                        >
                          <option value="">
                            {!complaintType
                              ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                              : subComplaintTypesLoading
                              ? "กำลังโหลด..."
                              : "เลือกประเภทเรื่องย่อย (ถ้ามี)"}
                          </option>
                          {subComplaintTypes.length > 0 &&
                            subComplaintTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ช่องทางเรื่องร้องเรียน</label>
                        <select
                          {...step3Methods.register("complaintChannel")}
                          disabled={complaintChannelsLoading}
                        >
                          <option value="">
                            {complaintChannelsLoading
                              ? "กำลังโหลด..."
                              : "เลือกช่องทาง (ถ้ามี)"}
                          </option>
                          {complaintChannels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: เรื่อง */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroupFull}>
                        <label>
                          เรื่อง <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("subject", {
                            onChange: () => handleFieldChange("subject"),
                          })}
                          className={
                            hasFieldError("subject") ? styles.errorField : ""
                          }
                          placeholder="กรุณากรอกเรื่อง"
                        />
                        {hasFieldError("subject") && (
                          <span className={styles.errorText}>
                            {getFieldError("subject")}
                          </span>
                        )}
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
                            onChange: () =>
                              handleFieldChange("referenceNumber1"),
                          })}
                          className={
                            hasFieldError("referenceNumber1")
                              ? styles.errorField
                              : ""
                          }
                          placeholder="กรุณากรอกเลข สป.กค."
                        />
                        {hasFieldError("referenceNumber1") && (
                          <span className={styles.errorText}>
                            {getFieldError("referenceNumber1")}
                          </span>
                        )}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <ControlledDateThaiPickerService
                          name="referenceDate1"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                          error={hasFieldError("referenceDate1")}
                          helperText={getFieldError("referenceDate1")}
                          onChange={() => handleFieldChange("referenceDate1")}
                          required
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>เลข สป.สร.</label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber2")}
                          placeholder="เลข สป.สร."
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

                    {/* Row 4: เลข สตป., วันที่, เลข สรร. (สารบัญ), วันที่ */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สตป. <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber3", {
                            onChange: () =>
                              handleFieldChange("referenceNumber3"),
                          })}
                          className={
                            hasFieldError("referenceNumber3")
                              ? styles.errorField
                              : ""
                          }
                          placeholder="กรุณากรอกเลข สตป."
                        />
                        {hasFieldError("referenceNumber3") && (
                          <span className={styles.errorText}>
                            {getFieldError("referenceNumber3")}
                          </span>
                        )}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.datePickerWrapper}>
                          <ControlledDateThaiPickerService
                            name="referenceDate3"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                            error={hasFieldError("referenceDate3")}
                            helperText={getFieldError("referenceDate3")}
                            required
                            onChange={() => handleFieldChange("referenceDate3")}
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สรร. (สารบัญ) <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber4", {
                            onChange: onRefNo4Change, 
                          })}
                          className={hasFieldError("referenceNumber4") ? styles.errorField : ""}
                          placeholder="กรุณากรอกเลข สรร. (สารบัญ)"
                          disabled
                        />
                        {hasFieldError("referenceNumber4") && (
                          <span className={styles.errorText}>{getFieldError("referenceNumber4")}</span>
                        )}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.datePickerWrapper}>
                          <ControlledDateThaiPickerService
                            name="referenceDate4"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                            error={hasFieldError("referenceDate4")}
                            helperText={getFieldError("referenceDate4")}
                            onChange={() => handleFieldChange("referenceDate4")}
                            required
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 5: เลขที่หนังสือ, วันที่, หน่วยงานอื่นที่ส่งเรื่องมา กค. */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>เลขที่หนังสือ</label>
                        <input
                          type="text"
                          {...step3Methods.register("documentNumber")}
                          placeholder="เลขที่หนังสือ"
                        />
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>วันที่</label>
                        <div className={styles.datePickerWrapper}>
                          <ControlledDateThaiPickerService
                            name="documentDate"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>หน่วยงานอื่นที่ส่งเรื่องมายัง กค.</label>
                        <select
                          className={styles.niceSelect}
                          {...step3Methods.register("senderAgency")}
                        >
                          <option value="">เลือกหน่วยงาน</option>
                          {positions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.name}
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

                    {/* Checkboxes - แยกจาก dropdown ประเภทเรื่องร้องเรียน */}
                    <div className={styles.checkboxSection}>
                      <div className={styles.checkboxGroupVertical}>
                        {/* เรื่องร้องเรียนใหม่ */}
                        <div className={styles.checkboxRowSingle}>
                          <label
                            className={`${styles.checkboxItem} ${
                              complaintFilingType === "new"
                                ? styles.checked
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={complaintFilingType === "new"}
                              onChange={() => {
                                handleComplaintFilingTypeChange("new");
                              }}
                            />
                            เรื่องร้องเรียนใหม่
                          </label>
                        </div>

                        {/* เรื่องร้องเรียนเพิ่มเติม */}
                        <div className={styles.checkboxRowWithFields}>
                          <div className={styles.checkboxColumn}>
                            <label
                              className={`${styles.checkboxItem} ${
                                complaintFilingType === "additional"
                                  ? styles.checked
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={complaintFilingType === "additional"}
                                onChange={() => {
                                  handleComplaintFilingTypeChange("additional");
                                }}
                              />
                              เรื่องร้องเรียนเพิ่มเติม
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง(เลข สรร.สารบัญ)</label>
                                <div className={styles.inputWithIcon}>
                                  <input
                                    type="text"
                                    disabled={
                                      complaintFilingType !== "additional"
                                    }
                                    {...step3Methods.register(
                                      "additionalReference1"
                                    )}
                                  />
                                  <span
                                    className={styles.icon}
                                    onClick={() => {
                                      if (complaintFilingType === "additional")
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
                                    <SearchIcon color="primary" />{" "}
                                    ค้นหาเลขที่อ้างอิง
                                  </DialogTitle>
                                  <DialogContent>
                                    <TextField
                                      inputRef={inputRef}
                                      fullWidth
                                      size="small"
                                      placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                                      value={searchText}
                                      onChange={(e) => {
                                        setSearchText(e.target.value);
                                        handleSearch(e.target.value);
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
                                      <List>
                                        {searchResults.map((item) => (
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
                                                "&:hover": {
                                                  background: "#e3f2fd",
                                                },
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                              }}
                                            >
                                              {/* จุดสถานะ is_master */}
                                              <span
                                                style={{
                                                  width: 12,
                                                  height: 12,
                                                  borderRadius: "50%",
                                                  backgroundColor:
                                                    item.is_master
                                                      ? "#2ecc71"
                                                      : "#bdbdbd",
                                                  border: "2px solid #fff",
                                                  boxShadow:
                                                    "0 0 0 1px rgba(0,0,0,0.15)",
                                                  flex: "0 0 auto",
                                                }}
                                                title={
                                                  item.is_master
                                                    ? "Master"
                                                    : "Non-master"
                                                }
                                              />
                                              <DescriptionIcon
                                                color="info"
                                                sx={{ mr: 1 }}
                                              />
                                              <span style={{ fontWeight: 500 }}>
                                                {item.label}
                                              </span>
                                            </ListItemButton>
                                          </ListItem>
                                        ))}
                                      </List>
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
                                    disabled={
                                      complaintFilingType !== "additional"
                                    }
                                    placeholder="กรุณาเลือกวันที่"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* รับเรื่องจากคณะทำงานนักตรวจสอบ */}
                        <div className={styles.checkboxRowWithFields}>
                          <div className={styles.checkboxColumn}>
                            <label
                              className={`${styles.checkboxItem} ${
                                complaintFilingType === "committee"
                                  ? styles.checked
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={complaintFilingType === "committee"}
                                onChange={() => {
                                  handleComplaintFilingTypeChange("committee");
                                }}
                              />
                              รับเรื่องจากคณะทำงานนักตรวจสอบ
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง(เลข สรร.สารบัญ)</label>
                                <input
                                  type="text"
                                  disabled={complaintFilingType !== "committee"}
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
                                    disabled={
                                      complaintFilingType !== "committee"
                                    }
                                    placeholder="กรุณาเลือกวันที่"
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
                              label="วันที่รับงานของเจ้าหน้าที่"
                              name="officerReceivedDate"
                              control={step4Methods.control}
                              // defaultValue={
                              //   defaultData?.assignment_form?.registration_date
                              // }
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
                              // defaultValue={
                              //   defaultData?.assignment_form?.director_submission_date
                              // }
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
                              name="incidentDate"
                              control={step4Methods.control}
                              defaultValue={
                                defaultData?.step3?.general?.incidentDate
                                  ? new Date(
                                      defaultData.step3.general.incidentDate
                                    )
                                  : undefined
                              }
                              time={true}
                              disabled={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: รายละเอียดเพิ่มเติม */}
                      <div className={styles.fieldGroup}>
                        <label>รายละเอียดเพิ่มเติม</label>
                        <textarea
                          rows={8}
                          defaultValue={
                            defaultData?.step3?.general?.description
                          }
                          disabled
                          className={styles.disabledTextarea}
                          {...step3Methods.register("description")}
                        />
                      </div>

                      {/* เอกสารประกอบการร้องเรียน */}
                      <div className={styles.attachmentSection}>
                        <h4>เอกสารประกอบการร้องเรียน</h4>
                        <div className={styles.attachmentList}>
                          {defaultData?.step3?.general?.attachment?.length >
                          0 ? (
                            defaultData.step3.general.attachment.map(
                              (file, index) => {
                                const fileSizeMB = (
                                  file.fileSize /
                                  (1024 * 1024)
                                ).toFixed(2);

                                const formatDate = (isoString) => {
                                  const date = new Date(isoString);
                                  const day = date
                                    .getDate()
                                    .toString()
                                    .padStart(2, "0");
                                  const month = (date.getMonth() + 1)
                                    .toString()
                                    .padStart(2, "0");
                                  const year = (date.getFullYear() + 543)
                                    .toString()
                                    .slice(-2);
                                  return `${day}/${month}/${year}`;
                                };

                                const baseUrl =
                                  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL?.replace(
                                    /\/$/,
                                    ""
                                  ) || "";
                                const fileUrl = file.fileUrl?.startsWith("http")
                                  ? file.fileUrl
                                  : `${baseUrl}/${
                                      file.fileUrl?.replace(/^\//, "") || ""
                                    }`;

                                return (
                                  <div
                                    key={file.id || index}
                                    className={styles.attachmentItem}
                                  >
                                    <span className={styles.pdfIcon}>📄</span>
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "inherit",
                                        textDecoration: "none",
                                      }}
                                    >
                                      {file.fileName} {fileSizeMB} MB (
                                      {formatDate(file.created_at)})
                                    </a>
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <div className={styles.attachmentItem}>
                              <span className={styles.pdfIcon}>📄</span>
                              ไม่มีเอกสารประกอบ
                            </div>
                          )}
                        </div>
                        <p className={styles.attachmentNote}>
                          หมายเหตุ : หลักฐาน เช่น สำเนาสัญญา ภาพถ่าย หรือ
                          หมายศาล
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FormProvider>

              {/* Section 6: คัดกรองเรื่องราวร้องทุกข์ */}
              <FormProvider {...step4Methods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      คัดกรองเรื่องราวร้องทุกข์{" "}
                      <span className={styles.required}>*</span>
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.screeningSection}>
                      {/* เจ้าหน้าที่ผู้รับผิดชอบ */}
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label>
                            เจ้าหน้าที่ผู้รับผิดชอบ
                            <span className={styles.required}>*</span>
                          </label>
                          <Autocomplete
                              options={Object.values(groupedStaffUsers).flat()}
                              getOptionLabel={option =>
                                typeof option === "string" ? option : option.label || option.value || ""
                              }
                              value={
                                (() => {
                                  const val = step4Methods.getValues("responsibleOfficer");
                                  if (!val) return null;
                                  return staffUsers.find(u => String(u.value) === String(val)) || null;
                                })()
                              }
                              inputValue={inputValue}
                              onInputChange={(event, newInputValue, reason) => {
                                setInputValue(newInputValue);
                                if (reason === "clear") {
                                  step4Methods.setValue("responsibleOfficer", "");
                                  step4Methods.setValue("responsibleOfficerId", "");
                                  step4Methods.setValue("responsibleOfficerName", "");
                                  handleFieldChange("responsibleOfficer");
                                }
                              }}
                              onChange={(event, newValue) => {
                                let actualValue = "";
                                let selectedObj = null;
                                if (newValue && typeof newValue === "object") {
                                  actualValue = newValue.value || "";
                                  selectedObj = newValue;
                                } else {
                                  actualValue = "";
                                  selectedObj = null;
                                }
                                step4Methods.setValue("responsibleOfficer", actualValue);
                                step4Methods.setValue("responsibleOfficerId", selectedObj ? selectedObj.value : "");
                                step4Methods.setValue("responsibleOfficerName", selectedObj ? selectedObj.label : "");
                                handleFieldChange("responsibleOfficer");
                                setInputValue(selectedObj ? selectedObj.label : "");
                              }}
                              isOptionEqualToValue={(option, v) => String(option.value) === String(v?.value || v)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  name="responsibleOfficer"
                                  error={hasFieldError("responsibleOfficer")}
                                  helperText={getFieldError("responsibleOfficer")}
                                  variant="outlined"
                                  autoComplete="off"
                                  placeholder="เลือกเจ้าหน้าที่ผู้รับผิดชอบ"
                                  sx={{
                                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                                    fontSize: "16px",
                                    color: "#1120A3",
                                    background: "#fff",
                                    borderRadius: "12px",
                                    // --- ไม่มีขอบทุกส่วน ---
                                    border: "none !important",
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: "12px",
                                      background: "#fff",
                                      boxShadow: "none",
                                      height: "44px",
                                      paddingRight: "36px", // เพิ่มพื้นที่ขวาให้กากบาทอยู่ในกรอบ input
                                      border: "none !important",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      border: "none !important",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                      border: "none !important",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                      border: "none !important",
                                    },
                                    "& .MuiFormHelperText-root": {
                                      marginLeft: 0,
                                    },
                                  }}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {(step4Methods.getValues("responsibleOfficer") || inputValue) && (
                                          <InputAdornment position="end">
                                            <IconButton
                                              onClick={() => {
                                                step4Methods.setValue("responsibleOfficer", "");
                                                step4Methods.setValue("responsibleOfficerId", "");
                                                step4Methods.setValue("responsibleOfficerName", "");
                                                setInputValue("");
                                                handleFieldChange("responsibleOfficer");
                                              }}
                                              edge="end"
                                              size="small"
                                              sx={{
                                                color: "#999",
                                                "&:hover": {
                                                  color: "#1976d2",
                                                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                                                },
                                              }}
                                            >
                                              <CloseIcon fontSize="small" />
                                            </IconButton>
                                          </InputAdornment>
                                        )}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                              disableClearable
                            />
                          {hasFieldError("responsibleOfficer") && (
                            <span className={styles.errorText}>
                              {getFieldError("responsibleOfficer")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* หมายเหตุ */}
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroupFull}>
                          <label>หมายเหตุ</label>
                          <textarea
                            rows={4}
                            {...step4Methods.register("screeningRemarks")}
                            placeholder="ให้หน่วยงานทำการชี้แจงผลกระทบความล่าช้าและเสนอแนวทางแก้ไข..."
                            defaultValue={
                              defaultData?.assignment_form?.assigned_remark
                                ? defaultData?.assignment_form?.assigned_remark
                                : ""
                            }
                            className={styles.textarea}
                          />
                        </div>
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
                  label="อัปเดต Step 1,2"
                  color="primary"
                  variant="outlined"
                  onClick={handleUpdateSteps}
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
