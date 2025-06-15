import React, { useState, useMemo, useCallback, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableFilterList from "@services/TableFilterList/TableFilterList";
import { GetComplaintsGroupedbyChannel } from "@pages/api/complaint/complaint";

const breadcrumbItems = [
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
    label: "สืบค้นเรื่องร้องเรียน",
    url: "/admin/edit/search",
  },
  { label: "คัดกรองเรื่องร้องเรียน" },
];

const ALL_CHANNELS = [
  { key: "website", name: "เว็บไซต์" },
  { key: "admin", name: "แอดมิน" },
  { key: "opm1111", name: "เว็บไซต์ opm1111" },
];

const Filteromplaints = () => {
  const [apiData, setApiData] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic options from API
  const [issueTypeOptions, setIssueTypeOptions] = useState([
    { value: "", label: "เลือกประเภทเรื่อง" }
  ]);
  const [respondentOptions, setRespondentOptions] = useState([
    { value: "", label: "เลือกผู้ถูกร้อง" }
  ]);


  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = (date.getFullYear() + 543);
      return `${day}.${month}.${year}`;
    } catch {
      return "";
    }
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {

        const response = await GetComplaintsGroupedbyChannel({
          limit: 100,
          skip: 0
        });

        if (response?.res_code === "0000" && response?.res_data) {
          const data = response.res_data;
          setApiData(data);

          // สร้าง Map ของข้อมูลที่มี
          const dataMap = new Map();
          data.groups.forEach((group) => {
            const channelName = group.complaint_channel_name.toLowerCase();
            dataMap.set(channelName, {
              title: `ช่องทางการรับเรื่อง : ${group.complaint_channel_name}`,
              complaint_channel_id: group.complaint_channel_id,
              data: group.items.map((item) => ({
                id: item.id,
                name: item.complainant_name || "-",
                issueType: item.complaint_type || "-",
                subject: item.subject || "-",
                respondentName: item.respondent_name || "-",
                docNo: item.reference_number ?
                  `${item.reference_number} (${formatDate(item.reference_date)})` :
                  "-",
                docNo2: item.reference_number2 ?
                  `${item.reference_number2} (${formatDate(item.reference_date2)})` :
                  "-",
                docNo3: item.reference_number3 ?
                  `${item.reference_number3} (${formatDate(item.reference_date3)})` :
                  "-",
                docNo4: item.reference_number4 ?
                  `${item.reference_number4} (${formatDate(item.reference_date4)})` :
                  "-",
                complaint_number: item.complaint_number,
                status: item.status,
                created_at: item.created_at,
                incident_location: item.incident_location,
                urgency_level: item.urgency_level,
                severity_level: item.severity_level,
                complaint_subtype: item.complaint_subtype,
                assigned_to: item.assigned_to
              }))
            });
          });

          // สร้างกลุ่มทั้งหมด รวมทั้งที่ไม่มีข้อมูล
          const allChannelGroups = ALL_CHANNELS.map(channel => {
            const existingData = dataMap.get(channel.name.toLowerCase()) ||
              dataMap.get(channel.key.toLowerCase());

            if (existingData) {
              return existingData;
            } else {
              // สร้างกลุ่มว่างสำหรับ channel ที่ไม่มีข้อมูล
              return {
                title: `ช่องทางการรับเรื่อง : ${channel.name}`,
                complaint_channel_id: channel.key,
                data: []
              };
            }
          });

          // เพิ่มข้อมูลจาก API ที่ไม่อยู่ใน ALL_CHANNELS
          data.groups.forEach((group) => {
            const channelName = group.complaint_channel_name.toLowerCase();
            const exists = ALL_CHANNELS.some(ch =>
              ch.name.toLowerCase() === channelName ||
              ch.key.toLowerCase() === channelName
            );

            if (!exists) {
              allChannelGroups.push({
                title: `ช่องทางการรับเรื่อง : ${group.complaint_channel_name}`,
                complaint_channel_id: group.complaint_channel_id,
                data: group.items.map((item) => ({
                  id: item.id,
                  name: item.complainant_name || "-",
                  issueType: item.complaint_type || "-",
                  subject: item.subject || "-",
                  respondentName: item.respondent_name || "-",
                  docNo: item.reference_number ?
                    `${item.reference_number} (${formatDate(item.reference_date)})` :
                    "-",
                  docNo2: item.reference_number2 ?
                    `${item.reference_number2} (${formatDate(item.reference_date2)})` :
                    "-",
                  docNo3: item.reference_number3 ?
                    `${item.reference_number3} (${formatDate(item.reference_date3)})` :
                    "-",
                  docNo4: item.reference_number4 ?
                    `${item.reference_number4} (${formatDate(item.reference_date4)})` :
                    "-",
                  complaint_number: item.complaint_number,
                  status: item.status,
                  created_at: item.created_at,
                  incident_location: item.incident_location,
                  urgency_level: item.urgency_level,
                  severity_level: item.severity_level,
                  complaint_subtype: item.complaint_subtype,
                  assigned_to: item.assigned_to
                }))
              });
            }
          });

          setAllGroups(allChannelGroups);
          setFilteredGroups(allChannelGroups);

          // Set options from API filters
          if (data.filters) {
            const typeOptions = [
              { value: "", label: "เลือกประเภทเรื่อง" },
              ...(data.filters.available_types || [])
            ];
            setIssueTypeOptions(typeOptions);

            // Generate respondent options from unique respondent names
            const uniqueRespondents = [...new Set(
              data.groups.flatMap(g =>
                g.items.map(item => item.respondent_name)
              ).filter(Boolean)
            )];

            const respondentOpts = [
              { value: "", label: "เลือกผู้ถูกร้อง" },
              ...uniqueRespondents.map(name => ({ value: name, label: name }))
            ];
            setRespondentOptions(respondentOpts);
          }

        } else {
          throw new Error(response?.res_message || "ไม่สามารถดึงข้อมูลได้");
        }
      } catch (error) {
        setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");

        // Fallback to empty structure with all channels
        const emptyChannelGroups = ALL_CHANNELS.map(channel => ({
          title: `ช่องทางการรับเรื่อง : ${channel.name}`,
          complaint_channel_id: channel.key,
          data: []
        }));

        setAllGroups(emptyChannelGroups);
        setFilteredGroups(emptyChannelGroups);
        setIssueTypeOptions([{ value: "", label: "เลือกประเภทเรื่อง" }]);
        setRespondentOptions([{ value: "", label: "เลือกผู้ถูกร้อง" }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const safeIncludes = (text, query) => {
    if (!query || query === "") return true;
    if (!text) return false;

    const textStr = String(text).toLowerCase().trim();
    const queryStr = String(query).toLowerCase().trim();

    return textStr.includes(queryStr);
  };

  const isEmpty = (value) => {
    return value === "" || value === null || value === undefined;
  };

  const exactMatch = (text, query) => {
    if (isEmpty(query)) return true;
    if (!text) return false;

    const textStr = String(text).trim();
    const queryStr = String(query).trim();

    return textStr === queryStr;
  };

  const handleSearch = useCallback(
    (filters) => {

      const { claimantName, subject, issueType, respondentName } = filters;

      // ตรวจสอบว่ามีการกรองหรือไม่
      const hasFilters =
        !isEmpty(claimantName) ||
        !isEmpty(subject) ||
        !isEmpty(issueType) ||
        !isEmpty(respondentName);

      if (!hasFilters) {
        setFilteredGroups(allGroups);
        return;
      }

      const filteredData = allGroups.map((group) => ({
        ...group,
        data: group.data.filter((item) => {
          // ชื่อผู้ร้อง - partial match
          if (
            !isEmpty(claimantName) &&
            !safeIncludes(item.name, claimantName)
          ) {
            return false;
          }

          // ชื่อเรื่อง - partial match
          if (!isEmpty(subject) && !safeIncludes(item.subject, subject)) {
            return false;
          }

          // ประเภทเรื่อง - exact match
          if (!isEmpty(issueType) && !exactMatch(item.issueType, issueType)) {
            return false;
          }

          // ชื่อผู้ถูกร้อง - partial match
          if (
            !isEmpty(respondentName) &&
            !safeIncludes(item.respondentName, respondentName)
          ) {
            return false;
          }

          return true;
        }),
      }));
      // ไม่กรองกลุ่มออก - แสดงทุกกลุ่มแม้ไม่มีข้อมูลหลังการกรอง

      setFilteredGroups(filteredData);
    },
    [allGroups ]
  );

  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '18px'
        }}>
          กำลังโหลดข้อมูล...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          <div>เกิดข้อผิดพลาด: {error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#0f67b1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableFilterList
        title="คัดกรองเรื่องร้องเรียน"
        navigateTo="/admin/edit/search/Filteromplaints"
        groups={filteredGroups}
        issueTypeOptions={issueTypeOptions}
        respondentOptions={respondentOptions}
        onSearch={handleSearch}
        loading={loading}
        totalCount={apiData?.pagination?.total || 0}
      />
    </>
  );
};

export default Filteromplaints;