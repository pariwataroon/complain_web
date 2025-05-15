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
  const StepComponent = processComponents[activeStep];
  const pdfRef = useRef();

  const {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  } = useComplaintForm();


  const validateStep = async () => {
    const stepKey = `step${activeStep + 1}`;
    const data = getStepTabData(stepKey, "general");

    // STEP 1: ข้อมูลผู้ร้องทุกข์
    if (activeStep === 0) {
      const isIndividual = !!data?.general?.idCard;

      if (isIndividual) {
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
        for (const field of generalFields) {
          const value = data?.general?.[field.key];
          if (!value || (typeof value === "object" && !value.value)) {
            await alertError("ข้อมูลไม่ครบ", `กรุณากรอก ${field.label}`);
            return false;
          }
        }

        // !! รอถามคณะกรรมการว่าบังคับส่งไหม
        // const delegateFields = [
        //   { key: "name", label: "ชื่อผู้รับมอบอำนาจ" },
        //   { key: "phone", label: "เบอร์โทรผู้รับมอบอำนาจ" },
        // ];
        // for (const field of delegateFields) {
        //   const value = data?.delegate?.[field.key];
        //   if (!value) {
        //     await alertError("ข้อมูลไม่ครบ", `กรุณากรอก ${field.label}`);
        //     return false;
        //   }
        // }

      } else {
        const corpFields = [
          { key: "name", label: "ชื่อองค์กร" },
          { key: "address", label: "ที่อยู่" },
          { key: "phone", label: "หมายเลขโทรศัพท์" },
          { key: "email", label: "อีเมล" },
        ];
        for (const field of corpFields) {
          const value = data?.corporate?.[field.key];
          if (!value) {
            await alertError("ข้อมูลไม่ครบ", `กรุณากรอก ${field.label} ของนิติบุคคล`);
            return false;
          }
        }
        
        // !! รอถามคณะกรรมการว่าบังคับส่งไหม
        // const signerFields = [
        //   { key: "name", label: "ชื่อผู้มีอำนาจลงนาม" },
        //   { key: "phone", label: "เบอร์โทรผู้มีอำนาจลงนาม" },
        // ];
        // for (const field of signerFields) {
        //   const value = data?.signer?.[field.key];
        //   if (!value) {
        //     await alertError("ข้อมูลไม่ครบ", `กรุณากรอก ${field.label} ของผู้มีอำนาจลงนาม`);
        //     return false;
        //   }
        // }
      }
    }

    // STEP 2: ข้อมูลผู้ถูกร้องทุกข์
    if (activeStep === 1) {
      const activeType = data?.activeType;
      if (!activeType) {
        await alertError("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทผู้ถูกร้องทุกข์");
        return false;
      }

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
      for (let field of requiredFields) {
        const value = current[field.key];
        if (!value || (typeof value === "object" && !value.value)) {
          await alertError("ข้อมูลไม่ครบ", `กรุณากรอก ${field.label}`);
          return false;
        }
      }
    }

    // STEP 3: รายละเอียดเรื่องร้องทุกข์ (หากคุณใช้ Tab3)
    if (activeStep === 2) {
      const detail = data || {};
      if (!detail.subject || !detail.description) {
        await alertError("ข้อมูลไม่ครบ", "กรุณากรอกหัวข้อเรื่อง และรายละเอียดเรื่องร้องทุกข์");
        return false;
      }
    }

    return true;
  };




  const handleNext = async () => {
    const currentStepKey = `step${activeStep + 1}`;
    const currentTabData = getStepTabData(currentStepKey, "general");
    const isValid = await validateStep();
    if (!isValid) return;

    // console.log(`📦 Data in ${currentStepKey}:`, currentTabData);

    setActiveStep((prev) => Math.min(prev + 1, processComponents.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    await handleSubmitForm();
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
                  setActiveStep={setActiveStep}
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
                    <ButtonService
                      label="ส่งออก"
                      color="ส่งออก"
                      variant="outlined"
                      onClick={() => exportElementToPDF(pdfRef, "แบบฟอร์มร้องทุกข์.pdf")}
                      iconRight={<UploadOutlinedIcon />}
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
                        onClick={
                          () => {
                            if (activeStep === 3) {
                              if (!acceptSubmit) {
                                alertError("ไม่สามารถส่งได้", "กรุณายอมรับเงื่อนไขก่อนส่งเรื่องร้องทุกข์");
                                return;
                              }
                              handleNext();
                            } else {
                              handleNext();
                            }
                          }
                        }
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
