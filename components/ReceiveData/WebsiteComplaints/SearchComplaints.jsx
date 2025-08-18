import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  GetComplaintByID,
  GetComplaintsWithSearch,
} from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService, {
  ControlledDateThaiPickerService,
} from "@services/DateThaiPickerService/DateThaiPickerService";
import { FormProvider, useForm, Controller } from "react-hook-form";
import styles from "./TabNav.module.scss";
import SearchComplaintsPreview from "./SearchComplaintsPreview";
import { alertWarning } from "@utils/Alerts";
import {
  GetAllSelectComplaintTypes,
  getSubComplaintTypeById,
  GetAllComplaintChannels,
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
  { label: "แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง" },
];

const SearchComplaints = () => {
  const router = useRouter();
  const { id, preview } = router.query;

  const hasRedirected = useRef(false);
  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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

  const [complaintTypes, setComplaintTypes] = useState([]);

  const [subComplaintTypes, setSubComplaintTypes] = useState([]);
  const [complaintChannels, setComplaintChannels] = useState([]); // เพิ่ม state สำหรับ channels
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false); // เพิ่ม loading state สำหรับ channels
  const [selectedComplaintTypeId, setSelectedComplaintTypeId] = useState("");

  // เพิ่ม refs เพื่อควบคุมการยิง API
  const fetchSubTypesTimeoutRef = useRef(null);
  const currentFetchPromiseRef = useRef(null);
  const lastFetchedIdRef = useRef("");

  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef();

  // --- เปลี่ยน useEffect เปิด Dialog ให้ยิง API ---
  useEffect(() => {
    if (openSearchDialog) {
      setSearchText(""); // reset input
      handleSearch(""); // โหลดรายการทั้งหมดทันทีที่เปิด (keyword ว่าง)
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  // --- handleSearch ยังคงเดิม (ยิง API search ด้วย keyword) ---

  const handleSearch = async (keyword) => {
    setSearchLoading(true);
    try {
      const response = await GetComplaintsWithSearch({
        skip: 0,
        limit: 100,
        search: keyword || "",
      });

      console.log("API response", response);

      // ใช้ complaint_number เป็น label และ value หลัก
      const items = Array.isArray(response?.res_data?.items)
        ? response.res_data.items
        : [];

      console.log("items for result", items);

      const results = items.map((item) => ({
        ...item,
        label: item.complaint_number || "",
        value: item.complaint_number || "",
      }));

      setSearchResults(results);
      console.log("results for display", results);
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

    step3Methods.setValue("complaintSubType", ""); // ล้าง sub type
    setSelectedComplaintTypeId(value);

    // ล้าง sub types เก่า
    clearSubTypes();

    // ถ้ามี ID ที่ถูกต้อง ให้โหลด sub types ใหม่
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

  useEffect(() => {
    if (id) {
      fetchComplaints(id);
    }
  }, [id]);

  useEffect(() => {
    // เงื่อนไข: ต้องมีทั้ง defaultData และ complaintTypes (และข้อมูลใน general)
    if (
      defaultData?.step3?.general?.complaintType &&
      complaintTypes.length > 0
    ) {
      const step3General = defaultData.step3.general;
      const complaintTypeName = step3General.complaintType;
      const matchedType = complaintTypes.find(
        (type) => type.name === complaintTypeName
      );
      const complaintTypeId = matchedType ? matchedType.id : "";

      // Map complaintChannel ด้วย
      let complaintChannelId = "";
      if (step3General.complaintChannel && complaintChannels.length > 0) {
        const matchedChannel = complaintChannels.find(
          (channel) => channel.name === step3General.complaintChannel
        );
        complaintChannelId = matchedChannel ? matchedChannel.id : "";
      }

      // Reset form ด้วย id ที่ map แล้ว
      step3Methods.reset({
        ...step3General,
        complaintTypeId: String(complaintTypeId),
        complaintSubType: step3General.complaintSubType || "",
        complaintChannel: complaintChannelId || "",
        complaint_filing_type: step3General.complaint_filing_type || "new",
      });

      setSelectedComplaintTypeId(complaintTypeId);

      // autoload sub types ถ้ามี id เดิม
      if (complaintTypeId) {
        fetchSubComplaintTypes(complaintTypeId);
      }
    }
    // eslint-disable-next-line
  }, [defaultData, complaintTypes, complaintChannels]);

  const fetchComplaints = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);

      // refs เก่า
      defaultGeneralRef.current = data?.step1?.general?.general || {};
      defaultDelegateRef.current = data?.step1?.general?.delegate || null;
      defaultStep2Ref.current = data?.step2?.general?.individual || {};
      defaultStep3Ref.current = data?.step3?.general || {};
      defaultStep4Ref.current = data?.step4?.general || {};

      // reset form อื่น
      generalMethods.reset(defaultGeneralRef.current);
      if (defaultDelegateRef.current)
        delegateMethods.reset(defaultDelegateRef.current);
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
    // ล้าง API calls ที่รอค้างอยู่
    clearSubTypes();

    // Reset forms
    generalMethods.reset(defaultGeneralRef.current);
    if (defaultDelegateRef.current) {
      delegateMethods.reset(defaultDelegateRef.current);
    }
    step2Methods.reset(defaultStep2Ref.current);
    step3Methods.reset(defaultStep3Ref.current);
    step4Methods.reset(defaultStep4Ref.current);
  };

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

  const handleSubmit = async () => {
    const fieldsToValidate = [
      "complaintTypeId",
      "complaintSubType",
      "complaintChannel",
      "subject",
      "referenceNumber1",
      "referenceDate2",
      "referenceNumber3",
      "referenceDate3",
      "referenceNumber4",
      "referenceDate4",
    ];

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

    const generalData = generalMethods.getValues();
    const delegateData = delegateMethods.getValues();
    const step2Data = step2Methods.getValues();
    const step3Data = step3Methods.getValues();
    const step4Data = step4Methods.getValues();

    // Logic mapping ที่ robust สำหรับ id หรือ name ที่อาจมีแค่อย่างเดียว
    const selectedComplaintType =
      complaintTypes.find(
        (type) =>
          type.id === step3Data.complaintTypeId ||
          type.name === step3Data.complaintType ||
          type.name === step3Data.complaintTypeName
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

    // ถ้าไม่มี id ให้ส่ง "-"
    const complaintTypeId =
      step3Data.complaintTypeId ||
      step3Data.complaint_type_id ||
      selectedComplaintType?.id ||
      "-";
    const complaintTypeName =
      step3Data.complaintTypeName ||
      step3Data.complaintType ||
      selectedComplaintType?.name ||
      "-";
    const complaintTypeData =
      step3Data.complaintTypeData ||
      step3Data.complaint_type_data ||
      selectedComplaintType ||
      null;

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
          complaintType: complaintTypeName,
          complaintTypeId,
          complaintTypeID: complaintTypeId,
          complaintTypeName,
          complaintTypeData,
          complaint_type: complaintTypeName,
          complaint_type_id: complaintTypeId,
          complaint_type_data: complaintTypeData,

          complaintSubType: complaintSubTypeName,
          complaintSubTypeID: complaintSubTypeId,
          complaintSubTypeName: complaintSubTypeName,
          complaintSubTypeData: complaintSubTypeData,
          complaint_subtype: complaintSubTypeName,
          complaint_subtype_id: complaintSubTypeId,
          complaint_subtype_data: complaintSubTypeData,

          complaintChannel: complaintChannelName,
          complaintChannelID: complaintChannelId,
          complaintChannelName: complaintChannelName,
          complaintChannelData: complaintChannelData,
          complaint_channel: complaintChannelName,
          complaint_channel_id: complaintChannelId,
          complaint_channel_data: complaintChannelData,
        },
      },
      step4: {
        general: step4Data,
      },
    };

    setPreviewData(submitData);
    setShowPreview(true);
  };

  const handleComplaintTypeChange = (type) => {
    step3Methods.setValue("isNewComplaint", false);
    step3Methods.setValue("isAdditionalComplaint", false);
    step3Methods.setValue("isCommitteeComplaint", false);

    if (type === "new") {
      step3Methods.setValue("isNewComplaint", true);
    } else if (type === "additional") {
      step3Methods.setValue("isAdditionalComplaint", true);
    } else if (type === "committee") {
      step3Methods.setValue("isCommitteeComplaint", true);
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
          query: { preview: "" },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [showPreview, previewData, defaultData?.id, preview, router]);

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
      />
    );
  }

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

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div className={styles.container}>
        <div className={styles.headerBar}>
          แบบรับคำร้องเรียน / ร้องทุกข์กระทรวง
        </div>

        {defaultData ? (
          <div className={styles.contentContainer}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
              <div className={`${styles.tab} ${styles.tab0} ${styles.active}`}>
                บุคคลทั่วไป
              </div>
              <div className={`${styles.tab} ${styles.tab1}`}>นิติบุคคล</div>
              <div className={`${styles.tab} ${styles.tab2}`}>
                หน่วยงานของรัฐ
              </div>
              <div
                className={styles.underlineBar}
                style={{ backgroundColor: "#0B1F8F" }}
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
                      data={defaultGeneralRef.current}
                      formType="complainant"
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Section 2: ข้อมูลผู้รับมอบอำนาจร้องทุกข์ */}
              <FormProvider {...delegateMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      ข้อมูลผู้รับมอบอำนาจร้องทุกข์
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      data={defaultDelegateRef.current}
                      formType="delegate"
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Tab Navigation for Step 2 */}
              <div className={styles.tabNav}>
                <div className={`${styles.tab} ${styles.tab0}`}>
                  บุคคลทั่วไป
                </div>
                <div
                  className={`${styles.tab} ${styles.tab1} ${styles.active}`}
                >
                  นิติบุคคล
                </div>
                <div className={`${styles.tab} ${styles.tab2}`}>
                  หน่วยงานของรัฐ
                </div>
                <div
                  className={styles.underlineBar}
                  style={{ backgroundColor: "#3FA9F5" }}
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
                      data={defaultStep2Ref.current}
                      formType="complainee"
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
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                        {getErrorMessage("complaintTypeId")}
                      </div>

                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องย่อย{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <select
                          {...step3Methods.register("complaintSubType", {
                            required: "กรุณาเลือกประเภทเรื่องย่อย",
                          })}
                          style={getErrorStyle("complaintSubType")}
                          disabled={
                            !isValidId(selectedComplaintTypeId) ||
                            loadingSubTypes
                          }
                        >
                          <option value="">
                            {!isValidId(selectedComplaintTypeId)
                              ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                              : loadingSubTypes
                              ? "กำลังโหลด..."
                              : subComplaintTypes.length === 0
                              ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                              : "เลือกประเภทเรื่องย่อย"}
                          </option>
                          {subComplaintTypes.map((subType) => (
                            <option key={subType.id} value={subType.id}>
                              {subType.name}
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
                            <option key={channel.id} value={channel.id}>
                              {channel.name}
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
                          name="referenceDate2"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                          rules={{ required: "กรุณาเลือกวันที่" }}
                          required={true}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>เลข สป.สร.</label>
                        <input
                          type="text"
                          defaultValue="16-4925-56"
                          {...step3Methods.register("referenceNumber2")}
                        />
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>วันที่</label>
                        <DateThaiPickerService
                          name="referenceDate2Optional"
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
                          rules={{ required: "กรุณาเลือกวันที่" }}
                          required={true}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สรร. (สานต่อ){" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber4", {
                            required: "กรุณากรอกเลข สรร. (สานต่อ)",
                          })}
                          style={getErrorStyle("referenceNumber4")}
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
                          rules={{ required: "กรุณาเลือกวันที่" }}
                          required={true}
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
                        <div className={styles.datePickerWrapper}>
                          <DateThaiPickerService
                            name="documentDate"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>หน่วยงานอื่นที่ส่งเรื่องมาที่ กค.</label>
                        <select {...step3Methods.register("senderAgency")}>
                          <option value="">เลือกหน่วยงาน</option>
                          <option value="ministry1">กระทรวงการคลัง</option>
                          <option value="ministry2">กระทรวงมหาดไทย</option>
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
                                <label>เลขที่อ้างอิง(เลข สรร.สารบัญ)</label>
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
                                    disabled={
                                      currentComplaintFilingType !==
                                      "additional"
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
                              รับเรื่องจากคณะทำงานนักตรวจสอบ
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง(เลข สรร.สานต่อ)</label>
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
                                  <DateThaiPickerService
                                    name="additionalReferenceDate2"
                                    control={step3Methods.control}
                                    disabled={
                                      currentComplaintFilingType !== "committee"
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
                            <DateThaiPickerService
                              label="วันที่รับเรื่องของเจ้าพนักงาน"
                              value={
                                defaultData?.step4?.general
                                  ?.officerReceivedDate || ""
                              }
                              onChange={() => {}}
                              time={true}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <DateThaiPickerService
                              label="วันที่เสนองาน ผอ.สรร."
                              value={
                                defaultData?.step4?.general
                                  ?.directorSubmittedDate || ""
                              }
                              onChange={() => {}}
                              time={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: วันและเวลาที่เกิดเหตุ */}
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.datePickerWrapper}>
                            <DateThaiPickerService
                              label="วันและเวลาที่เกิดเหตุ"
                              value={
                                defaultData?.step4?.general?.incidentDateTime ||
                                "2023-11-01T14:37:00"
                              }
                              onChange={() => {}}
                              time={true}
                              dis={true}
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
