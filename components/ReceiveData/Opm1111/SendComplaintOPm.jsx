import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import SelectFieldPAAOPM from "@services/SelectFieldPAAOPM/SelectFieldPAAOPM";

const SendComplaintOPM = () => {
  const router = useRouter();
  const queryParams = router.query;
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleProvinceChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedProvince(newValue);
    setSelectedDistrict("");
    setSelectedSubDistrict("");
  }, []);

  const handleDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedDistrict(newValue);
    setSelectedSubDistrict("");
  }, []);

  const handleSubDistrictChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedSubDistrict(newValue);
  }, []);

  const handleChannelChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedChannel(newValue);
  }, []);
  
  const handleStatusChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedStatus(newValue);
    console.log("Selected Status ID:", newValue);
  }, []);

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
            label: "ส่งเรื่องร้องทุกข์ไปช่องทาง สปน.",
          },
        ]}
      />

      <SelectFieldPAAOPM
        label="จังหวัด"
        name="province"
        placeholder="เลือกจังหวัด"
        value={selectedProvince}
        onChange={handleProvinceChange}
        required={true}
      />

      <SelectFieldPAAOPM
        label="อำเภอ"
        name="district"
        placeholder="เลือกอำเภอ"
        value={selectedDistrict}
        onChange={handleDistrictChange}
        disabled={!selectedProvince}
        selectedProvince={selectedProvince}
        required={true}
      />

      <SelectFieldPAAOPM
        label="ตำบล"
        name="subdistrict"
        placeholder="เลือกตำบล"
        value={selectedSubDistrict}
        onChange={handleSubDistrictChange}
        disabled={!selectedDistrict}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
        required={true}
      />

      <SelectFieldPAAOPM
        label="ช่องทางดำเนินการ"
        name="channel"
        placeholder="เลือกช่องทางดำเนินการ"
        value={selectedChannel}
        onChange={handleChannelChange}
        required={true}
      />

      <SelectFieldPAAOPM
        label="สถานะการดำเนินการ"
        name="status"
        placeholder="เลือกสถานะการดำเนินการ"
        value={selectedStatus}
        onChange={handleStatusChange}
        required={true}
      />

    </>

  );
};

export default SendComplaintOPM;