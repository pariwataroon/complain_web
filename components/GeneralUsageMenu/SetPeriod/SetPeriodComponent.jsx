// SetPeriodComponent.js
import React, { useState } from "react";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs"; // ปรับ path ให้ตรงกับโปรเจ็กต์
import TextfieldService from "@services/TextfieldService/TextfieldService"; // ปรับ path ให้ตรงกับโปรเจ็กต์
import SettingsIcon from "@mui/icons-material/Settings"; // นำไอคอนจาก MUI มาใช้

const SetPeriodComponent = () => {
  const options = [
    { value: "", label: "--เลือกตัวเลือก--" },
    { value: "option1", label: "ตัวเลือกที่ 1" },
    { value: "option2", label: "ตัวเลือกที่ 2" },
    { value: "option3", label: "ตัวเลือกที่ 3" },
  ];

  // เก็บ state สำหรับ SelectMenu
  const [selectedOption, setSelectedOption] = useState({
    value: "",
    label: "",
  });

  // เก็บ state สำหรับ Textfield
  const [textValue, setTextValue] = useState("");

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    // ค้นหา label จาก options ตาม value ที่เลือก
    const option = options.find((option) => option.value === selectedValue) || {
      value: "",
      label: "",
    };
    setSelectedOption(option);
  };

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };

  // กำหนด breadcrumb items โดยส่ง icon จาก MUI
  const breadcrumbItems = [
    {
      label: "เมนูกำหนดการใช้งานทั่วไป",
      url: "/general-menu",
      icon: <SettingsIcon />,
    },
    {
      label: "กำหนดระยะเวลา",
    },
  ];

  return (
    <div style={{ padding: "1rem", background: "#f0f4fa" }}>
      {/* Breadcrumbs อยู่บนสุด */}
      <BreadcrumbsService items={breadcrumbItems} separator=">" />
      <h2>SetPeriodComponent</h2>
      <label htmlFor="select" style={{ marginRight: "0.5rem" }}>
        กรุณาเลือกตัวเลือก: {selectedOption.label}
      </label>
      <SelectMenuService
        options={options}
        handleChange={handleSelectChange}
        value={selectedOption.value}
        label="ตัวเลือก"
      />
      {/* TextfieldService สำหรับรับข้อความ */}
      <div style={{ marginTop: "1rem" }}>
        <TextfieldService
          value={textValue}
          onChange={handleTextChange}
          placeholder="test"
        />
      </div>
    </div>
  );
};

export default SetPeriodComponent;
