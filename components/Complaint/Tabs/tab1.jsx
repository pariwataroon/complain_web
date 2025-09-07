import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";
import ComplaintMinistryMainForm from "@services/ComplaintMinistryMain/ComplaintMinistryMainForm";
import { getAuthMe } from "@pages/api/role/role";

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

  // อ่าน roles จาก cookie (ฝั่ง Dashboard ใส่มาให้)
  const getUserRoles = () => {
    try {
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) acc[key] = value;
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

  // ====== กรอง error ของฟิลด์ที่อยู่ทิ้งทั้งหมด (ไม่ให้บังคับกรอก) ======
  const addressKeys = useMemo(
    () => [
      "province", "district", "districts",
      "subdistrict", "subdistricts",
      "zipcode", "zip_code", "zipCode",
    ],
    []
  );

  const stripAddressErrors = useMemo(() => {
    // deep clone แบบง่าย
    const cloned = JSON.parse(JSON.stringify(validationErrors || {}));

    const removeAddress = (obj) => {
      if (!obj || typeof obj !== "object") return;

      // ลบคีย์ที่เป็นฟิลด์ที่อยู่โดยตรง
      addressKeys.forEach((k) => {
        if (k in obj) delete obj[k];
      });

      // เดินลงไปในทุกก้อน (รองรับโครงสร้างซ้อน)
      Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (v && typeof v === "object") removeAddress(v);
        // กันเคส key เป็นรูป general.province / signer.zipcode เป็นต้น
        if (
          addressKeys.some((ak) => k === ak || k.endsWith("." + ak))
        ) {
          delete obj[k];
        }
      });
    };

    removeAddress(cloned);
    return cloned;
  }, [validationErrors, addressKeys]);

  // ดึงข้อมูล auth me
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

  // ตรวจสอบและอัพเดทข้อมูล auto-populate เมื่อได้ข้อมูล authMe แล้ว
  useEffect(() => {
    if (authMeData && Object.keys(authMeData).length > 0 && !isLoadingAuthMe) {
      // ตรวจสอบว่าข้อมูลใน tabData.general ยังไม่มี หรือไม่ครบ ถึงจะ auto-populate
      const currentGeneralData = tabData.general || {};
      const shouldAutoPopulate = !currentGeneralData.idCard && !currentGeneralData.email && !currentGeneralData.phone;
      
      if (shouldAutoPopulate && currentTab === 0) {
        console.log("Auto-populating data from authMe:", authMeData);
        
        // สร้างข้อมูลที่จะ auto-populate
        const autoPopulatedData = {};
        
        if (authMeData.citizen_id?.trim()) {
          autoPopulatedData.idCard = authMeData.citizen_id;
        }
        if (authMeData.email?.trim()) {
          autoPopulatedData.email = authMeData.email;
        }
        if (authMeData.phone?.trim()) {
          autoPopulatedData.phone = authMeData.phone;
        }
        if (authMeData.full_name?.trim()) {
          autoPopulatedData.name = authMeData.full_name;
        }

        // อัพเดทข้อมูลโดยตรงถ้ามีข้อมูลที่จะ populate
        if (Object.keys(autoPopulatedData).length > 0) {
          const updatedData = {
            ...tabData,
            general: {
              ...currentGeneralData,
              ...autoPopulatedData
            }
          };
          updateStepData(stepKey, "general", updatedData);
        }
      }
    }
  }, [authMeData, isLoadingAuthMe, tabData, currentTab, stepKey, updateStepData]);

  // ตรวจสิทธิ์ tab หน่วยงานรัฐ
  useEffect(() => {
    const roles = getUserRoles();
    setUserRoles(roles);
    const allowedRoles = ["admin", "staff", "supervisor", "department", "admin_home"];
    const hasAccess = allowedRoles.some((role) => roles.includes(role));
    setHasGovernmentAccess(hasAccess);
  }, []);

  const handleTabChange = (newTab) => {
    if (newTab === 2 && !hasGovernmentAccess) {
      console.log("ไม่มีสิทธิ์เข้าถึง tab หน่วยงานของรัฐ");
      return;
    }
    if (onTabChange) onTabChange("step1", newTab);
  };

  const handleUpdate = useMemo(() => {
    return (type) => (name, value) => {
      // ใช้ tabData[type] ที่มีอยู่แล้ว หรือ object ว่างถ้าไม่มี
      const prev = tabData[type] || {};
      const updated = { ...prev, [name]: value };

      // สร้าง updatedData โดยรักษาข้อมูลเดิมทั้งหมดและอัพเดทเฉพาะส่วนที่เปลี่ยน
      let updatedData = { ...tabData }; // รักษาข้อมูลเดิมทั้งหมด
      
      if (currentTab === 0) {
        updatedData = {
          ...updatedData,
          general: type === "general" ? updated : updatedData.general || {},
          delegate: type === "delegate" ? updated : updatedData.delegate || {},
        };
      } else if (currentTab === 1) {
        updatedData = {
          ...updatedData,
          corporate: type === "corporate" ? updated : updatedData.corporate || {},
          signer: type === "signer" ? updated : updatedData.signer || {},
        };
      } else if (currentTab === 2) {
        updatedData = {
          ...updatedData,
          government: type === "government" ? updated : updatedData.government || {},
        };
      }
      
      updateStepData(stepKey, "general", updatedData);
    };
  }, [stepKey, tabData, currentTab, updateStepData]);

  // ถ้า province เปลี่ยน ค่อยรีเซ็ต อำเภอ/ตำบล/รหัส — (แค่ความสะดวก, ไม่เกี่ยวกับการบังคับกรอก)
  useEffect(() => {
    const resetAddressFields = (type, provinceValue) => {
      const currentData = tabData[type] || {};
      if (currentData.province?.value !== provinceValue) {
        handleUpdate(type)("districts", "");
        handleUpdate(type)("subdistricts", "");
        handleUpdate(type)("zipcode", "");
      }
    };

    if (currentTab === 0) {
      if (tabData.general?.province) {
        resetAddressFields("general", tabData.general.province.value);
      }
      if (tabData.delegate?.province) {
        resetAddressFields("delegate", tabData.delegate.province.value);
      }
    } else if (currentTab === 1) {
      if (tabData.corporate?.province) {
        resetAddressFields("corporate", tabData.corporate.province.value);
      }
      if (tabData.signer?.province) {
        resetAddressFields("signer", tabData.signer.province.value);
      }
    } else if (currentTab === 2) {
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
          if (idx === 2 && !hasGovernmentAccess) return null;
          return (
            <div
              key={idx}
              className={`${styles.tab} ${styles[`tab${idx}`]} ${currentTab === idx ? styles.active : ""}`}
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

      {currentTab === 0 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.general || {}}
              onChange={handleUpdate("general")}
              title="ข้อมูลผู้ร้องทุกข์"
              validationErrors={stripAddressErrors}     
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="general"
              formType="mandatory"
              dataMe={authMeData}
              isLoadingAuthMe={isLoadingAuthMe}
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleUpdate("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
              validationErrors={stripAddressErrors}    
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
              validationErrors={stripAddressErrors}     
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
              validationErrors={stripAddressErrors}     
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="signer"
              formType="optional"
            />
          </div>
        </>
      )}

      {currentTab === 2 && hasGovernmentAccess && (
        <>
          <div className={styles.formContainer}>
            <ComplaintMinistryMainForm
              data={tabData.government || {}}
              onChange={handleUpdate("government")}
              title="ข้อมูลผู้ร้องทุกข์ (หน่วยงานของรัฐ)"
              validationErrors={stripAddressErrors}      
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
