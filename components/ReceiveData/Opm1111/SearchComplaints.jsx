import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import DetailOPM from "@services/DetailOPM/DetailOPM";
import { GetCase } from "@pages/api/opm/opm";

const SearchComplaints = () => {
  const router = useRouter();
  const queryParams = router.query;

  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        if (queryParams.id) {
          const caseResponse = await GetCase(queryParams.id);
          setCaseDetails(caseResponse);
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [queryParams.id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(parseInt(dateString.replace("/Date(", "").replace(")/", ""), 10));
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "รับเข้าข้อมูล",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111",
            url: "/admin/edit/opm1111",
          },
          {
            label: queryParams.id || "กำลังโหลด...",
          },
        ]}
      />

      <DetailOPM
        params={queryParams.id}
        caseDetails={caseDetails}
        loading={loading}
        formatDate={formatDate}
      />
    </>
  );
};

export default SearchComplaints;