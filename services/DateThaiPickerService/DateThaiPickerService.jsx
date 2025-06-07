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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [inputPosition, setInputPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

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

  // คำนวณตำแหน่งของ input
  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      setInputPosition({
        top: rect.bottom + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
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

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // อัพเดต selectedDate เมื่อ value prop เปลี่ยน
  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleInputClick = () => {
    if (!disabled && !isReadOnly) {
      if (!isOpen) {
        calculatePosition();
      }
      setIsOpen(!isOpen);
      setShowYearSelector(false);
    }
  };

  // สร้าง popup calendar
  const renderPopupCalendar = () => {
    if (!isOpen || !isMounted || typeof window === "undefined") return null;

    return createPortal(
      <div
        className={styles.portalOverlay}
        style={{
          position: "absolute",
          top: inputPosition.top + 8,
          left: inputPosition.left,
          width: Math.max(inputPosition.width, 320),
          zIndex: 99999,
        }}
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
                    onChange={(e) => handleYearSelect(parseInt(e.target.value))}
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
      </div>,
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
