import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { FormProvider, useForm } from "react-hook-form";
import styles from "./TabNav.module.scss";

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
  const { id } = router.query;

  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complaintType, setComplaintType] = useState("new"); // "new", "additional", "committee"

  // Current user and datetime from provided UTC data
  const currentUser = "vampirebeam";
  const currentDateTime = "2025-06-09 19:25:47";

  const generalMethods = useForm();
  const delegateMethods = useForm();
  const step2Methods = useForm();
  const step3Methods = useForm();
  const step4Methods = useForm();

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

  const fetchComplaints = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);
      console.log({ data });

      const general = data?.step1?.general?.general || {};
      const delegate = data?.step1?.general?.delegate || null;
      const step2Data = data?.step2?.general?.individual || {};
      const step3Data = data?.step3?.general || {};
      const step4Data = data?.step4?.general || {};

      defaultGeneralRef.current = general;
      defaultDelegateRef.current = delegate;
      defaultStep2Ref.current = step2Data;
      defaultStep3Ref.current = step3Data;
      defaultStep4Ref.current = step4Data;

      generalMethods.reset(general);
      if (delegate) delegateMethods.reset(delegate);
      step2Methods.reset(step2Data);
      step3Methods.reset(step3Data);
      step4Methods.reset(step4Data);
    } catch (error) {
      console.error("Load complaints failed", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    generalMethods.reset(defaultGeneralRef.current);
    if (defaultDelegateRef.current) {
      delegateMethods.reset(defaultDelegateRef.current);
    }
    step2Methods.reset(defaultStep2Ref.current);
    step3Methods.reset(defaultStep3Ref.current);
    step4Methods.reset(defaultStep4Ref.current);
  };

  const handleSubmit = () => {
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
      updated_by: "vampirebeam",
      updated_at: "2025-06-10 03:31:02",
    };

    console.log("Submitting data:", JSON.stringify(submitData, null, 2));

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
            <div className={styles.tabNav}>
              <div className={`${styles.tab} ${styles.tab0} ${styles.active}`}>
                บุคคลทั่วไป
              </div>
              <div className={`${styles.tab} ${styles.tab1}`}>
                นิติบุคคล
              </div>
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
                    <h3 className={styles.sectionTitle}>ข้อมูลผู้รับมอบอำนาจร้องทุกข์</h3>
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
                <div className={`${styles.tab} ${styles.tab1} ${styles.active}`}>
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
                    <h3 className={styles.sectionTitle}>ข้อมูลผู้ถูกร้องเรียน</h3>
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
                    <h3 className={styles.sectionTitle}>ข้อมูลเรื่องร้องทุกข์</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    {/* Row 1: ประเภทเรื่องร้องเรียน, ประเภทเรื่องย่อย, ช่องทางเรื่องร้องเรียน */}
                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องร้องเรียน <span className={styles.required}>*</span>
                        </label>
                        <select {...step3Methods.register("complaintType")}>
                          <option value="">ความไม่มีประสิทธิภาพ</option>
                          <option value="corruption">การทุจริต</option>
                          <option value="misconduct">การประพฤติมิชอบ</option>
                          <option value="inefficiency">ความไม่มีประสิทธิภาพ</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          ประเภทเรื่องย่อย <span className={styles.required}>*</span>
                        </label>
                        <select {...step3Methods.register("complaintSubType")}>
                          <option value="">ข้อคิดแก้/ข้อเสนอแนะ...</option>
                          <option value="suggestion">ข้อเสนอแนะ</option>
                          <option value="complaint">ข้อร้องเรียน</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ช่องทางเรื่องร้องเรียน</label>
                        <input
                          type="text"
                          defaultValue="เว็บไซต์ศูนย์เรื่องร้องทุกข์"
                          {...step3Methods.register("complaintChannel")}
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
                          defaultValue="อุทดลลทดให้โดยเจื้นอื่นสิ่งสะดวกไว้"
                          {...step3Methods.register("subject")}
                        />
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
                          defaultValue="12-1507-15"
                          {...step3Methods.register("referenceNumber1")}
                        />
                      </div>
                      <div className={styles.fieldGroupDate}>
                        <label>
                          วันที่ <span className={styles.required}>*</span>
                        </label>
                        <DateThaiPickerService
                          name="referenceDate2"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
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
                          name="referenceDate2"
                          control={step3Methods.control}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </div>
                    </div>

                    {/* Row 4: เลข สตป., วันที่, เลข สรร. (สานต่อง), วันที่ */}
                    <div className={styles.fieldRowDate}>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สตป. <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          defaultValue="15-9909-45"
                          {...step3Methods.register("referenceNumber3")}
                        />
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
                          />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>
                          เลข สรร. (สานต่อง) <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          {...step3Methods.register("referenceNumber4")}
                        />
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
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 5: เลขที่หนังสือ, วันที่, หน่วยงานอื่นที่ส่งเรื่องมาขึ่ง กก. */}
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
                        <label>หน่วยงานอื่นที่ส่งเรื่องมาขึ่ง กก.</label>
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
                          <option value="normal">ลับ</option>
                          <option value="confidential">ลับ</option>
                          <option value="secret">ลับมาก</option>
                          <option value="top_secret">ลับที่สุด</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>ชั้นความเร่งด่วน</label>
                        <select {...step3Methods.register("urgencyLevel")}>
                          <option value="normal">ไม่เร่งด่วน</option>
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
                                <label>เลขที่อ้างอิง(เลข สรร.สานต่อง)</label>
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
                                <label>เลขที่อ้างอิง(เลข สรร.สานต่อง)</label>
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

              {/* Section 5: ข้อมูลเรื่องร้องทุกข์ (รายละเอียด) - ปรับปรุงตามภาพ */}
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
                              label="วันที่รับเรื่องของเจ้าพนักงาน"
                              value={defaultData?.step4?.general?.officerReceivedDate || ""}
                              onChange={() => { }}
                              time={true}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldGroupDate}>
                          <div className={styles.datePickerWrapper}>
                            <DateThaiPickerService
                              label="วันที่เสนองาน ผอ.สรร."
                              value={defaultData?.step4?.general?.directorSubmittedDate || ""}
                              onChange={() => { }}
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
                              value={defaultData?.step4?.general?.incidentDateTime || "2023-11-01T14:37:00"}
                              onChange={() => { }}
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
                          defaultValue="บริษัท พีพี เพราคติส จำกัด ได้บอกบนาคาร-ผื่นนี้แล้วส่วนรวบอำนาจเพิ่ม (VAT) ประจำเดือนธันวาคม 2568 แต่มาเสียงปิดบนชิปปิบไม่ได้รับงบแจ้งเวียนอีกแล้วโปรแกรมการต้องเป็นดำเนินอธุรกิจ แน่นงไม่เข้าชำนะดังเดิมนั้นคือแต่งข่าว จะติดต่อมาเมื่อไหร่ แต่กรกฎาคมที่ได้ประมาณการกิจการยังไม่ได้รับการแจ้งเก็บ สรรพากรที่เกี่ยวข้องกับยอดเพาะมารบาศุกก์ แต่ถึงปิดแจ้งแล้วใบใรมสำยาพารขอรายอ่าค่าที่รุงแต่ไม่ได้ราคิดความเสียหายในการปิดเพลิม บราแต่ประเจ่าแก้ข่าย รองรับใหะพอรัดการบริโภคความเสือมได้หมองทางการขี้นแพทิ์่วเพี้ยมาจะเสีสูงมีมันแข่นหาซะการมจังหลายการคาเป็นเวลา สารในข้อมูลใเพื่อนประชาลบไวดยหายแรงกะ 30-60 วัดเป็นลาดยมมายรายละเอียดกิจกรรม แดผงสำนึกต่อขชำห้างทรัพ รับมหลงคนคาเคียกิจกำนองการซิษณีการสุาม สํารองข้องงข่าทนคะกิจและล้วนานด้วยพอมชันใช่ใบสีแนบรประง่ายในมายทางเพาะมายโส ฟอร์มเคล็ทคิบัง คิงแสานเทปในพรวม ทำให้ไม่เก็ดผลการดทอด์อารุโนบายราม."
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