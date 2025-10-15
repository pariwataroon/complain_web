import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./TabNav.module.scss";
import ComplaintPersonalForm from "@services/ComplaintPersonal/ComplaintPersonalForm";
import ComplaintMinistryMainForm from "@services/ComplaintMinistryMain/ComplaintMinistryMainForm";
import { getAuthMe } from "@pages/api/role/role";

const tabs = ["บุคคลทั่วไป", "นิติบุคคล", "หนังสือร้องเรียนถึง กค."];
const underlineColors = ["#0B1F8F", "#3FA9F5", "#EDC458"];

const Tab1 = ({
  stepKey,
  tabData = {}, 
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false,
  onTabChange,
  currentTab = 0,
}) => {
  // ===== Roles & Access =====
  const [userRoles, setUserRoles] = useState([]);
  const [hasGovernmentAccess, setHasGovernmentAccess] = useState(false);

  // ===== AuthMe (auto populate) =====
  const [authMeData, setAuthMeData] = useState({});
  const [isLoadingAuthMe, setIsLoadingAuthMe] = useState(false);

  // Read roles from cookie
  const readRolesFromCookie = useCallback(() => {
    try {
      const cookies = document.cookie.split(";").reduce((acc, c) => {
        const [k, v] = c.trim().split("=");
        if (k && v) acc[k] = v;
        return acc;
      }, {});
      if (cookies.info) {
        const parsed = JSON.parse(decodeURIComponent(cookies.info));
        if (parsed?.roles) {
          if (typeof parsed.roles === "string") return JSON.parse(parsed.roles);
          if (Array.isArray(parsed.roles)) return parsed.roles;
        }
      }
    } catch (e) {
      console.warn("parse roles failed", e);
    }
    return [];
  }, []);

  useEffect(() => {
    const roles = readRolesFromCookie();
    setUserRoles(roles);
    const allowed = ["admin", "staff", "supervisor", "department", "admin_home"];
    setHasGovernmentAccess(allowed.some((r) => roles.includes(r)));
  }, [readRolesFromCookie]);

  const isAdmin = useMemo(() => userRoles.includes("admin"), [userRoles]);

  // ===== Filter out address errors (avoid noisy display) =====
  const addressKeys = useMemo(
    () => ["province", "district", "districts", "subdistrict", "subdistricts", "zipcode", "zip_code", "zipCode"],
    []
  );

  const filteredErrors = useMemo(() => {
    if (!validationErrors || typeof validationErrors !== "object") return {};
    const result = {};
    Object.entries(validationErrors).forEach(([k, v]) => {
      if (addressKeys.some((ak) => k === ak || k.endsWith(`.${ak}`))) return; // skip address related
      result[k] = v;
    });
    return result;
  }, [validationErrors, addressKeys]);

  // ===== Fetch AuthMe for auto populate (general tab only) =====
  useEffect(() => {
    const fetchAuthMe = async () => {
      try {
        setIsLoadingAuthMe(true);
        const res = await getAuthMe();
        if (res?.res_code === "0000" && res?.res_data) {
          setAuthMeData(res.res_data);
        } else {
          setAuthMeData({});
        }
      } catch (e) {
        console.error("authMe fetch failed", e);
        setAuthMeData({});
      } finally {
        setIsLoadingAuthMe(false);
      }
    };
    fetchAuthMe();
  }, []);

  // ===== Auto populate general info once =====
  useEffect(() => {
    if (currentTab !== 0) return;
    if (isLoadingAuthMe) return;
    if (!authMeData || Object.keys(authMeData).length === 0) return;

    const currentGeneral = tabData.general || {};
    const shouldPopulate = !currentGeneral.idCard && !currentGeneral.email && !currentGeneral.phone;
    if (!shouldPopulate) return;

    const patch = {};
    if (authMeData.citizen_id?.trim()) patch.idCard = authMeData.citizen_id;
    if (authMeData.email?.trim()) patch.email = authMeData.email;
    if (authMeData.phone?.trim()) patch.phone = authMeData.phone;
    if (authMeData.full_name?.trim()) patch.name = authMeData.full_name;

    if (Object.keys(patch).length > 0) {
      const newContainer = { ...tabData, general: { ...currentGeneral, ...patch } };
      updateStepData(stepKey, "general", newContainer);
    }
  }, [currentTab, isLoadingAuthMe, authMeData, tabData, stepKey, updateStepData]);

  // ===== Handle tab change (UI only) =====
  const handleTabChange = (idx) => {
    if (idx === 2 && !hasGovernmentAccess) return;
    onTabChange && onTabChange("step1", idx);
  };

  // ===== Update section data (general/delegate/corporate/signer/government) =====
  const handleUpdate = useCallback(
    (section) => (field, value) => {
      const prevSection = tabData?.[section] || {};
      const nextSection = { ...prevSection, [field]: value };
      // Avoid unnecessary state update
      if (JSON.stringify(prevSection) === JSON.stringify(nextSection)) return;
      const newContainer = { ...tabData, [section]: nextSection };
      updateStepData(stepKey, "general", newContainer);
    },
    [tabData, stepKey, updateStepData]
  );

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
        <div className={styles.underlineBar} style={{ backgroundColor: underlineColors[currentTab] }} />
      </div>

      {/* บุคคลทั่วไป */}
      {currentTab === 0 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.general || {}}
              onChange={handleUpdate("general")}
              title="ข้อมูลผู้ร้องทุกข์"
              validationErrors={isAdmin ? {} : filteredErrors}
              shouldShowValidation={isAdmin ? false : shouldShowValidation}
              fieldPrefix="general"
              formType={isAdmin ? "optional" : "mandatory"}
              dataMe={authMeData}
              isLoadingAuthMe={isLoadingAuthMe}
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.delegate || {}}
              onChange={handleUpdate("delegate")}
              title="ข้อมูลผู้รับมอบอำนาจร้องทุกข์"
              validationErrors={filteredErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="delegate"
              formType="optional"
            />
          </div>
        </>
      )}

      {/* นิติบุคคล */}
      {currentTab === 1 && (
        <>
          <div className={styles.formContainer}>
            <ComplaintPersonalForm
              data={tabData.corporate || {}}
              onChange={handleUpdate("corporate")}
              title="ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)"
              validationErrors={isAdmin ? {} : filteredErrors}
              shouldShowValidation={isAdmin ? false : shouldShowValidation}
              fieldPrefix="corporate"
              formType={isAdmin ? "optional" : "mandatory"}
            />
          </div>
          <div className={styles.formContainer2}>
            <ComplaintPersonalForm
              data={tabData.signer || {}}
              onChange={handleUpdate("signer")}
              title="ข้อมูลผู้มีอำนาจลงนาม"
              validationErrors={filteredErrors}
              shouldShowValidation={shouldShowValidation}
              fieldPrefix="signer"
              formType="optional"
            />
          </div>
        </>
      )}

      {/* หน่วยงานของรัฐ */}
      {currentTab === 2 && hasGovernmentAccess && (
        <div className={styles.formContainer}>
          <style jsx>{`
            .${styles.formContainer} :global(.MuiGrid-root.MuiGrid-item):has(label:contains("หน่วยงาน")) {
              display: none !important;
            }
            .${styles.formContainer} :global(.MuiGrid-container > .MuiGrid-item:nth-child(2)) {
              display: none !important;
            }
          `}</style>
          <ComplaintMinistryMainForm
            data={tabData.government || {}}
            onChange={handleUpdate("government")}
            title="ข้อมูลผู้ร้องทุกข์ (หนังสือร้องเรียนถึง กค.)"
            validationErrors={isAdmin ? {} : filteredErrors}
            shouldShowValidation={isAdmin ? false : shouldShowValidation}
            fieldPrefix="government"
            formType={isAdmin ? "optional" : "mandatory"}
          />
        </div>
      )}
    </div>
  );
};

export default Tab1;
