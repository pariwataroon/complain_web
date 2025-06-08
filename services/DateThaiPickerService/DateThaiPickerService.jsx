import React, { useState, useRef, useEffect } from "react";
import { FormControl, Typography } from "@mui/material";
import { createPortal } from "react-dom";
import styles from "./DateThaiPickerService.module.scss";

const DateThaiPickerService = ({
  label, // แบบด้านนอก
  inputLabel, // แบบใน TextField
  value,
  onChange,
  name,
  disabled,
  placeholder = "กรุณาเลือกวันที่.....",
  minDate = null,
  maxDate = null,
  InputProps = {},
  ...props
}) => {
  const [selectedDate, setSelectedDate] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  // แก้ไขการตั้งค่า initial month และ year
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value && value.month) {
      return value.month - 1; // แปลงจาก 1-12 เป็น 0-11
    }
    return new Date().getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    if (value && value.year) {
      return value.year;
    }
    return new Date().getFullYear();
  });
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [inputPosition, setInputPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    // ← เพิ่ม properties สำหรับการปรับตำแหน่ง
    isRightAligned: false,
    availableSpace: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const isReadOnly = InputProps?.readOnly;

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const thaiDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // ตรวจสอบ client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // เพิ่ม useEffect สำหรับตรวจสอบขนาดหน้าจอ
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 460);
    };

    // ตรวจสอบครั้งแรก
    checkScreenSize();

    // เพิ่ม event listener สำหรับ resize
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // แปลงปี ค.ศ. เป็น พ.ศ.
  const toBuddhistYear = (gregorianYear) => {
    return gregorianYear + 543;
  };

  // สร้างรายการปี พ.ศ.
  const generateYearOptions = () => {
    const years = [];
    for (let buddhistYear = 2400; buddhistYear <= 2700; buddhistYear++) {
      years.push({
        value: buddhistYear - 543,
        label: buddhistYear.toString(),
      });
    }
    return years;
  };

  // ตรวจสอบว่าวันที่สามารถเลือกได้หรือไม่
  const isDateSelectable = (year, month, day) => {
    const dateToCheck = new Date(year, month, day);

    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      dateToCheck.setHours(0, 0, 0, 0);
      if (dateToCheck < min) return false;
    }

    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      dateToCheck.setHours(0, 0, 0, 0);
      if (dateToCheck > max) return false;
    }

    return true;
  };

  // ← แก้ไขฟังก์ชันคำนวณตำแหน่งให้เป็น dynamic
  const calculatePosition = () => {
    if (inputRef.current && !isSmallScreen) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      // ขนาดของ popup calendar (ประมาณ)
      const popupWidth = Math.max(rect.width, 320);
      const popupHeight = 400; // ประมาณความสูงของ popup

      // ขนาดของ viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // คำนวณพื้นที่ว่างรอบๆ input
      const availableSpace = {
        left: rect.left,
        right: viewportWidth - rect.right,
        top: rect.top,
        bottom: viewportHeight - rect.bottom,
      };

      // กำหนดตำแหน่ง left
      let left = rect.left + scrollLeft;
      let isRightAligned = false;

      // ตรวจสอบว่าทะลุขอบขวาหรือไม่
      if (left + popupWidth > viewportWidth) {
        // ถ้าทะลุ ให้จัดชิดขวาของ input
        left = rect.right + scrollLeft - popupWidth;
        isRightAligned = true;

        // ถ้ายังทะลุซ้าย ให้จัดให้อยู่ในขอบจอ
        if (left < scrollLeft) {
          left = scrollLeft + 10; // เว้นระยะจากขอบ 10px
        }
      }

      // กำหนดตำแหน่ง top
      let top = rect.bottom + scrollTop + 8;

      // ตรวจสอบว่าทะลุขอบล่างหรือไม่
      if (top + popupHeight > viewportHeight + scrollTop) {
        // ถ้าทะลุ ให้แสดงด้านบนของ input
        top = rect.top + scrollTop - popupHeight - 8;

        // ถ้ายังทะลุด้านบน ให้จัดให้อยู่ในขอบจอ
        if (top < scrollTop) {
          top = scrollTop + 10; // เว้นระยะจากขอบ 10px
        }
      }

      setInputPosition({
        top,
        left,
        width: popupWidth,
        isRightAligned,
        availableSpace,
      });
    }
  };

  // สร้างปฏิทิน
  const generateCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateClick = (day) => {
    if (day && isDateSelectable(currentYear, currentMonth, day)) {
      const thaiDate = {
        day,
        month: currentMonth + 1,
        year: currentYear,
        buddhistYear: toBuddhistYear(currentYear),
      };

      setSelectedDate(thaiDate);
      if (onChange) {
        onChange(thaiDate);
      }
      setIsOpen(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(monthIndex);
    setShowYearSelector(false);
  };

  const handleYearSelect = (gregorianYear) => {
    setCurrentYear(gregorianYear);
    setShowYearSelector(false);
  };

  const toggleYearSelector = () => {
    setShowYearSelector(!showYearSelector);
  };

  const formatSelectedDate = (date) => {
    if (!date) return "";
    return `${date.day} ${thaiMonths[date.month - 1]} พ.ศ. ${
      date.buddhistYear
    }`;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSelected = (day) => {
    return (
      selectedDate?.day === day &&
      selectedDate?.month === currentMonth + 1 &&
      selectedDate?.year === currentYear
    );
  };

  const getDayCellClasses = (day) => {
    let classes = [styles.dayCell];

    if (day) {
      if (isDateSelectable(currentYear, currentMonth, day)) {
        classes.push(styles.clickable);
        if (isToday(day)) classes.push(styles.today);
        if (isSelected(day)) classes.push(styles.selected);
      } else {
        classes.push(styles.disabled);
      }
    } else {
      classes.push(styles.empty);
    }

    return classes.join(" ");
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // เพิ่ม function สำหรับไปที่วันที่ที่เลือก
  const goToSelectedDate = () => {
    if (selectedDate && selectedDate.month && selectedDate.year) {
      setCurrentMonth(selectedDate.month - 1); // แปลงจาก 1-12 เป็น 0-11
      setCurrentYear(selectedDate.year);
    }
  };

  // ปิด popup เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };

    // ← แก้ไขการจัดการ scroll และ resize ให้คำนวณตำแหน่งใหม่
    const handleScroll = () => {
      if (isOpen && !isSmallScreen) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen && !isSmallScreen) {
        calculatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);

      // เฉพาะหน้าจอเล็กถึงจะป้องกัน body scroll
      if (isSmallScreen) {
        document.body.style.overflow = "hidden";
      } else {
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSmallScreen]);

  // แก้ไข useEffect สำหรับอัพเดต selectedDate และ currentMonth/Year
  useEffect(() => {
    setSelectedDate(value);
    // ถ้ามี value ให้ปรับ currentMonth และ currentYear ไปตาม value
    if (value && value.month && value.year) {
      setCurrentMonth(value.month - 1); // แปลงจาก 1-12 เป็น 0-11
      setCurrentYear(value.year);
    }
  }, [value]);

  const handleInputClick = () => {
    if (!disabled && !isReadOnly) {
      // เมื่อเปิด popup ให้ไปที่วันที่ที่เลือกไว้ (ถ้ามี)
      if (selectedDate && selectedDate.month && selectedDate.year) {
        setCurrentMonth(selectedDate.month - 1);
        setCurrentYear(selectedDate.year);
      }

      if (!isOpen && !isSmallScreen) {
        calculatePosition();
      }
      setIsOpen(!isOpen);
      setShowYearSelector(false);
    }
  };

  // ← แก้ไข renderPopupCalendar ให้ใช้ตำแหน่งที่คำนวณแล้ว
  const renderPopupCalendar = () => {
    if (!isOpen || !isMounted || typeof window === "undefined") return null;

    return createPortal(
      <>
        {/* Backdrop/Overlay เฉพาะหน้าจอเล็ก */}
        {isSmallScreen && <div className={styles.backdrop} />}

        {/* Calendar popup */}
        <div
          className={
            isSmallScreen ? styles.centeredPopup : styles.portalOverlay
          }
          style={
            isSmallScreen
              ? {} // ใช้ CSS สำหรับกลางจอ
              : {
                  position: "absolute",
                  top: inputPosition.top,
                  left: inputPosition.left,
                  width: inputPosition.width,
                  zIndex: 99999,
                  // ← เพิ่ม maxWidth เพื่อป้องกันการทะลุ
                  maxWidth: `${window.innerWidth - 20}px`,
                }
          }
        >
          <div ref={popupRef} className={styles.popupCalendar}>
            <div className={styles.calendarHeader}>
              <button className={styles.navButton} onClick={goToPreviousMonth}>
                ‹
              </button>
              <div className={styles.monthYearSelector}>
                <button
                  className={styles.monthYearButton}
                  onClick={toggleYearSelector}
                >
                  {thaiMonths[currentMonth]} {toBuddhistYear(currentYear)}
                </button>
              </div>
              <button className={styles.navButton} onClick={goToNextMonth}>
                ›
              </button>
            </div>

            {/* Month and Year Selector */}
            {showYearSelector && (
              <div className={styles.selectorContainer}>
                {/* Month Selector */}
                <div className={styles.monthSelector}>
                  <h4 className={styles.selectorTitle}>เลือกเดือน</h4>
                  <div className={styles.monthGrid}>
                    {thaiMonths.map((month, index) => (
                      <button
                        key={index}
                        className={`${styles.monthItem} ${
                          index === currentMonth ? styles.selected : ""
                        }`}
                        onClick={() => handleMonthSelect(index)}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Selector */}
                <div className={styles.yearSelector}>
                  <h4 className={styles.selectorTitle}>เลือกปี</h4>
                  <div className={styles.yearSelectWrapper}>
                    <select
                      className={styles.yearSelect}
                      value={currentYear}
                      onChange={(e) =>
                        handleYearSelect(parseInt(e.target.value))
                      }
                    >
                      {generateYearOptions().map((yearOption) => (
                        <option key={yearOption.value} value={yearOption.value}>
                          {yearOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            {!showYearSelector && (
              <div className={styles.calendarGrid}>
                <div className={styles.daysHeader}>
                  {thaiDays.map((day, index) => (
                    <div key={index} className={styles.dayHeader}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className={styles.daysGrid}>
                  {generateCalendar().map((day, index) => (
                    <div
                      key={index}
                      className={getDayCellClasses(day)}
                      onClick={() => handleDateClick(day)}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with today button */}
            <div className={styles.popupFooter}>
              <button
                className={styles.todayButton}
                onClick={() => {
                  const today = new Date();
                  if (
                    isDateSelectable(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    )
                  ) {
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    setShowYearSelector(false);
                    handleDateClick(today.getDate());
                  }
                }}
              >
                วันนี้
              </button>
              {/* ปุ่มไปที่วันที่ที่เลือก */}
              {selectedDate && (
                <button
                  className={styles.goToSelectedButton}
                  onClick={goToSelectedDate}
                >
                  ไปที่วันที่เลือก
                </button>
              )}
              <button
                className={styles.clearButton}
                onClick={() => {
                  setSelectedDate(null);
                  if (onChange) {
                    onChange(null);
                  }
                  goToCurrentMonth();
                  setIsOpen(false);
                  setShowYearSelector(false);
                }}
              >
                ล้าง
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
        >
          {label}
        </Typography>
      )}

      <div className={styles.datePickerContainer}>
        {/* Input Field */}
        <div
          ref={inputRef}
          className={`${styles.inputField} ${
            selectedDate ? styles.hasValue : ""
          } ${disabled ? styles.disabled : ""}`}
          onClick={handleInputClick}
        >
          <input
            type="text"
            value={selectedDate ? formatSelectedDate(selectedDate) : ""}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            name={name}
            className={styles.dateInput}
            style={{
              color: selectedDate ? "#1120A3" : "#999",
              fontWeight: selectedDate ? 500 : 400,
            }}
          />
          <div className={styles.calendarIcon}>📅</div>
        </div>

        {/* Render popup calendar using portal */}
        {renderPopupCalendar()}
      </div>
    </FormControl>
  );
};

export default DateThaiPickerService;
