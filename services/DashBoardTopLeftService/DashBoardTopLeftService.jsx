import React, { useRef, useState, useMemo } from "react";
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import mapDataThailand from "@highcharts/map-collection/countries/th/th-all.geo.json";


const provinceValues = {
    2564: [
        { "hc-key": "th-ct", value: 38 },
        { "hc-key": "th-pg", value: 44 },
        { "hc-key": "th-st", value: 37 },
        { "hc-key": "th-kr", value: 45 },
        { "hc-key": "th-sa", value: 41 },
        { "hc-key": "th-tg", value: 36 },
        { "hc-key": "th-tt", value: 39 },
        { "hc-key": "th-pl", value: 42 },
        { "hc-key": "th-ps", value: 40 },
        { "hc-key": "th-kp", value: 43 },
        { "hc-key": "th-pc", value: 40 },
        { "hc-key": "th-sh", value: 39 },
        { "hc-key": "th-at", value: 41 },
        { "hc-key": "th-lb", value: 37 },
        { "hc-key": "th-pa", value: 38 },
        { "hc-key": "th-np", value: 44 },
        { "hc-key": "th-sb", value: 36 },
        { "hc-key": "th-cn", value: 40 },
        { "hc-key": "th-bm", value: 50 },
        { "hc-key": "th-pt", value: 45 },
        { "hc-key": "th-no", value: 43 },
        { "hc-key": "th-sp", value: 46 },
        { "hc-key": "th-ss", value: 42 },
        { "hc-key": "th-sm", value: 40 },
        { "hc-key": "th-pe", value: 37 },
        { "hc-key": "th-cc", value: 44 },
        { "hc-key": "th-nn", value: 36 },
        { "hc-key": "th-cb", value: 47 },
        { "hc-key": "th-br", value: 38 },
        { "hc-key": "th-kk", value: 43 },
        { "hc-key": "th-ph", value: 39 },
        { "hc-key": "th-kl", value: 40 },
        { "hc-key": "th-sr", value: 41 },
        { "hc-key": "th-nr", value: 45 },
        { "hc-key": "th-si", value: 37 },
        { "hc-key": "th-re", value: 38 },
        { "hc-key": "th-le", value: 42 },
        { "hc-key": "th-nk", value: 39 },
        { "hc-key": "th-ac", value: 36 },
        { "hc-key": "th-md", value: 40 },
        { "hc-key": "th-sn", value: 41 },
        { "hc-key": "th-nw", value: 35 },
        { "hc-key": "th-pi", value: 38 },
        { "hc-key": "th-rn", value: 43 },
        { "hc-key": "th-nt", value: 45 },
        { "hc-key": "th-sg", value: 44 },
        { "hc-key": "th-pr", value: 40 },
        { "hc-key": "th-py", value: 39 },
        { "hc-key": "th-so", value: 42 },
        { "hc-key": "th-ud", value: 41 },
        { "hc-key": "th-kn", value: 38 },
        { "hc-key": "th-tk", value: 36 },
        { "hc-key": "th-ut", value: 39 },
        { "hc-key": "th-ns", value: 43 },
        { "hc-key": "th-pk", value: 45 },
        { "hc-key": "th-ur", value: 40 },
        { "hc-key": "th-sk", value: 38 },
        { "hc-key": "th-ry", value: 44 },
        { "hc-key": "th-cy", value: 41 },
        { "hc-key": "th-su", value: 37 },
        { "hc-key": "th-nf", value: 40 },
        { "hc-key": "th-bk", value: 48 },
        { "hc-key": "th-mh", value: 35 },
        { "hc-key": "th-pu", value: 50 },
        { "hc-key": "th-cp", value: 39 },
        { "hc-key": "th-yl", value: 34 },
        { "hc-key": "th-cr", value: 43 },
        { "hc-key": "th-cm", value: 47 },
        { "hc-key": "th-ln", value: 39 },
        { "hc-key": "th-na", value: 38 },
        { "hc-key": "th-lg", value: 42 },
        { "hc-key": "th-pb", value: 36 },
        { "hc-key": "th-rt", value: 45 },
        { "hc-key": "th-ys", value: 37 },
        { "hc-key": "th-ms", value: 39 },
        { "hc-key": "th-un", value: 44 },
        { "hc-key": "th-nb", value: 40 }
    ],
    2565: [
        { "hc-key": "th-bk", value: 45 },
        { "hc-key": "th-ct", value: 18 },
        { "hc-key": "th-yl", value: 9 },
        { "hc-key": "th-kr", value: 21 },
        { "hc-key": "th-pt", value: 28 },
    ],
    2566: [
        { "hc-key": "th-bk", value: 60 },
        { "hc-key": "th-ct", value: 30 },
        { "hc-key": "th-yl", value: 15 },
        { "hc-key": "th-kr", value: 25 },
        { "hc-key": "th-pt", value: 35 },
    ],
    2567: [
        { "hc-key": "th-ct", value: 38 },
        { "hc-key": "th-pg", value: 44 },
        { "hc-key": "th-st", value: 37 },
        { "hc-key": "th-kr", value: 45 },
        { "hc-key": "th-sa", value: 41 },
        { "hc-key": "th-tg", value: 36 },
        { "hc-key": "th-tt", value: 39 },
        { "hc-key": "th-pl", value: 42 },
        { "hc-key": "th-ps", value: 40 },
        { "hc-key": "th-kp", value: 43 },
        { "hc-key": "th-pc", value: 40 },
        { "hc-key": "th-sh", value: 39 },
        { "hc-key": "th-at", value: 41 },
        { "hc-key": "th-lb", value: 37 },
        { "hc-key": "th-pa", value: 38 },
        { "hc-key": "th-np", value: 44 },
        { "hc-key": "th-sb", value: 36 },
        { "hc-key": "th-cn", value: 40 },
        { "hc-key": "th-bm", value: 50 },
        { "hc-key": "th-pt", value: 45 },
        { "hc-key": "th-no", value: 43 },
        { "hc-key": "th-sp", value: 46 },
        { "hc-key": "th-ss", value: 42 },
        { "hc-key": "th-sm", value: 40 },
        { "hc-key": "th-pe", value: 37 },
        { "hc-key": "th-cc", value: 44 },
        { "hc-key": "th-nn", value: 36 },
        { "hc-key": "th-cb", value: 47 },
        { "hc-key": "th-br", value: 38 },
        { "hc-key": "th-kk", value: 43 },
        { "hc-key": "th-ph", value: 39 },
        { "hc-key": "th-kl", value: 40 },
        { "hc-key": "th-sr", value: 41 },
        { "hc-key": "th-nr", value: 45 },
        { "hc-key": "th-si", value: 37 },
        { "hc-key": "th-re", value: 38 },
        { "hc-key": "th-le", value: 42 },
        { "hc-key": "th-nk", value: 39 },
        { "hc-key": "th-ac", value: 36 },
        { "hc-key": "th-md", value: 40 },
        { "hc-key": "th-sn", value: 41 },
        { "hc-key": "th-nw", value: 35 },
        { "hc-key": "th-pi", value: 38 },
        { "hc-key": "th-rn", value: 43 },
        { "hc-key": "th-nt", value: 45 },
        { "hc-key": "th-sg", value: 44 },
        { "hc-key": "th-pr", value: 40 },
        { "hc-key": "th-py", value: 39 },
        { "hc-key": "th-so", value: 42 },
        { "hc-key": "th-ud", value: 41 },
        { "hc-key": "th-kn", value: 38 },
        { "hc-key": "th-tk", value: 36 },
        { "hc-key": "th-ut", value: 39 },
        { "hc-key": "th-ns", value: 43 },
        { "hc-key": "th-pk", value: 45 },
        { "hc-key": "th-ur", value: 40 },
        { "hc-key": "th-sk", value: 38 },
        { "hc-key": "th-ry", value: 44 },
        { "hc-key": "th-cy", value: 41 },
        { "hc-key": "th-su", value: 37 },
        { "hc-key": "th-nf", value: 40 },
        { "hc-key": "th-bk", value: 48 },
        { "hc-key": "th-mh", value: 35 },
        { "hc-key": "th-pu", value: 50 },
        { "hc-key": "th-cp", value: 39 },
        { "hc-key": "th-yl", value: 34 },
        { "hc-key": "th-cr", value: 43 },
        { "hc-key": "th-cm", value: 47 },
        { "hc-key": "th-ln", value: 39 },
        { "hc-key": "th-na", value: 38 },
        { "hc-key": "th-lg", value: 42 },
        { "hc-key": "th-pb", value: 36 },
        { "hc-key": "th-rt", value: 45 },
        { "hc-key": "th-ys", value: 37 },
        { "hc-key": "th-ms", value: 39 },
        { "hc-key": "th-un", value: 44 },
        { "hc-key": "th-nb", value: 40 }
    ],
};

const years = [2564, 2565, 2566, 2567];

const TopLeftService = () => {
    const chartRef = useRef(null);
    const [selectedStartYear, setSelectedStartYear] = useState(2564);
    const [selectedEndYear, setSelectedEndYear] = useState(2567);
    const [selectedProvince, setSelectedProvince] = useState("ทั้งหมด");

    const mergedData = useMemo(() => {
        const dataMap = {};
        for (let year = selectedStartYear; year <= selectedEndYear; year++) {
            provinceValues[year]?.forEach((item) => {
                dataMap[item["hc-key"]] =
                    (dataMap[item["hc-key"]] || 0) + item.value;
            });
        }
        return Object.entries(dataMap).map(([key, value]) => ({
            "hc-key": key,
            value,
        }));
    }, [selectedStartYear, selectedEndYear]);

    const options = useMemo(() => ({
        chart: {
            map: mapDataThailand,
            height: 1000,
        },
        title: {
            text: "",
        },
        subtitle: {
            text: "",
        },
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
                    format: "{point.name}",
                },
                tooltip: {
                    pointFormat: "{point.name}: <b>{point.value}</b>",
                },
            },
        ],
    }), [mergedData, selectedStartYear, selectedEndYear]);

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
                <FormControl size="small">
                    <InputLabel>จังหวัด</InputLabel>
                    <Select
                        value={selectedProvince}
                        label="จังหวัด"
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
                        <MenuItem value="th-bk">กรุงเทพมหานคร</MenuItem>
                        <MenuItem value="th-kr">กระบี่</MenuItem>
                        <MenuItem value="th-yl">ยะลา</MenuItem>
                        <MenuItem value="th-ct">ชัยนาท</MenuItem>
                        <MenuItem value="th-pt">ประจวบคีรีขันธ์</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small">
                    <InputLabel>ปีเริ่มต้น</InputLabel>
                    <Select
                        value={selectedStartYear}
                        label="ปีเริ่มต้น"
                        onChange={(e) => setSelectedStartYear(Number(e.target.value))}
                    >
                        {years.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small">
                    <InputLabel>ปีสิ้นสุด</InputLabel>
                    <Select
                        value={selectedEndYear}
                        label="ปีสิ้นสุด"
                        onChange={(e) => setSelectedEndYear(Number(e.target.value))}
                    >
                        {years.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <HighchartsReact
                ref={chartRef}
                constructorType={"mapChart"}
                highcharts={Highcharts}
                options={options}
            />
        </Box>
    );
};

export default TopLeftService;