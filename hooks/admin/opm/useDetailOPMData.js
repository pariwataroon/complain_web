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

  // เพิ่ม state variables ที่ขาดหายไป
  const [opmChannelId, setOpmChannelId] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Update current item data when router is ready
  useEffect(() => {
    if (router.isReady) {
      const queryData = router.query;
      if (queryData) {
        setCurrentItemData(queryData);
      }
    }
  }, [router.isReady]);

  // Helper function to get field value
  const getFieldValue = (fieldName) => {
    if (currentItemData && currentItemData[fieldName]) {
      return currentItemData[fieldName];
    }
    const field = caseDetails?.find((item) => item.field === fieldName);
    return field?.value || "-";
  };

  // Helper function to get field array value
  const getFieldArrayValue = (fieldName) => {
    const field = caseDetails?.find((item) => item.field === fieldName);
    const value = field?.value;

    if (Array.isArray(value)) {
      return value;
    }

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

    if (value && typeof value === "object") {
      return [value];
    }

    return [];
  };

  // Function to get account data
  const getAccountData = () => {
    const accountField = caseDetails?.find((item) => item.field === "account");
    const accountData = accountField?.value;

    if (accountData && typeof accountData === "object") {
      const fullName = `${accountData.salutation_th || ""} ${
        accountData.firstname_th || ""
      } ${accountData.lastname_th || ""}`.trim();

      return {
        name: fullName,
        fullName: fullName,
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
          subdistrict: accountData.subdistrict_text,
          district: accountData.district_text,
          province: accountData.province_text,
          postcode: accountData.postcode,
        },
        contacts: accountData.list_account_detail || [],
      };
    }

    return {
      name: "-",
      fullName: "-",
      phone: "-",
      email: "-",
    };
  };

  // Function to get customer data
  const getCustomerData = () => {
    if (currentItemData?.customer_name) {
      return {
        name: currentItemData.customer_name,
        fullName: currentItemData.customer_name,
        phone: "-",
        email: "-",
      };
    }

    const customerField = caseDetails?.find(
      (item) => item.field === "customer"
    );
    const customerData = customerField?.value;

    if (customerData && typeof customerData === "object") {
      const fullName = `${customerData.salutation_th || ""} ${
        customerData.firstname_th || ""
      } ${customerData.lastname_th || ""}`.trim();

      return {
        name: fullName,
        fullName: fullName,
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
          subdistrict: customerData.subdistrict_text,
          district: customerData.district_text,
          province: customerData.province_text,
          postcode: customerData.postcode,
        },
        contacts: customerData.list_customer_detail || [],
      };
    }

    return {
      name: "-",
      fullName: "-",
      phone: "-",
      email: "-",
    };
  };

  // เพิ่มฟังก์ชัน getOpmChannelId ที่ขาดหายไป
  const getOpmChannelId = async () => {
    try {
      setIsCreating(true);
      const data = await GetAllComplaintChannels();
      setOpmChannelId(data.channelId || data.channel_id);
      console.log(
        "✅ OPM Channel ID obtained:",
        data.channelId || data.channel_id
      );
      return data.channelId || data.channel_id;
    } catch (error) {
      console.error("❌ Error fetching OPM Channel ID:", error);
      const mockChannelId = "mock-channel-id-123";
      setOpmChannelId(mockChannelId);
      return mockChannelId;
    } finally {
      setIsCreating(false);
    }
  };

  // เพิ่มฟังก์ชัน isValidForAPICreation ที่ขาดหายไป
  const isValidForAPICreation = () => {
    if (!compiledData.length) return false;

    const mainInfo = getSectionData("main_information");
    const accountData = getAccountData();

    // ตรวจสอบข้อมูลที่จำเป็น
    const hasRequiredData =
      mainInfo.case_code &&
      mainInfo.case_id &&
      accountData.fullName !== "-" &&
      accountData.fullName !== "" &&
      !autoCreateAttempted;

    console.log("🔍 Validation check:", {
      hasRequiredData,
      caseCode: mainInfo.case_code,
      caseId: mainInfo.case_id,
      accountName: accountData.fullName,
      autoCreateAttempted,
    });

    return hasRequiredData;
  };

  const createComplaintAPI = async (apiData) => {
    try {
      setIsCreating(true);
      console.log("📤 Sending complaint data to API:", apiData);

      const result = await CreateComplaint(apiData);
      console.log("✅ Complaint created successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating complaint:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const autoCreateComplaint = async () => {
    try {
      setAutoCreateAttempted(true);
      const apiData = getFormattedDataForCreateAPI();
      apiData.channel_id = opmChannelId;
      const result = await createComplaintAPI(apiData);
      return result;
    } catch (error) {
      console.error("❌ Auto-create complaint failed:", error);
      throw error;
    }
  };

  // Compile all data into structured format
  const compileAllData = useMemo(() => {
    if (!caseDetails && !currentItemData) {
      return [];
    }

    const accountData = getAccountData();
    const customerData = getCustomerData();
    const orgOwnerList = getFieldArrayValue("list_case_org_owner");
    const caseCode = currentItemData?.case_code || getFieldValue("case_code");
    const caseId = currentItemData?.case_id || params?.case_id;

    const dataArray = [
      // Section 1: Main Information
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

      // Section 2: Account Details (ผู้ยื่นคำร้อง)
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

      // Section 3: Customer Details (ผู้เดือดร้อน)
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

      // Section 4: Attachments
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

      // Section 5: Organizations
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

      // Section 6: Additional Information
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

      // Section 7: Details and Summary
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

  // Update compiled data when dependencies change
  useEffect(() => {
    if (compileAllData.length > 0) {
      setCompiledData(compileAllData);
      setIsDataReady(true);
    }
  }, [compileAllData]);

  // Function to get specific section data
  const getSectionData = (sectionName) => {
    return (
      compiledData.find((section) => section.section === sectionName)?.data ||
      {}
    );
  };

  // Function to get all data as flat object
  const getFlatData = () => {
    const flatData = {};
    compiledData.forEach((section) => {
      flatData[section.section] = section.data;
    });
    return flatData;
  };

  // Function to get formatted data for API
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

  // Function to get formatted data for Create API (step format)
  const getFormattedDataForCreateAPI = () => {
    const accountData = getAccountData();
    const customerData = getCustomerData();
    const mainInfo = getSectionData("main_information");
    const additionalInfo = getSectionData("additional_information");
    const attachments = getSectionData("attachments");
    const detailsData = getSectionData("details_summary");

    // Helper function to create address object
    const createAddressObject = (addressData) => {
      if (!addressData) return {};
      const obj = {};
      if (addressData.province_id || addressData.province_text) {
        obj.province = {};
        if (addressData.province_id)
          obj.province.value = addressData.province_id;
        if (addressData.province_text)
          obj.province.label = addressData.province_text;
      }
      if (addressData.district_id || addressData.district_text) {
        obj.districts = {};
        if (addressData.district_id)
          obj.districts.value = addressData.district_id;
        if (addressData.district_text)
          obj.districts.label = addressData.district_text;
      }
      if (addressData.subdistrict_id || addressData.subdistrict_text) {
        obj.subdistricts = {};
        if (addressData.subdistrict_id)
          obj.subdistricts.value = addressData.subdistrict_id;
        if (addressData.subdistrict_text)
          obj.subdistricts.label = addressData.subdistrict_text;
        if (addressData.postcode)
          obj.subdistricts.zip_code = addressData.postcode;
      }
      if (addressData.postcode) {
        obj.zipcode = {
          value: addressData.postcode,
          label: String(addressData.postcode),
        };
      }
      return obj;
    };

    const getFormattedDataForCreateAPI = () => {
      const accountData = getAccountData();
      const customerData = getCustomerData();
      const mainInfo = getSectionData("main_information");
      const attachments = getSectionData("attachments");
      const detailsData = getSectionData("details_summary");

      // Step 1: ผู้ยื่น (individual)
      const step1 = {
        general: {
          general: {
            idCard: accountData.citizenId || "",
            name: accountData.fullName || "",
            address: accountData.address?.full_address || "",
            phone: accountData.phone || "",
            email: accountData.email || "",
            ...createAddressObject(accountData.address),
          },
        },
      };

      // Step 2: corporate หรือ individual (ดูว่ามี customerData หรือไม่)
      let step2 = undefined;
      // ถ้ามี customerData และมีชื่อที่ต่างจาก accountData
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
              ...createAddressObject(customerData.address),
            },
            activeType: "individual",
          },
        };
      }

      // Step 3: ข้อมูลร้องเรียน
      const step3 = {
        general: {
          complaintType: mainInfo.type_text || "",
          subject: mainInfo.case_code || "", // subject ให้ใช้เลข นร = รหัสเรื่อง
          incidentDate: mainInfo.date_opened || "",
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

      // Step 4: ยอมรับ
      const step4 = {
        general: {
          accepted: true,
        },
      };

      // รวม payload
      const payload = {
        step1,
        ...(step2 ? { step2 } : {}),
        step3,
        step4,
      };

      return payload;
    };

    // Auto-create complaint when data is ready
    useEffect(() => {
      if (isDataReady && opmChannelId && !autoCreateAttempted && !isCreating) {
        if (isValidForAPICreation()) {
          const mainInfo = getSectionData("main_information");
          console.log(
            "🚀 Auto-creating complaint for case:",
            mainInfo.case_code
          );

          // Add a small delay to ensure all data is properly loaded
          setTimeout(() => {
            autoCreateComplaint();
          }, 1000);
        }
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
        console.log("📞 Fetching OPM Channel ID...");
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
};

export default useDetailOPMData;
