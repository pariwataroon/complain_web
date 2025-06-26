import soapInstance from "@pages/api/soapInstance";
import Cookies from "js-cookie";

const Encode = async () => {
  const str = "m0f#n01";
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

const GetOperatings = async (case_id) => {
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
            <GetOperatings xmlns="http://tempuri.org/">
              <token_id>${token_id}</token_id>
              <case_id>${case_id}</case_id>
              <select_org_id>${org_id}</select_org_id>
              <skip>0</skip>
              <take>1</take>
            </GetOperatings>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "GetOperatings",
      }
    );

    
    const responseAddOperating = await AddOperating(response);
    return responseAddOperating;
  } catch (error) {
    console.error("Error fetching case details:", error);
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
              <severity_id>${submitData.severity_id}</severity_id>
              <secret_id>${submitData.secret_id}</secret_id>
            </AddOperating>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "AddOperating",
      }
    );

    console.log({ response });

    return response;
  } catch (error) {
    console.error("Error fetching case details:", error);
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
              <result>${submitData.details}</result>
            </SetOrgSummaryResult>
          </soap:Body>
        </soap:Envelope>`,
      {
        soapActionSuffix: "SetOrgSummaryResult",
      }
    );

    console.log({ response });

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

    console.log({ response });

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
          console.log("Parsed sub-districts:", subDistricts);

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
    
    if (typeof xmlString === 'string') {
      if (typeof window !== 'undefined') {
        // Browser environment
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const resultElement = xmlDoc.getElementsByTagName("GetOperatingChannelResult")[0];
        
        if (resultElement && resultElement.textContent) {
          const channels = JSON.parse(resultElement.textContent);
          
          return {
            success: true,
            data: Array.isArray(channels) ? channels : [],
          };
        }
      } else {
        // Server-side environment
        const match = xmlString.match(/<GetOperatingChannelResult>(.*?)<\/GetOperatingChannelResult>/);
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
};
