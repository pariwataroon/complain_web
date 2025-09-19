// components/Complaint/Tabs/tab3-1.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

export default function Tab31({
  defaultData = null,
  options = {},
  fetchSubComplaintTypes,
  onReset,
  onSubmit,
  searchFn,
}) {
  const step3Methods = useForm({ mode: "onChange" });
  const step4Methods = useForm({ mode: "onChange" });

  // map options
  const complaintTypes = useMemo(() => {
    const src = options.complaintTypes || [];
    return src.map((t) => ({ value: t.value ?? t.id, label: t.label ?? t.name }));
  }, [options.complaintTypes]);
  const complaintChannels = useMemo(() => {
    const src = options.complaintChannels || [];
    return src.map((c) => ({ value: c.value ?? c.id, label: c.label ?? c.name }));
  }, [options.complaintChannels]);
  const outsideDepartments = useMemo(
    () => (options.outsideDepartments || []).map((d) => ({
      value: d.value ?? d.id, label: d.label ?? d.name,
    })),
    [options.outsideDepartments]
  );

  const [selectedComplaintType, setSelectedComplaintType] = useState("");
  const [subComplaintTypes, setSubComplaintTypes] = useState([]);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingChannels] = useState(false);
  const [loadingOutsideDepartments] = useState(false);

  // search dialog
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef(null);

  const errMsg = (name) => {
    const e = step3Methods.formState.errors[name];
    return e ? <div className={styles.errorText}>{e.message}</div> : null;
  };
  const errStyle = (name) => (step3Methods.formState.errors[name] ? { borderColor: "#ef4444" } : {});

  useEffect(() => {
    const step3 = defaultData?.step3?.general || {};
    const step4 = defaultData?.step4?.general || {};

    const ctId = String(step3.complaint_type_id || step3.complaintTypeId || step3.complaintType || "");
    setSelectedComplaintType(ctId);

    step3Methods.reset({
      complaintType: ctId,
      complaintTypeId: ctId,
      complaintSubType: step3.complaint_subtype_id || step3.complaintSubType || "",
      complaintChannel: step3.complaint_channel_id || step3.complaintChannel || "",
      subject: step3.subject || "",
      referenceNumber1: step3.reference_number || step3.referenceNumber1 || "",
      referenceDate1: step3.reference_date1 || step3.referenceDate1 || "",
      referenceNumber2: step3.reference_number2 || "",
      referenceDate2: step3.reference_date2 || "",
      referenceNumber3: step3.reference_number3 || "",
      referenceDate3: step3.reference_date3 || "",
      referenceNumber4: step3.reference_number4 || defaultData?.complaint_number || "",
      referenceDate4: step3.reference_date4 || "",
      documentNumber: step3.document_number || "",
      documentDate: step3.document_date || "",
      senderAgency: step3.senderAgency || "",
      securityLevel: step3.securityLevel || "normal",
      urgencyLevel: step3.urgencyLevel || "low",
      additionalReference1: step3.additional_reference_number1 || "",
      additionalReferenceDate1: step3.additional_reference_date1 || "",
      additionalReference2: step3.additional_reference_number2 || "",
      additionalReferenceDate2: step3.additional_reference_date2 || "",
      description: step3.description || "",
      complaint_filing_type: step3.complaint_filing_type || "new",
    });

    step4Methods.reset({
      officerReceivedDate: step4.officerReceivedDate || "",
      directorSubmittedDate: step4.directorSubmittedDate || "",
      incidentDateTime: step4.incidentDateTime || step3.incidentDate || "",
    });

    if (ctId) loadSubTypes(ctId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultData]);

  const loadSubTypes = useCallback(async (parentId) => {
    if (!parentId || !fetchSubComplaintTypes) {
      setSubComplaintTypes([]); return;
    }
    try {
      setLoadingSubTypes(true);
      const res = await fetchSubComplaintTypes(parentId);
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setSubComplaintTypes(items.map((s) => ({ value: s.id ?? s.value, label: s.name ?? s.label })));
    } finally { setLoadingSubTypes(false); }
  }, [fetchSubComplaintTypes]);

  const onTypeChange = (e) => {
    const v = e.target.value;
    step3Methods.setValue("complaintType", v);
    step3Methods.setValue("complaintTypeId", v);
    step3Methods.setValue("complaintSubType", "");
    setSelectedComplaintType(v);
    loadSubTypes(v);
  };

  const runSearch = async (kw) => {
    if (!searchFn) return setSearchResults([]);
    setSearchLoading(true);
    try {
      const list = await searchFn(kw || "");
      setSearchResults(Array.isArray(list) ? list : []);
    } finally { setSearchLoading(false); }
  };
  const clearSearch = () => { setSearchText(""); runSearch(""); inputRef.current?.focus(); };
  const pickRef = (item) => {
    step3Methods.setValue("additionalReference1", item.complaint_number || "");
    setOpenSearchDialog(false);
  };

  const filingType = step3Methods.watch("complaint_filing_type") || "new";
  const setFilingType = (t) => step3Methods.setValue("complaint_filing_type", t);

  const handleReset = () => onReset?.();
  const handleSubmit = () =>
    onSubmit?.({ step3: step3Methods.getValues(), step4: step4Methods.getValues() });

  return (
    <div className={styles.formWrapper}>
      {/* ============== Section 4 ============== */}
      <FormProvider {...step3Methods}>
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์</h3>
          </div>

          <div className={styles.sectionContent}>
            {/* Row 1: ประเภท/ประเภทย่อย/ช่องทาง */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ประเภทเรื่องร้องเรียน <span className={styles.required}>*</span></label>
                <select
                  className={styles.inputControl}
                  {...step3Methods.register("complaintTypeId", {
                    required: "กรุณาเลือกประเภทเรื่องร้องเรียน", onChange: onTypeChange,
                  })}
                  style={errStyle("complaintTypeId")}
                >
                  <option value="">เลือกประเภทเรื่องร้องเรียน</option>
                  {complaintTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                      : subComplaintTypes.length === 0 ? "กรุณาเลือกประเภทเรื่องร้องเรียนก่อน"
                      : "เลือกประเภทเรื่องย่อย"}
                  </option>
                  {subComplaintTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errMsg("complaintSubType")}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>ช่องทางเรื่องร้องเรียน <span className={styles.required}>*</span></label>
                <select
                  className={styles.inputControl}
                  {...step3Methods.register("complaintChannel", { required: "กรุณาเลือกช่องทางเรื่องร้องเรียน" })}
                  disabled={loadingChannels}
                  style={errStyle("complaintChannel")}
                >
                  <option value="">เลือกช่องทางเรื่องร้องเรียน</option>
                  {complaintChannels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {errMsg("complaintChannel")}
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
                <div className={styles.datePickerWrapper}>
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
                <div className={styles.datePickerWrapper}>
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
                <div className={styles.datePickerWrapper}>
                  <ControlledDateThaiPickerService name="referenceDate3" control={step3Methods.control} placeholder="กรุณาเลือกวันที่" />
                </div>
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
                <div className={styles.datePickerWrapper}>
                  <ControlledDateThaiPickerService name="documentDate" control={step3Methods.control} placeholder="กรุณาเลือกวันที่" />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>หน่วยงานอื่นที่ส่งเรื่องมาที่ กค.</label>
                <select className={styles.inputControl} {...step3Methods.register("senderAgency")} disabled={loadingOutsideDepartments}>
                  <option value="">{loadingOutsideDepartments ? "กำลังโหลดหน่วยงาน..." : "เลือกหน่วยงาน"}</option>
                  {outsideDepartments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
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
                        {/* Dialog ค้นหา */}
                        <Dialog open={openSearchDialog} onClose={() => setOpenSearchDialog(false)} maxWidth="sm" fullWidth
                          PaperProps={{ style:{ borderRadius:12, background:"#f7fafd", height:500 } }}>
                          <DialogTitle sx={{ display:"flex", alignItems:"center", gap:1 }}>
                            <SearchIcon color="primary" /> ค้นหาเลขที่อ้างอิง
                          </DialogTitle>
                          <DialogContent>
                            <TextField
                              inputRef={inputRef} fullWidth size="small"
                              placeholder="พิมพ์คำค้นหาเลขที่อ้างอิง หรือชื่อเรื่อง..."
                              value={searchText}
                              onChange={(e)=>{ const v=e.target.value; setSearchText(v); runSearch(v); }}
                              InputProps={{
                                startAdornment:(<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                                endAdornment: searchText ? (
                                  <InputAdornment position="end">
                                    <IconButton size="small" onClick={clearSearch}><ClearIcon /></IconButton>
                                  </InputAdornment>
                                ) : null,
                                style:{ background:"#fff", borderRadius:8 },
                              }}
                              sx={{ mb:2 }}
                            />
                            {searchLoading ? (
                              <div className={styles.dialogLoading}><CircularProgress color="primary" /><div>กำลังค้นหา...</div></div>
                            ) : searchResults.length === 0 ? (
                              <div className={styles.dialogEmpty}><DescriptionIcon sx={{ fontSize:48, mb:1 }} color="disabled" />ไม่พบรายการเลขที่อ้างอิง</div>
                            ) : (
                              <List sx={{ maxHeight:320, overflow:"auto" }}>
                                {searchResults.map((item)=>(
                                  <ListItem key={item.id} disablePadding>
                                    <ListItemButton onClick={()=>pickRef(item)}>
                                      <DescriptionIcon color="info" sx={{ mr:1 }} />
                                      <span style={{ fontWeight:500 }}>{item.complaint_type} - {item.complaint_number}</span>
                                    </ListItemButton>
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </DialogContent>
                          <DialogActions sx={{ px:3, pb:2 }}>
                            <Button onClick={()=>setOpenSearchDialog(false)} variant="outlined" color="inherit">ปิด</Button>
                          </DialogActions>
                        </Dialog>
                      </div>

                      <div className={styles.fieldWithLabelDate}>
                        <label className={styles.label}>วันที่</label>
                        <div className={styles.datePickerWrapper}>
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
                        <div className={styles.datePickerWrapper}>
                          <ControlledDateThaiPickerService name="additionalReferenceDate2" control={step3Methods.control} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>{/* sectionContent */}
            </div>{/* formSection */}
          </div>
        </div>
      </FormProvider>

      {/* ============== Section 5 ============== */}
      <FormProvider {...step4Methods}>
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์ <span className={styles.required}>*</span></h3>
          </div>

          <div className={styles.sectionContent}>
            {/* ใช้ fieldRowTwo = 2 คอลัมน์ */}
            <div className={styles.fieldRowTwo}>
              <div className={styles.fieldGroupDate}>
                <div className={styles.datePickerWrapper}>
                  <ControlledDateThaiPickerService
                    label="วันที่รับเรื่องของเจ้าพนักงาน"
                    name="officerReceivedDate" control={step4Methods.control} time
                  />
                </div>
              </div>
              <div className={styles.fieldGroupDate}>
                <div className={styles.datePickerWrapper}>
                  <ControlledDateThaiPickerService
                    label="วันที่เสนองาน ผอ.สรร."
                    name="directorSubmittedDate" control={step4Methods.control} placeholder="กรุณาเลือกวันที่" time
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <div className={styles.datePickerWrapper}>
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
                rows={8} disabled
                className={`${styles.inputControl} ${styles.textAreaControl} ${styles.disabledTextarea}`}
                {...step3Methods.register("description")}
              />
            </div>

            <div className={styles.attachmentSection}>
              <h4>เอกสารประกอบการร้องเรียน</h4>
              <div className={styles.attachmentList}>
                {defaultData?.step3?.general?.attachment?.length > 0 ? (
                  defaultData.step3.general.attachment.map((file, i) => {
                    const sizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
                    const formatDate = (iso) => {
                      const d = new Date(iso);
                      const dd = String(d.getDate()).padStart(2, "0");
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const yy = String(d.getFullYear() + 543).slice(-2);
                      return `${dd}/${mm}/${yy}`;
                    };
                    const base = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL?.replace(/\/$/, "") || "";
                    const url = file.fileUrl?.startsWith("http") ? file.fileUrl : `${base}/${(file.fileUrl || "").replace(/^\//, "")}`;
                    return (
                      <div key={file.id || i} className={styles.attachmentItem}>
                        <span className={styles.pdfIcon}>📄</span>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {file.fileName} {sizeMB} MB ({formatDate(file.created_at)})
                        </a>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.attachmentItem}><span className={styles.pdfIcon}>📄</span>ไม่มีเอกสารประกอบ</div>
                )}
              </div>
              <p className={styles.attachmentNote}>หมายเหตุ : หลักฐาน เช่น สำเนาสัญญา ภาพถ่าย หรือ หมายศาล</p>
            </div>
          </div>
        </div>
      </FormProvider>

      {/* ปุ่ม (เปิดใช้ถ้าต้องการ)
      <div className={styles.actionButtons}>
        <ButtonService label="ล้าง" color="ล้าง" variant="outlined" onClick={handleReset} />
        <ButtonService label="บันทึก" color="ยืนยัน" variant="contained" onClick={handleSubmit} />
      </div> */}
    </div>
  );
}
