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
import Tab31 from "./Tabs/tab3-1";
import useComplaintForm from "@hooks/user/complaint/useComplaintForm";
import { alertError } from "@utils/Alerts";
import { validateEmail } from "@utils/emailValidation";

const processComponents = [Tab1, Tab2, Tab3, Tab4, Tab5];
const stepLabels = ["ข้อมูลผู้ร้องทุกข์", "ข้อมูลผู้ถูกร้องทุกข์", "รายละเอียดเรื่องร้องทุกข์"];

const STEP2_TYPE_MAP = ["individual", "corporate", "government"];

export default function ComplaintComponent() {
  // Circuit breaker
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  renderCountRef.current++;
  const currentTime = Date.now();
  if (currentTime - lastRenderTimeRef.current < 5000) {
    if (renderCountRef.current > 50) {
      console.error("🛑 CIRCUIT BREAKER ACTIVATED: Too many renders detected!");
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
          <h2>⚠️ ระบบหยุดชั่วคราว</h2>
          <p>ตรวจพบการทำงานผิดปกติ กรุณารีเฟรชหน้าเว็บ</p>
          <button onClick={() => window.location.reload()}>รีเฟรชหน้า</button>
        </div>
      );
    }
  } else {
    renderCountRef.current = 1;
    lastRenderTimeRef.current = currentTime;
  }

  const [activeStep, setActiveStep] = useState(0);
  const [acceptSubmit, setAcceptSubmit] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [shouldShowValidation, setShouldShowValidation] = useState(false);

  const [tabStates, setTabStates] = useState({ step1: 0, step2: 0 });
  const [subPage, setSubPage] = useState(null);
  const [skippedStep3Via31, setSkippedStep3Via31] = useState(false);
  const tab31Ref = useRef(null);

  const { formData, updateStepData, getStepTabData, getFormData, handleSubmitForm } =
    useComplaintForm();

  const stepKey = `step${activeStep + 1}`;
  const memoizedStepData = getStepTabData(stepKey, "general");

  const stepperActive = useMemo(() => {
    if (activeStep === 1 && subPage === "tab3-1") return 2; 
    return activeStep;
  }, [activeStep, subPage]);

  const hasValue = useCallback((value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return false;
      const validFiles = value.filter((file) => {
        const isFile = file instanceof File;
        const isValidObject =
          file &&
          typeof file === "object" &&
          (file.name || file.size) &&
          Object.keys(file).length > 1;
        return isFile || isValidObject;
      });
      return validFiles.length > 0;
    }
    if (value instanceof File) return true;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "object" && value) {
      if (value.name || value.size) return Object.keys(value).length > 1;
      return Object.keys(value).length > 0;
    }
    return !!value;
  }, []);

  // ตรวจ role admin จาก cookie
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

  const step2ActiveType = useMemo(() => {
    const fromData =
      formData?.step2?.activeType ||
      formData?.step2?.general?.activeType ||
      formData?.step2?.type ||
      null;
    if (fromData) return String(fromData).toLowerCase();
    const idx = tabStates.step2 ?? 0;
    return STEP2_TYPE_MAP[idx] || "individual";
  }, [formData?.step2, tabStates.step2]);

  const validateCurrentStep = () => {
    const stepKey = `step${activeStep + 1}`;

    let data;
    if (activeStep === 2) {
      data = formData?.[stepKey]?.general || {};
    } else {
      const stepData = getStepTabData(stepKey, "general");
      data = {
        ...stepData,
        ...formData?.[stepKey]?.general,
      };
    }

    const errors = {};
    if (isAdmin) return { errors: {}, isValid: true };

    if (activeStep === 0) {
      const currentTab = tabStates.step1 || 0;
      if (currentTab === 0) {
        const generalFields = [
          { key: "province", label: "จังหวัด" },
          { key: "districts", label: "อำเภอ/เขต" },
          { key: "subdistricts", label: "ตำบล/แขวง" },
          { key: "zipcode", label: "รหัสไปรษณีย์" },
        ];
        generalFields.forEach((field) => {
          const value = data?.general?.[field.key];
          if (!hasValue(value)) {
            errors[`general.${field.key}`] = `กรุณากรอก ${field.label} ของผู้ร้องทุกข์`;
          }
        });

        const emailValue = data?.general?.email;
        if (emailValue) {
          const emailErrors = validateEmail(emailValue);
          if (emailErrors.length > 0) {
            errors[`general.email`] = emailErrors[0];
          }
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
            errors[`corporate.${field.key}`] = `กรุณากรอก ${field.label} ของนิติบุคคล`;
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

    if (activeStep === 2) {
      if (!hasValue(data.subject)) errors.subject = "กรุณากรอกชื่อเรื่อง";
      if (!hasValue(data.description)) errors.description = "กรุณากรอกรายละเอียดเหตุการณ์";
      if (!hasValue(data.incidentDate)) errors.incidentDate = "กรุณาเลือกวันและเวลาที่เกิดเหตุ";
      if (!hasValue(data.complaintType))
        errors.complaintType = "กรุณาเลือกประเภทเรื่องราวร้องทุกข์";
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
  };

  const validateStepForSubmit = useCallback(async () => {
    setShouldShowValidation(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const { errors, isValid } = validateCurrentStep();
    setValidationErrors(errors);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      if (firstError) await alertError("ข้อมูลไม่ครบ", firstError);
      return false;
    }
    return true;
  }, [activeStep, tabStates, formData, hasValue, isAdmin]);

  // เปลี่ยนเงื่อนไขไป Tab3-1 เมื่อ Step2 = government
  const handleNext = async () => {
    // เข้า Tab3-1 เมื่อ Step2 = government
    if (activeStep === 1 && step2ActiveType === "government" && subPage === null) {
      setSubPage("tab3-1");
      return;
    }

    // ออกจาก Tab3-1 -> ข้าม Tab3 ไป Tab4 เลย
    if (activeStep === 1 && subPage === "tab3-1") {
       if (tab31Ref.current) {        const ok = await tab31Ref.current.validateAndSave();
       if (!ok) return; // ถ้าไม่ผ่าน validation ก็หยุดอยู่หน้านี้
      }
      setSubPage(null);
      setSkippedStep3Via31(true);
      setActiveStep((prev) => Math.min(prev + 2, processComponents.length - 1));
      setShouldShowValidation(false);
      setValidationErrors({});
      return;
    }

    // ปกติ
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
    setTabStates((prev) => ({ ...prev, [stepKey]: tabIndex }));
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
                  activeStep={stepperActive}
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
                <Tab3
                  stepKey={`step${activeStep + 1}`}
                  tabData={memoizedStepData}
                  updateStepData={updateStepData}
                  validationErrors={validationErrors}
                  shouldShowValidation={shouldShowValidation}
                />
              ) : activeStep === 1 && subPage === "tab3-1" ? (
                <Tab31
                  ref={tab31Ref}
                  stepKey="step31"
                  tabData={getStepTabData("step31", "general")}
                  updateStepData={updateStepData}
                  formData={formData}
                  onNext={handleNext} // ส่งฟังก์ชัน handleNext ให้ Tab31
                  onBack={() => setSubPage(null)}
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

              <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
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
                        onClick={() => {
                          if (activeStep === 1 && subPage === "tab3-1") {
                            setSubPage(null);
                            return;
                          }
                          if (activeStep === 3 && skippedStep3Via31) {
                            setActiveStep(1);
                            setSubPage("tab3-1");
                            return;
                          }
                          handleBack();
                        }}
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