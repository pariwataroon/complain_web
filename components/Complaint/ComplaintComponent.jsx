import React, { useState, useRef } from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import { Container, Box } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import ButtonService from "@services/ButtonService/ButtonService";
import StepperComponent from "./StepperComponent";
import Tab1 from "./Tabs/tab1";
import Tab2 from "./Tabs/tab2";
import Tab3 from "./Tabs/tab3";
import Tab4 from "./Tabs/tab4";
import Tab5 from "./Tabs/tab5";
import useComplaintForm from "@hooks/user/complaint/useComplaintForm";
import { exportElementToPDF } from "@utils/exportPDF";
import { alertError } from "@utils/Alerts";

const processComponents = [Tab1, Tab2, Tab3, Tab4, Tab5];
const stepLabels = ["ข้อมูลผู้ร้องทุกข์", "ข้อมูลผู้ถูกร้องทุกข์", "รายละเอียดเรื่องร้องทุกข์"];

export default function ComplaintComponent() {
  const [activeStep, setActiveStep] = useState(0);
  const [acceptSubmit, setAcceptSubmit] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [shouldShowValidation, setShouldShowValidation] = useState(false);

  const [tabStates, setTabStates] = useState({
    step1: 0, 
    step2: 0, 
  });

  const StepComponent = processComponents[activeStep];
  const pdfRef = useRef();

  const {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  } = useComplaintForm();

  const hasValue = (value) => {
    if (!value) return false;
    if (typeof value === "object" && (!value.value)) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  };

  const validateCurrentStep = () => {
    const stepKey = `step${activeStep + 1}`;
    const data = getStepTabData(stepKey, "general");
    const errors = {};

    // STEP 1: ข้อมูลผู้ร้องทุกข์
    if (activeStep === 0) {
      const currentTab = tabStates.step1;

      if (currentTab === 0) {
        // console.log("Validating บุคคลทั่วไป - general fields");

        const generalFields = [
          { key: "idCard", label: "เลขบัตรประชาชน" },
          { key: "name", label: "ชื่อ - นามสกุล" },
          { key: "address", label: "ที่อยู่" },
          { key: "phone", label: "หมายเลขโทรศัพท์" },
          { key: "province", label: "จังหวัด" },
          { key: "districts", label: "อำเภอ/เขต" },
          { key: "subdistricts", label: "ตำบล/แขวง" },
          { key: "zipcode", label: "รหัสไปรษณีย์" },
          { key: "email", label: "อีเมล" },
        ];

        // ตรวจสอบ general (required)
        generalFields.forEach(field => {
          const value = data?.general?.[field.key];
          if (!hasValue(value)) {
            errors[`general.${field.key}`] = `กรุณากรอก ${field.label} ของผู้ร้องทุกข์`;
          }
        });

        // delegate เป็น optional ไม่ต้องตรวจสอบ

      } else if (currentTab === 1) {
        // console.log("Validating นิติบุคคล - corporate fields");

        const corpFields = [
          { key: "idCard", label: "เลขบัตรประจำตัวประชาชน/เลขทะเบียนนิติบุคคล" },
          { key: "name", label: "ชื่อองค์กร/บริษัท" },
          { key: "address", label: "ที่อยู่องค์กร" },
          { key: "phone", label: "หมายเลขโทรศัพท์" },
          { key: "province", label: "จังหวัด" },
          { key: "districts", label: "อำเภอ/เขต" },
          { key: "subdistricts", label: "ตำบล/แขวง" },
          { key: "zipcode", label: "รหัสไปรษณีย์" },
          { key: "email", label: "อีเมล" },
        ];

        corpFields.forEach(field => {
          const value = data?.corporate?.[field.key];
          if (!hasValue(value)) {
            errors[`corporate.${field.key}`] = `กรุณากรอก ${field.label} ของนิติบุคคล`;
          }
        });

      }
    }

    // STEP 2: ข้อมูลผู้ถูกร้องทุกข์ (เหมือนเดิม)
    if (activeStep === 1) {
      const currentTab = tabStates.step2;
      const typeMap = ["individual", "corporate", "government"];
      const activeType = typeMap[currentTab];

      if (!activeType) {
        errors.activeType = "กรุณาเลือกประเภทผู้ถูกร้องทุกข์";
      } else {
        const current = data[activeType] || {};
        const requiredFieldsMap = {
          individual: [
            { key: "idCard", label: "เลขบัตรประชาชน" },
            { key: "name", label: "ชื่อ - นามสกุล" },
            { key: "address", label: "ที่อยู่" },
            { key: "phone", label: "หมายเลขโทรศัพท์" },
            { key: "province", label: "จังหวัด" },
            { key: "districts", label: "อำเภอ/เขต" },
            { key: "subdistricts", label: "ตำบล/แขวง" },
            { key: "zipcode", label: "รหัสไปรษณีย์" },
            { key: "email", label: "อีเมล" },
          ],
          corporate: [
            { key: "companyName", label: "ชื่อบริษัท" },
            { key: "signatoryName", label: "ชื่อผู้มีอำนาจลงนาม" },
            { key: "address", label: "ที่อยู่บริษัท" },
            { key: "phone", label: "หมายเลขโทรศัพท์" },
            { key: "province", label: "จังหวัด" },
            { key: "districts", label: "อำเภอ/เขต" },
            { key: "subdistricts", label: "ตำบล/แขวง" },
            { key: "zipcode", label: "รหัสไปรษณีย์" },
            { key: "email", label: "อีเมล" },
          ],
          government: [
            { key: "idCard", label: "เลขบัตรประชาชน" },
            { key: "agencyName", label: "หน่วยงาน" },
            { key: "fullName", label: "ชื่อ - นามสกุล" },
            { key: "address", label: "ที่อยู่ที่สามารถติดต่อได้" },
            { key: "phone", label: "หมายเลขโทรศัพท์" },
            { key: "province", label: "จังหวัด" },
            { key: "districts", label: "อำเภอ/เขต" },
            { key: "subdistricts", label: "ตำบล/แขวง" },
            { key: "zipcode", label: "รหัสไปรษณีย์" },
            { key: "email", label: "อีเมล" },
          ],
        };

        const requiredFields = requiredFieldsMap[activeType] || [];
        requiredFields.forEach(field => {
          const value = current[field.key];
          if (!hasValue(value)) {
            errors[`${activeType}.${field.key}`] = `กรุณากรอก ${field.label}`;
          }
        });
      }
    }

    // STEP 3: รายละเอียดเรื่องร้องทุกข์ (เหมือนเดิม)
    if (activeStep === 2) {
      const detail = data || {};
      if (!hasValue(detail.subject)) {
        errors.subject = "กรุณากรอกหัวข้อเรื่อง";
      }
      if (!hasValue(detail.description)) {
        errors.description = "กรุณากรอกรายละเอียดเรื่องร้องทุกข์";
      }
    }

    // console.log("Validation errors:", errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate step for submit (with alert)
  const validateStepForSubmit = async () => {
    setShouldShowValidation(true);
    const isValid = validateCurrentStep();

    if (!isValid) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        await alertError("ข้อมูลไม่ครบ", firstError);
      }
      return false;
    }

    return true;
  };

  // Update validation when data changes
  React.useEffect(() => {
    if (shouldShowValidation) {
      validateCurrentStep();
    }
  }, [formData, activeStep, shouldShowValidation, tabStates]);

  const handleNext = async () => {
    const isValid = await validateStepForSubmit();
    if (!isValid) return;

    setActiveStep((prev) => Math.min(prev + 1, processComponents.length - 1));
    setShouldShowValidation(false);
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    setShouldShowValidation(false);
  };

  const handleSubmit = async () => {
    await handleSubmitForm();
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
      setShouldShowValidation(false);
    }
  };

  // Function to handle tab change from child components
  const handleTabChange = (stepKey, tabIndex) => {
    setTabStates(prev => ({
      ...prev,
      [stepKey]: tabIndex
    }));
  };

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
                <div ref={pdfRef}>
                  <Tab5
                    stepKey={`step${activeStep + 1}`}
                    tabData={getStepTabData(`step${activeStep + 1}`, "general")}
                    updateStepData={updateStepData}
                    onAccepted={setAcceptSubmit}
                    formData={getFormData()}
                  />
                </div>
              ) : (
                <StepComponent
                  stepKey={`step${activeStep + 1}`}
                  tabData={getStepTabData(`step${activeStep + 1}`, "general")}
                  updateStepData={updateStepData}
                  onAccepted={setAcceptSubmit}
                  formData={getFormData()}
                  validationErrors={validationErrors}
                  shouldShowValidation={shouldShowValidation}
                  onTabChange={handleTabChange}
                  currentTab={tabStates[`step${activeStep + 1}`] || 0}
                />
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
                        onClick={handleBack}
                      />
                    )}
                    <ButtonService
                      label={
                        activeStep === 3
                          ? "ส่งเรื่องร้องทุกข์"
                          : "ถัดไป"
                      }
                      color="ถัดไป"
                      variant="contained"
                      onClick={() => {
                        if (activeStep === 3) {
                          if (!acceptSubmit) {
                            alertError("ไม่สามารถส่งได้", "กรุณายอมรับเงื่อนไขก่อนส่งเรื่องร้องทุกข์");
                            return;
                          }
                          handleNext();
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