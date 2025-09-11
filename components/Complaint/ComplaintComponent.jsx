import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import { Container, Box } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ButtonService from "@services/ButtonService/ButtonService";
import StepperComponent from "./StepperComponent";
import Tab1 from "./Tabs/tab1";
import Tab2 from "./Tabs/tab2";
import Tab3 from "./Tabs/tab3";
import Tab4 from "./Tabs/tab4";
import Tab5 from "./Tabs/tab5";
import useComplaintForm from "@hooks/user/complaint/useComplaintForm";
import { alertError } from "@utils/Alerts";
import { validateEmail } from "@utils/emailValidation";

const processComponents = [Tab1, Tab2, Tab3, Tab4, Tab5];
const stepLabels = [
  "ข้อมูลผู้ร้องทุกข์",
  "ข้อมูลผู้ถูกร้องทุกข์",
  "รายละเอียดเรื่องร้องทุกข์",
];

export default function ComplaintComponent() {
  // ===== CIRCUIT BREAKER: ป้องกัน Infinite Loop =====
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  renderCountRef.current++;
  const currentTime = Date.now();
  
  // ถ้า render เกิน 50 ครั้งภายใน 5 วินาที = หยุดทันที
  if (currentTime - lastRenderTimeRef.current < 5000) {
    if (renderCountRef.current > 50) {
      console.error("🛑 CIRCUIT BREAKER ACTIVATED: Too many renders detected!");
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h2>⚠️ ระบบหยุดชั่วคราว</h2>
          <p>ตรวจพบการทำงานผิดปกติ กรุณารีเฟรชหน้าเว็บ</p>
          <button onClick={() => window.location.reload()}>รีเฟรชหน้า</button>
        </div>
      );
    }
  } else {
    // รีเซ็ตตัวนับทุก 5 วินาที
    renderCountRef.current = 1;
    lastRenderTimeRef.current = currentTime;
  }

  const [activeStep, setActiveStep] = useState(0);
  const [acceptSubmit, setAcceptSubmit] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [shouldShowValidation, setShouldShowValidation] = useState(false);

  const [tabStates, setTabStates] = useState({
    step1: 0,
    step2: 0,
  });

  const {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  } = useComplaintForm();

  const stepKey = `step${activeStep + 1}`;

  // ===== Memoize Step Data to Prevent Unnecessary Re-renders =====
  // This is the core fix for the infinite loop.
  // We ensure the `tabData` object reference only changes when the actual data changes.
  // 🛑 TEMPORARILY DISABLED FOR DEBUGGING
  const memoizedStepData = getStepTabData(stepKey, "general"); // ปิด useMemo ชั่วคราว

  const hasValue = useCallback((value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return false;
      }

      const validFiles = value.filter((file) => {
        const isFile = file instanceof File;
        const isValidObject =
          file &&
          typeof file === "object" &&
          (file.name || file.size) &&
          Object.keys(file).length > 1;

        return isFile || isValidObject;
      });

      const result = validFiles.length > 0;

      return result;
    }

    // **เพิ่ม: Single File object check**
    if (value instanceof File) {
      return true;
    }

    if (typeof value === "string") {
      const result = value.trim() !== "";
      return result;
    }

    if (typeof value === "object") {
      // **ตรวจสอบ File-like object**
      if (value.name || value.size) {
        const result = Object.keys(value).length > 1;
        return result;
      }

      const result = Object.keys(value).length > 0;
      return result;
    }

    const result = !!value;
    return result;
  }, []);

  // ===== ตรวจ role admin จาก cookie (รูปแบบเดียวกับ tab1) =====
  const [userRoles, setUserRoles] = useState([]);
  useEffect(() => {
    try {
      const cookies = document.cookie.split(";").reduce((acc, c) => {
        const [k, v] = c.trim().split("=");
        if (k && v) acc[k] = v;
        return acc;
      }, {});
      if (cookies.info) {
        const parsed = JSON.parse(decodeURIComponent(cookies.info));
        let roles = [];
        if (typeof parsed.roles === "string") roles = JSON.parse(parsed.roles);
        else if (Array.isArray(parsed.roles)) roles = parsed.roles;
        setUserRoles(roles);
      }
    } catch (e) {
      console.warn("parse roles failed", e);
    }
  }, []);
  const isAdmin = useMemo(() => userRoles.includes("admin"), [userRoles]);

  const validateCurrentStep = () => {
    const stepKey = `step${activeStep + 1}`;

    let data;
    if (activeStep === 2) {
      data = formData?.[stepKey]?.general || {};
    } else {
      const stepData = getStepTabData(stepKey, "general");
      data = {
        ...stepData,
        ...formData?.[stepKey]?.general
      };
    }

    const errors = {};

    if (isAdmin) {
      // ข้าม validation ทั้งหมดถ้าเป็น admin
      return { errors: {}, isValid: true };
    }

    // STEP 1: ข้อมูลผู้ร้องทุกข์
    if (activeStep === 0) {
      const currentTab = tabStates.step1 || 0;

      if (currentTab === 0) {
        // const idCardValue = data?.general?.idCard;
        // if (!hasValue(idCardValue)) {
        //   errors[`general.idCard`] = "กรุณากรอก เลขบัตรประชาชน ของผู้ร้องทุกข์";
        // } else if (idCardValue.length !== 13) {
        //   errors[`general.idCard`] =
        //     "กรุณากรอกเลขบัตรประจำตัวประชาชนให้ครบ 13 หลัก ของผู้ร้องทุกข์";
        // } else if (!/^\d{13}$/.test(idCardValue)) {
        //   errors[`general.idCard`] =
        //     "เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น ของผู้ร้องทุกข์";
        // }

        const generalFields = [
          // { key: "name", label: "ชื่อ - นามสกุล" },
          // { key: "address", label: "ที่อยู่" },
          // { key: "phone", label: "หมายเลขโทรศัพท์" },
          { key: "province", label: "จังหวัด" },
          { key: "districts", label: "อำเภอ/เขต" },
          { key: "subdistricts", label: "ตำบล/แขวง" },
          { key: "zipcode", label: "รหัสไปรษณีย์" },
          // { key: "email", label: "อีเมล" },
        ];

        generalFields.forEach((field) => {
          const value = data?.general?.[field.key];
          if (!hasValue(value)) {
            errors[
              `general.${field.key}`
            ] = `กรุณากรอก ${field.label} ของผู้ร้องทุกข์`;
          }
        });

        const emailValue = data?.general?.email;
        if (emailValue) {
          const emailErrors = validateEmail(emailValue);
          if (emailErrors.length > 0) {
            // errors[`general.email`] = emailErrors[0];
          }
        } else {
          // errors[`general.email`] = "กรุณากรอกอีเมล ของผู้ร้องทุกข์";
        }
      } else if (currentTab === 1) {
        const corpIdCardValue = data?.corporate?.idCard;
        if (!hasValue(corpIdCardValue)) {
          errors[`corporate.idCard`] =
            "กรุณากรอก เลขบัตรประชาชน/เลขทะเบียนนิติบุคคล ของนิติบุคคล";
        } else if (corpIdCardValue.length !== 13) {
          errors[`corporate.idCard`] =
            "กรุณากรอกเลขบัตรประจำตัวประชาชน/เลขทะเบียนนิติบุคคลให้ครบ 13 หลัก ของนิติบุคคล";
        } else if (!/^\d{13}$/.test(corpIdCardValue)) {
          errors[`corporate.idCard`] =
            "เลขบัตรประจำตัวประชาชน/เลขทะเบียนนิติบุคคลต้องเป็นตัวเลขเท่านั้น ของนิติบุคคล";
        }

        const corpFields = [
          { key: "name", label: "ชื่อ - นามสกุล" },
          { key: "address", label: "ที่อยู่ที่สามารถติดต่อได้" },
          { key: "phone", label: "หมายเลขโทรศัพท์" },
          { key: "province", label: "จังหวัด" },
          { key: "districts", label: "อำเภอ/เขต" },
          { key: "subdistricts", label: "ตำบล/แขวง" },
          { key: "zipcode", label: "รหัสไปรษณีย์" },
          { key: "email", label: "อีเมล" },
        ];

        corpFields.forEach((field) => {
          const value = data?.corporate?.[field.key];
          if (!hasValue(value)) {
            errors[
              `corporate.${field.key}`
            ] = `กรุณากรอก ${field.label} ของนิติบุคคล`;
          }
        });

        const emailValue = data?.corporate?.email;
        if (emailValue) {
          const emailErrors = validateEmail(emailValue);
          if (emailErrors.length > 0) {
            errors[`corporate.email`] = emailErrors[0];
          }
        } else {
          errors[`corporate.email`] = "กรุณากรอกอีเมล ของนิติบุคคล";
        }
      }
    }

    // STEP 2: ข้อมูลผู้ถูกร้องทุกข์
    // if (activeStep === 1) {
    //   const currentTab = tabStates.step2;
    //   const typeMap = ["individual", "corporate", "government"];
    //   const activeType = typeMap[currentTab];

    //   if (!activeType) {
    //     errors.activeType = "กรุณาเลือกประเภทผู้ถูกร้องทุกข์";
    //   } else {
    //     const current = data[activeType] || {};

    //     const requiredFieldsMap = {
    //       individual: [
    //         { key: "idCard", label: "เลขบัตรประชาชน" },
    //         { key: "name", label: "ชื่อ - นามสกุล" },
    //         { key: "address", label: "ที่อยู่" },
    //         { key: "phone", label: "หมายเลขโทรศัพท์" },
    //         { key: "province", label: "จังหวัด" },
    //         { key: "districts", label: "อำเภอ/เขต" },
    //         { key: "subdistricts", label: "ตำบล/แขวง" },
    //         { key: "zipcode", label: "รหัสไปรษณีย์" },
    //         { key: "email", label: "อีเมล" },
    //       ],
    //       corporate: [
    //         { key: "idCard", label: "เลขทะเบียนนิติบุคคล" },
    //         { key: "companyName", label: "ชื่อบริษัท" },
    //         { key: "signatoryName", label: "ชื่อผู้มีอำนาจลงนาม" },
    //         { key: "address", label: "ที่อยู่บริษัท" },
    //         { key: "phone", label: "หมายเลขโทรศัพท์" },
    //         { key: "province", label: "จังหวัด" },
    //         { key: "districts", label: "อำเภอ/เขต" },
    //         { key: "subdistricts", label: "ตำบล/แขวง" },
    //         { key: "zipcode", label: "รหัสไปรษณีย์" },
    //         { key: "email", label: "อีเมล" },
    //       ],
    //       government: [
    //         { key: "idCard", label: "เลขบัตรประชาชน" },
    //         { key: "agencyName", label: "หน่วยงาน" },
    //         { key: "fullName", label: "ชื่อ - นามสกุล" },
    //         { key: "address", label: "ที่อยู่ที่สามารถติดต่อได้" },
    //         { key: "phone", label: "หมายเลขโทรศัพท์" },
    //         { key: "province", label: "จังหวัด" },
    //         { key: "districts", label: "อำเภอ/เขต" },
    //         { key: "subdistricts", label: "ตำบล/แขวง" },
    //         { key: "zipcode", label: "รหัสไปรษณีย์" },
    //         { key: "email", label: "อีเมล" },
    //       ],
    //     };

    //     const requiredFields = requiredFieldsMap[activeType] || [];

    //     requiredFields.forEach(field => {
    //       const value = current[field.key];

    //       if (field.key === 'idCard') {
    //         if (!hasValue(value)) {
    //           errors[`${activeType}.${field.key}`] = `กรุณากรอก ${field.label}`;
    //         } else if (typeof value === 'string' && value.length !== 13) {
    //           errors[`${activeType}.${field.key}`] = `กรุณากรอก${field.label}ให้ครบ 13 หลัก`;
    //         } else if (typeof value === 'string' && !/^\d{13}$/.test(value)) {
    //           errors[`${activeType}.${field.key}`] = `${field.label}ต้องเป็นตัวเลขเท่านั้น`;
    //         }
    //       } else {
    //         if (!hasValue(value)) {
    //           errors[`${activeType}.${field.key}`] = `กรุณากรอก ${field.label}`;
    //         }
    //       }
    //     });

    //     const emailValue = current.email;
    //     if (emailValue) {
    //       const emailErrors = validateEmail(emailValue);
    //       if (emailErrors.length > 0) {
    //         errors[`${activeType}.email`] = emailErrors[0];
    //       }
    //     } else {
    //       errors[`${activeType}.email`] = "กรุณากรอกอีเมล";
    //     }
    //   }
    // }

    // STEP 3: รายละเอียดเรื่องร้องทุกข์
    if (activeStep === 2) {
      if (!hasValue(data.subject)) {
        errors.subject = "กรุณากรอกชื่อเรื่อง";
      }

      if (!hasValue(data.description)) {
        errors.description = "กรุณากรอกรายละเอียดเหตุการณ์";
      }

      if (!hasValue(data.incidentDate)) {
        errors.incidentDate = "กรุณาเลือกวันและเวลาที่เกิดเหตุ";
      }

      if (!hasValue(data.complaintType)) {
        errors.complaintType = "กรุณาเลือกประเภทเรื่องราวร้องทุกข์";
      }
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
  };

  const validateStepForSubmit = useCallback(async () => {
    setShouldShowValidation(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    const { errors, isValid } = validateCurrentStep();
    setValidationErrors(errors);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        await alertError("ข้อมูลไม่ครบ", firstError);
      }
      return false;
    }

    return true;
  }, [activeStep, tabStates, formData, hasValue, isAdmin]);

  const handleNext = async () => {
    const isValid = await validateStepForSubmit();
    if (!isValid) return;

    setActiveStep((prev) => Math.min(prev + 1, processComponents.length - 1));
    setShouldShowValidation(false);
    setValidationErrors({});
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    setShouldShowValidation(false);
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    await handleSubmitForm();
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
      setShouldShowValidation(false);
      setValidationErrors({});
    }
  };

  const handleTabChange = (stepKey, tabIndex) => {
    setTabStates((prev) => ({
      ...prev,
      [stepKey]: tabIndex,
    }));
    if (shouldShowValidation) {
      setShouldShowValidation(false);
      setValidationErrors({});
    }
  };

  const StepComponent = processComponents[activeStep];

  return (
    <>
      <NavbarMain />
      <Box sx={{ backgroundColor: "#eaf5ff", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", gap: 4 }}>
            {activeStep >= 0 && activeStep < 3 && (
              <Box sx={{ width: 200 }}>
                <StepperComponent
                  steps={stepLabels}
                  activeStep={activeStep}
                  setActiveStep={handleStepClick}
                />
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              {activeStep === 4 ? (
                <div>
                  <Tab5
                    stepKey={`step${activeStep + 1}`}
                    tabData={getStepTabData(`step${activeStep + 1}`, "general")}
                    updateStepData={updateStepData}
                    onAccepted={setAcceptSubmit}
                    formData={formData}
                    currentTab1={tabStates.step1}
                    currentTab2={tabStates.step2}
                  />
                </div>
              ) : activeStep === 2 ? (
                // � STEP 3 DEBUG MODE: ทดสอบ Tab3 แต่ปิด sub-components
                <Tab3
                  stepKey={`step${activeStep + 1}`}
                  tabData={memoizedStepData}
                  updateStepData={updateStepData}
                  validationErrors={validationErrors}
                  shouldShowValidation={shouldShowValidation}
                />
              ) : (
                StepComponent && (
                  <StepComponent
                    stepKey={`step${activeStep + 1}`}
                    tabData={memoizedStepData}
                    updateStepData={updateStepData}
                    onAccepted={setAcceptSubmit}
                    formData={formData}
                    validationErrors={validationErrors}
                    shouldShowValidation={shouldShowValidation}
                    onTabChange={handleTabChange}
                    currentTab={tabStates[`step${activeStep + 1}`] || 0}
                  />
                )
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  gap: 2,
                }}
              >
                {activeStep === 4 ? (
                  <>
                    <ButtonService
                      label="แก้ไข"
                      color="แก้ไข"
                      variant="outlined"
                      onClick={handleBack}
                      iconLeft={<EditOutlinedIcon />}
                    />
                    <ButtonService
                      label="ยืนยัน"
                      color="ยืนยัน"
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!acceptSubmit}
                      iconRight={<CheckIcon />}
                    />
                  </>
                ) : (
                  <>
                    {activeStep > 0 && (
                      <ButtonService
                        label="ย้อนกลับ"
                        color="ย้อนกลับ"
                        variant="contained"
                        onClick={handleBack}
                      />
                    )}
                    <ButtonService
                      label={activeStep === 3 ? "ส่งเรื่องร้องทุกข์" : "ถัดไป"}
                      color="ถัดไป"
                      variant="contained"
                      onClick={() => {
                        if (activeStep === 3) {
                          handleSubmit();
                        } else {
                          handleNext();
                        }
                      }}
                      disabled={activeStep === 3 && !acceptSubmit}
                    />
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
