import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Box, Grid, Typography, Button, Stack } from "@mui/material";
import styles from "./TabNav.module.scss";
import { Add, InsertDriveFile, Close } from "@mui/icons-material";

const Tab3 = ({
  stepKey,
  tabData = {},
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false
}) => {
  
  console.log("🔍 Tab3 rendered with:", { stepKey, tabData });

  // 🎯 SAFE: ใช้ useCallback เพื่อป้องกัน re-render
  const handleChange = useCallback((fieldName, value) => {
    console.log(`Field ${fieldName} changed:`, value);

    updateStepData(stepKey, "general", (prevData) => ({
      ...prevData,
      [fieldName]: value
    }));
  }, [stepKey, updateStepData]);

  // State สำหรับไฟล์แนบ
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // Sync กับ tabData เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (tabData.attachment && Array.isArray(tabData.attachment)) {
      setAttachmentFiles(tabData.attachment);
    }
  }, [tabData.attachment]);

  // ฟังก์ชันสำหรับจัดการไฟล์อัพโหลด
  const handleFileUpload = useCallback((files) => {
    console.log("Files uploaded:", files);
    setAttachmentFiles(files);
    handleChange("attachment", files);
  }, [handleChange]);

  const COLOR_PRIMARY = "#1120A3";
  const COLOR_BORDER = COLOR_PRIMARY;
  const HEIGHT_INPUT = 46; 
  const FONT_SIZE_INPUT = 14;

  const baseInput = {
    width: "100%",
    height: HEIGHT_INPUT + "px",
    padding: "0 14px",
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: "12px", // มนขึ้น
    fontSize: FONT_SIZE_INPUT,
    fontFamily: "inherit",
    outline: "none",
    color: COLOR_PRIMARY,
    backgroundColor: "#fff",
    boxSizing: "border-box",
    transition: "border-color .15s, box-shadow .15s",
  };
  const inputStyle = {
    ...baseInput,
  };

  const disabledInput = {
    ...baseInput,
    backgroundColor: "#fff",
    color: "#4f5a6a",
    cursor: "not-allowed",
  };

  const selectStyle = {
    ...baseInput,
    cursor: "pointer",
  };

  const labelStyle = {
    color: COLOR_PRIMARY,
    fontWeight: 500,
    marginBottom: 4,
    display: "block",
    fontSize: 14,
    lineHeight: 1.2,
  };

  const requiredStyle = { color: "#f44336", marginLeft: 4 };

  const containerStyle = { marginBottom: 16 };

  const textareaStyle = {
    ...baseInput,
    padding: "10px 14px",
    height: "auto",
    minHeight: 140,
    lineHeight: 1.5,
    resize: "vertical",
    borderRadius: "12px", // มนขึ้น
  };
  const fileBarStyle = {
    position: "relative",
    width: "100%",
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 12, // มนขึ้น
    height: HEIGHT_INPUT + "px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: 10,
    background: "#fff",
    boxSizing: "border-box",
  };

  const fileLabelTextStyle = {
    color: "#4f5a6a",
    fontSize: FONT_SIZE_INPUT,
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const plusButtonStyle = {
    fontSize: 20,
    lineHeight: 1,
    color: COLOR_PRIMARY,
    fontWeight: 600,
    pointerEvents: "none",
    userSelect: "none",
    paddingRight: 4
  };

  const hiddenFileInputOverlay = {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
    width: "100%",
  };

  const noteStyle = { color: "#6c6f7a", fontSize: 12, marginTop: 6, lineHeight: 1.4 };

  const dateWrapper = { position: "relative" };
  const dateIconStyle = {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: "translateY(-50%)",
    fontSize: 16,
    color: COLOR_PRIMARY,
    pointerEvents: "none",
  };

  // ==== Custom Calendar (Thai) ====
  const thaiDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]; // abbreviations
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const [openCal, setOpenCal] = useState(false);
  // simplified calendar (no extra month/year panel toggle to mimic provided UI)
  const selectedDate = tabData.incidentDate ? new Date(tabData.incidentDate) : null;
  const initial = selectedDate || new Date();
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const calRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!calRef.current) return;
      if (!calRef.current.contains(e.target)) {
        setOpenCal(false);
      }
    };
    if (openCal) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openCal]);

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) arr.push(d);
    return arr;
  }, [viewMonth, viewYear]);

  const calContainerStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    background: '#fff',
    border: '1px solid #dfe4ec',
    borderRadius: 12, // มนขึ้น
    boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
    zIndex: 50,
    width: 340,
    padding: '10px 14px 14px 14px'
  };

  const calHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 };
  const navBtnStyle = { cursor: 'pointer', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', background:'#f3f5f9', color: COLOR_PRIMARY, fontSize: 16, userSelect: 'none', border:'1px solid #e2e8f0' };
  const monthLabelStyle = { fontWeight: 600, fontSize: 15, color: COLOR_PRIMARY };
  const weekdayRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, fontSize: 12, color: COLOR_PRIMARY, textAlign: 'center' };
  const weekdayCellStyle = { background:'#eef3f9', borderRadius:6, padding:'6px 0', fontWeight:600, letterSpacing:'0.5px' };
  const daysGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 };
  const dayCellBase = { height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', borderRadius: 8, color: COLOR_PRIMARY, transition:'all .12s', fontWeight:500 };
  const dayCellEmpty = { height: 34 };
  const todayBtnRow = { display: 'flex', gap: 10, marginTop: 14 };
  const todayBtnStyle = { flex: 1, height: 38, borderRadius: 8, fontSize: 13, cursor: 'pointer', border: `1px solid ${COLOR_PRIMARY}`, background: COLOR_PRIMARY, color: '#fff', fontWeight: 600, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' };
  const clearBtnStyle = { flex: 1, height: 38, borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid #d0d5dd', background: '#fff', color: COLOR_PRIMARY, fontWeight:600 };

  const selectedBg = '#F5A000';
  const hoverBg = '#FFF4DA';

  // Year options (ย้อนหลัง 10 ปี ถึงปีปัจจุบัน + ensure selected year in range)
  const generateYearOptions = () => { // (kept for potential future extension)
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current - 10; y <= current; y++) years.push(y);
    return years;
  };

  const formatDisplayDate = (dateObj) => {
    if (!dateObj) return '';
    const day = dateObj.getDate();
    const monthName = thaiMonths[dateObj.getMonth()];
    const buddhistYear = dateObj.getFullYear() + 543;
    return `${day} ${monthName} พ.ศ. ${buddhistYear}`;
  };
  const displayDateText = formatDisplayDate(selectedDate);
  const handleSelectDay = (d) => {
    if (!d) return;
    const dateObj = new Date(viewYear, viewMonth, d);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    handleChange('incidentDate', `${yyyy}-${mm}-${dd}`);
    setOpenCal(false);
  // no panel toggle
  };

  const handleToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    handleChange('incidentDate', `${yyyy}-${mm}-${dd}`);
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    setOpenCal(false);
  // no panel toggle
  };

  const handleClear = () => {
    handleChange('incidentDate', '');
    setOpenCal(false);
  // no panel toggle
  };

  return (
    <div className={styles.container} style={{background:'transparent', padding:0}}>
      <div className={styles.formContainer} style={{boxShadow:'0 4px 18px rgba(0,0,0,0.06)', border:'1px solid #eceff3', padding:'28px 32px'}}> 
          <Typography className={styles.title} sx={{mb: 2, fontSize: 16, fontWeight: 600, color: COLOR_PRIMARY, mt:0}}>
            รายละเอียดเรื่องราวร้องทุกข์
          </Typography>

          <Grid container spacing={3}>
            {/* ช่องทางร้องทุกข์ */}
            <Grid item xs={12} sm={6}>
              <div style={containerStyle}>
                <label style={labelStyle}>ช่องทางร้องทุกข์<span style={requiredStyle}>*</span></label>
                <input
                  type="text"
                  value="เว็บไซต์แจ้งเรื่องราวร้องทุกข์"
                  disabled
                  style={disabledInput}
                />
              </div>
            </Grid>

            {/* ประเภทเรื่องร้องทุกข์ */}
            <Grid item xs={12} sm={6}>
              <div style={containerStyle}>
                <label style={labelStyle}>ประเภทเรื่องร้องทุกข์<span style={requiredStyle}>*</span></label>
                <select 
                  value={tabData.complaintType || ""}
                  onChange={(e) => handleChange("complaintType", e.target.value)}
                  style={selectStyle}
                >
                  <option value="" disabled style={{ color: "#999" }}>เลือกประเภทเรื่องร้องทุกข์</option>
                  <option value="ร้องเรียน">ร้องเรียน</option>
                  <option value="ร้องทุกข์">ร้องทุกข์</option>
                  <option value="เสนอแนะ">เสนอแนะ</option>
                  <option value="แจ้งเบาะแส">แจ้งเบาะแส</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
            </Grid>

            {/* หัวข้อเรื่อง */}
            <Grid item xs={12}>
              <div style={containerStyle}>
                <label style={labelStyle}>ชื่อเรื่อง<span style={requiredStyle}>*</span></label>
                <input
                  type="text"
                  value={tabData.subject || ""}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder=""
                  style={inputStyle}
                />
              </div>
            </Grid>

            {/* วันที่เกิดเหตุ */}
            <Grid item xs={12}>
              <div style={containerStyle}>
                <label style={labelStyle}>วันและเวลาที่เกิดเหตุ<span style={requiredStyle}>*</span></label>
                <div style={dateWrapper}>
                  <div
                    style={{
                      ...inputStyle,
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      paddingRight: 34
                    }}
                    onClick={() => setOpenCal(o => !o)}
                  >
                    <span style={{ color: tabData.incidentDate ? COLOR_PRIMARY : '#999', fontSize: FONT_SIZE_INPUT }}>
                      {tabData.incidentDate ? displayDateText : 'กรุณาเลือกวันที่และเวลา.....'}
                    </span>
                    <span style={dateIconStyle}>🕒</span>
                  </div>
                  {openCal && (
                    <div ref={calRef} style={calContainerStyle}>
                      <div style={calHeaderStyle}>
                        <span style={navBtnStyle} onClick={(e)=>{e.stopPropagation(); setViewMonth(m=>{ if(m===0){ setViewYear(y=>y-1); return 11;} return m-1;});}}>‹</span>
                        <span style={monthLabelStyle}>{thaiMonths[viewMonth]} {viewYear + 543}</span>
                        <span style={navBtnStyle} onClick={(e)=>{e.stopPropagation(); setViewMonth(m=>{ if(m===11){ setViewYear(y=>y+1); return 0;} return m+1;});}}>›</span>
                      </div>
                      <div style={weekdayRowStyle}>
                        {thaiDays.map(d=> <div key={d} style={weekdayCellStyle}>{d}</div>)}
                      </div>
                      <div style={daysGridStyle}>
                        {daysInMonth.map((d,i)=>{
                          if(!d) return <div key={i} style={dayCellEmpty}/>;
                          const isSel = selectedDate && d===selectedDate.getDate() && viewMonth===selectedDate.getMonth() && viewYear===selectedDate.getFullYear();
                          return (
                            <div
                              key={i}
                              onClick={(e)=>{e.stopPropagation(); handleSelectDay(d);}}
                              style={{
                                ...dayCellBase,
                                background: isSel ? selectedBg : '#fff',
                                color: isSel ? '#fff' : COLOR_PRIMARY,
                                boxShadow: isSel ? '0 2px 4px rgba(0,0,0,0.15)' : 'none'
                              }}
                              onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background=hoverBg; }}
                              onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background='#fff'; }}
                            >{d}</div>
                          );
                        })}
                      </div>
                      <div style={todayBtnRow}>
                        <button type="button" style={todayBtnStyle} onClick={(e)=>{e.stopPropagation(); handleToday();}}>วันนี้</button>
                        <button type="button" style={clearBtnStyle} onClick={(e)=>{e.stopPropagation(); handleClear();}}>ล้าง</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Grid>

            {/* รายละเอียดเรื่องร้องทุกข์ */}
            <Grid item xs={12}>
              <div style={containerStyle}>
                <label style={labelStyle}>รายละเอียดเหตุการณ์<span style={requiredStyle}>*</span></label>
                <textarea
                  value={tabData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="กรุณากรอกรายละเอียดเหตุการณ์..."
                  rows={5}
                  style={textareaStyle}
                />
              </div>
            </Grid>

            {/* ไฟล์แนบ */}
            <Grid item xs={12}>
              <div style={containerStyle}>
                <label style={labelStyle}>เอกสารประกอบการร้องเรียน</label>

                {/* File Upload Button */}
                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 3);
                      setAttachmentFiles(files);
                      handleChange("attachment", files);
                    }}
                    style={{ display: 'none' }}
                    ref={(ref) => (window.fileInputRef = ref)}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => window.fileInputRef?.click()}
                    disabled={attachmentFiles.length >= 3}
                    sx={{
                      width: '100%',
                      height: '46px',
                      borderColor: COLOR_PRIMARY,
                      color: COLOR_PRIMARY,
                      borderRadius: '12px',
                      '&:hover': {
                        borderColor: COLOR_PRIMARY,
                        backgroundColor: `${COLOR_PRIMARY}10`
                      }
                    }}
                  >
                    {attachmentFiles.length >= 3
                      ? `อัปโหลดครบแล้ว ${attachmentFiles.length}/3 ไฟล์`
                      : `อัปโหลดไฟล์ประกอบ (${attachmentFiles.length}/3)`
                    }
                  </Button>
                </Box>

                {/* Display Selected Files */}
                {attachmentFiles.length > 0 && (
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {attachmentFiles.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#F6F8FF',
                          px: 2,
                          py: 1,
                          borderRadius: '8px',
                          color: COLOR_PRIMARY,
                        }}
                      >
                        <InsertDriveFile sx={{ fontSize: 20, mr: 1 }} />
                        <Typography
                          fontSize={14}
                          noWrap
                          sx={{ flex: 1 }}
                          title={file.name}
                        >
                          {file.name}
                        </Typography>
                        <Typography
                          fontSize={12}
                          sx={{ color: '#666', mr: 1 }}
                        >
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            const newFiles = attachmentFiles.filter((_, idx) => idx !== index);
                            setAttachmentFiles(newFiles);
                            handleChange("attachment", newFiles);
                          }}
                          sx={{
                            minWidth: 'auto',
                            color: '#ff5252',
                            p: 0.5
                          }}
                        >
                          <Close fontSize="small" />
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}

                <div style={noteStyle}>
                  หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB
                </div>
              </div>
            </Grid>
          </Grid>
      </div>
    </div>
  );
};

export default Tab3;
