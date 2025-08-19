import React, { useRef, useState, useMemo, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import mapDataThailand from "@highcharts/map-collection/countries/th/th-all.geo.json";
import SelectField from "@services/SelectField/SelectField";
import {
  GetMapJSONThailandMapData,
} from "@pages/api/dashboard/dashboard";
import {
  GetAllSelectYears,
} from "@pages/api/allselect/allselect";

const getCurrentThaiYear = () => (new Date().getFullYear() + 543).toString();

const TopLeftService = () => {
  const chartRef = useRef(null);

  const [selectedStartYear, setSelectedStartYear] = useState(getCurrentThaiYear());
  const [selectedEndYear, setSelectedEndYear] = useState(getCurrentThaiYear());
  const [selectedProvince, setSelectedProvince] = useState("ทั้งหมด");

  // API data states
  const [mapData, setMapData] = useState(null);
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch years data from API
  const fetchYearData = async () => {
    try {
      const result = await GetAllSelectYears();

      if (result.success) {
        setYearData(result);

        const years = result.yearOptions || [];
        const current = getCurrentThaiYear();
        const hasCurrent = years.some((y) => y.value === current);

        if (hasCurrent) {
          setSelectedStartYear(current);
          setSelectedEndYear(current);
        } else if (years.length > 0) {
          const latest = years[years.length - 1].value;
          setSelectedStartYear(latest);
          setSelectedEndYear(latest);
        }
      } else {
        console.warn("Failed to fetch years data:", result.message);
        const current = getCurrentThaiYear();
        setSelectedStartYear(current);
        setSelectedEndYear(current);
      }
    } catch (err) {
      console.error("Error fetching years data:", err);
      const current = getCurrentThaiYear();
      setSelectedStartYear(current);
      setSelectedEndYear(current);
    }
  };

  // Fetch map data from API
  const fetchMapData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GetMapJSONThailandMapData();

      if (result.success) {
        setMapData(result);
      } else {
        setError(result.message || result.error || "ไม่สามารถดึงข้อมูลได้");
        setMapData(null);
      }
    } catch (err) {
      console.error("Error fetching map data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setMapData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([fetchYearData(), fetchMapData()]);
    };

    fetchAllData();
  }, []);

  // Create year options from API data
  const yearOptions = useMemo(() => {
    const current = getCurrentThaiYear();
    if (!yearData?.yearOptions?.length) {
      return [{ value: current, label: current }];
    }
    return yearData.yearOptions;
  }, [yearData]);

  // Create localized map data
  const localizedMapDataThailand = useMemo(() => {
    if (!mapData?.hcKeyToThaiName) return mapDataThailand;

    const newMap = JSON.parse(JSON.stringify(mapDataThailand));
    newMap.features = newMap.features.filter(f =>
      mapData.hcKeyToThaiName[f.properties["hc-key"]]
    );
    newMap.features.forEach((f) => {
      const key = f.properties["hc-key"];
      f.properties.name = mapData.hcKeyToThaiName[key];
      f.id = key;
    });
    return newMap;
  }, [mapData]);

  // Get province options
  const provinceOptions = useMemo(() => {
    return mapData?.provinceOptions || [{ value: "ทั้งหมด", label: "ทั้งหมด" }];
  }, [mapData]);

  // Calculate merged data based on selected years and province
  const mergedData = useMemo(() => {
    if (!mapData?.provinceValues || !selectedStartYear || !selectedEndYear) return [];

    const dataMap = {};
    for (
      let year = parseInt(selectedStartYear);
      year <= parseInt(selectedEndYear);
      year++
    ) {
      const yData = mapData.provinceValues[year.toString()];
      if (yData) {
        yData.forEach((item) => {
          dataMap[item.hcKey] = (dataMap[item.hcKey] || 0) + item.value;
        });
      }
    }

    let result = Object.entries(dataMap).map(([key, value]) => ({
      "hc-key": key,
      value,
      name: mapData.hcKeyToThaiName[key] || key
    }));

    if (selectedProvince !== "ทั้งหมด") {
      result = result.filter((item) => item["hc-key"] === selectedProvince);
    }

    return result;
  }, [mapData, selectedStartYear, selectedEndYear, selectedProvince]);

  // Chart options
  const options = useMemo(
    () => ({
      chart: {
        map: localizedMapDataThailand,
        height: 740,
      },
      title: { text: "" },
      subtitle: { text: "" },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: "bottom",
        },
      },
      colorAxis: {
        min: 0,
        stops: [
          [0, '#EFEFFF'],
          [0.5, '#4A90E2'],
          [1, '#1976D2']
        ]
      },
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'bottom',
        layout: 'vertical'
      },
      series: [
        {
          data: mergedData,
          joinBy: "hc-key",
          name: `ข้อมูลรวมปี ${selectedStartYear} ถึง ${selectedEndYear}`,
          states: {
            hover: {
              color: "#BADA55",
            },
          },
          dataLabels: {
            enabled: true,
            formatter: function () {
              return this.point.value > 0 ? this.point.name : '';
            },
            align: 'center',
            verticalAlign: 'middle',
            style: {
              fontSize: '10px',
              textOutline: 'none',
              fontWeight: 'bold',
              color: '#333'
            },
          },
          tooltip: {
            pointFormat: "{point.name}: <b>{point.value} เรื่อง</b>",
          },
        },
      ],
    }),
    [mergedData, selectedStartYear, selectedEndYear, localizedMapDataThailand]
  );

  // Event handlers
  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
  };

  const handleStartYearChange = (e) => {
    const newStartYear = e.target.value;
    setSelectedStartYear(newStartYear);
    if (parseInt(newStartYear) > parseInt(selectedEndYear)) {
      setSelectedEndYear(newStartYear);
    }
  };

  const handleEndYearChange = (e) => {
    const newEndYear = e.target.value;
    setSelectedEndYear(newEndYear);
    if (parseInt(newEndYear) < parseInt(selectedStartYear)) {
      setSelectedStartYear(newEndYear);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          กำลังโหลดข้อมูลแผนที่...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" color="error">
          เกิดข้อผิดพลาด
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {error}
        </Typography>
        <Box
          component="button"
          onClick={fetchMapData}
          sx={{
            mt: 2,
            px: 3,
            py: 1,
            border: '1px solid #1976d2',
            borderRadius: 1,
            backgroundColor: 'transparent',
            color: '#1976d2',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#1976d2',
              color: 'white'
            }
          }}
        >
          ลองใหม่
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Control Panel */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 140 }}>
          <SelectField
            label="จังหวัด"
            options={provinceOptions}
            value={selectedProvince}
            onChange={handleProvinceChange}
            name="province"
          />
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <SelectField
            label="ปีเริ่มต้น"
            options={yearOptions}
            value={selectedStartYear}
            onChange={handleStartYearChange}
            name="startYear"
          />
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <SelectField
            label="ปีสิ้นสุด"
            options={yearOptions.filter(
              (year) => parseInt(year.value) >= parseInt(selectedStartYear)
            )}
            value={selectedEndYear}
            onChange={handleEndYearChange}
            name="endYear"
          />
        </Box>
      </Box>

      {/* Statistics Summary */}
      {mapData?.statistics && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              รวมทั้งหมด
            </Typography>
            <Typography variant="h6" color="primary">
              {mergedData.reduce((sum, item) => sum + item.value, 0)} เรื่อง
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              จังหวัดที่มีข้อมูล
            </Typography>
            <Typography variant="h6" color="primary">
              {mergedData.filter(item => item.value > 0).length} จังหวัด
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              สูงสุด
            </Typography>
            <Typography variant="h6" color="primary">
              {Math.max(...mergedData.map(item => item.value), 0)} เรื่อง
            </Typography>
          </Box>
        </Box>
      )}

      {/* Map Chart */}
      <HighchartsReact
        ref={chartRef}
        constructorType="mapChart"
        highcharts={Highcharts}
        options={options}
      />
    </Box>
  );
};

export default TopLeftService;