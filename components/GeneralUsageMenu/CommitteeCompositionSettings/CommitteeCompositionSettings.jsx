import React, { useState, useEffect, useRef } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import { Box, Typography, Grid, Stack } from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import SelectField from "@services/SelectField/SelectField";
import SelectFieldpositionOpts from "@services/SelectFieldpositionOpts/SelectFieldpositionOpts";
import {
  getDepartmentGroup,
  getAvailable,
  getSignatureAuthorities,
  createSignatureAuthorityGroup,
  updateSignatureAuthorityGroup,
  deleteSignatureAuthorityGroup,
} from "@pages/api/department/department";
import { GetAllSelectPositionOptions } from "@pages/api/allselect/allselect";
import { alertSuccess, alertError, showConfirm } from "@utils/Alerts";
import { translateResCode, isSuccessResCode } from "@utils/responseMessages";

const breadcrumbItems = [
  {
    label: "เมนูการใช้งานทั่วไป",
    icon: (
      <img
        src="/icons/settingico.png"
        alt="Settings Icon"
        style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
      />
    ),
  },
  { label: "กำหนดกลุ่มหน่วยงาน" },
];

const CommitteeCompositionSettings = () => {
  const router = useRouter();

  const [allPositionOptions, setAllPositionOptions] = useState([]);
  const [availablePositionOptions, setAvailablePositionOptions] = useState([]);
  const [signatoryOptions, setSignatoryOptions] = useState([]);
  const [stateEnterpriseOptions, setStateEnterpriseOptions] = useState([]);
  const [governmentOptions, setGovernmentOptions] = useState([]);
  const [otherOptions, setOtherOptions] = useState([]);
  const [otherGroupOptions, setOtherGroupOptions] = useState([]);

  const positionsLoaded = useRef(false);
  const usersLoaded = useRef(false);
  const departmentsLoaded = useRef(false);

  const [formData, setFormData] = useState({});
  const [additionalSelects, setAdditionalSelects] = useState({});
  const [signatoryBoxes, setSignatoryBoxes] = useState(2);
  const [boxSaveState, setBoxSaveState] = useState({});
  const [groupsPrefilled, setGroupsPrefilled] = useState(false);
  const [groupIdByBox, setGroupIdByBox] = useState({});

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await GetAllSelectPositionOptions();

        if (Array.isArray(res)) {
          const mapped = res.map((p, index) => {
            const baseName =
              p.name ?? p.position_name ?? p.label ?? String(p.id);
            const levelText = p.level ? ` (${p.level})` : "";
            const uniqueLabel = `${baseName}${levelText}`;
            return {
              displayLabel: uniqueLabel,
              label: uniqueLabel,
              value: p.id ?? p.value,
              rawName: baseName,
              level: p.level || "",
              description: p.description || "",
              uniqueId: p.id || `${baseName}_${p.level}_${index}`,
              uniqueKey: `${baseName}_${p.level}_${p.id}`,
              originalData: p,
              sortOrder: index,
            };
          });

          setAllPositionOptions(mapped);
          setAvailablePositionOptions(mapped);
        } else {
          console.warn("API did not return array data:", res);
          setAllPositionOptions([]);
          setAvailablePositionOptions([]);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        setAllPositionOptions([]);
        setAvailablePositionOptions([]);
      } finally {
        positionsLoaded.current = true;
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    const fetchAvailableSignatories = async () => {
      try {
        const res = await getAvailable();
        const list = Array.isArray(res?.res_data) ? res.res_data : [];
        const mapped = list.map((item) => ({
          value: item.id,
          label:
            item.full_name_with_title ||
            item.name_with_title ||
            item.full_name ||
            item.name ||
            item.label ||
            "(ไม่ระบุชื่อ)",
          fullName: item.full_name || item.name || "",
          email: item.email || "",
          departmentName:
            item.department?.name ||
            item.department_name ||
            item.dept_name ||
            "",
          raw: item,
        }));
        setSignatoryOptions(mapped);
      } catch {
        setSignatoryOptions([]);
      } finally {
        usersLoaded.current = true;
      }
    };
    fetchAvailableSignatories();
  }, []);

  function mapDepartmentsToOptions(departments) {
    if (!Array.isArray(departments)) return [];
    return departments.map((dep) => ({
      label: dep.name + (dep.short_name ? ` (${dep.short_name})` : ""),
      value: dep.id,
      short_name: dep.short_name,
      code: dep.code,
      ...dep,
    }));
  }

  // ดึง venues จาก venue_groups ของแต่ละ department ในรัฐวิสาหกิจ
  function mapAllVenueOptionsFromDepartments(departments) {
    let venues = [];
    if (!Array.isArray(departments)) return [];
    departments.forEach((dep) => {
      if (Array.isArray(dep.venue_groups)) {
        dep.venue_groups.forEach((vg) => {
          if (Array.isArray(vg.venues)) {
            venues = venues.concat(
              vg.venues.map((venue) => ({
                label:
                  venue.name +
                  (venue.short_name ? ` (${venue.short_name})` : ""),
                value: venue.id,
                short_name: venue.short_name,
                code: venue.code,
                isVenue: true,
                venue_group: vg.group_name,
                parent_department: dep.name,
                ...venue,
              }))
            );
          }
        });
      }
    });
    return venues;
  }

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getDepartmentGroup();
        if (Array.isArray(res?.res_data)) {
          const resData = res.res_data;

          // --- รัฐวิสาหกิจ ---
          const stateEnterprise = resData.find((i) => i.name === "รัฐวิสาหกิจ");
          const stateEnterpriseDepts = mapDepartmentsToOptions(
            stateEnterprise?.departments
          );

          // venues จากทุก department > venue_groups > venues
          const stateEnterpriseVenues = mapAllVenueOptionsFromDepartments(
            stateEnterprise?.departments
          );

          const stateEnterpriseOptionsCombined = [
            ...stateEnterpriseDepts,
            ...stateEnterpriseVenues,
          ];

          setStateEnterpriseOptions(stateEnterpriseOptionsCombined);

          // --- ส่วนราชการ ---
          const government = resData.find((i) => i.name === "ส่วนราชการ");
          setGovernmentOptions(
            mapDepartmentsToOptions(government?.departments)
          );

          // --- อื่น ๆ ---
          const others = resData.find((i) => i.name === "อื่น ๆ");
          setOtherOptions(mapDepartmentsToOptions(others?.departments));

          // --- group อื่น ๆ (ที่ไม่ใช่ 3 อันแรก) ---
          const exclude = ["รัฐวิสาหกิจ", "ส่วนราชการ", "อื่น ๆ"];
          const otherGroups = resData
            .filter((g) => !exclude.includes(g.name))
            .map((group) => ({
              groupName: group.name,
              label: group.name,
              options: mapDepartmentsToOptions(group.departments),
            }));
          setOtherGroupOptions(otherGroups);
        } else {
          setStateEnterpriseOptions([]);
          setGovernmentOptions([]);
          setOtherOptions([]);
          setOtherGroupOptions([]);
        }
      } catch (err) {
        console.error("Error loading departments:", err);
        setStateEnterpriseOptions([]);
        setGovernmentOptions([]);
        setOtherOptions([]);
        setOtherGroupOptions([]);
      } finally {
        departmentsLoaded.current = true;
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const ready =
      positionsLoaded.current &&
      usersLoaded.current &&
      departmentsLoaded.current &&
      !groupsPrefilled;
    if (!ready) return;

    const prefill = async () => {
      try {
        const res = await getSignatureAuthorities();
        if (!isSuccessResCode(res?.res_code)) {
          setGroupsPrefilled(true);
          return;
        }
        const groups = res?.res_data?.groups || [];
        if (groups.length === 0) {
          setGroupsPrefilled(true);
          return;
        }

        setSignatoryBoxes(groups.length);

        const newForm = {};
        const newAdditional = {};
        const newGroupMap = {};
        const usedGroupNames = new Set();

        groups.forEach((group, idx) => {
          const num = idx + 1;
          newGroupMap[num] = group.group_id;

          let positionOption = allPositionOptions.find(
            (p) =>
              p.label === group.group_name ||
              p.displayLabel === group.group_name
          );

          if (!positionOption) {
            const customId = `__custom_${group.group_id}`;
            positionOption = {
              displayLabel: group.group_name,
              label: group.group_name,
              value: customId,
              description: group.group_description || "",
              rawName: group.group_name,
              sortOrder: 999 + idx,
            };
            setAllPositionOptions((prev) => {
              if (prev.find((p) => p.value === positionOption.value))
                return prev;
              return [...prev, positionOption];
            });
          }

          newForm[`position_${num}`] = positionOption.value;
          usedGroupNames.add(positionOption.label);

          const users = group.users || [];
          if (users.length > 0) {
            newForm[`name_${num}`] = users[0].user_id;
            if (users.length > 1) {
              const key = `name_${num}`;
              newAdditional[key] = [];
              users.slice(1).forEach((u) => {
                const addId = Date.now() + Math.random();
                newAdditional[key].push(addId);
                newForm[`name_${num}_additional_${addId}`] = u.user_id;
              });
            }
          }

          const departments = group.departments || [];
          if (departments.length > 0) {
            const stateIds = [];
            const govIds = [];
            const otherIds = [];
            const dynamicGroupMap = {};

            departments.forEach((dpt) => {
              const id = dpt.department_id;
              if (stateEnterpriseOptions.some((o) => o.value === id))
                stateIds.push(id);
              else if (governmentOptions.some((o) => o.value === id))
                govIds.push(id);
              else if (otherOptions.some((o) => o.value === id))
                otherIds.push(id);
              else {
                let assigned = false;
                for (const g of otherGroupOptions) {
                  if (g.options.some((o) => o.value === id)) {
                    if (!dynamicGroupMap[g.groupName])
                      dynamicGroupMap[g.groupName] = [];
                    dynamicGroupMap[g.groupName].push(id);
                    assigned = true;
                    break;
                  }
                }
                if (!assigned) otherIds.push(id);
              }
            });

            if (stateIds.length > 0) {
              newForm[`state_enterprise_${num}`] = stateIds[0];
              if (stateIds.length > 1) {
                const key = `state_enterprise_${num}`;
                newAdditional[key] = [];
                stateIds.slice(1).forEach((id) => {
                  const addId = Date.now() + Math.random();
                  newAdditional[key].push(addId);
                  newForm[`state_enterprise_${num}_additional_${addId}`] = id;
                });
              }
            }
            if (govIds.length > 0) {
              newForm[`government_${num}`] = govIds[0];
              if (govIds.length > 1) {
                const key = `government_${num}`;
                newAdditional[key] = [];
                govIds.slice(1).forEach((id) => {
                  const addId = Date.now() + Math.random();
                  newAdditional[key].push(addId);
                  newForm[`government_${num}_additional_${addId}`] = id;
                });
              }
            }
            if (otherIds.length > 0) {
              newForm[`other1_${num}`] = otherIds[0];
              if (otherIds.length > 1) newForm[`other2_${num}`] = otherIds[1];
              if (otherIds.length > 2) {
                const key = `other_${num}`;
                newAdditional[key] = [];
                otherIds.slice(2).forEach((id) => {
                  const addId = Date.now() + Math.random();
                  newAdditional[key].push(addId);
                  newForm[`other_${num}_additional_${addId}`] = id;
                });
              }
            }
            // แก้ไขการ prefill dynamic groups
            Object.entries(dynamicGroupMap).forEach(([gName, ids]) => {
              if (!ids.length) return;
              newForm[`other_${gName}_${num}`] = ids[0];
              if (ids.length > 1) {
                const key = `other_${gName}_${num}`;
                newAdditional[key] = [];
                ids.slice(1).forEach((id) => {
                  const addId = Date.now() + Math.random();
                  newAdditional[key].push(addId);
                  newForm[`other_${gName}_${num}_additional_${addId}`] = id;
                });
              }
            });
          }
        });

        const usedValues = new Set();
        groups.forEach((group, idx) => {
          const positionOption = allPositionOptions.find(
            (p) =>
              p.label === group.group_name ||
              p.displayLabel === group.group_name
          );
          if (positionOption) {
            usedValues.add(positionOption.value);
          }
        });

        setAvailablePositionOptions((prevAvail) =>
          prevAvail.filter((opt) => !usedValues.has(opt.value))
        );

        setGroupIdByBox(newGroupMap);
        setFormData((prev) => ({ ...prev, ...newForm }));
        setAdditionalSelects((prev) => ({ ...prev, ...newAdditional }));
        setGroupsPrefilled(true);
      } catch {
        setGroupsPrefilled(true);
      }
    };

    prefill();
  }, [
    groupsPrefilled,
    allPositionOptions,
    signatoryOptions,
    stateEnterpriseOptions,
    governmentOptions,
    otherOptions,
    otherGroupOptions,
  ]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSelectMenu = (section, signatoryNumber) => {
    const sectionKey = `${section}_${signatoryNumber}`;
    setAdditionalSelects((prev) => {
      const currentSelects = prev[sectionKey] || [];
      return { ...prev, [sectionKey]: [...currentSelects, Date.now()] };
    });
  };

  const DepartmentButton = ({
    section,
    signatoryNumber,
    label = "เพิ่มผู้ลงนาม",
  }) => (
    <Box mt={1}>
      <ButtonService
        label={label}
        color="#2499FF"
        iconRight={<AddIcon />}
        variant="outlined"
        onClick={() => addSelectMenu(section, signatoryNumber)}
        sx={{
          backgroundColor: "#ffffff",
          color: "#1E88E5",
          borderRadius: "15px",
          width: "100%",
          height: "40px",
          fontSize: "14px",
          "&:hover": { backgroundColor: "#1E88E5", color: "#ffffff" },
        }}
      />
    </Box>
  );

  const addSignatoryBox = () => setSignatoryBoxes((c) => c + 1);

  // ฟังก์ชันสำหรับรวบรวมค่าที่ถูกใช้ในการ์ดเดียวกัน (ไม่ใช่การ์ดอื่น)
  const getUsedValuesInSameCard = (
    section,
    cardNumber,
    excludeFieldName = null
  ) => {
    const usedValues = new Set();

    // เก็บค่าหลัก
    const mainFieldName = `${section}_${cardNumber}`;
    const mainValue = formData[mainFieldName];
    if (mainValue && mainFieldName !== excludeFieldName) {
      usedValues.add(mainValue);
    }

    // เก็บค่าจาก additional selects ในการ์ดเดียวกัน
    const additionalKey = `${section}_${cardNumber}`;
    if (additionalSelects[additionalKey]) {
      additionalSelects[additionalKey].forEach((id) => {
        const additionalFieldName = `${section}_${cardNumber}_additional_${id}`;
        const additionalValue = formData[additionalFieldName];
        if (additionalValue && additionalFieldName !== excludeFieldName) {
          usedValues.add(additionalValue);
        }
      });
    }

    return usedValues;
  };

  // ฟังก์ชันสำหรับสร้าง options ที่กรองแล้วสำหรับแต่ละ field ในการ์ด
  const getFilteredOptionsForField = (
    section,
    cardNumber,
    allOptions,
    fieldName = null
  ) => {
    const usedValues = getUsedValuesInSameCard(section, cardNumber, fieldName);
    const currentValue = formData[fieldName] || "";

    // กรอง options ที่ไม่ได้ถูกใช้ในการ์ดเดียวกัน
    const filteredOptions = allOptions.filter(
      (option) => !usedValues.has(option.value) || option.value === currentValue
    );

    return filteredOptions;
  };

  const renderAdditionalSelects = (section, signatoryNumber) => {
    const sectionKey = `${section}_${signatoryNumber}`;
    const selects = additionalSelects[sectionKey] || [];
    let allOptions = [];

    switch (section) {
      case "name":
        allOptions = signatoryOptions;
        break;
      case "state_enterprise":
        allOptions = stateEnterpriseOptions;
        break;
      case "government":
        allOptions = governmentOptions;
        break;
      case "other":
        allOptions = otherOptions;
        break;
      default:
        // ตรวจสอบว่าเป็น dynamic group หรือไม่
        const groupName = section.replace("other_", "");
        const dynamicGroup = otherGroupOptions.find(
          (g) => g.groupName === groupName
        );
        if (dynamicGroup) {
          allOptions = dynamicGroup.options;
        } else {
          allOptions = [];
        }
    }

    return selects.map((id) => {
      const fieldName = `${section}_${signatoryNumber}_additional_${id}`;
      const currentValue = formData[fieldName] || "";

      // กรอง options สำหรับ additional select นี้ (ซ่อนที่ใช้ในการ์ดเดียวกัน)
      const filteredOptions = getFilteredOptionsForField(
        section,
        signatoryNumber,
        allOptions,
        fieldName
      );

      return (
        <Box mt={1} key={id}>
          <SelectField
            options={filteredOptions}
            value={currentValue}
            onChange={handleInputChange}
            name={fieldName}
          />
        </Box>
      );
    });
  };

  // แก้ไขฟังก์ชัน collectDepartmentIdsForBox
  const collectDepartmentIdsForBox = (i) => {
    const deptFields = new Set([
      `state_enterprise_${i}`,
      `government_${i}`,
      `other1_${i}`,
      `other2_${i}`,
    ]);

    // เพิ่ม dynamic group fields
    otherGroupOptions.forEach((g) =>
      deptFields.add(`other_${g.groupName}_${i}`)
    );

    // เพิ่ม additional fields สำหรับ basic sections
    ["state_enterprise", "government", "other"].forEach((sec) => {
      const key = `${sec}_${i}`;
      if (additionalSelects[key]) {
        additionalSelects[key].forEach((id) =>
          deptFields.add(`${sec}_${i}_additional_${id}`)
        );
      }
    });

    // เพิ่ม additional fields สำหรับ dynamic groups
    otherGroupOptions.forEach((g) => {
      const key = `other_${g.groupName}_${i}`;
      if (additionalSelects[key]) {
        additionalSelects[key].forEach((id) =>
          deptFields.add(`other_${g.groupName}_${i}_additional_${id}`)
        );
      }
    });

    // รวบรวม department IDs จากทุก fields
    const departmentIds = Array.from(deptFields)
      .map((f) => formData[f])
      .filter((v) => v && typeof v === "string" && v.trim() !== "");

    return Array.from(new Set(departmentIds));
  };

  const buildAssignmentsForBox = (i) => {
    const primaryUser = formData[`name_${i}`];
    const additionalUserKeys = Object.keys(formData).filter((k) =>
      k.startsWith(`name_${i}_additional_`)
    );
    const userIds = [
      ...(primaryUser ? [primaryUser] : []),
      ...additionalUserKeys.map((k) => formData[k]).filter(Boolean),
    ];
    if (!userIds.length) return [];
    const departmentIds = collectDepartmentIdsForBox(i);
    if (!departmentIds.length) return [];

    const assignments = userIds.map((uid) => ({
      user_id: uid,
      department_ids: departmentIds,
    }));

    return assignments;
  };

  const handleSaveBox = async (boxNumber) => {
    setBoxSaveState((prev) => ({
      ...prev,
      [boxNumber]: { saving: true, success: null, error: null },
    }));
    try {
      const positionId = formData[`position_${boxNumber}`];
      if (!positionId) {
        const msg = "กรุณาเลือกตำแหน่งก่อนบันทึก";
        setBoxSaveState((prev) => ({
          ...prev,
          [boxNumber]: { saving: false, success: null, error: msg },
        }));
        alertError("บันทึกล้มเหลว", msg);
        return;
      }
      const positionObj = allPositionOptions.find(
        (p) => p.value === positionId
      );

      // ใช้ label (ที่มี level) สำหรับ group_name
      const groupName =
        positionObj?.label || positionObj?.displayLabel || "ไม่ระบุตำแหน่ง";
      const description = positionObj?.description || "";
      const assignments = buildAssignmentsForBox(boxNumber);

      if (!assignments.length) {
        const msg = "กรุณาเลือกผู้ลงนามและหน่วยงานอย่างน้อย 1 รายการ";
        setBoxSaveState((prev) => ({
          ...prev,
          [boxNumber]: { saving: false, success: null, error: msg },
        }));
        alertError("บันทึกล้มเหลว", msg);
        return;
      }
      const payload = { group_name: groupName, description, assignments };

      const existingGroupId = groupIdByBox[boxNumber];
      let res;
      let isUpdate = false;

      if (existingGroupId) {
        isUpdate = true;
        res = await updateSignatureAuthorityGroup(existingGroupId, payload);
      } else {
        res = await createSignatureAuthorityGroup(payload);
      }

      const code = res?.res_code;
      const backendMsg = res?.res_message;
      const thaiMsg = translateResCode(code, backendMsg);

      if (isSuccessResCode(code)) {
        if (!existingGroupId) {
          const returnedGroupId =
            res?.res_data?.group_id ||
            res?.res_data?.group?.group_id ||
            res?.group_id;
          if (returnedGroupId) {
            setGroupIdByBox((prev) => ({
              ...prev,
              [boxNumber]: returnedGroupId,
            }));
            setAvailablePositionOptions((prevAvail) =>
              prevAvail.filter((opt) => opt.value !== positionId)
            );
          }
        }
        setBoxSaveState((prev) => ({
          ...prev,
          [boxNumber]: {
            saving: false,
            success: thaiMsg,
            error: null,
          },
        }));
        alertSuccess(
          isUpdate ? "อัปเดตสำเร็จ" : "สร้างสำเร็จ",
          `${thaiMsg}\n(${groupName})`
        );
      } else {
        const errText = thaiMsg || "ดำเนินการไม่สำเร็จ";
        setBoxSaveState((prev) => ({
          ...prev,
          [boxNumber]: { saving: false, success: null, error: errText },
        }));
        alertError(isUpdate ? "อัปเดตล้มเหลว" : "บันทึกล้มเหลว", errText);
      }
    } catch (e) {
      console.error("Error saving box:", e);
      const code = e?.response?.data?.res_code;
      const backendMsg =
        e?.response?.data?.res_message || e?.response?.data?.message;
      const translated = translateResCode(code, backendMsg || e.message, true);
      setBoxSaveState((prev) => ({
        ...prev,
        [boxNumber]: {
          saving: false,
          success: null,
          error: translated,
        },
      }));
      alertError("ข้อผิดพลาด", translated);
    }
  };

  // ฟังก์ชันลบกลุ่ม
  const handleDeleteBox = async (boxNumber) => {
    const existingGroupId = groupIdByBox[boxNumber];

    if (!existingGroupId) {
      // หากไม่มี group_id แสดงว่ายังไม่ได้บันทึก ให้ลบออกจาก UI เลย
      const confirmed = await showConfirm(
        "ยืนยันการลบ",
        "คุณต้องการลบกลุ่มนี้ใช่หรือไม่?",
        "ลบ",
        "ยกเลิก"
      );

      if (confirmed) {
        removeBoxFromUI(boxNumber);
        alertSuccess("ลบสำเร็จ", "ลบกลุ่มเรียบร้อยแล้ว");
      }
      return;
    }

    // ยืนยันการลบ
    const confirmed = await showConfirm(
      "ยืนยันการลบกลุ่ม",
      "คุณต้องการลบกลุ่มนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
      "ลบ",
      "ยกเลิก"
    );

    if (!confirmed) return;

    // เปลี่ยนสถานะเป็นกำลังลบ
    setBoxSaveState((prev) => ({
      ...prev,
      [boxNumber]: { deleting: true, success: null, error: null },
    }));

    try {
      const res = await deleteSignatureAuthorityGroup(existingGroupId);
      const code = res?.res_code;
      const backendMsg = res?.res_message;
      const thaiMsg = translateResCode(code, backendMsg);

      if (isSuccessResCode(code)) {
        // ลบสำเร็จ - ลบออกจาก UI
        removeBoxFromUI(boxNumber);
        alertSuccess("ลบสำเร็จ", thaiMsg || "ลบกลุ่มเรียบร้อยแล้ว");
      } else {
        const errText = thaiMsg || "ไม่สามารถลบได้";
        setBoxSaveState((prev) => ({
          ...prev,
          [boxNumber]: { deleting: false, success: null, error: errText },
        }));
        alertError("ลบล้มเหลว", errText);
      }
    } catch (e) {
      const code = e?.response?.data?.res_code;
      const backendMsg =
        e?.response?.data?.res_message || e?.response?.data?.message;
      const translated = translateResCode(code, backendMsg || e.message, true);

      setBoxSaveState((prev) => ({
        ...prev,
        [boxNumber]: {
          deleting: false,
          success: null,
          error: translated,
        },
      }));
      alertError("เกิดข้อผิดพลาด", translated);
    }
  };

  // ฟังก์ชันลบ box ออกจาก UI
  const removeBoxFromUI = (boxNumber) => {
    // ลบข้อมูลใน formData ที่เกี่ยวข้องกับ box นี้
    setFormData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (key.includes(`_${boxNumber}`)) {
          delete newData[key];
        }
      });
      return newData;
    });

    // ลบข้อมูลใน additionalSelects
    setAdditionalSelects((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (key.includes(`_${boxNumber}`)) {
          delete newData[key];
        }
      });
      return newData;
    });

    // ลบ group ID
    setGroupIdByBox((prev) => {
      const newData = { ...prev };
      delete newData[boxNumber];
      return newData;
    });

    // ลบ save state
    setBoxSaveState((prev) => {
      const newData = { ...prev };
      delete newData[boxNumber];
      return newData;
    });

    // คืนค่า position option ให้สามารถเลือกได้อีกครั้ง
    const positionId = formData[`position_${boxNumber}`];
    if (positionId) {
      const positionOption = allPositionOptions.find(
        (opt) => opt.value === positionId
      );
      if (positionOption) {
        setAvailablePositionOptions((prev) => {
          if (prev.some((opt) => opt.value === positionId)) return prev;
          return [...prev, positionOption];
        });
      }
    }

    // ลดจำนวน box ลง 1
    setSignatoryBoxes((prev) => Math.max(1, prev - 1));
  };

  const getPositionOptionsForBox = (number) => {
    const currentVal = formData[`position_${number}`];

    const optionsToReturn = !currentVal
      ? availablePositionOptions
      : (() => {
          const currentOption = allPositionOptions.find(
            (o) => o.value === currentVal
          );

          if (!currentOption) {
            return availablePositionOptions;
          }

          const existsInAvailable = availablePositionOptions.some(
            (o) => o.value === currentVal
          );

          if (existsInAvailable) {
            return availablePositionOptions;
          }

          return [currentOption, ...availablePositionOptions];
        })();

    return optionsToReturn;
  };

  const SignatoryBox = ({ number }) => {
    const saveState = boxSaveState[number] || {
      saving: false,
      deleting: false,
      success: null,
      error: null,
    };
    const assignmentsPreview = buildAssignmentsForBox(number);
    const hasPosition = !!formData[`position_${number}`];
    const disabledSave =
      saveState.saving ||
      saveState.deleting ||
      !hasPosition ||
      assignmentsPreview.length === 0;
    const disabledDelete = saveState.saving || saveState.deleting;
    const positionOpts = getPositionOptionsForBox(number);
    const existingGroupId = groupIdByBox[number];

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          borderRadius: "10px",
          border: "2px solid #2499FF",
          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
          mb: 2,
          backgroundColor: "white",
        }}
      >
        <Box
          sx={{
            width: "70px",
            background: "linear-gradient(to bottom, #2499FF, #0067B1)",
            borderTopRightRadius: "8px",
            borderBottomRightRadius: "8px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: "rotate(180deg)",
            writingMode: "vertical-lr",
            color: "white",
            fontWeight: "bold",
          }}
        >
          <Typography variant="h6">
            {existingGroupId ? `กลุ่ม ${number}` : number}
          </Typography>
        </Box>

        <Box
          sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              width: "100%",
              gap: 2,
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#0067B1",
                  fontSize: "18px",
                  mt: { xs: 0, md: 0 },
                }}
              >
                ชื่อผู้ลงนาม
              </Typography>
              <SelectField
                label="เลือกผู้ลงนาม"
                options={getFilteredOptionsForField(
                  "name",
                  number,
                  signatoryOptions,
                  `name_${number}`
                )}
                value={formData[`name_${number}`] || ""}
                onChange={handleInputChange}
                name={`name_${number}`}
              />
              {renderAdditionalSelects("name", number)}
              <DepartmentButton
                section="name"
                signatoryNumber={number}
                label="เพิ่มผู้ลงนาม"
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#0067B1",
                  fontSize: "18px",
                  mt: { xs: 0, md: 0 },
                }}
              >
                ตำแหน่ง
              </Typography>
              <SelectFieldpositionOpts
                label="เลือกตำแหน่ง"
                options={allPositionOptions}
                value={formData[`position_${number}`] || ""}
                onChange={handleInputChange}
                name={`position_${number}`}
              />
            </Box>
          </Box>

          <Box sx={{ width: "100%", marginTop: "20px" }}>
            <Grid container spacing={2} alignItems="flex-start">
              {/* หัวข้อเต็มแถว */}
              <Grid item xs={12}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "#2499FF" }}
                >
                  หน่วยงานรับผิดชอบเรื่องร้องเรียนร้องทุกข์
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: "bold", color: "#2499FF" }}>
                    ส่วนราชการ
                  </Typography>
                  <SelectField
                    label="เลือกส่วนราชการ"
                    options={getFilteredOptionsForField(
                      "government",
                      number,
                      governmentOptions,
                      `government_${number}`
                    )}
                    value={formData[`government_${number}`] || ""}
                    onChange={handleInputChange}
                    name={`government_${number}`}
                  />
                  {renderAdditionalSelects("government", number)}
                  <DepartmentButton
                    section="government"
                    signatoryNumber={number}
                    label="เพิ่มหน่วยงาน"
                  />
                </Stack>
              </Grid>

              {/* ขวา: รัฐวิสาหกิจ + อื่นๆ */}
              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: "bold", color: "#2499FF" }}>
                    รัฐวิสาหกิจ
                  </Typography>

                  <SelectField
                    label="เลือกรัฐวิสาหกิจ"
                    options={getFilteredOptionsForField(
                      "state_enterprise",
                      number,
                      stateEnterpriseOptions,
                      `state_enterprise_${number}`
                    )}
                    value={formData[`state_enterprise_${number}`] || ""}
                    onChange={handleInputChange}
                    name={`state_enterprise_${number}`}
                  />
                  {renderAdditionalSelects("state_enterprise", number)}
                  <DepartmentButton
                    section="state_enterprise"
                    signatoryNumber={number}
                    label="เพิ่มรัฐวิสาหกิจ"
                  />

                  <Typography
                    sx={{ fontWeight: "bold", color: "#2499FF", mt: 0.5 }}
                  >
                    อื่นๆ
                  </Typography>

                  <SelectField
                    label="เลือกหน่วยงานอื่นๆ"
                    options={getFilteredOptionsForField(
                      "other",
                      number,
                      otherOptions,
                      `other1_${number}`
                    )}
                    value={formData[`other1_${number}`] || ""}
                    onChange={handleInputChange}
                    name={`other1_${number}`}
                  />
                  {renderAdditionalSelects("other", number)}
                  <DepartmentButton
                    section="other"
                    signatoryNumber={number}
                    label="เพิ่มหน่วยงานอื่นๆ"
                  />

                  {/* Dynamic groups - แสดงก่อน SelectField อื่นๆ (เพิ่มเติม) */}
                  {Array.isArray(otherGroupOptions) &&
                    otherGroupOptions.length > 0 &&
                    otherGroupOptions.map((group) => (
                      <Box key={group.groupName}>
                        <SelectField
                          label={group.label}
                          options={getFilteredOptionsForField(
                            `other_${group.groupName}`,
                            number,
                            group.options,
                            `other_${group.groupName}_${number}`
                          )}
                          value={
                            formData[`other_${group.groupName}_${number}`] || ""
                          }
                          onChange={handleInputChange}
                          name={`other_${group.groupName}_${number}`}
                        />
                        {renderAdditionalSelects(
                          `other_${group.groupName}`,
                          number
                        )}
                        <DepartmentButton
                          section={`other_${group.groupName}`}
                          signatoryNumber={number}
                          label={`เพิ่ม${group.label}`}
                        />
                      </Box>
                    ))}

                  {/* SelectField อื่นๆ (เพิ่มเติม) - แสดงเฉพาะเมื่อไม่มี dynamic groups */}
                  {(!Array.isArray(otherGroupOptions) ||
                    otherGroupOptions.length === 0) && (
                    <SelectField
                      label="เลือกหน่วยงานอื่นๆ (เพิ่มเติม)"
                      options={getFilteredOptionsForField(
                        "other",
                        number,
                        otherOptions,
                        `other2_${number}`
                      )}
                      value={formData[`other2_${number}`] || ""}
                      onChange={handleInputChange}
                      name={`other2_${number}`}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <ButtonService
              label={
                saveState.saving
                  ? "กำลังบันทึก..."
                  : existingGroupId
                  ? "อัปเดตกลุ่ม"
                  : "บันทึก"
              }
              variant="contained"
              iconLeft={<SaveIcon />}
              disabled={disabledSave}
              onClick={() => handleSaveBox(number)}
              sx={{
                background: disabledSave ? "#b5c6d4" : "#2499FF",
                color: "#ffffff",
                borderRadius: "12px",
                padding: "8px 20px",
                fontSize: "15px",
                "&:hover": {
                  background: disabledSave ? "#b5c6d4" : "#0067B1",
                },
              }}
            />

            <ButtonService
              label={saveState.deleting ? "กำลังลบ..." : "ลบกลุ่ม"}
              variant="contained"
              iconLeft={<DeleteIcon />}
              disabled={disabledDelete}
              onClick={() => handleDeleteBox(number)}
              sx={{
                background: disabledDelete ? "#b5c6d4" : "#f44336",
                color: "#ffffff",
                borderRadius: "12px",
                padding: "8px 20px",
                fontSize: "15px",
                "&:hover": {
                  background: disabledDelete ? "#b5c6d4" : "#d32f2f",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 0 },
          mb: 2,
        }}
      >
        <BreadcrumbsService items={breadcrumbItems} />
        <ButtonService
          label="เพิ่มหน่วยงานในสังกัด"
          variant="outlined"
          iconLeft={<AddIcon />}
          onClick={() => router.push("/admin/settinggeneral/department/add")}
          sx={{
            background: "#0067B1",
            color: "#ffffff",
            borderRadius: "15px",
            padding: "8px 20px",
            width: { xs: "100%", sm: "auto" },
            fontSize: "16px",
            border: "2px solid #0067B1",
          }}
        />
      </Box>

      {Array.from({ length: signatoryBoxes }).map((_, index) => (
        <SignatoryBox key={index} number={index + 1} />
      ))}

      <Box mt={2} display="flex" justifyContent="center">
        <ButtonService
          label="เพิ่มกลุ่ม"
          color="#2499FF"
          iconRight={<AddIcon />}
          variant="contained"
          onClick={addSignatoryBox}
          sx={{
            backgroundColor: "#2499FF",
            color: "#ffffff",
            borderRadius: "15px",
            padding: "10px 30px",
            fontSize: "18px",
            "&:hover": { backgroundColor: "#0067B1" },
          }}
        />
      </Box>
    </Box>
  );
};

export default CommitteeCompositionSettings;
