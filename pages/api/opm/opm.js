import soapInstance from "@pages/api/soapInstance";
import Cookies from "js-cookie";

const Encode = async () => {
  const str = process.env.NEXT_PUBLIC_OPM_PS;
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_GENERAL,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <EncodeString xmlns="http://tempuri.org/">
              <str>${str}</str>
            </EncodeString>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "EncodeString",
      }
    );

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    let encodeStringResult =
      xmlDoc.getElementsByTagName("EncodeStringResult")[0].textContent;

    encodeStringResult = encodeStringResult.replace(/^"|"$/g, "");

    const tokenResponse = await GetToken(encodeStringResult);
    return tokenResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getIPAddress = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "127.0.0.1";
  }
};

const GetToken = async (password) => {
  try {
    const ipAddress = await getIPAddress();
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,

      `<?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
              <GetToken xmlns="http://tempuri.org/">
              <user>${process.env.NEXT_PUBLIC_OPM_ID}</user>
              <password>${password}</password>
              <authen_from>S</authen_from>
              <ip_address>${ipAddress}</ip_address>
              </GetToken>
          </soap:Body>
          </soap:Envelope>`,
      {
        soapActionSuffix: "GetToken",
      }
    );

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const getTokenResult =
      xmlDoc.getElementsByTagName("GetTokenResult")[0].textContent;

    const tokenData = JSON.parse(getTokenResult);

    Cookies.set("opm_token", tokenData.token_id, { expires: 3 });
    Cookies.set("org_id", tokenData.org_id, { expires: 3 });

    return tokenData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const GetTimelineHeader = async (take = 1) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }

    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <GetTimelineHeader xmlns="http://tempuri.org/">
                <token_id>${token_id}</token_id>
                <last_get_date_time></last_get_date_time>
                <timeline_type>A</timeline_type>
                <skip>0</skip>
                <take>${take}</take>
                </GetTimelineHeader>
            </soap:Body>
            </soap:Envelope>`,
      {
        soapActionSuffix: "GetTimelineHeader",
      }
    );

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const timelineResult = xmlDoc.getElementsByTagName(
      "GetTimelineHeaderResult"
    )[0]?.textContent;

    if (!timelineResult) {
      throw new Error("No GetTimelineHeaderResult found in the response.");
    }

    const parsedResult = JSON.parse(timelineResult);

    return parsedResult;
  } catch (error) {
    console.error("Error fetching timeline header:", error);
    throw error;
  }
};

const GetCase = async (case_id) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetCase xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${case_id}</case_id>
            </GetCase>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetCase",
      }
    );

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const getCaseResult =
      xmlDoc.getElementsByTagName("GetCaseResult")[0]?.textContent;

    if (!getCaseResult) {
      throw new Error("No GetCaseResult found in the SOAP response.");
    }

    const caseData = JSON.parse(getCaseResult);

    const caseDetailsArray = Object.entries(caseData).map(([key, value]) => ({
      field: key,
      value: value,
    }));
    return caseDetailsArray;
  } catch (error) {
    console.error("Error fetching case details:", error);
    throw error;
  }
};

const GetOperatings = async (case_id, take = 1000) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id)
      throw new Error("Token not found in cookies. Please authenticate first.");
    const org_id = Cookies.get("org_id");
    if (!org_id)
      throw new Error("Token not found in cookies. Please authenticate first.");

    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetOperatings xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${case_id}</case_id>
              <select_org_id></select_org_id>
              <skip>0</skip>
              <take>${take}</take>
            </GetOperatings>
          </soap:Body>
        </soap:Envelope>`,
      { soapActionSuffix: "GetOperatings" }
    );

    const match = response.data.match(
      /<GetOperatingsResult>(.*?)<\/GetOperatingsResult>/
    );
    if (!match || !match[1]) return [];

    const arr = JSON.parse(match[1]);
    return Array.isArray(arr) ? arr : [arr];
  } catch (error) {
    console.error("Error fetching operating details:", error);
    throw error;
  }
};

const AddOperating = async (submitData) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const org_id = Cookies.get("org_id");
    if (!org_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }

    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <AddOperating xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${submitData.case_id}</case_id>
              <type_id>${submitData.type_id}</type_id>
              <objective_id>6</objective_id>
              <terminal_org_id>${org_id}</terminal_org_id>
              <terminal_owner_id>${submitData.created_by}</terminal_owner_id>
              <channel_id>5899EE5D72CF3652A4AAE69E429D9DED</channel_id>
              <contact_detail>${submitData.contact_detail}</contact_detail>
              <date_opened>${submitData.date_opened}</date_opened>
              <date_closed>${submitData.date_closed}</date_closed>
              <detail>${submitData.detail}</detail>
              <severity_id>1</severity_id>
              <secret_id>1</secret_id>
            </AddOperating>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "AddOperating",
      }
    );

    try {
      const xmlDoc = new DOMParser().parseFromString(response.data, "text/xml");
      const addOperatingResult =
        xmlDoc.getElementsByTagName("AddOperatingResult")[0]?.textContent;

      if (addOperatingResult) {
        console.log("AddOperating raw result:", addOperatingResult);

        // Extract operating_id from format: "Result:6000207FB2A44CA7ACD90FEF1F26C784"
        let operatingId = null;

        if (addOperatingResult.includes("Result:")) {
          // Remove quotes and extract the ID after "Result:"
          const cleanResult = addOperatingResult.replace(/"/g, ""); // Remove quotes
          const resultMatch = cleanResult.match(/Result:([A-F0-9]+)/i);

          if (resultMatch && resultMatch[1]) {
            operatingId = resultMatch[1];
            console.log("Extracted operating_id:", operatingId);
          }
        }

        // Fallback: try to parse as JSON (in case format changes)
        if (!operatingId) {
          try {
            const resultData = JSON.parse(addOperatingResult);
            operatingId =
              resultData.operating_id || resultData.id || resultData.ID;
          } catch (parseError) {
            console.log("Could not parse as JSON, trying regex extraction");

            // Final fallback: generic regex
            const operatingIdMatch = addOperatingResult.match(/[A-F0-9]{32}/i);
            operatingId = operatingIdMatch ? operatingIdMatch[0] : null;
          }
        }

        return {
          success: true,
          operating_id: operatingId,
          data: addOperatingResult,
          raw_response: response,
        };
      }

      console.warn("No AddOperatingResult found in response");
      return {
        success: false,
        operating_id: null,
        data: null,
        raw_response: response,
      };
    } catch (error) {
      console.error("Error parsing AddOperating response:", error);
      return {
        success: false,
        operating_id: null,
        error: error.message,
        raw_response: response,
      };
    }
  } catch (error) {
    console.error("Error in AddOperating API call:", error);
    throw error;
  }
};

const SetOrgSummaryResult = async (submitData) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <SetOrgSummaryResult xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${submitData.case_id}</case_id>
              <status_id>${submitData.status_id}</status_id>
              <result>${submitData.detail}</result>
            </SetOrgSummaryResult>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "SetOrgSummaryResult",
      }
    );

    // console.log({ response });

    return response;
  } catch (error) {
    console.error("Error fetching case details:", error);
    throw error;
  }
};

const AddCase = async (submitData) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const org_id = Cookies.get("org_id");
    if (!org_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_MANAGECENTER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <AddCase xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_code>${submitData.case_code}</case_code>
              <type_id>${submitData.type_id}</type_id>
              <status_id>${submitData.status_id}</status_id>
              <organization_id>${org_id}</organization_id>
              <channel_id>${submitData.channel_id}</channel_id>
              <detail>${submitData.complaint_detail}</detail>
              <province_id>${submitData.province_id}</province_id>
              <district_id>${submitData.district_id}</district_id>
              <subdistrict_id>${submitData.subdistrict_id}</subdistrict_id>
              <contact_citizen_id></contact_citizen_id>
              <contact_name>${submitData.reporter_first_name}</contact_name>
              <contact_lastname>${submitData.reporter_last_name}</contact_lastname>
              <contact_telephone>${submitData.reporter_phone}</contact_telephone>
              <created_date>${submitData.created_date}</created_date>
              <updated_date>${submitData.updated_date}</updated_date>
            </AddCase>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "AddCase",
      }
    );

    return response;
  } catch (error) {
    console.error("Error fetching case details:", error);
    throw error;
  }
};

const GetDistricts = async (provinceId) => {
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_LISTOFVALUES,
      `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <GetDistricts xmlns="http://tempuri.org/">
            <province_id>${provinceId}</province_id>
            <is_thai>true</is_thai>
          </GetDistricts>
        </soap:Body>
      </soap:Envelope>`,
      {
        soapActionSuffix: "GetDistricts",
      }
    );

    let xmlString = response.data;

    if (typeof xmlString === "string") {
      if (typeof window !== "undefined") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement =
          xmlDoc.getElementsByTagName("GetDistrictsResult")[0];

        if (resultElement && resultElement.textContent) {
          const districts = JSON.parse(resultElement.textContent);

          return {
            success: true,
            data: Array.isArray(districts) ? districts : [],
          };
        }
      } else {
        const match = xmlString.match(
          /<GetDistrictsResult>(.*?)<\/GetDistrictsResult>/
        );
        if (match && match[1]) {
          const districts = JSON.parse(match[1]);

          return {
            success: true,
            data: Array.isArray(districts) ? districts : [],
          };
        }
      }
    }

    return {
      success: false,
      message: "No data received",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching districts:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: [],
    };
  }
};

const GetSubDistricts = async (districtId) => {
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_LISTOFVALUES,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetSubDistricts xmlns="http://tempuri.org/">
              <district_id>${districtId}</district_id>
              <is_thai>true</is_thai>
            </GetSubDistricts>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetSubDistricts",
      }
    );

    let xmlString = response.data;

    if (typeof xmlString === "string") {
      if (typeof window !== "undefined") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement = xmlDoc.getElementsByTagName(
          "GetSubDistrictsResult"
        )[0];

        if (resultElement && resultElement.textContent) {
          const subDistricts = JSON.parse(resultElement.textContent);

          return {
            success: true,
            data: Array.isArray(subDistricts) ? subDistricts : [],
          };
        }
      } else {
        const match = xmlString.match(
          /<GetSubDistrictsResult>(.*?)<\/GetSubDistrictsResult>/
        );
        if (match && match[1]) {
          const subDistricts = JSON.parse(match[1]);
          // console.log("Parsed sub-districts:", subDistricts);

          return {
            success: true,
            data: Array.isArray(subDistricts) ? subDistricts : [],
          };
        }
      }
    }

    return {
      success: false,
      message: "No data received",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching sub-districts:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: [],
    };
  }
};

const GetOperatingChannel = async () => {
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_LISTOFVALUES,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetOperatingChannel xmlns="http://tempuri.org/">
              <is_thai>true</is_thai>
            </GetOperatingChannel>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetOperatingChannel",
      }
    );

    // Parse XML response
    let xmlString = response.data;

    if (typeof xmlString === "string") {
      if (typeof window !== "undefined") {
        // Browser environment
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement = xmlDoc.getElementsByTagName(
          "GetOperatingChannelResult"
        )[0];

        if (resultElement && resultElement.textContent) {
          const channels = JSON.parse(resultElement.textContent);

          return {
            success: true,
            data: Array.isArray(channels) ? channels : [],
          };
        }
      } else {
        // Server-side environment
        const match = xmlString.match(
          /<GetOperatingChannelResult>(.*?)<\/GetOperatingChannelResult>/
        );
        if (match && match[1]) {
          const channels = JSON.parse(match[1]);

          return {
            success: true,
            data: Array.isArray(channels) ? channels : [],
          };
        }
      }
    }

    return {
      success: false,
      message: "No data received",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching operating channels:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: [],
    };
  }
};

const GetCaseStatus = async () => {
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_LISTOFVALUES,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetCaseStatus xmlns="http://tempuri.org/">
              <ref_id>88</ref_id>
              <is_thai>true</is_thai>
            </GetCaseStatus>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetCaseStatus",
      }
    );

    let xmlString = response.data;

    if (typeof xmlString === "string") {
      if (typeof window !== "undefined") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement = xmlDoc.getElementsByTagName(
          "GetCaseStatusResult"
        )[0];

        if (resultElement && resultElement.textContent) {
          const statuses = JSON.parse(resultElement.textContent);

          return {
            success: true,
            data: Array.isArray(statuses) ? statuses : [],
          };
        }
      } else {
        const match = xmlString.match(
          /<GetCaseStatusResult>(.*?)<\/GetCaseStatusResult>/
        );
        if (match && match[1]) {
          const statuses = JSON.parse(match[1]);

          return {
            success: true,
            data: Array.isArray(statuses) ? statuses : [],
          };
        }
      }
    }

    return {
      success: false,
      message: "No data received",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching case statuses:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: [],
    };
  }
};

const GetCaseType = async () => {
  try {
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_LISTOFVALUES,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetCaseType xmlns="http://tempuri.org/">
              <ref_id>1</ref_id>
              <is_thai>true</is_thai>
            </GetCaseType>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetCaseType",
      }
    );

    let xmlString = response.data;

    if (typeof xmlString === "string") {
      if (typeof window !== "undefined") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement =
          xmlDoc.getElementsByTagName("GetCaseTypeResult")[0];

        if (resultElement && resultElement.textContent) {
          const statuses = JSON.parse(resultElement.textContent);

          return {
            success: true,
            data: Array.isArray(statuses)
              ? statuses.map(({ val, text }) => ({ val, text }))
              : [],
          };
        }
      } else {
        const match = xmlString.match(
          /<GetCaseTypeResult>(.*?)<\/GetCaseTypeResult>/
        );
        if (match && match[1]) {
          const statuses = JSON.parse(match[1]);

          return {
            success: true,
            data: Array.isArray(statuses)
              ? statuses.map(({ val, text }) => ({ val, text }))
              : [],
          };
        }
      }
    }

    return {
      success: false,
      message: "No data received",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching case types:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      data: [],
    };
  }
};

const GetAttachment = async (id) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }
    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <GetAttachment xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <attachment_id>${id}</attachment_id>
              <is_preview>true</is_preview>
            </GetAttachment>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetAttachment",
      }
    );

    const xml = response.data;
    const match = xml.match(
      /<GetAttachmentResult>([\s\S]*?)<\/GetAttachmentResult>/
    );
    if (!match) {
      throw new Error("Cannot find <GetAttachmentResult> in SOAP response.");
    }
    const attachmentObj = JSON.parse(match[1]);
    return attachmentObj;
  } catch (error) {
    console.error("Error fetching attachment:", error);
    throw error;
  }
};

const buildDateField = (name, value) => {
  if (!value) {
    return `<${name} xsi:nil="true" />`;
  }
  return `<${name}>${value}</${name}>`;
};

const OperatingAttachment = async (attachmentData) => {
  try {
    const token_id = Cookies.get("opm_token");
    if (!token_id) {
      throw new Error("Token not found in cookies. Please authenticate first.");
    }

    const response = await soapInstance.post(
      process.env.NEXT_PUBLIC_OPM_API_OFFICER,
      `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <OperatingAttachment xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${attachmentData.case_id}</case_id>
              <operating_id>${attachmentData.operating_id}</operating_id>
              <file_name>${attachmentData.file_name}</file_name>
              <file_content>${attachmentData.file_content}</file_content>
              <file_description>${
                attachmentData.file_description || ""
              }</file_description>
              <doc_type_id>${attachmentData.doc_type_id || 8}</doc_type_id>
              <doc_type>${attachmentData.doc_type || "X"}</doc_type>
              <doc_no>${attachmentData.doc_no || ""}</doc_no>
              ${buildDateField("doc_date", attachmentData.doc_date)}
              <doc_ref_no>${attachmentData.doc_ref_no || ""}</doc_ref_no>
              ${buildDateField("doc_ref_date", attachmentData.doc_ref_date)}
              <document_no>${attachmentData.document_no || ""}</document_no>
              ${buildDateField("document_date", attachmentData.document_date)}
            </OperatingAttachment>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "OperatingAttachment",
      }
    );

    // Parse response to get result
    const xml = response.data;
    const match = xml.match(
      /<OperatingAttachmentResult>([\s\S]*?)<\/OperatingAttachmentResult>/
    );

    if (match && match[1]) {
      try {
        const attachmentResult = JSON.parse(match[1]);
        return {
          success: true,
          data: attachmentResult,
          message: "Attachment uploaded successfully",
        };
      } catch (parseError) {
        console.log(
          "Could not parse attachment result as JSON, returning raw response"
        );
        return {
          success: true,
          data: match[1],
          message: "Attachment uploaded successfully",
        };
      }
    }

    return {
      success: true,
      data: response.data,
      message: "Attachment uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    throw error;
  }
};

export {
  Encode,
  GetTimelineHeader,
  GetCase,
  AddOperating,
  SetOrgSummaryResult,
  AddCase,
  GetOperatings,
  GetDistricts,
  GetSubDistricts,
  GetOperatingChannel,
  GetCaseStatus,
  GetCaseType,
  GetAttachment,
  OperatingAttachment,
};
