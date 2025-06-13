import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { FormProvider, useForm } from "react-hook-form";
import { alertError, alertSuccess } from "@utils/Alerts";
import styles from "./TabNav.module.scss";

const breadcrumbItems = [
  {
    label: "รับเข้าข้อมูล",
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

const getComplainantTypeAndData = (data) => {
  if (data?.corporate) return { type: "corporate", data: data.corporate };
  if (data?.individual) return { type: "individual", data: data.individual };
  if (data?.idCard && data?.name) return { type: "individual", data };
  return { type: "unknown", data: data || {} };
};

const getDelegateTypeAndData = (data) => {
  if (data?.signer) return { type: "signer", data: data.signer };
  if (data?.delegate) return { type: "delegate", data: data.delegate };
  if (data?.idCard && (data?.name || data?.signatoryName)) return { type: "delegate", data };
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
  const { id } = router.query;

  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complaintType, setComplaintType] = useState("new");
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);

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

  // --- Dynamic parse for complainant/delegate/respondent
  const [complainantType, setComplainantType] = useState("individual");
  const [complainantData, setComplainantData] = useState({});
  const [delegateType, setDelegateType] = useState("delegate");
  const [delegateData, setDelegateData] = useState({});
  const [respondentType, setRespondentType] = useState("individual");
  const [respondentData, setRespondentData] = useState({});

  useEffect(() => {
    if (id) {
      fetchComplaints(id);
    }
  }, [id]);

  const fetchComplaints = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);
      console.log({ data });

      // Step1: General/Delegate
      const general = data?.step1?.general?.general || {};
      const delegate = data?.step1?.general?.delegate || {};
      const { type: cType, data: cData } = getComplainantTypeAndData(general);
      setComplainantType(cType);
      setComplainantData(cData);
      defaultGeneralRef.current = cData;

      const { type: dType, data: dData } = getDelegateTypeAndData(general);
      setDelegateType(dType);
      setDelegateData(dData);
      defaultDelegateRef.current = dData;

      // Step2: Respondent (บุคคล/นิติบุคคล/หน่วยงานรัฐ)
      const step2General = data?.step2?.general || {};
      const { type: rType, data: rData } = getRespondentTypeAndData(step2General);
      setRespondentType(rType);
      setRespondentData(rData);
      defaultStep2Ref.current = rData;

      // Step3, Step4
      const step3Data = data?.step3?.general || {};
      const step4Data = data?.step4?.general || {};

      // วันที่
      const step3DataWithDefaults = {
        ...step3Data,
        referenceDate1: step3Data.referenceDate1 || "",
        referenceDate3: step3Data.referenceDate3 || "",
        referenceDate4: step3Data.referenceDate4 || "",
      };

      defaultStep3Ref.current = step3DataWithDefaults;
      defaultStep4Ref.current = step4Data;

      generalMethods.reset(cData);
      delegateMethods.reset(dData);
      step2Methods.reset(rData);
      step3Methods.reset(step3DataWithDefaults);
      step4Methods.reset(step4Data);

    } catch (error) {
      console.error("Load complaints failed", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    let hasErrors = false;

    // Get all form values
    const step3Data = step3Methods.getValues();

    console.log("=== Validation Debug ===", {
      step3Data,
      complaintType,
      formState: step3Methods.formState
    });

    // Step 3 Validation - Required fields with red asterisk

    // ประเภทเรื่องร้องเรียน *
    if (!step3Data.complaintType || step3Data.complaintType.trim() === "") {
      errors.complaintType = "กรุณาเลือกประเภทเรื่องร้องเรียน";
      hasErrors = true;
    }

    // ประเภทเรื่องย่อย *
    if (!step3Data.complaintSubType || step3Data.complaintSubType.trim() === "") {
      errors.complaintSubType = "กรุณาเลือกประเภทเรื่องย่อย";
      hasErrors = true;
    }

    // เรื่อง *
    if (!step3Data.subject || step3Data.subject.trim() === "") {
      errors.subject = "กรุณากรอกเรื่อง";
      hasErrors = true;
    }

    // เลข สป.กก. *
    if (!step3Data.referenceNumber1 || step3Data.referenceNumber1.trim() === "") {
      errors.referenceNumber1 = "กรุณากรอกเลข สป.กก.";
      hasErrors = true;
    }

    // วันที่ (referenceDate1) *
    if (!step3Data.referenceDate1 || step3Data.referenceDate1.trim() === "") {
      errors.referenceDate1 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    // เลข สตป. *
    if (!step3Data.referenceNumber3 || step3Data.referenceNumber3.trim() === "") {
      errors.referenceNumber3 = "กรุณากรอกเลข สตป.";
      hasErrors = true;
    }

    // วันที่ (referenceDate3) *
    if (!step3Data.referenceDate3 || step3Data.referenceDate3.trim() === "") {
      errors.referenceDate3 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    // เลข สรร. (สารบัญ) *
    if (!step3Data.referenceNumber4 || step3Data.referenceNumber4.trim() === "") {
      errors.referenceNumber4 = "กรุณากรอกเลข สรร. (สารบัญ)";
      hasErrors = true;
    }

    // วันที่ (referenceDate4) *
    if (!step3Data.referenceDate4 || step3Data.referenceDate4.trim() === "") {
      errors.referenceDate4 = "กรุณาเลือกวันที่";
      hasErrors = true;
    }

    console.log("=== Validation Result ===", {
      errors,
      hasErrors,
      errorCount: Object.keys(errors).length
    });

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

    // Reset validation
    setValidationErrors({});
    setShowValidation(false);
    setComplaintType("new");
  };

  const handleSubmit = () => {
    console.log("=== Submit Clicked ===");

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

    const submitData = {
      id: defaultData?.id,
      step1: {
        general: {
          general: generalData,
          delegate: defaultDelegateRef.current ? delegateData : null,
        }
      },
      step2: {
        general: {
          individual: step2Data
        }
      },
      step3: {
        general: {
          ...step3Data,
          complaintType: complaintType
        }
      },
      step4: {
        general: step4Data
      },
      updated_by: currentUser,
      updated_at: currentDateTime,
    };

    console.log("Submitting data:", JSON.stringify(submitData, null, 2));

    alertSuccess("บันทึกข้อมูลสำเร็จ", "ข้อมูลได้รับการบันทึกแล้ว");

    // ส่งข้อมูลไปหน้า SearchComplaintsPreview
    router.push({
      pathname: "/admin/edit/website-complaints/SearchComplaintsPreview",
      query: {
        id: defaultData?.id,
        data: JSON.stringify(submitData),
      },
    });
  };

  const handleComplaintTypeChange = (type) => {
    setComplaintType(type);

    // Clear validation errors when changing
    if (showValidation) {
      setValidationErrors(prev => {
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

  // Helper function to show field error
  const getFieldError = (fieldName) => {
    return showValidation ? validationErrors[fieldName] : "";
  };

  const hasFieldError = (fieldName) => {
    return showValidation && !!validationErrors[fieldName];
  };

  // Helper function to clear validation error when field changes
  const handleFieldChange = (fieldName) => {
    if (showValidation && validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  // Loading state
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

  // Error state
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
            {/* Tab Navigation - แสดงเพื่อความสวยงาม */}
            <div className={styles.tabNavV2}>
              <div className={`${styles.tabV2} ${complainantType === "individual" ? styles.activeV2 : ""}`}>
                บุคคลทั่วไป
              </div>
              <div className={`${styles.tabV2} ${complainantType === "corporate" ? styles.activeV2 : ""}`}>
                นิติบุคคล
              </div>
              <div className={`${styles.tabV2} ${complainantType === "government" ? styles.activeV2 : ""}`}>
                หน่วยงานของรัฐ
              </div>
              <div
                className={styles.underlineBarV2}
                style={{
                  background: complainantType === "corporate"
                    ? "linear-gradient(90deg, #3FA9F5 0%, #0f67b1 100%)"
                    : complainantType === "government"
                      ? "linear-gradient(90deg, #edc458 0%, #e3ebf7 100%)"
                      : "linear-gradient(90deg, #2196f3 0%, #0f67b1 100%)"
                }}
              />
            </div>

            <div className={styles.formWrapper}>
              {/* Section 1: ข้อมูลผู้ร้องทุกข์ */}
              <FormProvider {...generalMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      {complainantType === "corporate" ? "ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)" : "ข้อมูลผู้ร้องทุกข์"}
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      data={complainantData}
                      formType={complainantType === "corporate" ? "corporate" : "individual"}
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Section 2: ข้อมูลผู้รับมอบอำนาจร้องทุกข์ */}
              <FormProvider {...delegateMethods}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      {delegateType === "signer" ? "ข้อมูลผู้มีอำนาจลงนาม" : "ข้อมูลผู้รับมอบอำนาจร้องทุกข์"}
                    </h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <ComplaintPersonalFormAPI
                      data={delegateData}
                      formType={delegateType === "signer" ? "signer" : "delegate"}
                    />
                  </div>
                </div>
              </FormProvider>

              {/* Tab Navigation for Step 2 */}
              <div className={styles.tabNavV2}>
                <div className={`${styles.tabV2} ${complainantType === "individual" ? styles.activeV2 : ""}`}>
                  บุคคลทั่วไป
                </div>
                <div className={`${styles.tabV2} ${complainantType === "corporate" ? styles.activeV2 : ""}`}>
                  นิติบุคคล
                </div>
                <div className={`${styles.tabV2} ${complainantType === "government" ? styles.activeV2 : ""}`}>
                  หน่วยงานของรัฐ
                </div>
                <div
                  className={styles.underlineBarV2}
                  style={{
                    background: complainantType === "corporate"
                      ? "linear-gradient(90deg, #3FA9F5 0%, #0f67b1 100%)"
                      : complainantType === "government"
                        ? "linear-gradient(90deg, #edc458 0%, #e3ebf7 100%)"
                        : "linear-gradient(90deg, #2196f3 0%, #0f67b1 100%)"
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
                    <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    {/* Row 1: ประเภทเรื่องร้องเรียน, ประเภทเรื่องย่อย, ช่องทางเรื่องร้องเรียน */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องร้องเรียน <span className={styles.required}>*</span>
                        </label>
                        <select
                          {...step3Methods.register("complaintType", {
                            onChange: () => handleFieldChange("complaintType")
                          })}
                          className={hasFieldError("complaintType") ? styles.errorField : ""}
                        >
                          <option value="">เลือกประเภทเรื่องร้องเรียน</option>
                          <option value="corruption">การทุจริต</option>
                          <option value="misconduct">การประพฤติมิชอบ</option>
                          <option value="inefficiency">ความไม่มีประสิทธิภาพ</option>
                        </select>
                        {hasFieldError("complaintType") && (
                          <span className={styles.errorText}>{getFieldError("complaintType")}</span>
                        )}
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องย่อย <span className={styles.required}>*</span>
                        </label>
                        <select
                          {...step3Methods.register("complaintSubType", {
                            onChange: () => handleFieldChange("complaintSubType")
                          })}
                          className={hasFieldError("complaintSubType") ? styles.errorField : ""}
                        >
                          <option value="">เลือกประเภทเรื่องย่อย</option>
                          <option value="suggestion">ข้อเสนอแนะ</option>
                          <option value="complaint">ข้อร้องเรียน</option>
                        </select>
                        {hasFieldError("complaintSubType") && (
                          <span className={styles.errorText}>{getFieldError("complaintSubType")}</span>
                        )}
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ช่องทางเรื่องร้องเรียน</label>
                        <input
                          type="text"
                          defaultValue="เว็บไซต์ศูนย์เรื่องร้องทุกข์"
                          {...step3Methods.register("complaintChannel")}
                          disabled
                        />
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
                            onChange: () => handleFieldChange("subject")
                          })}
                          className={hasFieldError("subject") ? styles.errorField : ""}
                          placeholder="กรุณากรอกเรื่อง"
                        />
                        {hasFieldError("subject") && (
                          <span className={styles.errorText}>{getFieldError("subject")}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 3: เลข สป.กก., วันที่, เลข สป.สร., วันที่ */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สป.กก. <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber1", {
                            onChange: () => handleFieldChange("referenceNumber1")
                          })}
                          className={hasFieldError("referenceNumber1") ? styles.errorField : ""}
                          placeholder="กรุณากรอกเลข สป.กก."
                        />
                        {hasFieldError("referenceNumber1") && (
                          <span className={styles.errorText}>{getFieldError("referenceNumber1")}</span>
                        )}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <DateThaiPickerService
                          name="referenceDate1"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                          error={hasFieldError("referenceDate1")}
                          helperText={getFieldError("referenceDate1")}
                          required
                          onChange={() => handleFieldChange("referenceDate1")}
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
                        <DateThaiPickerService
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
                            onChange: () => handleFieldChange("referenceNumber3")
                          })}
                          className={hasFieldError("referenceNumber3") ? styles.errorField : ""}
                          placeholder="กรุณากรอกเลข สตป."
                        />
                        {hasFieldError("referenceNumber3") && (
                          <span className={styles.errorText}>{getFieldError("referenceNumber3")}</span>
                        )}
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.datePickerWrapper}>
                          <DateThaiPickerService
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
                            onChange: () => handleFieldChange("referenceNumber4")
                          })}
                          className={hasFieldError("referenceNumber4") ? styles.errorField : ""}
                          placeholder="กรุณากรอกเลข สรร. (สารบัญ)"
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
                          <DateThaiPickerService
                            name="referenceDate4"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                            error={hasFieldError("referenceDate4")}
                            helperText={getFieldError("referenceDate4")}
                            onChange={() => handleFieldChange("referenceDate4")}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 5: เลขที่หนังสือ, วันที่, หน่วยงานอื่นที่ส่งเรื่องมา กก. */}
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
                          <DateThaiPickerService
                            name="documentDate"
                            control={step3Methods.control}
                            placeholder="กรุณาเลือกวันที่"
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>หน่วยงานอื่นที่ส่งเรื่องมา กก.</label>
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
                          <option value="normal">ธรรมดา</option>
                          <option value="confidential">ลับ</option>
                          <option value="secret">ลับมาก</option>
                          <option value="top_secret">ลับที่สุด</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ชั้นความเร่งด่วน</label>
                        <select {...step3Methods.register("urgencyLevel")}>
                          <option value="normal">ธรรมดา</option>
                          <option value="urgent">เร่งด่วน</option>
                          <option value="very_urgent">เร่งด่วนมาก</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkboxes - ตามภาพ 12 (แนวตั้ง) */}
                    <div className={styles.checkboxSection}>
                      <div className={styles.checkboxGroupVertical}>
                        {/* เรื่องร้องเรียนใหม่ */}
                        <div className={styles.checkboxRowSingle}>
                          <label className={`${styles.checkboxItem} ${complaintType === "new" ? styles.checked : ""}`}>
                            <input
                              type="checkbox"
                              checked={complaintType === "new"}
                              onChange={() => handleComplaintTypeChange("new")}
                            />
                            เรื่องร้องเรียนใหม่
                          </label>
                        </div>

                        {/* เรื่องร้องเรียนเพิ่มเติม */}
                        <div className={styles.checkboxRowWithFields}>
                          <div className={styles.checkboxColumn}>
                            <label className={`${styles.checkboxItem} ${complaintType === "additional" ? styles.checked : ""}`}>
                              <input
                                type="checkbox"
                                checked={complaintType === "additional"}
                                onChange={() => handleComplaintTypeChange("additional")}
                              />
                              เรื่องร้องเรียนเพิ่มเติม
                            </label>
                          </div>
                          <div className={styles.fieldsColumn}>
                            <div className={styles.fieldPair}>
                              <div className={styles.fieldWithLabel}>
                                <label>เลขที่อ้างอิง(เลข สรร.สารบัญ)</label>
                                <input
                                  type="text"
                                  disabled={complaintType !== "additional"}
                                  {...step3Methods.register("additionalReference1")}
                                />
                              </div>
                              <div className={styles.fieldWithLabelDate}>
                                <label>วันที่</label>
                                <div className={styles.datePickerWrapper}>
                                  <DateThaiPickerService
                                    name="additionalReferenceDate1"
                                    control={step3Methods.control}
                                    disabled={complaintType !== "additional"}
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
                            <label className={`${styles.checkboxItem} ${complaintType === "committee" ? styles.checked : ""}`}>
                              <input
                                type="checkbox"
                                checked={complaintType === "committee"}
                                onChange={() => handleComplaintTypeChange("committee")}
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
                                  disabled={complaintType !== "committee"}
                                  {...step3Methods.register("additionalReference2")}
                                />
                              </div>
                              <div className={styles.fieldWithLabelDate}>
                                <label>วันที่</label>
                                <div className={styles.datePickerWrapper}>
                                  <DateThaiPickerService
                                    name="additionalReferenceDate2"
                                    control={step3Methods.control}
                                    disabled={complaintType !== "committee"}
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
                    <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์ <span className={styles.required}>*</span></h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.complaintDescriptionSection}>
                      {/* Row 1: วันที่รับเรื่องของเจ้าพนักงาน, วันที่เสนองาน ผอ.สรร. */}
                      <div className={styles.fieldRowDate}>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <DateThaiPickerService
                              label="วันที่รับงานของเจ้าหน้าที่"
                              name="officerReceivedDate"
                              control={step4Methods.control}
                              defaultValue={defaultData?.step4?.general?.officerReceivedDate}
                              time={true}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <DateThaiPickerService
                              label="วันที่เสนองาน ผอ.สรร."
                              name="directorSubmittedDate"
                              control={step4Methods.control}
                              defaultValue={defaultData?.step4?.general?.directorSubmittedDate}
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
                              name="incidentDate"
                              control={step4Methods.control}
                              defaultValue={
                                defaultData?.step4?.general?.incidentDate
                                  ? new Date(defaultData.step4.general.incidentDate)
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
                          defaultValue={defaultData?.step3?.general?.description}
                          disabled
                          className={styles.disabledTextarea}
                          {...step4Methods.register("additionalDescription")}
                        />
                      </div>

                      {/* เอกสารประกอบการร้องเรียน */}
                      <div className={styles.attachmentSection}>
                        <h4>เอกสารประกอบการร้องเรียน</h4>
                        <div className={styles.attachmentList}>
                          {defaultData?.step3?.general?.attachment?.map((file, index) => {
                            // แปลงขนาดไฟล์จาก bytes เป็น MB
                            const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);

                            // แปลงวันที่จาก ISO string เป็นรูปแบบไทย
                            const formatDate = (isoString) => {
                              const date = new Date(isoString);
                              const day = date.getDate().toString().padStart(2, '0');
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const year = (date.getFullYear() + 543).toString().slice(-2);
                              return `${day}/${month}/${year}`;
                            };

                            return (
                              <div key={file.id || index} className={styles.attachmentItem}>
                                <span className={styles.pdfIcon}>📄</span>
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'inherit', textDecoration: 'none' }}
                                >
                                  {file.fileName} {fileSizeMB} MB ({formatDate(file.created_at)})
                                </a>
                              </div>
                            );
                          }) || (
                              // กรณีไม่มีไฟล์แนบ
                              <div className={styles.attachmentItem}>
                                <span className={styles.pdfIcon}>📄</span>
                                ไม่มีเอกสารประกอบ
                              </div>
                            )}
                        </div>
                        <p className={styles.attachmentNote}>
                          หมายเหตุ : หลักฐาน เช่น สำเนาสัญญา ภาพถ่าย หรือ หมายศาล
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