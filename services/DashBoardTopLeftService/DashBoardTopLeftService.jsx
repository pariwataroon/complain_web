import React, { useRef, useState, useMemo, useEffect } from "react";
import { Box } from "@mui/material";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import mapDataThailand from "@highcharts/map-collection/countries/th/th-all.geo.json";
import SelectField from "@services/SelectField/SelectField";

const provinceValues = {
  2564: [
    { "hc-key": "th-ct", value: 1 },
    { "hc-key": "th-kr", value: 2 },
    { "hc-key": "th-kk", value: 3 },
    { "hc-key": "th-cm", value: 4 },
    { "hc-key": "th-st", value: 5 },
    { "hc-key": "th-sa", value: 6 },
    { "hc-key": "th-tg", value: 7 },
    { "hc-key": "th-tt", value: 8 },
    { "hc-key": "th-pl", value: 9 },
    { "hc-key": "th-ps", value: 10 },
    { "hc-key": "th-kp", value: 11 },
    { "hc-key": "th-sb", value: 12 },
    { "hc-key": "th-pi", value: 13 },
    { "hc-key": "th-pr", value: 14 },
    { "hc-key": "th-np", value: 15 },
    { "hc-key": "th-nw", value: 16 },
    { "hc-key": "th-pk", value: 17 },
    { "hc-key": "th-sk", value: 18 },
    { "hc-key": "th-sr", value: 19 },
    { "hc-key": "th-pn", value: 20 },
    { "hc-key": "th-pt", value: 21 },
    { "hc-key": "th-nb", value: 22 },
    { "hc-key": "th-pm", value: 23 },
    { "hc-key": "th-yu", value: 24 },
    { "hc-key": "th-lp", value: 25 },
    { "hc-key": "th-md", value: 26 },
    { "hc-key": "th-sp", value: 27 },
    { "hc-key": "th-py", value: 28 },
    { "hc-key": "th-nr", value: 29 },
    { "hc-key": "th-no", value: 30 },
    { "hc-key": "th-su", value: 31 },
    { "hc-key": "th-sn", value: 32 },
    { "hc-key": "th-sm", value: 33 },
    { "hc-key": "th-sg", value: 34 },
    { "hc-key": "th-cn", value: 35 },
    { "hc-key": "th-re", value: 36 },
    { "hc-key": "th-at", value: 37 },
    { "hc-key": "th-le", value: 38 },
    { "hc-key": "th-ud", value: 39 },
    { "hc-key": "th-ns", value: 40 },
    { "hc-key": "th-nk", value: 41 },
    { "hc-key": "th-bu", value: 42 },
    { "hc-key": "th-sv", value: 43 },
    { "hc-key": "th-br", value: 44 },
    { "hc-key": "th-pc", value: 45 },
    { "hc-key": "th-si", value: 46 },
    { "hc-key": "th-ay", value: 47 },
    { "hc-key": "th-nt", value: 48 },
    { "hc-key": "th-pb", value: 49 },
    { "hc-key": "th-rs", value: 50 },
    { "hc-key": "th-nn", value: 51 },
    { "hc-key": "th-cy", value: 52 },
    { "hc-key": "th-un", value: 53 },
    { "hc-key": "th-ms", value: 54 },
    { "hc-key": "th-rt", value: 55 },
    { "hc-key": "th-ub", value: 56 },
    { "hc-key": "th-rb", value: 57 },
    { "hc-key": "th-ph", value: 58 },
    { "hc-key": "th-bk", value: 59 },
    { "hc-key": "th-nv", value: 60 },
    { "hc-key": "th-ma", value: 61 },
    { "hc-key": "th-bl", value: 62 },
    { "hc-key": "th-ch", value: 63 },
    { "hc-key": "th-ta", value: 64 },
    { "hc-key": "th-pa", value: 65 },
    { "hc-key": "th-rg", value: 66 },
    { "hc-key": "th-ys", value: 67 },
    { "hc-key": "th-bm", value: 68 },
  ],
  2565: [
    { "hc-key": "th-ta", value: 64 },
    { "hc-key": "th-pa", value: 65 },
    { "hc-key": "th-rg", value: 66 },
    { "hc-key": "th-ys", value: 67 },
    { "hc-key": "th-bm", value: 68 },
  ],
  2566: [
    { "hc-key": "th-ta", value: 64 },
    { "hc-key": "th-pa", value: 65 },
    { "hc-key": "th-rg", value: 66 },
    { "hc-key": "th-ys", value: 67 },
    { "hc-key": "th-bm", value: 68 },
  ],
  2567: [
    { "hc-key": "th-ct", value: 1 },
    { "hc-key": "th-kr", value: 2 },
    { "hc-key": "th-kk", value: 3 },
    { "hc-key": "th-cm", value: 4 },
    { "hc-key": "th-st", value: 5 },
    { "hc-key": "th-sa", value: 6 },
    { "hc-key": "th-tg", value: 7 },
    { "hc-key": "th-tt", value: 8 },
    { "hc-key": "th-pl", value: 9 },
    { "hc-key": "th-ps", value: 10 },
    { "hc-key": "th-kp", value: 11 },
    { "hc-key": "th-sb", value: 12 },
    { "hc-key": "th-pi", value: 13 },
    { "hc-key": "th-pr", value: 14 },
    { "hc-key": "th-np", value: 15 },
    { "hc-key": "th-nw", value: 16 },
    { "hc-key": "th-pk", value: 17 },
    { "hc-key": "th-sk", value: 18 },
    { "hc-key": "th-sr", value: 19 },
    { "hc-key": "th-pn", value: 20 },
    { "hc-key": "th-pt", value: 21 },
    { "hc-key": "th-nb", value: 22 },
    { "hc-key": "th-pm", value: 23 },
    { "hc-key": "th-yu", value: 24 },
    { "hc-key": "th-lp", value: 25 },
    { "hc-key": "th-md", value: 26 },
    { "hc-key": "th-sp", value: 27 },
    { "hc-key": "th-py", value: 28 },
    { "hc-key": "th-nr", value: 29 },
    { "hc-key": "th-no", value: 30 },
    { "hc-key": "th-su", value: 31 },
    { "hc-key": "th-sn", value: 32 },
    { "hc-key": "th-sm", value: 33 },
    { "hc-key": "th-sg", value: 34 },
    { "hc-key": "th-cn", value: 35 },
    { "hc-key": "th-re", value: 36 },
    { "hc-key": "th-at", value: 37 },
    { "hc-key": "th-le", value: 38 },
    { "hc-key": "th-ud", value: 39 },
    { "hc-key": "th-ns", value: 40 },
    { "hc-key": "th-nk", value: 41 },
    { "hc-key": "th-bu", value: 42 },
    { "hc-key": "th-sv", value: 43 },
    { "hc-key": "th-br", value: 44 },
    { "hc-key": "th-pc", value: 45 },
    { "hc-key": "th-si", value: 46 },
    { "hc-key": "th-ay", value: 47 },
    { "hc-key": "th-nt", value: 48 },
    { "hc-key": "th-pb", value: 49 },
    { "hc-key": "th-rs", value: 50 },
    { "hc-key": "th-nn", value: 51 },
    { "hc-key": "th-cy", value: 52 },
    { "hc-key": "th-un", value: 53 },
    { "hc-key": "th-ms", value: 54 },
    { "hc-key": "th-rt", value: 55 },
    { "hc-key": "th-ub", value: 56 },
    { "hc-key": "th-rb", value: 57 },
    { "hc-key": "th-ph", value: 58 },
    { "hc-key": "th-bk", value: 59 },
    { "hc-key": "th-nv", value: 60 },
    { "hc-key": "th-ma", value: 61 },
    { "hc-key": "th-bl", value: 62 },
    { "hc-key": "th-ch", value: 63 },
    { "hc-key": "th-ta", value: 64 },
    { "hc-key": "th-pa", value: 65 },
    { "hc-key": "th-rg", value: 66 },
    { "hc-key": "th-ys", value: 67 },
    { "hc-key": "th-bm", value: 68 },
  ],
};

const hcKeyToThaiName = {
  "th-ct": "ชัยนาท",
  "th-kr": "กระบี่",
  "th-kk": "ขอนแก่น",
  "th-cm": "เชียงใหม่",
  "th-st": "สตูล",
  "th-sa": "สิงห์บุรี",
  "th-tg": "ตรัง",
  "th-tt": "ตราด",
  "th-pl": "พัทลุง",
  "th-ps": "พังงา",
  "th-kp": "กำแพงเพชร",
  "th-sb": "สระบุรี",
  "th-pi": "พิจิตร",
  "th-pr": "ปราจีนบุรี",
  "th-np": "นครปฐม",
  "th-nw": "นครสวรรค์",
  "th-pk": "พะเยา",
  "th-sk": "สกลนคร",
  "th-sr": "สุรินทร์",
  "th-pn": "พิษณุโลก",
  "th-pt": "เพชรบูรณ์",
  "th-nb": "นนทบุรี",
  "th-pm": "พัทลุง",
  "th-yu": "ยะลา",
  "th-lp": "ลำพูน",
  "th-md": "แม่ฮ่องสอน",
  "th-sp": "สมุทรปราการ",
  "th-py": "พะเยา",
  "th-nr": "นราธิวาส",
  "th-no": "หนองคาย",
  "th-su": "สุพรรณบุรี",
  "th-sn": "สกลนคร",
  "th-sm": "สมุทรสงคราม",
  "th-sg": "สงขลา",
  "th-cn": "เชียงราย",
  "th-re": "ร้อยเอ็ด",
  "th-at": "อ่างทอง",
  "th-le": "เลย",
  "th-ud": "อุดรธานี",
  "th-ns": "นครศรีธรรมราช",
  "th-nk": "หนองบัวลำภู",
  "th-bu": "บุรีรัมย์",
  "th-sv": "สระแก้ว",
  "th-br": "บึงกาฬ",
  "th-pc": "เพชรบุรี",
  "th-si": "สิงห์บุรี",
  "th-ay": "พระนครศรีอยุธยา",
  "th-nt": "นครนายก",
  "th-pb": "ปทุมธานี",
  "th-rs": "ระนอง",
  "th-nn": "นนทบุรี",
  "th-cy": "ชัยภูมิ",
  "th-un": "อุทัยธานี",
  "th-ms": "สมุทรสาคร",
  "th-rt": "ราชบุรี",
  "th-ub": "อุบลราชธานี",
  "th-rb": "ระยอง",
  "th-ph": "พังงา",
  "th-bk": "กรุงเทพมหานคร",
  "th-nv": "น่าน",
  "th-ma": "มหาสารคาม",
  "th-bl": "ลพบุรี",
  "th-ch": "ชลบุรี",
  "th-ta": "ตาก",
  "th-pa": "ปัตตานี",
  "th-rg": "ราชบุรี",
  "th-ys": "ยะลา",
  "th-bm": "กรุงเทพมหานคร",
};

const yearOptions = [
  { value: "2564", label: "2564" },
  { value: "2565", label: "2565" },
  { value: "2566", label: "2566" },
  { value: "2567", label: "2567" },
];

const TopLeftService = () => {
  const chartRef = useRef(null);
  const [selectedStartYear, setSelectedStartYear] = useState("2564");
  const [selectedEndYear, setSelectedEndYear] = useState("2567");
  const [selectedProvince, setSelectedProvince] = useState("ทั้งหมด");

  const localizedMapDataThailand = useMemo(() => {
  const newMap = JSON.parse(JSON.stringify(mapDataThailand));
    newMap.features = newMap.features.filter(f =>
      hcKeyToThaiName[f.properties["hc-key"]]
    );
    newMap.features.forEach((f) => {
      const key = f.properties["hc-key"];
      f.properties.name = hcKeyToThaiName[key];
      f.id = key; 
    });
    return newMap;
  }, []);

  const activeProvinceKeys = useMemo(() => {
    const keys = new Set();
    Object.values(provinceValues).forEach((yearData) => {
      yearData.forEach((item) => keys.add(item["hc-key"]));
    });
    return keys;
  }, []);
    console.log(localizedMapDataThailand.features.map(f => ({
    key: f.properties["hc-key"],
    name: f.properties.name
  })));

  const provinceOptions = useMemo(() => {
    return [
      { value: "ทั้งหมด", label: "ทั้งหมด" },
      ...localizedMapDataThailand.features
        .filter((f) => activeProvinceKeys.has(f.properties["hc-key"]))
        .map((f) => ({
          value: f.properties["hc-key"],
          label: hcKeyToThaiName[f.properties["hc-key"]] || f.properties.name,
        })),
    ];
  }, [activeProvinceKeys, localizedMapDataThailand]);

  const mergedData = useMemo(() => {
    const dataMap = {};
    for (
      let year = parseInt(selectedStartYear);
      year <= parseInt(selectedEndYear);
      year++
    ) {
      provinceValues[year]?.forEach((item) => {
        dataMap[item["hc-key"]] = (dataMap[item["hc-key"]] || 0) + item.value;
      });
    }

    let result = Object.entries(dataMap).map(([key, value]) => ({
      "hc-key": key,
      value,
    }));

    if (selectedProvince !== "ทั้งหมด") {
      result = result.filter((item) => item["hc-key"] === selectedProvince);
    }

    return result;
  }, [selectedStartYear, selectedEndYear, selectedProvince]);

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
              return this.point.name;
            },
            align: 'center',
            verticalAlign: 'middle',
            style: {
              fontSize: '10px',
              textOutline: 'none',
            },
          },
          tooltip: {
            pointFormat: "{point.name}: <b>{point.value}</b>",
          },
        },
      ],
    }),
    [mergedData, selectedStartYear, selectedEndYear, localizedMapDataThailand]
  );

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

  return (
    <Box>
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
