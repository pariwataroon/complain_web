import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { GetComplaintByID } from "@pages/api/complaint/complaint";

export const useComplaintForm = () => {
  const router = useRouter();
  const { id } = router.query;

  // State management
  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [complaintType, setComplaintType] = useState("new");

  // Current user and datetime - ใช้ข้อมูลจริงที่คุณให้มา
  const currentUser = "vampirebeam";
  const currentDateTime = "2025-06-09 20:45:11";

  // Form methods for each section
  const generalMethods = useForm();
  const delegateMethods = useForm();
  const step2Methods = useForm();
  const step3Methods = useForm();
  const step4Methods = useForm();

  // Default data refs
  const defaultGeneralRef = useRef({});
  const defaultDelegateRef = useRef({});
  const defaultStep2Ref = useRef({});
  const defaultStep3Ref = useRef({});
  const defaultStep4Ref = useRef({});

  // Fetch complaint data
  const fetchComplaints = async (complaintId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetComplaintByID(complaintId);
      const data = res?.res_data;
      setDefaultData(data);
      console.log("🔍 Fetched complaint data:", data);

      const general = data?.step1?.general?.general || {};
      const delegate = data?.step1?.general?.delegate || null;
      const step2Data = data?.step2?.general?.individual || {};
      const step3Data = data?.step3?.general || {};
      const step4Data = data?.step4?.general || {};

      defaultGeneralRef.current = general;
      defaultDelegateRef.current = delegate;
      defaultStep2Ref.current = step2Data;
      defaultStep3Ref.current = step3Data;
      defaultStep4Ref.current = step4Data;

      generalMethods.reset(general);
      if (delegate) delegateMethods.reset(delegate);
      step2Methods.reset(step2Data);
      step3Methods.reset(step3Data);
      step4Methods.reset(step4Data);
    } catch (error) {
      console.error("❌ Load complaints failed:", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    console.log("🔄 Resetting form data...");

    generalMethods.reset(defaultGeneralRef.current);
    if (defaultDelegateRef.current) {
      delegateMethods.reset(defaultDelegateRef.current);
    }
    step2Methods.reset(defaultStep2Ref.current);
    step3Methods.reset(defaultStep3Ref.current);
    step4Methods.reset(defaultStep4Ref.current);

    // Reset complaint type
    setComplaintType("new");

    console.log("✅ Form reset completed");
  };

  // Handle complaint type change
  const handleComplaintTypeChange = (type) => {
    console.log(`🔧 Changing complaint type to: ${type}`);

    setComplaintType(type);

    // Clear other radio buttons when one is selected
    if (type === "new") {
      step3Methods.setValue("isAdditionalComplaint", false);
      step3Methods.setValue("isCommitteeComplaint", false);
      step3Methods.setValue("isNewComplaint", true);
    } else if (type === "additional") {
      step3Methods.setValue("isNewComplaint", false);
      step3Methods.setValue("isCommitteeComplaint", false);
      step3Methods.setValue("isAdditionalComplaint", true);
    } else if (type === "committee") {
      step3Methods.setValue("isNewComplaint", false);
      step3Methods.setValue("isAdditionalComplaint", false);
      step3Methods.setValue("isCommitteeComplaint", true);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log("🚀 Starting form submission...");

    try {
      // Gather all form data
      const generalData = generalMethods.getValues();
      const delegateData = delegateMethods.getValues();
      const step2Data = step2Methods.getValues();
      const step3Data = step3Methods.getValues();
      const step4Data = step4Methods.getValues();

      console.log("📊 Individual form data:");
      console.log("├── General Data:", generalData);
      console.log("├── Delegate Data:", delegateData);
      console.log("├── Step2 Data:", step2Data);
      console.log("├── Step3 Data:", step3Data);
      console.log("└── Step4 Data:", step4Data);

      // Prepare submission data
      const submitData = {
        id: defaultData?.id,
        step1: {
          general: {
            general: generalData,
            delegate: defaultDelegateRef.current ? delegateData : null,
          },
        },
        step2: {
          general: {
            individual: step2Data,
          },
        },
        step3: {
          general: {
            ...step3Data,
            complaintType: complaintType,
          },
        },
        step4: {
          general: step4Data,
        },
        updated_by: currentUser,
        updated_at: currentDateTime,
      };

      console.log("📦 Complete submission data:");
      console.log("┌─────────────────────────────────────────┐");
      console.log("│              SUBMIT DATA                │");
      console.log("└─────────────────────────────────────────┘");
      console.log(JSON.stringify(submitData, null, 2));
      console.log("┌─────────────────────────────────────────┐");
      console.log("│            END SUBMIT DATA              │");
      console.log("└─────────────────────────────────────────┘");

      // Log additional info
      console.log("📋 Submission Summary:");
      console.log(`├── ID: ${submitData.id}`);
      console.log(`├── Complaint Type: ${complaintType}`);
      console.log(`├── Updated By: ${currentUser}`);
      console.log(`├── Updated At: ${currentDateTime}`);
      console.log(`└── Has Delegate: ${!!defaultDelegateRef.current}`);

      // Navigate to next page (commented out for testing)
      // router.push({
      //   pathname: "/next-page",
      //   query: {
      //     data: JSON.stringify(submitData),
      //   },
      // });

      console.log("✅ Form submission completed successfully");
    } catch (error) {
      console.error("❌ Submit error:", error);
    }
  };

  // Retry loading data
  const retryFetch = () => {
    if (id) {
      fetchComplaints(id);
    }
  };

  // Load data when component mounts or id changes
  useEffect(() => {
    if (id) {
      fetchComplaints(id);
    }
  }, [id]);

  // Return all necessary data and functions
  return {
    // State
    defaultData,
    loading,
    error,
    complaintType,

    // Form methods
    generalMethods,
    delegateMethods,
    step2Methods,
    step3Methods,
    step4Methods,

    // Default data refs
    defaultGeneralRef,
    defaultDelegateRef,
    defaultStep2Ref,
    defaultStep3Ref,
    defaultStep4Ref,

    // Functions
    handleReset,
    handleSubmit,
    handleComplaintTypeChange,
    retryFetch,
    fetchComplaints,

    // Utilities
    currentUser,
    currentDateTime,
  };
};
