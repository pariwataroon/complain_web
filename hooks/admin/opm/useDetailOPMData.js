import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { GetAllComplaintChannels } from "@pages/api/allselect/allselect";
import { CreateComplaint } from "@pages/api/complaint/complaint";

const useDetailOPMData = ({
  caseDetails,
  attachmentsDetails,
  operatingsDetails,
  params,
  itemData,
}) => {
  const router = useRouter();
  const [currentItemData, setCurrentItemData] = useState(null);
  const [compiledData, setCompiledData] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [opmChannelId, setOpmChannelId] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const queryData = router.query;
      if (queryData) {
        setCurrentItemData(queryData);
      }
    }
  }, [router.isReady]);

  const getFieldValue = (fieldName) => {
    if (currentItemData && currentItemData[fieldName]) {
      return currentItemData[fieldName];
    }
    const field = caseDetails?.find((item) => item.field === fieldName);
    return field?.value || "-";
  };

  const getFieldArrayValue = (fieldName) => {
    const field = caseDetails?.find((item) => item.field === fieldName);
    const value = field?.value;

    if (Array.isArray(value)) return value;

    if (
      typeof value === "string" &&
      (value.startsWith("[") || value.startsWith("{"))
    ) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn(`Failed to parse JSON for field ${fieldName}:`, error);
        return [];
      }
    }
    if (value && typeof value === "object") return [value];
    return [];
  };

  const getAccountData = () => {
    const accountField = caseDetails?.find((item) => item.field === "account");
    const accountData = accountField?.value;
    
    if (accountData && typeof accountData === "object") {
      const fullName = `${accountData.salutation_th || ""} ${
        accountData.firstname_th || ""
      } ${accountData.lastname_th || ""}`.trim();
      return {
        name: fullName,
        fullName,
        salutation: accountData.salutation_th,
        firstName: accountData.firstname_th,
        lastName: accountData.lastname_th,
        citizenId: accountData.citizen_id,
        gender: accountData.gender_text,
        phone:
          accountData.list_account_detail?.find((c) => c.detail_type === "M")
            ?.detail || "-",
        email:
          accountData.list_account_detail?.find((c) => c.detail_type === "E")
            ?.detail || "-",
        address: {
          address: accountData.address,
          subdistrict: accountData.subdistrict_text,
          district: accountData.district_text,
          province: accountData.province_text,
          postcode: accountData.postcode,
          province_id: accountData.province_id,
          district_id: accountData.district_id,
          subdistrict_id: accountData.subdistrict_id,
        },
        contacts: accountData.list_account_detail || [],
      };
    }
    return {
      name: "-",
      fullName: "-",
      phone: "-",
      email: "-",
      address: {},
      contacts: [],
    };
  };

  const getCustomerData = () => {
    if (currentItemData?.customer_name) {
      return {
        name: currentItemData.customer_name,
        fullName: currentItemData.customer_name,
        phone: "-",
        email: "-",
        address: {},
        contacts: [],
      };
    }
    const customerField = caseDetails?.find(
      (item) => item.field === "customer"
    );
    const customerData = customerField?.value;
    // console.log({ customerData });
    
    if (customerData && typeof customerData === "object") {
      const fullName = `${customerData.salutation_th || ""} ${
        customerData.firstname_th || ""
      } ${customerData.lastname_th || ""}`.trim();
      return {
        name: fullName,
        fullName,
        salutation: customerData.salutation_th,
        firstName: customerData.firstname_th,
        lastName: customerData.lastname_th,
        citizenId: customerData.citizen_id,
        gender: customerData.gender_text,
        phone:
          customerData.list_customer_detail?.find((c) => c.detail_type === "M")
            ?.detail || "-",
        email:
          customerData.list_customer_detail?.find((c) => c.detail_type === "E")
            ?.detail || "-",
        address: {
          address: customerData.address,
          subdistrict: customerData.subdistrict_text,
          district: customerData.district_text,
          province: customerData.province_text,
          postcode: customerData.postcode,
          province_id: customerData.province_id,
          district_id: customerData.district_id,
          subdistrict_id: customerData.subdistrict_id,
        },
        contacts: customerData.list_customer_detail || [],
      };
    }
    return {
      name: "-",
      fullName: "-",
      phone: "-",
      email: "-",
      address: {},
      contacts: [],
    };
  };

  // แก้ให้ส่ง label อย่างเดียว (และ zip_code สำหรับ subdistricts)
  const stripAddressValues = (address) => {
    if (!address) return {};
    return {
      province:
        address.province_text || address.province
          ? { label: address.province_text || address.province }
          : undefined,
      districts:
        address.district_text || address.district
          ? { label: address.district_text || address.district }
          : undefined,
      subdistricts:
        address.subdistrict_text || address.subdistrict
          ? {
              label: address.subdistrict_text || address.subdistrict,
              ...(address.postcode ? { zip_code: address.postcode } : {}),
            }
          : undefined,
      zipcode: address.postcode
        ? { label: String(address.postcode) }
        : undefined,
    };
  };

  const getFormattedDataForCreateAPI = () => {
    const accountData = getAccountData();
    const customerData = getCustomerData();
    const mainInfo = getSectionData("main_information");
    const attachments = getSectionData("attachments");
    const detailsData = getSectionData("details_summary");

    let incidentDate = mainInfo.date_opened || "";
    if (incidentDate) {
      const match = incidentDate.match(/\/Date\((\d+)\)\//);
      if (match) {
        const timestamp = Number(match[1]);
        incidentDate = new Date(timestamp).toISOString();
      } else {
        const isoTry = new Date(incidentDate);
        if (!isNaN(isoTry.getTime())) {
          incidentDate = isoTry.toISOString();
        }
      }
    } else {
      incidentDate = new Date().toISOString();
    }

    const step1 = {
      general: {
        general: {
          idCard: accountData.citizenId || "",
          name: accountData.fullName || "",
          address: accountData.address?.full_address || "",
          phone: accountData.phone || "",
          email: accountData.email || "",
          ...stripAddressValues(accountData.address),
        },
      },
    };

    let step2 = undefined;
    if (
      customerData.fullName &&
      customerData.fullName !== "-" &&
      customerData.fullName !== accountData.fullName
    ) {
      step2 = {
        general: {
          individual: {
            idCard: customerData.citizenId || "",
            name: customerData.fullName || "",
            email: customerData.email || "",
            address: customerData.address?.full_address || "",
            phone: customerData.phone || "",
            ...stripAddressValues(customerData.address),
          },
          activeType: "individual",
        },
      };
    }

    const step3 = {
      general: {
        complaintType: mainInfo.type_text || "",
        subject: mainInfo.case_code || "",
        incidentDate: incidentDate || "",
        description: detailsData.detail || "",
        attachment:
          attachments.attachments?.map((file) => ({
            id: file.attachment_id,
            name: file.file_name,
            type: file.file_type,
            size: file.file_size,
            description: file.file_description,
            content: file.file_content,
          })) || [],
      },
    };

    const step4 = {
      general: {
        accepted: true,
      },
    };

    const payload = {
      step1,
      ...(step2 ? { step2 } : {}),
      step3,
      step4,
    };

    return payload;
  };

  const compileAllData = useMemo(() => {
    if (
      (!caseDetails || caseDetails.length === 0) &&
      (!currentItemData || Object.keys(currentItemData).length === 0)
    ) {
      return [];
    }
    const accountData = getAccountData();
    const customerData = getCustomerData();
    const orgOwnerList = getFieldArrayValue("list_case_org_owner");
    const caseCode = currentItemData?.case_code || getFieldValue("case_code");
    const caseId = currentItemData?.case_id || params?.case_id;
    const dataArray = [
      {
        section: "main_information",
        section_name: "ข้อมูลหลัก",
        data: {
          case_code: caseCode,
          case_id: caseId,
          objective_text:
            getFieldValue("objective_text") ||
            currentItemData?.type_text ||
            getFieldValue("type_text"),
          type_text: currentItemData?.type_text || getFieldValue("type_text"),
          status_text:
            currentItemData?.status_text || getFieldValue("status_text"),
          main_status_text:
            currentItemData?.main_status_text ||
            getFieldValue("main_status_text"),
          date_opened: getFieldValue("date_opened"),
        },
      },
      {
        section: "account_details",
        section_name: "ข้อมูลผู้ยื่นคำร้อง",
        data: {
          full_name: accountData.fullName,
          salutation: accountData.salutation,
          first_name: accountData.firstName,
          last_name: accountData.lastName,
          citizen_id: accountData.citizenId,
          gender: accountData.gender,
          email: accountData.email,
          phone: accountData.phone,
          address: {
            subdistrict: accountData.address?.subdistrict || "-",
            district: accountData.address?.district || "-",
            province: accountData.address?.province || "-",
            postcode: accountData.address?.postcode || "-",
            full_address: [
              accountData.address,
              accountData.address?.subdistrict,
              accountData.address?.district,
              accountData.address?.province,
              accountData.address?.postcode,
            ]
              .filter(Boolean)
              .join(" "),
          },
          contacts: accountData.contacts || [],
        },
      },
      {
        section: "customer_details",
        section_name: "ข้อมูลผู้เดือดร้อน",
        data: {
          full_name: customerData.fullName,
          salutation: customerData.salutation,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          citizen_id: customerData.citizenId,
          gender: customerData.gender,
          email: customerData.email,
          phone: customerData.phone,
          address: {
            subdistrict: customerData.address?.subdistrict || "-",
            district: customerData.address?.district || "-",
            province: customerData.address?.province || "-",
            postcode: customerData.address?.postcode || "-",
            full_address: [
              customerData.address,
              customerData.address?.subdistrict,
              customerData.address?.district,
              customerData.address?.province,
              customerData.address?.postcode,
            ]
              .filter(Boolean)
              .join(" "),
          },
          contacts: customerData.contacts || [],
        },
      },
      {
        section: "attachments",
        section_name: "ไฟล์แนบ",
        data: {
          attachment_count: attachmentsDetails?.length || 0,
          attachments:
            attachmentsDetails?.map((file, index) => ({
              attachment_id: file.attachment_id,
              file_name: file.file_name || `ไฟล์แนบ ${index + 1}`,
              file_type: file.file_type,
              file_description: file.file_description || "",
              file_content: file.file_content || null,
              file_size: file.file_size || null,
            })) || [],
        },
      },
      {
        section: "organizations",
        section_name: "หน่วยงานที่เกี่ยวข้อง",
        data: {
          organization_count: orgOwnerList?.length || 0,
          organizations:
            orgOwnerList?.map((org, index) => ({
              line: org.line || index + 1,
              org_text: org.org_text || "ไม่ระบุหน่วยงาน",
              case_org_status_text: org.case_org_status_text || "ไม่ระบุสถานะ",
              case_org_summary_result: org.case_org_summary_result || "",
              created_by_text: org.created_by_text || "ไม่ระบุ",
            })) || [],
        },
      },
      {
        section: "additional_information",
        section_name: "ข้อมูลเพิ่มเติม",
        data: {
          channel_incoming_text: getFieldValue("channel_incoming_text"),
          priority_text: getFieldValue("priority_text"),
          severity_text: getFieldValue("severity_text"),
          secret_text: getFieldValue("secret_text"),
          case_area: getFieldValue("case_area"),
          location: {
            subdistrict_text: getFieldValue("subdistrict_text"),
            district_text: getFieldValue("district_text"),
            province_text: getFieldValue("province_text"),
            full_location: [
              getFieldValue("case_area"),
              getFieldValue("subdistrict_text"),
              getFieldValue("district_text"),
              getFieldValue("province_text"),
            ]
              .filter((item) => item !== "-")
              .join(" "),
          },
          time_occurrenced: getFieldValue("time_occurrenced"),
          date_occurrenced_from: getFieldValue("date_occurrenced_from"),
          date_occurrenced_to: getFieldValue("date_occurrenced_to"),
          is_in_court: getFieldValue("is_in_court"),
          is_in_court_text: getFieldValue("is_in_court_text"),
          defendant: getFieldValue("defendant"),
          created_by_text: getFieldValue("created_by_text"),
          remark: getFieldValue("remark"),
        },
      },
      {
        section: "details_summary",
        section_name: "รายละเอียดและสรุป",
        data: {
          detail: getFieldValue("detail"),
          summary: getFieldValue("summary"),
        },
      },
    ];
    return dataArray;
  }, [
    caseDetails,
    currentItemData,
    attachmentsDetails,
    operatingsDetails,
    params,
  ]);

  useEffect(() => {
    if (compileAllData.length > 0) {
      setCompiledData(compileAllData);
      setIsDataReady(true);
    }
  }, [compileAllData]);

  const getSectionData = (sectionName) => {
    return (
      compiledData.find((section) => section.section === sectionName)?.data ||
      {}
    );
  };

  const getFlatData = () => {
    const flatData = {};
    compiledData.forEach((section) => {
      flatData[section.section] = section.data;
    });
    return flatData;
  };

  const getFormattedDataForAPI = () => {
    const flatData = getFlatData();
    return {
      case_id: flatData.main_information?.case_id,
      case_code: flatData.main_information?.case_code,
      sections: compiledData,
      created_at: new Date().toISOString(),
      total_sections: compiledData.length,
    };
  };

  const getOpmChannelId = async () => {
    try {
      setIsCreating(true);
      const data = await GetAllComplaintChannels();
      const opmChannel = data.res_data?.items?.find(
        (item) => item.name === "opm1111"
      );
      if (opmChannel) {
        setOpmChannelId(opmChannel.id);
        return opmChannel.id; 
      } else {
        throw new Error("OPM Channel not found");
      }
    } catch (error) {
      console.error("❌ Error fetching OPM Channel ID:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const isValidForAPICreation = () => {
    if (!compiledData.length) return false;
    const mainInfo = getSectionData("main_information");
    const accountData = getAccountData();
    const hasRequiredData =
      mainInfo.case_code &&
      mainInfo.case_id &&
      accountData.fullName !== "-" &&
      accountData.fullName !== "" &&
      !autoCreateAttempted;
    return hasRequiredData;
  };

  const createComplaintAPI = async (apiData) => {
    try {
      setIsCreating(true);
      const result = await CreateComplaint(opmChannelId, apiData);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const autoCreateComplaint = async () => {
    try {
      setAutoCreateAttempted(true);
      const apiData = getFormattedDataForCreateAPI();
      const result = await createComplaintAPI(apiData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (
      isDataReady &&
      opmChannelId &&
      !autoCreateAttempted &&
      !isCreating
    ) {
      setTimeout(() => {
        autoCreateComplaint();
      }, 500);
    }
  }, [
    isDataReady,
    opmChannelId,
    autoCreateAttempted,
    isCreating,
    compiledData,
  ]);

  useEffect(() => {
    if (isDataReady && !opmChannelId) {
      getOpmChannelId();
    }
  }, [isDataReady, opmChannelId, compiledData]);

  return {
    compiledData,
    isDataReady,
    isCreating,
    autoCreateAttempted,
    currentItemData,
    opmChannelId,

    getSectionData,
    getFlatData,
    getFormattedDataForAPI,
    getFormattedDataForCreateAPI,
    getAccountData,
    getCustomerData,
    getFieldValue,
    getFieldArrayValue,

    createComplaintAPI,
    autoCreateComplaint,
    isValidForAPICreation,
    getOpmChannelId,

    setOpmChannelId,
    setAutoCreateAttempted,
    setIsCreating,
  };
};

export default useDetailOPMData;