import React, { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { FormProvider, useForm } from "react-hook-form";
import styles from "./TabNav.module.scss";

import { ControlledDateThaiPickerService } from "@services/DateThaiPickerService/DateThaiPickerService";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemButton, TextField, InputAdornment,
  CircularProgress, IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import ClearIcon from "@mui/icons-material/Clear";

import {    
  GetAllSelectComplaintTypes,
  getSubComplaintTypeById,
  GetAllComplaintChannels,
  GetAllOutsideDepartments,
} from "@pages/api/allselect/allselect";
import { GetComplaintsWithSearch } from "@pages/api/complaint/complaint";
import { alertSuccess, alertError, alertWarning } from "@utils/Alerts";

const Tab31 = ({
  stepKey,
  tabData = {},
  updateStepData,
  formData,
  onBack,
  onNext, 
}, ref) => {

  const step3Methods = useForm({ mode: "onChange" });
  const step4Methods = useForm({ mode: "onChange" });

  // State สำหรับ master data
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [complaintChannels, setComplaintChannels] = useState([]);
  const [outsideDepartments, setOutsideDepartments] = useState([]);
  const [subComplaintTypes, setSubComplaintTypes] = useState([]);

  // Loading states
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingOutsideDepartments, setLoadingOutsideDepartments] = useState(false);

  // Selected state
  const [selectedComplaintType, setSelectedComplaintType] = useState("");

  // search dialog
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef(null);

  const fetchSubTypesTimeoutRef = useRef(null);
  const currentFetchPromiseRef = useRef(null);
  const lastFetchedIdRef = useRef("");
  const initialComplaintTypeIdRef = useRef(null);

  const errMsg = (name) => {
    const e = step3Methods.formState.errors[name];
    return e ? <div className={styles.errorText}>{e.message}</div> : null;
  };
  const errStyle = (name) => (step3Methods.formState.errors[name] ? { borderColor: "#ef4444" } : {});

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

  const clearSubTypes = () => {
    if (fetchSubTypesTimeoutRef.current) {
      clearTimeout(fetchSubTypesTimeoutRef.current);
      fetchSubTypesTimeoutRef.current = null;
    }
    if (currentFetchPromiseRef.current) {
      currentFetchPromiseRef.current = null;
    }
    setSubComplaintTypes([]);
    setLoadingSubTypes(false);
    lastFetchedIdRef.current = "";
  };

  // Load initial master data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingOptions(true);
      setLoadingChannels(true);
      setLoadingOutsideDepartments(true);

      try {
        const [complaintTypesResponse, channelsResponse, outsideResponse] = await Promise.all([
          GetAllSelectComplaintTypes(),
          GetAllComplaintChannels(),
          GetAllOutsideDepartments(),
        ]);

        if (complaintTypesResponse?.res_code === "0000" && complaintTypesResponse?.res_data) {
          const normTypes = Array.isArray(complaintTypesResponse.res_data)
            ? complaintTypesResponse.res_data.map((t) => ({
                value: t.id,
                label: t.name,
                raw: t,
              }))
            : [];
          setComplaintTypes(normTypes);
        } else {
          setComplaintTypes([]);
        }

        if (channelsResponse?.res_code === "0000" && channelsResponse?.res_data) {
          const channelsData = channelsResponse.res_data;
          if (channelsData.items && Array.isArray(channelsData.items)) {
            const normChannels = channelsData.items.map((c) => ({
              value: c.id,
              label: c.name,
              raw: c,
            }));
            setComplaintChannels(normChannels);
          } else {
            setComplaintChannels([]);
          }
        } else {
          setComplaintChannels([]);
        }

        if (Array.isArray(outsideResponse)) {
          const normOutside = outsideResponse.map((d) => ({
            value: d.value ?? d.id,
            label: d.label ?? d.name,
            raw: d,
          }));
          setOutsideDepartments(normOutside);
        } else {
          setOutsideDepartments([]);
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
        setComplaintTypes([]);
        setComplaintChannels([]);
        setOutsideDepartments([]);
      } finally {
        setLoadingOptions(false);
        setLoadingChannels(false);
        setLoadingOutsideDepartments(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch sub complaint types
  const fetchSubComplaintTypesInternal = useCallback(async (complaintTypeId) => {
    if (!isValidId(complaintTypeId)) {
      clearSubTypes();
      return;
    }

    clearSubTypes();
    setLoadingSubTypes(true);
    lastFetchedIdRef.current = complaintTypeId;

    const fetchPromise = (async () => {
      try {
        const response = await getSubComplaintTypeById(complaintTypeId);

        if (response?.res_code === "0000" && response?.res_data) {
          const responseData = response.res_data;
          if (Array.isArray(responseData.items)) {
            const filteredSubTypes = responseData.items.map((item) => ({
              value: item.id,
              label: item.name,
              raw: item,
            }));
            setSubComplaintTypes(filteredSubTypes);
          } else {
            setSubComplaintTypes([]);
          }
        } else {
          setSubComplaintTypes([]);
        }
      } catch (error) {
        setSubComplaintTypes([]);
        if (error?.response?.status === 404) {
          console.log("404 - No sub types found for this complaint type");
        } else if (error?.response?.status === 400) {
          console.log("400 - Bad request, possibly invalid parent_type_id");
        } else {
          console.error("Error fetching sub complaint types:", error);
        }
      } finally {
        if (currentFetchPromiseRef.current === fetchPromise) {
          setLoadingSubTypes(false);
          currentFetchPromiseRef.current = null;
        }
      }
    })();

    currentFetchPromiseRef.current = fetchPromise;
  }, []);

  // Handle complaint type change
  const onTypeChange = (e) => {
    const value = e.target.value;
    step3Methods.setValue("complaintType", value);
    step3Methods.setValue("complaintTypeId", value);
    step3Methods.setValue("complaintSubType", "");
    setSelectedComplaintType(value);
    clearSubTypes();
    
    if (isValidId(value)) {
      fetchSubTypesTimeoutRef.current = setTimeout(() => {
        fetchSubComplaintTypesInternal(value);
      }, 300);
    }
  };

  // Search functionality
  const runSearch = async (kw) => {
    setSearchLoading(true);
    try {
      const response = await GetComplaintsWithSearch({
        skip: 0,
        limit: 100,
        search: kw || "",
      });

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
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => { 
    setSearchText(""); 
    runSearch(""); 
    inputRef.current?.focus(); 
  };

  const pickRef = (item) => {
    step3Methods.setValue("additionalReference1", item.complaint_number || "");
    setOpenSearchDialog(false);
  };

  // Auto-extract date from reference number 4
  const buddhistYYYYMMDDToDate = (yyyymmddStr) => {
    if (!/^\d{8}$/.test(yyyymmddStr)) return null;
    const yearThai = parseInt(yyyymmddStr.slice(0, 4), 10);
    const month = parseInt(yyyymmddStr.slice(4, 6), 10);
    const day = parseInt(yyyymmddStr.slice(6, 8), 10);

    if (yearThai < 2400 || yearThai > 2800) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const yearAD = yearThai - 543;
    return new Date(yearAD, month - 1, day, 0, 0, 0);
  };

  const extractYYYYMMDDFromRef = (refNo) => {
    if (!refNo) return null;
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

  // Load data from tabData
  useEffect(() => {
    if (!tabData || Object.keys(tabData).length === 0) return;

    let complaintTypeId = String(tabData.complaintTypeId || tabData.complaintType || "");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(complaintTypeId) && typeof complaintTypeId === "string" && complaintTypes.length > 0) {
      const found = complaintTypes.find((t) => t.label === complaintTypeId);
      complaintTypeId = found ? found.value : "";
    }

    setSelectedComplaintType(complaintTypeId);

    step3Methods.reset({
      complaintType: complaintTypeId,
      complaintTypeId: complaintTypeId,
      complaintSubType: tabData.complaintSubType || "",
      complaintChannel: tabData.complaintChannel || "",
      subject: tabData.subject || "",
      referenceNumber1: tabData.referenceNumber1 || "",
      referenceDate1: tabData.referenceDate1 || "",
      referenceNumber2: tabData.referenceNumber2 || "",
      referenceDate2: tabData.referenceDate2 || "",
      referenceNumber3: tabData.referenceNumber3 || "",
      referenceDate3: tabData.referenceDate3 || "",
      referenceNumber4: tabData.referenceNumber4 || "",
      referenceDate4: tabData.referenceDate4 || "",
      documentNumber: tabData.documentNumber || "",
      documentDate: tabData.documentDate || "",
      senderAgency: tabData.senderAgency || "",
      securityLevel: tabData.securityLevel || "normal",
      urgencyLevel: tabData.urgencyLevel || "low",
      additionalReference1: tabData.additionalReference1 || "",
      additionalReferenceDate1: tabData.additionalReferenceDate1 || "",
      additionalReference2: tabData.additionalReference2 || "",
      additionalReferenceDate2: tabData.additionalReferenceDate2 || "",
      description: tabData.description || "",
      complaint_filing_type: tabData.complaint_filing_type || "new",
    });

    const formatDateTimeForForm = (dateValue) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date;
    };

    step4Methods.reset({
      officerReceivedDate: formatDateTimeForForm(tabData.officerReceivedDate || ""),
      directorSubmittedDate: formatDateTimeForForm(tabData.directorSubmittedDate || ""),
      incidentDateTime: formatDateTimeForForm(tabData.incidentDateTime || ""),
    });

    if (complaintTypeId && uuidRegex.test(complaintTypeId)) {
      fetchSubComplaintTypesInternal(complaintTypeId);
      if (initialComplaintTypeIdRef.current === null) {
        initialComplaintTypeIdRef.current = complaintTypeId;
      }
    }
  }, [tabData, complaintTypes, step3Methods, step4Methods, fetchSubComplaintTypesInternal]);

  // Open search dialog effect
  useEffect(() => {
    if (openSearchDialog) {
      setSearchText("");
      runSearch("");
      inputRef.current?.focus();
    }
  }, [openSearchDialog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSubTypes();
    };
  }, []);

  // Filing type handlers
  const filingType = step3Methods.watch("complaint_filing_type") || "new";
  const setFilingType = (t) => step3Methods.setValue("complaint_filing_type", t);

  const handleReset = () => {
    clearSubTypes();
    step3Methods.reset();
    step4Methods.reset();
  };

  // บันทึกข้อมูลไปยัง hook แล้วไปขั้นตอนต่อไป
  const validateAndSave = async () => {
    const must = [
      "complaintTypeId",
      "complaintChannel",
      "subject",
      "referenceNumber1","referenceDate1", // สป.กค.
      "referenceNumber3","referenceDate3", // สตป.
      "referenceNumber4","referenceDate4"  // สรร.
    ];

    // เผื่อบางที่ผูกกับ complaintType แทน complaintTypeId
    const v = step3Methods.getValues();
    if (v.complaintType && !v.complaintTypeId) {
      step3Methods.setValue("complaintTypeId", v.complaintType, { shouldDirty:false });
    }

    const isValid = await step3Methods.trigger(must);
        if (!isValid) {
            const errs = Object.values(step3Methods.formState.errors || {}).map(e => `• ${e.message || "ข้อมูลไม่ถูกต้อง"}`);
            await alertWarning("ข้อมูลไม่ครบถ้วน", `กรุณาแก้ไขข้อมูลดังต่อไปนี้:<br/><br/>${errs.join("<br/>")}`, true);
        return false;
    }

    const s3 = step3Methods.getValues();
    const s4 = step4Methods.getValues();

    // รวมข้อมูลทั้งหมดจาก Tab3-1
    const combinedData = {
      ...s3,
      ...s4,
      // เพิ่มข้อมูลจาก step4Methods ด้วย
      officerReceivedDate: s4.officerReceivedDate,
      directorSubmittedDate: s4.directorSubmittedDate,
      incidentDateTime: s4.incidentDateTime,
    };

    // บันทึกข้อมูลไปยัง hook สำหรับ step31
    updateStepData("step31", "general", combinedData);
    
    return true;
    };
    useImperativeHandle(ref, () => ({
    validateAndSave,
    // เผื่ออยากอ่านข้อมูลสด ๆ (ไม่บังคับใช้)
    getCurrentValues: () => ({
        step3: step3Methods.getValues(),
        step4: step4Methods.getValues(),
    }),
    }));

    const handleSave = async () => {
    const ok = await validateAndSave();
    if (!ok) return;
    await alertSuccess("บันทึกข้อมูล", "ข้อมูลได้รับการบันทึกแล้ว จะถูกส่งพร้อมกับเรื่องร้องทุกข์");
    onNext?.();
};

  return (
    <div className={styles.formWrapper}>
      {/* ============== Section 4 ============== */}
      <FormProvider {...step3Methods}>
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์</h3>
          </div>

          <div className={styles.sectionContent}>

            {/* Row 3: สป.กค./วันที่ + สป.สร./วันที่ */}
            <div className={styles.fieldRowDate}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>เลข สป.กค. <span className={styles.required}>*</span></label>
                <input className={styles.inputControl} type="text"
                  {...step3Methods.register("referenceNumber1", { required: "กรุณากรอกเลข สป.กค." })}
                  style={errStyle("referenceNumber1")}
                />
                {errMsg("referenceNumber1")}
              </div>
              <div className={styles.fieldGroupDate}>
                <label className={styles.label}>วันที่ <span className={styles.required}>*</span></label>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService
                    name="referenceDate1" control={step3Methods.control}
                    placeholder="กรุณาเลือกวันที่" rules={{ required: "กรุณาเลือกวันที่" }}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>เลข สป.สร.</label>
                <input className={styles.inputControl} type="text" {...step3Methods.register("referenceNumber2")} />
              </div>
              <div className={styles.fieldGroupDate}>
                <label className={styles.label}>วันที่</label>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService name="referenceDate2" control={step3Methods.control} placeholder="กรุณาเลือกวันที่" />
                </div>
              </div>
            </div>

            {/* Row 4: สตป./วันที่ */}
            <div className={styles.fieldRowDate}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>เลข สตป. <span className={styles.required}>*</span></label>
                <input className={styles.inputControl} type="text"
                  {...step3Methods.register("referenceNumber3", { required: "กรุณากรอกเลข สตป." })}
                  style={errStyle("referenceNumber3")}
                />
                {errMsg("referenceNumber3")}
              </div>
              <div className={styles.fieldGroupDate}>
                <label className={styles.label}>วันที่ <span className={styles.required}>*</span></label>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService 
                    name="referenceDate3" 
                    control={step3Methods.control} 
                    placeholder="กรุณาเลือกวันที่"
                    rules={{ required: "กรุณาเลือกวันที่" }}
                  />
                </div>
              </div>
            </div>

             {/* Row 1: ประเภท/ประเภทย่อย/ช่องทาง */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ประเภทเรื่องร้องเรียน <span className={styles.required}>*</span></label>
                <select
                  className={styles.inputControl}
                  {...step3Methods.register("complaintTypeId", {
                    required: "กรุณาเลือกประเภทเรื่องร้องเรียน", 
                    onChange: onTypeChange,
                  })}
                  style={errStyle("complaintTypeId")}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "กำลังโหลด..." : "เลือกประเภทเรื่องร้องเรียน"}
                  </option>
                  {complaintTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errMsg("complaintTypeId")}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>ประเภทเรื่องย่อย</label>
                <select
                  className={styles.inputControl}
                  {...step3Methods.register("complaintSubType")}
                  disabled={!selectedComplaintType || loadingSubTypes}
                  style={errStyle("complaintSubType")}
                >
                  <option value="">
                    {!selectedComplaintType ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                      : loadingSubTypes ? "กำลังโหลด..."
                      : subComplaintTypes.length === 0 ? "ไม่มีประเภทย่อย"
                      : "เลือกประเภทเรื่องย่อย"}
                  </option>
                  {subComplaintTypes.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errMsg("complaintSubType")}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>ช่องทางเรื่องร้องเรียน <span className={styles.required}>*</span></label>
                <select
                  className={styles.inputControl}
                  {...step3Methods.register("complaintChannel", { 
                    required: "กรุณาเลือกช่องทางเรื่องร้องเรียน" 
                  })}
                  disabled={loadingChannels}
                  style={errStyle("complaintChannel")}
                >
                  <option value="">
                    {loadingChannels ? "กำลังโหลด..." : "เลือกช่องทางเรื่องร้องเรียน"}
                  </option>
                  {complaintChannels.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errMsg("complaintChannel")}
              </div>
            </div>

             {/* Row 6: ชั้นความลับ/เร่งด่วน */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ชั้นความลับ</label>
                <select className={styles.inputControl} {...step3Methods.register("securityLevel")}>
                  <option value="normal">ปกติ</option>
                  <option value="confidential">ลับ</option>
                  <option value="secret">ลับมาก</option>
                  <option value="top_secret">ลับที่สุด</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ชั้นความเร่งด่วน</label>
                <select className={styles.inputControl} {...step3Methods.register("urgencyLevel")}>
                  <option value="low">ปกติ</option>
                  <option value="medium">เร่งด่วน</option>
                  <option value="high">ด่วน</option>
                  <option value="urgent">ด่วนมาก</option>
                  <option value="critical">ด่วนที่สุด</option>
                </select>
              </div>
            </div>

            {/* Row 5: เลขที่หนังสือ/วันที่ + หน่วยงานอื่น */}
            <div className={styles.fieldRowDate}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>เลขที่หนังสือ</label>
                <input className={styles.inputControl} type="text" {...step3Methods.register("documentNumber")} />
              </div>
              <div className={styles.fieldGroupDate}>
                <label className={styles.label}>วันที่</label>
                  <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService name="documentDate" control={step3Methods.control} placeholder="กรุณาเลือกวันที่" />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>หน่วยงานอื่นที่ส่งเรื่องมาที่ กค.</label>
                <select className={styles.inputControl} {...step3Methods.register("senderAgency")} disabled={loadingOutsideDepartments}>
                  <option value="">
                    {loadingOutsideDepartments ? "กำลังโหลดหน่วยงาน..." : "เลือกหน่วยงาน"}
                  </option>
                  {outsideDepartments.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

             {/* Row 2: เรื่อง */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroupFull}>
                <label className={styles.label}>เรื่อง <span className={styles.required}>*</span></label>
                <input
                  className={styles.inputControl}
                  type="text"
                  {...step3Methods.register("subject", { required: "กรุณากรอกเรื่อง" })}
                  style={errStyle("subject")}
                />
                {errMsg("subject")}
              </div>
            </div>

            {/* Filing type */}
            <div className={styles.checkboxSection}>
              <div className={styles.checkboxGroupVertical}>
                <div className={styles.checkboxRowSingle}>
                  <label className={`${styles.checkboxItem} ${filingType === "new" ? styles.checked : ""}`}>
                    <input type="checkbox" checked={filingType === "new"} onChange={() => setFilingType("new")} />
                    เรื่องร้องเรียนใหม่
                  </label>
                </div>

                <div className={styles.checkboxRowWithFields}>
                  <div className={styles.checkboxColumn}>
                    <label className={`${styles.checkboxItem} ${filingType === "additional" ? styles.checked : ""}`}>
                      <input type="checkbox" checked={filingType === "additional"} onChange={() => setFilingType("additional")} />
                      เรื่องร้องเรียนเพิ่มเติม
                    </label>
                  </div>
                  <div className={styles.fieldsColumn}>
                    <div className={styles.fieldPair}>
                      <div className={styles.fieldWithLabel}>
                        <label className={styles.label}>เลขที่อ้างอิง(เลข สรร.สารบัญ)</label>
                        <div className={styles.inputWithIcon}>
                          <input className={styles.inputControl} type="text" disabled={filingType !== "additional"} {...step3Methods.register("additionalReference1")} />
                          <span className={styles.icon} onClick={() => filingType === "additional" && setOpenSearchDialog(true)}>
                            <SearchIcon />
                          </span>
                        </div>
                        
                        {/* Search Dialog */}
                        <Dialog 
                          open={openSearchDialog} 
                          onClose={() => setOpenSearchDialog(false)} 
                          maxWidth="sm" 
                          fullWidth
                          PaperProps={{ 
                            style: { borderRadius: 12, background: "#f7fafd", height: 500 } 
                          }}
                        >
                          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <SearchIcon color="primary" /> ค้นหาเลขที่อ้างอิง
                          </DialogTitle>
                          <DialogContent>
                            <TextField
                              inputRef={inputRef} 
                              fullWidth 
                              size="small"
                              placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                              value={searchText}
                              onChange={(e) => { const v = e.target.value; setSearchText(v); runSearch(v); }}
                              InputProps={{
                                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                                endAdornment: searchText ? (
                                  <InputAdornment position="end">
                                    <IconButton size="small" onClick={clearSearch}><ClearIcon /></IconButton>
                                  </InputAdornment>
                                ) : null,
                                style: { background: "#fff", borderRadius: 8 },
                              }}
                              sx={{ mb: 2 }}
                            />
                            {searchLoading ? (
                              <div className={styles.dialogLoading}>
                                <CircularProgress color="primary" />
                                <div>กำลังค้นหา...</div>
                              </div>
                            ) : searchResults.length === 0 ? (
                              <div className={styles.dialogEmpty}>
                                <DescriptionIcon sx={{ fontSize: 48, mb: 1 }} color="disabled" />
                                ไม่พบรายการเลขที่อ้างอิง
                              </div>
                            ) : (
                              <List sx={{ maxHeight: 320, overflow: "auto" }}>
                                {searchResults.map((item) => {
                                  const isMaster = !!item.is_master;
                                  return (
                                    <ListItem key={item.id} disablePadding>
                                      <ListItemButton 
                                        onClick={() => pickRef(item)}
                                        sx={{
                                          py: 1.5,
                                          px: 2,
                                          borderRadius: 2,
                                          mb: 0.5,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1.5,
                                          "&:hover": { background: "#e3f2fd" },
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            backgroundColor: isMaster ? "#2ecc71" : "#bdbdbd",
                                            border: "2px solid #fff",
                                            boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                                            flexShrink: 0,
                                          }}
                                          title={isMaster ? "Master" : "Non-master"}
                                        />
                                        <DescriptionIcon color="info" sx={{ mr: 0.5 }} />
                                        <span style={{ fontWeight: 500 }}>
                                          {item.complaint_type} - {item.complaint_number}
                                        </span>
                                      </ListItemButton>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            )}
                          </DialogContent>
                          <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setOpenSearchDialog(false)} variant="outlined" color="inherit">
                              ปิด
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </div>

                      <div className={styles.fieldWithLabelDate}>
                        <label className={styles.label}>วันที่</label>
                            <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                          <ControlledDateThaiPickerService name="additionalReferenceDate1" control={step3Methods.control} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* committee */}
                <div className={styles.checkboxRowWithFields}>
                  <div className={styles.checkboxColumn}>
                    <label className={`${styles.checkboxItem} ${filingType === "committee" ? styles.checked : ""}`}>
                      <input type="checkbox" checked={filingType === "committee"} onChange={() => setFilingType("committee")} />
                      รับเรื่องจากคณะทำงานนักตรวจสอบ
                    </label>
                  </div>
                  <div className={styles.fieldsColumn}>
                    <div className={styles.fieldPair}>
                      <div className={styles.fieldWithLabel}>
                        <label className={styles.label}>เลขที่อ้างอิง(เลข สรร.สานต่อ)</label>
                        <input className={styles.inputControl} type="text" disabled={filingType !== "committee"} {...step3Methods.register("additionalReference2")} />
                      </div>
                      <div className={styles.fieldWithLabelDate}>
                        <label className={styles.label}>วันที่</label>
                            <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                          <ControlledDateThaiPickerService name="additionalReferenceDate2" control={step3Methods.control} />
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

      {/* ============== Section 5 ============== */}
      <FormProvider {...step4Methods}>
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์เพิ่มเติม</h3>
          </div>

          <div className={styles.sectionContent}>
            {/* ใช้ fieldRowTwo = 2 คอลัมน์ */}
            <div className={styles.fieldRowTwo}>
              <div className={styles.fieldGroupDate}>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService
                    label="วันที่รับเรื่องของเจ้าพนักงาน"
                    name="officerReceivedDate" control={step4Methods.control} time
                  />
                </div>
              </div>
              <div className={styles.fieldGroupDate}>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService
                    label="วันที่เสนองาน ผอ.สรร."
                    name="directorSubmittedDate" control={step4Methods.control} placeholder="กรุณาเลือกวันที่" time
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <div className={`${styles.datePickerWrapper} ${styles.datePickerUX}`}>
                  <ControlledDateThaiPickerService
                    label="วันและเวลาที่เกิดเหตุ"
                    name="incidentDateTime" control={step4Methods.control} time
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>รายละเอียดเพิ่มเติม</label>
              <textarea
                rows={8}
                className={`${styles.inputControl} ${styles.textAreaControl} ${styles.textareaUX}`}
                {...step3Methods.register("description")}
                placeholder="กรอกรายละเอียดเพิ่มเติม..."
              />
            </div>
          </div>
        </div>
      </FormProvider>
    </div>
  );
}

export default forwardRef(Tab31);