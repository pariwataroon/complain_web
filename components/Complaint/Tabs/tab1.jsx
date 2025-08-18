import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";
import ComplaintMinistryMainForm from "@services/ComplaintMinistryMain/ComplaintMinistryMainForm";
import { getAuthMe } from "@pages/api/role/role"

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หน่วยงานของรัฐ"];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab1 = ({
  stepKey,
  tabData,
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false,
  onTabChange,
  currentTab = 0,
}) => {
  const [userRoles, setUserRoles] = useState([]);
  const [hasGovernmentAccess, setHasGovernmentAccess] = useState(false);
  const [authMeData, setAuthMeData] = useState({});
  const [isLoadingAuthMe, setIsLoadingAuthMe] = useState(false);

  // ฟังก์ชันตรวจสอบ roles จาก cookie (ดึงมาจาก Dashboard)
  const getUserRoles = () => {
    try {
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const infoCookie = cookies.info;

      if (infoCookie) {
        const parsed = JSON.parse(decodeURIComponent(infoCookie));
        let userRoles = [];

        if (typeof parsed.roles === "string") {
          userRoles = JSON.parse(parsed.roles);
        } else if (Array.isArray(parsed.roles)) {
          userRoles = parsed.roles;
        }

        return userRoles;
      }
    } catch (err) {
      console.error("Error parsing cookie or roles:", err);
    }

    return [];
  };

  // ดึงข้อมูลจาก getAuthMe API
  useEffect(() => {
    const fetchAuthMeData = async () => {
      try {
        setIsLoadingAuthMe(true);
        const response = await getAuthMe();

        if (response && response.res_code === "0000" && response.res_data) {
          setAuthMeData(response.res_data);
        } else {
          console.error("Failed to fetch auth me data:", response);
          setAuthMeData({});
        }
      } catch (error) {
        console.error("Error fetching auth me data:", error);
        setAuthMeData({});
      } finally {
        setIsLoadingAuthMe(false);
      }
    };

    fetchAuthMeData();
  }, []);

  // ตรวจสอบสิทธิ์การเข้าถึง tab หน่วยงานของรัฐ
  useEffect(() => {
    const roles = getUserRoles();
    setUserRoles(roles);

    const allowedRoles = [
      "admin",
      "staff",
      "supervisor",
      "department",
      "admin_home",
    ];
    const hasAccess = allowedRoles.some((role) => roles.includes(role));
    setHasGovernmentAccess(hasAccess);
  }, []);

  const handleTabChange = (newTab) => {
    // ถ้าพยายามเข้า tab หน่วยงานของรัฐ แต่ไม่มีสิทธิ์ ให้ return
    if (newTab === 2 && !hasGovernmentAccess) {
      console.log("ไม่มีสิทธิ์เข้าถึง tab หน่วยงานของรัฐ");
      return;
    }

    if (onTabChange) {
      onTabChange("step1", newTab);
    }
  };

  const handleUpdate = useMemo(() => {
    return (type) => (name, value) => {
      const prev = tabData[type] || {};
      const updated = {
        ...prev,
        [name]: value,
      };

      let updatedData = {};

      if (currentTab === 0) {
        updatedData = {
          general: type === "general" ? updated : tabData.general || {},
          delegate: type === "delegate" ? updated : tabData.delegate || {},
        };
      } else if (currentTab === 1) {
        updatedData = {
          corporate: type === "corporate" ? updated : tabData.corporate || {},
          signer: type === "signer" ? updated : tabData.signer || {},
        };
      } else if (currentTab === 2) {
        updatedData = {
          government:
            type === "government" ? updated : tabData.government || {},
        };
      }

      updateStepData(stepKey, "general", updatedData);
    };
  }, [stepKey, tabData, currentTab, updateStepData]);

  // แยก Logic การรีเซ็ต address fields
  useEffect(() => {
    const resetAddressFields = (type, provinceName) => {
      const currentData = tabData[type] || {};

      if (currentData.province?.value !== provinceName) {
        handleUpdate(type)("districts", "");
        handleUpdate(type)("subdistricts", "");
        handleUpdate(type)("zipcode", "");
      }
    };

    if (currentTab === 0) {
      // บุคคลทั่วไป
      if (tabData.general?.province) {
        resetAddressFields("general", tabData.general.province.value);
      }
      if (tabData.delegate?.province) {
        resetAddressFields("delegate", tabData.delegate.province.value);
      }
    } else if (currentTab === 1) {
      // นิติบุคคล
      if (tabData.corporate?.province) {
        resetAddressFields("corporate", tabData.corporate.province.value);
      }
      if (tabData.signer?.province) {
        resetAddressFields("signer", tabData.signer.province.value);
      }
    } else if (currentTab === 2) {
      // หน่วยงานของรัฐ
      if (tabData.government?.province) {
        resetAddressFields("government", tabData.government.province.value);
      }
    }
  }, [
    tabData.general?.province?.value,
    tabData.delegate?.province?.value,
    tabData.corporate?.province?.value,
    tabData.signer?.province?.value,
    tabData.government?.province?.value,
    currentTab,
    handleUpdate,
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.tabNav}>
        {tabs.map((label, idx) => {
          // ซ่อน tab หน่วยงานของรัฐ ถ้าไม่มีสิทธิ์
          if (idx === 2 && !hasGovernmentAccess) {
            return null;
          }

          return (
            <div
              key={idx}
              className={`${styles.tab} ${styles[`tab${idx}`]} ${
                currentTab === idx ? styles.active : ""
              }`}
              onClick={() => handleTabChange(idx)}
            >
              {label}
            </div>
          );
        })}
        <div
          className={styles.underlineBar}
          style={{ backgroundColor: underlineColors[currentTab] }}
        />
      </div>

      {/* ใช้ currentTab แทน active */}
      {currentTab === 0 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.general || {}}
              onChange={handleUpdate("general")}
              title="ข้อมูลผู้ร้องทุกข์"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="general"
              formType="mandatory"
              dataMe={authMeData}
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleUpdate("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="delegate"
              formType="optional"
            />
          </div>
        </>
      )}

      {currentTab === 1 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.corporate || {}}
              onChange={handleUpdate("corporate")}
              title="ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="corporate"
              formType="mandatory"
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.signer || {}}
              onChange={handleUpdate("signer")}
              title="ข้อมูลผู้มีอำนาจลงนาม"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="signer"
              formType="optional"
            />
          </div>
        </>
      )}

      {/* แสดง tab หน่วยงานของรัฐ เฉพาะเมื่อมีสิทธิ์ */}
      {currentTab === 2 && hasGovernmentAccess && (
        <>
          <div className={styles.formContainer}>
            <ComplaintMinistryMainForm
              data={tabData.government || {}}
              onChange={handleUpdate("government")}
              title="ข้อมูลผู้ร้องทุกข์ (หน่วยงานของรัฐ)"
              validationErrors={validationErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="government"
              formType="mandatory"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Tab1;
