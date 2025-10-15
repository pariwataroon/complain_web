import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import ComplaintPersonalFormAPI from "@services/ComplaintPersonalFormAPI/ComplaintPersonalFormAPI";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
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
  { label: "แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง" },
];

const SearchComplaints = () => {
  const router = useRouter();
  const { id } = router.query;

  const [defaultData, setDefaultData] = useState(null);
  const [active, setActive] = useState(0);
  const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "ส่วนราชการ"];
  const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

  const generalMethods = useForm();
  const delegateMethods = useForm();

  const defaultGeneralRef = useRef({});
  const defaultDelegateRef = useRef({});

  useEffect(() => {
    if (id) {
      fetchComplaints(id);
    }
  }, [id]);

  const fetchComplaints = async (id) => {
    try {
      const res = await GetComplaintByID(id);
      const data = res?.res_data;
      setDefaultData(data);

      const general = data?.step1?.general?.general || {};
      const delegate = data?.step1?.general?.delegate || null;

      defaultGeneralRef.current = general;
      defaultDelegateRef.current = delegate;

      generalMethods.reset(general);
      if (delegate) delegateMethods.reset(delegate);
    } catch (error) {
      console.error("Load complaints failed", error);
    }
  };

  const handleReset = () => {
    generalMethods.reset(defaultGeneralRef.current);
    if (defaultDelegateRef.current) {
      delegateMethods.reset(defaultDelegateRef.current);
    }
  };

  const handleSubmit = () => {
    const generalData = generalMethods.getValues();
    const delegateData = delegateMethods.getValues();

    router.push({
      pathname: "/next-page",
      query: {
        data: JSON.stringify({
          general: generalData,
          delegate: defaultDelegateRef.current ? delegateData : null,
        }),
      },
    });
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <div className={styles.container}>
        <div className={styles.headerBar}>
          แบบรับคำร้องเรียนผ่านเว็บไซต์กระทรวงการคลัง
        </div>

        {defaultData && generalMethods ? (
          <>
            <div className={styles.tabNav}>
              {tabs.map((label, idx) => (
                <div
                  key={idx}
                  className={`${styles.tab} ${styles[`tab${idx}`]} ${
                    active === idx ? styles.active : ""
                  }`}
                  onClick={() => setActive(idx)}
                >
                  {label}
                </div>
              ))}
              <div
                className={styles.underlineBar}
                style={{ backgroundColor: underlineColors[active] }}
              />
            </div>

            <FormProvider {...generalMethods}>
              <div className={styles.formContainer}>
                <ComplaintPersonalFormAPI title="ข้อมูลผู้ร้องทุกข์" />
              </div>
            </FormProvider>
            {/* ถ้าไม่ต้องการให้แสดงในกรณีที่ไม่มีข้อมูลให้เปิด Tab ส่วนนี้ */}
            {/* {defaultDelegateRef.current && (
              <FormProvider {...delegateMethods}>
                <div className={styles.formContainer2}>
                  <ComplaintPersonalFormAPI title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์" />
                </div>
              </FormProvider>
            )} */}

            <FormProvider {...delegateMethods}>
              <div className={styles.formContainer2}>
                <ComplaintPersonalFormAPI title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์" />
              </div>
            </FormProvider>

            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
            >
              <ButtonService
                label="ล้าง"
                color="ล้าง"
                variant="contained"
                iconLeft=""
                onClick={handleReset}
              />
              <ButtonService
                label="บันทึก"
                color="บันทึก"
                variant="contained"
                iconRight=""
                onClick={handleSubmit}
              />
            </Box>
          </>
        ) : (
          <p>กำลังโหลดข้อมูล...</p>
        )}
      </div>
    </>
  );
};

export default SearchComplaints;
