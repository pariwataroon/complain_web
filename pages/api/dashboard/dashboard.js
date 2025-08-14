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
const GetComplaintSummary = async () => {
  try {
    const response = await axiosInstance.get("/dashboard/summary");

    if (response?.data?.res_code === "0000" && response?.data?.res_data) {
      const { summary, latest_month_by_department, date_range_bangkok } =
        response.data.res_data;

      const dashboardCards = [
        {
          id: "total",
          title: "เรื่องราวร้องทุกข์ทั้งหมด",
          count: summary.total,
          unit: "เรื่อง",
          gradient: "cardBrown",
          trend: summary.yoy.total.pct_change_label,
          trendValue: summary.yoy.total.diff,
          compareYear: summary.yoy.compare_with_year.toString(),
          isPositive: summary.yoy.total.diff >= 0,
          previousValue: summary.yoy.total.previous,
          currentValue: summary.yoy.total.current,
        },
        {
          id: "completed",
          title: "เรื่องราวร้องทุกข์ยุติ",
          count: summary.completed,
          unit: "เรื่อง",
          gradient: "cardBlue",
          trend: summary.yoy.completed.pct_change_label,
          trendValue: summary.yoy.completed.diff,
          compareYear: summary.yoy.compare_with_year.toString(),
          isPositive: summary.yoy.completed.diff >= 0,
          previousValue: summary.yoy.completed.previous,
          currentValue: summary.yoy.completed.current,
        },
        {
          id: "in_progress",
          title: "เรื่องราวร้องทุกข์ดำเนินการ",
          count: summary.in_progress,
          unit: "เรื่อง",
          gradient: "cardPink",
          trend: summary.yoy.in_progress.pct_change_label,
          trendValue: summary.yoy.in_progress.diff,
          compareYear: summary.yoy.compare_with_year.toString(),
          isPositive: summary.yoy.in_progress.diff >= 0,
          previousValue: summary.yoy.in_progress.previous,
          currentValue: summary.yoy.in_progress.current,
        },
      ];

      const departmentData = latest_month_by_department.items.map(
        (item, index) => ({
          id: item.id,
          name: item.name,
          count: item.count,
          percent: item.percent,
          formattedPercent: `${item.percent.toFixed(2)}%`,
          rank: index + 1,
        })
      );

      return {
        success: true,
        dashboardCards,
        departmentData,
        compareWithYear: summary.yoy.compare_with_year,
        dateRange: date_range_bangkok,
        latestMonthTotal: latest_month_by_department.total,
        latestMonthRange: latest_month_by_department.date_range_bangkok,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        dashboardCards: [],
        departmentData: [],
        message: response?.data?.res_message || "ไม่พบข้อมูล",
        raw: response?.data,
      };
    }
  } catch (error) {
    console.error("Error fetching complaint summary:", error);
    return {
      success: false,
      dashboardCards: [],
      departmentData: [],
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
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

      const complaintTypes = (data.departments || []).map((dept, index) => ({
        id: dept.id || `dept_${index}`,
        name:
          dept.name ||
          dept.department_name ||
          dept.type_name ||
          "ไม่ระบุประเภท",
        value: dept.count || dept.complaint_count || dept.value || 0,
        percent: dept.percent || 0,
        formattedPercent: dept.percent ? `${dept.percent.toFixed(2)}%` : "0%",
        color: getComplaintTypeColor(index),
        departmentId: dept.department_id || dept.id,
        description: dept.description || "",
      }));

      const filterInfo = {
        year: data.filters?.year || year,
        departmentId: data.filters?.department_id || departmentId,
        dateRange: data.date_range_bangkok,
      };

      const statistics = {
        totalTypes: complaintTypes.length,
        totalComplaints: data.total || 0,
        maxValue:
          complaintTypes.length > 0
            ? Math.max(...complaintTypes.map((item) => item.value))
            : 0,
        avgValue:
          complaintTypes.length > 0 && data.total > 0
            ? (data.total / complaintTypes.length).toFixed(2)
            : 0,
      };

      return {
        success: true,
        data: complaintTypes,
        filterInfo,
        statistics,
        total: data.total || 0,
        isEmpty: (data.total || 0) === 0 || complaintTypes.length === 0,
        raw: response.data,
      };
    } else {
      return {
        success: false,
        data: [],
        filterInfo: null,
        statistics: null,
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
      filterInfo: null,
      statistics: null,
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

    return {
      filters: data.filters,
      totals: data.totals,
      departments: uniqueDepartments.map((dept, index) => ({
        rank: index + 1,
        departmentId: dept.department.id,
        departmentName: dept.department.name,
        complaintCount: dept.count,
      })),
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
