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

    // console.log("Token ID saved to cookie:", tokenData.token_id);

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

const AddCase = async () => {
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
              <case_code>{{case_id}}</case_code>
              <type_id>404</type_id>
              <status_id>1</status_id>
              <organization_id>${org_id}</organization_id>
              <channel_id>2</channel_id>
              <detail>ทดสอบ</detail>
              <province_id>{{province_id}}</province_id>
              <district_id>{{district_id}}</district_id>
              <subdistrict_id>{{subdistrict_id}}</subdistrict_id>
              <contact_citizen_id></contact_citizen_id>
              <contact_name>ปริสุทธิ์</contact_name>
              <contact_lastname>บัวแก้ว</contact_lastname>
              <contact_telephone>0864603371</contact_telephone>
              <created_date>${created_date}</created_date>
              <updated_date>${updated_date}</updated_date>
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

export {
  Encode,
  GetTimelineHeader,
  GetCase,
  AddOperating,
  SetOrgSummaryResult,
  AddCase,
};
