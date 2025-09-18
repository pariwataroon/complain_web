import axiosInstance from "@pages/api/axiosInstance";

//!! 1
const GetMapJSONThailandMapData = async () => {
  try {
    const response = await axiosInstance.get("/dashboard/map-json?json_path");

    if (response?.data?.res_code === "0000" && response?.data?.res_data) {
      const { hcKeyToThaiName, provinceValues, yearOptions } =
        response.data.res_data;

      const processedProvinceValues = {};
      Object.entries(provinceValues).forEach(([year, provinces]) => {
        processedProvinceValues[year] = provinces.map((province) => ({
          hcKey: province["hc-key"],
          value: province.value,
          provinceName: hcKeyToThaiName[province["hc-key"]] || "ไม่ระบุ",
        }));
      });

      const provinceOptions = [
        { value: "ทั้งหมด", label: "ทั้งหมด" },
        ...Object.entries(hcKeyToThaiName).map(([hcKey, provinceName]) => ({
          value: hcKey,
          label: provinceName,
          hcKey: hcKey,
        })),
      ];

      provinceOptions.sort((a, b) => {
        if (a.value === "ทั้งหมด") return -1;
        if (b.value === "ทั้งหมด") return 1;
        return a.label.localeCompare(b.label, "th");
      });

      const processedYearOptions = yearOptions.map((option) => ({
        value: option.value,
        label: option.label,
        buddhist: true,
      }));

      const statistics = {
        totalProvinces: Object.keys(hcKeyToThaiName).length,
        availableYears: yearOptions.length,
        dataByYear: {},
      };

      Object.entries(provinceValues).forEach(([year, provinces]) => {
        const total = provinces.reduce((sum, p) => sum + p.value, 0);
        const provincesWithData = provinces.filter((p) => p.value > 0).length;
        const maxValue = Math.max(...provinces.map((p) => p.value));

        statistics.dataByYear[year] = {
          total,
          provincesWithData,
          maxValue,
          avgValue:
            provincesWithData > 0 ? (total / provincesWithData).toFixed(2) : 0,
        };
      });

      return {
        success: true,
        hcKeyToThaiName,
        provinceValues: processedProvinceValues,
        provinceOptions,
        yearOptions: processedYearOptions,
        statistics,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        hcKeyToThaiName: {},
        provinceValues: {},
        provinceOptions: [{ value: "ทั้งหมด", label: "ทั้งหมด" }],
        yearOptions: [],
        statistics: null,
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching map data:", error);

    return {
      success: false,
      hcKeyToThaiName: {},
      provinceValues: {},
      provinceOptions: [{ value: "ทั้งหมด", label: "ทั้งหมด" }],
      yearOptions: [],
      statistics: null,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      raw: null,
    };
  }
};

//!! 2
const GetComplaintSummary = async (filterParams = null) => {
  try {
    const currentYearCE = new Date().getFullYear();

    const toInt = (v) =>
      v == null ? null : parseInt(String(v).replace(/[^\d]/g, ""), 10);

    const toCE = (y) => {
      const n = toInt(y);
      if (!n) return null;
      return n >= 2400 ? n - 543 : n;
    };

    const toTH = (y) => {
      const n = toInt(y);
      if (!n) return null;
      return n >= 2400 ? n : n + 543;
    };

    let urlParams = new URLSearchParams();

    if (filterParams) {
      switch (filterParams.mode) {
        case "monthly": {
          urlParams.append("period_type", "monthly");
          urlParams.append("year", toCE(filterParams.year) ?? currentYearCE);

          const monthMap = {
            "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
            "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
            "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
          };
          if (filterParams.month && monthMap[filterParams.month]) {
            urlParams.append("month", monthMap[filterParams.month]);
          }
          break;
        }

        case "quarterly": {
          urlParams.append("period_type", "quarterly");
          urlParams.append("year", toCE(filterParams.year) ?? currentYearCE);

          const quarterMap = {
            "ไตรมาสที่ 1": 1, "ไตรมาสที่ 2": 2, "ไตรมาสที่ 3": 3, "ไตรมาสที่ 4": 4,
          };
          if (filterParams.quarter && quarterMap[filterParams.quarter]) {
            urlParams.append("quarter", quarterMap[filterParams.quarter]);
          }
          break;
        }

        case "yearly": {
          urlParams.append("period_type", "yearly");
          urlParams.append("year", toCE(filterParams.year) ?? currentYearCE);
          break;
        }

        case "department": 
        case "compare": {
          urlParams.append("period_type", "compare");
          urlParams.append("year", toCE(filterParams.toYear ?? filterParams.year) ?? currentYearCE);
          urlParams.append(
            "compare_year",
            toCE(filterParams.fromYear) ??
              ((toCE(filterParams.toYear ?? filterParams.year) ?? currentYearCE) - 1)
          );
          break;
        }

        default:
          break;
      }
    }

    const apiUrl = urlParams.toString()
      ? `/dashboard/summary?${urlParams.toString()}`
      : "/dashboard/summary";

    const response = await axiosInstance.get(apiUrl);

    if (response?.data?.res_code === "0000" && response?.data?.res_data) {
      const resd = response?.data?.res_data || {};
      const summary = resd?.summary || null;
      const latest_month_by_department = resd?.latest_month_by_department || null;
      const date_range_bangkok =
        resd?.date_range_bangkok || latest_month_by_department?.date_range_bangkok || null;
      const chart_data = resd?.chart_data || null;

      const baseToYearCE =
        toCE(filterParams?.toYear ?? filterParams?.year) ??
        toCE(resd?.year) ??
        currentYearCE;

      const compareCE =
        toCE(filterParams?.fromYear) ??
        summary?.yoy?.compare_with_year ??
        toCE(resd?.compare_year) ??
        (baseToYearCE - 1);

      const cards = [
        {
          id: "total",
          title: "เรื่องราวร้องทุกข์ทั้งหมด",
          count: Number(summary?.total ?? 0),
          unit: "เรื่อง",
          gradient: "cardBrown",
          trend: summary?.yoy?.total?.pct_change_label || "0%",
          trendValue: summary?.yoy?.total?.diff ?? 0,
          compareYear: toTH(compareCE),
          compareYearCE: compareCE,
          isPositive: (summary?.yoy?.total?.diff ?? 0) >= 0,
          previousValue: summary?.yoy?.total?.previous ?? 0,
          currentValue: summary?.yoy?.total?.current ?? Number(summary?.total ?? 0),
        },
        {
          id: "completed",
          title: "เรื่องราวร้องทุกข์ยุติ",
          count: Number(summary?.completed ?? 0),
          unit: "เรื่อง",
          gradient: "cardBlue",
          trend: summary?.yoy?.completed?.pct_change_label || "0%",
          trendValue: summary?.yoy?.completed?.diff ?? 0,
          compareYear: toTH(compareCE),
          compareYearCE: compareCE,
          isPositive: (summary?.yoy?.completed?.diff ?? 0) >= 0,
          previousValue: summary?.yoy?.completed?.previous ?? 0,
          currentValue:
            summary?.yoy?.completed?.current ?? Number(summary?.completed ?? 0),
        },
        {
          id: "in_progress",
          title: "เรื่องราวร้องทุกข์ดำเนินการ",
          count: Number(summary?.in_progress ?? 0),
          unit: "เรื่อง",
          gradient: "cardPink",
          trend: summary?.yoy?.in_progress?.pct_change_label || "0%",
          trendValue: summary?.yoy?.in_progress?.diff ?? 0,
          compareYear: toTH(compareCE),
          compareYearCE: compareCE,
          isPositive: (summary?.yoy?.in_progress?.diff ?? 0) >= 0,
          previousValue: summary?.yoy?.in_progress?.previous ?? 0,
          currentValue:
            summary?.yoy?.in_progress?.current ?? Number(summary?.in_progress ?? 0),
        },
      ];

      let departmentData = [];
      if (latest_month_by_department?.items) {
        departmentData = latest_month_by_department.items.map((item, index) => ({
          id: item.id,
          name: item.name,
          count: Number(item.count ?? 0),
          percent: Number(item.percent ?? 0),
          formattedPercent: `${Number(item.percent ?? 0).toFixed(2)}%`,
          rank: index + 1,
        }));
      } else if (chart_data?.monthly_breakdown) {
        const monthlyTotals = chart_data.monthly_breakdown
          .filter((m) => Number(m.total ?? 0) > 0)
          .map((m, index) => ({
            id: `month-${m.month}`,
            name: m.month_name,
            count: Number(m.total ?? 0),
            percent: 0,
            formattedPercent: "0%",
            rank: index + 1,
          }));
        const totalCount = monthlyTotals.reduce((s, i) => s + i.count, 0);
        departmentData = totalCount
          ? monthlyTotals.map((i) => ({
              ...i,
              percent: (i.count / totalCount) * 100,
              formattedPercent: `${((i.count / totalCount) * 100).toFixed(2)}%`,
            }))
          : monthlyTotals;
      }

      return {
        success: true,
        dashboardCards: cards,
        departmentData,
        compareWithYear: toTH(compareCE),
        dateRange: date_range_bangkok ?? null,
        latestMonthTotal: Number(
          latest_month_by_department?.total ?? summary?.total ?? 0
        ), // จุดที่เคยพัง แก้ให้มี default
        latestMonthRange:
          latest_month_by_department?.date_range_bangkok ??
          date_range_bangkok ??
          null,
        chartData: chart_data || null,
        periodType: resd?.period_type ?? null,
        year: resd?.year ?? null,      
        quarter: resd?.quarter ?? null,
        month: resd?.month ?? null,
        raw: response.data,
      };
    }

    return {
      success: false,
      dashboardCards: [],
      departmentData: [],
      message: response?.data?.res_message || "ไม่พบข้อมูล",
      raw: response?.data,
    };
  } catch (error) {
    console.error("Error fetching complaint summary:", error);
    return {
      success: false,
      dashboardCards: [],
      departmentData: [],
      error: error?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
};

//!! 3
const GetNameDepartments = async () => {
  try {
    const response = await axiosInstance.get("/departments");

    if (response?.data?.res_code === "0000" && response?.data?.res_data) {
      const departments = response.data.res_data;

      const departmentOptions = departments
        .filter((dept) => dept.is_active)
        .map((dept) => ({
          id: dept.id,
          name: dept.name,
          shortName: dept.short_name,
          code: dept.code,
          value: dept.id,
          label: dept.name,
          groupName: dept.group?.name || "อื่นๆ",
          orderIndex: dept.order_index,
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const groupedDepartments = departmentOptions.reduce((groups, dept) => {
        const groupName = dept.groupName;
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(dept);
        return groups;
      }, {});

      return {
        success: true,
        departments: departmentOptions,
        groupedDepartments,
        totalCount: departmentOptions.length,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        departments: [],
        groupedDepartments: {},
        totalCount: 0,
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching departments:", error);

    return {
      success: false,
      departments: [],
      groupedDepartments: {},
      totalCount: 0,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      raw: null,
    };
  }
};



const GetDonutChartComplaintTypes = async (year, departmentId) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/donut/types?year=${year}&department_id=${departmentId}`
    );

    if (response?.data?.res_code === "0000" && response?.data?.res_data) {
      const data = response.data.res_data;

      return {
        success: true,
        data: data,
        total: data.total || 0,
        isEmpty: (data.total || 0) === 0,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        data: [],
        total: 0,
        isEmpty: true,
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching complaint types:", error);

    return {
      success: false,
      data: [],
      total: 0,
      isEmpty: true,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      raw: null,
    };
  }
};

//!! 4
const GetDonutChartChannels = async (year) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/donut/channels?year=${year}`
    );

    if (
      response?.data?.res_code === "0000" &&
      response?.data?.res_data?.items
    ) {
      const chartData = response.data.res_data.items.map((item, index) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        percent: item.percent,
        label: `${item.name} (${item.value})`,
        formattedPercent: `${item.percent.toFixed(2)}%`,
      }));

      return {
        success: true,
        data: chartData,
        total: response.data.res_data.total,
        filters: response.data.res_data.filters,
        dateRange: response.data.res_data.date_range_bangkok,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        data: [],
        total: 0,
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching donut chart channels:", error);

    return {
      success: false,
      data: [],
      total: 0,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      raw: null,
    };
  }
};

//!! 5
const GetDepartmentRanking = async (
  date_from,
  date_to,
  limit_top,
  limit_bottom
) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/departments/ranking?date_from=${date_from}&date_to=${date_to}&limit_top=${limit_top}&limit_bottom=${limit_bottom}`
    );
    const data = response?.data?.res_data;

    if (!data) {
      return {
        filters: {},
        totals: {},
        departments: [],
        provinces: [],
      };
    }

    const allDepartments = [
      ...(data.top_departments || []),
      ...(data.bottom_departments || []),
    ];

    const uniqueDepartments = allDepartments.reduce((acc, current) => {
      const existingDept = acc.find(
        (dept) => dept.department.id === current.department.id
      );
      if (!existingDept) {
        acc.push(current);
      }
      return acc;
    }, []);

    uniqueDepartments.sort((a, b) => b.count - a.count);

    const provinces = (data.top_provinces || []).map((prov) => ({
      rank: prov.rank,
      provinceId: prov.province.id,
      provinceName: prov.province.name,
      complaintCount: prov.count,
    }));

    return {
      filters: data.filters,
      totals: data.totals,
      departments: uniqueDepartments.map((dept, index) => ({
        rank: index + 1,
        departmentId: dept.department.id,
        departmentName: dept.department.name,
        complaintCount: dept.count,
      })),
      provinces: provinces,
    };

  } catch (error) {
    console.error("Error fetching department ranking:", error);
    throw error;
  }
};

export {
  GetMapJSONThailandMapData,
  GetComplaintSummary,
  GetDonutChartComplaintTypes,
  GetDonutChartChannels,
  GetDepartmentRanking,
  GetNameDepartments,
};
