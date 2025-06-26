import axios from "axios";

const soapInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OPM_API_BASE_URL,
  headers: {
    "Content-Type": "text/xml; charset=utf-8",
    Connection: "keep-alive",
  },
});

soapInstance.interceptors.request.use(
  (config) => {
    const baseSoapAction = process.env.NEXT_PUBLIC_OPM_API_ACTION_URL;
    if (config.soapActionSuffix) {
      config.headers.SOAPAction = `${baseSoapAction}${config.soapActionSuffix}`; 
      // console.log("SOAPAction:", config.headers.SOAPAction);
    } else {
      throw new Error("SOAPAction suffix is required for SOAP requests.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

soapInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default soapInstance;