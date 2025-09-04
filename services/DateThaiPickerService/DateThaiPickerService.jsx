import React, { useState, useRef, useEffect } from "react";
import { FormControl, Typography } from "@mui/material";
import { createPortal } from "react-dom";
import { Controller } from "react-hook-form";
import styles from "./DateThaiPickerService.module.scss";

const DateThaiPickerService = ({
  label,
  inputLabel,
  value,
  onChange,
  name,
  disabled,
  dis,
  displayValue,
  placeholder = "กรุณาเลือกวันที่.....",
  minDate = null,
  maxDate = null,
  InputProps = {},
  time = false,
  required = false,
  error = false,
  helperText = "",
  control,
  defaultValue,
  ...props
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  // ตรวจสอบ disabled state
  const isDisabled = disabled || dis;

  // สร้างรายการปี พ.ศ. (ย้อนหลัง 10 ปี + เคารพ minDate/maxDate + รวมปีที่เลือกไว้เสมอ)
const generateYearOptions = () => {
  const today = new Date();
  const current = today.getFullYear();

  // base: ย้อนหลัง 10 ปีจนถึงปีปัจจุบัน
  let minY = current - 10;
  let maxY = current;

  // ถ้ามี minDate / maxDate ให้เคารพช่วงนั้นด้วย
  if (minDate) {
    const min = new Date(minDate).getFullYear();
    if (!isNaN(min)) minY = Math.max(minY, min);
  }
  if (maxDate) {
    const max = new Date(maxDate).getFullYear();
    if (!isNaN(max)) maxY = Math.min(maxY, max);
  }

  // ถ้าผู้ใช้เลือกปีที่อยู่นอกช่วง (เช่นโหลดค่าจาก API) ให้เติมปีนั้นเข้ามา
  const selectedY = selectedDate?.year;
  if (selectedY && !isNaN(selectedY)) {
    minY = Math.min(minY, selectedY);
    maxY = Math.max(maxY, selectedY);
  }

  // กันเคส min > max (เช่นกำหนด maxDate เก่ากว่าช่วง 10 ปีมาก)
  if (minY > maxY) {
    // fallback: ใช้ปีเดียว (maxY) เพื่อให้ยังเลือกได้
    minY = maxY;
  }

  const years = [];
  for (let y = minY; y <= maxY; y++) {
    years.push({
      value: y,                  // ค.ศ. เก็บเป็นค่า
      label: (y + 543).toString() // แสดงเป็น พ.ศ.
    });
  }
  return years;
};

  // แก้ไขการตั้งค่า initial month และ year
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value && typeof value === 'object' && value.month) {
      return value.month - 1; // แปลงจาก 1-12 เป็น 0-11
    }
    return new Date().getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    if (value && typeof value === 'object' && value.year) {
      return value.year;
    }
    return new Date().getFullYear();
  });
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [inputPosition, setInputPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
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

  // ฟังก์ชันแปลงวันที่จาก API
  const parseApiDate = (apiDate) => {
    if (!apiDate) return null;

    try {
      let dateObj;

      // ถ้าเป็น string ที่มี T (ISO format)
      if (typeof apiDate === 'string' && apiDate.includes('T')) {
      const [datePart, timePart] = apiDate.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      let hour = 0, minute = 0;
      if (timePart) {
        [hour, minute] = timePart.split(':').map(Number);
      }
      dateObj = new Date(year, month - 1, day, hour, minute, 0);
    }
      // ถ้าเป็น string ธรรมดา
      else if (typeof apiDate === 'string') {
        dateObj = new Date(apiDate);
      }
      // ถ้าเป็น Date object
      else if (apiDate instanceof Date) {
        dateObj = apiDate;
      }
      // ถ้าเป็น object ที่มี format ของเราอยู่แล้ว
      else if (typeof apiDate === 'object' && apiDate.day && apiDate.month && apiDate.year) {
        return apiDate;
      }
      else {
        return null;
      }

      // ตรวจสอบว่า Date ถูกต้องหรือไม่
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      const thaiDate = {
        day: dateObj.getDate(),
        month: dateObj.getMonth() + 1,
        year: dateObj.getFullYear(),
        buddhistYear: dateObj.getFullYear() + 543,
      };

      // เพิ่มเวลาถ้ามี time prop
      if (time) {
        thaiDate.hour = dateObj.getHours().toString().padStart(2, '0');
        thaiDate.minute = dateObj.getMinutes().toString().padStart(2, '0');
      }

      return thaiDate;
    } catch (error) {
      console.error('Error parsing API date:', error);
      return null;
    }
  };

  const formatToApiDate = (thaiDate) => {
    if (!thaiDate || !thaiDate.day || !thaiDate.month || !thaiDate.year) {
      return null;
    }

    try {
      const year = thaiDate.year;
      const month = thaiDate.month - 1;
      const day = thaiDate.day;

      let dateObj;

      if (time && thaiDate.hour !== undefined && thaiDate.minute !== undefined) {
        const hour = parseInt(thaiDate.hour) || 0;
        const minute = parseInt(thaiDate.minute) || 0;
        dateObj = new Date(year, month, day, hour, minute, 0, 0);
      } else {
        dateObj = new Date(year, month, day, 0, 0, 0, 0);
      }

      return dateObj.toLocaleString("sv-SE"); 
    } catch (error) {
      console.error('Error formatting to API date:', error);
      return null;
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 460);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // อัปเดต selectedDate เมื่อ value เปลี่ยน
  useEffect(() => {
    const parsedDate = parseApiDate(value || defaultValue);
    setSelectedDate(parsedDate);

    if (parsedDate && parsedDate.month && parsedDate.year) {
      setCurrentMonth(parsedDate.month - 1);
      setCurrentYear(parsedDate.year);
    }
  }, [value, defaultValue]);

  // แปลงปี ค.ศ. เป็น พ.ศ.
  const toBuddhistYear = (gregorianYear) => {
    return gregorianYear + 543;
  };

  // สร้างรายการปี พ.ศ.
  // const generateYearOptions = () => {
  //   const years = [];
  //   for (let buddhistYear = 2400; buddhistYear <= 2700; buddhistYear++) {
  //     years.push({
  //       value: buddhistYear - 543,
  //       label: buddhistYear.toString(),
  //     });
  //   }
  //   return years;
  // };

  // สร้างรายการชั่วโมงและนาที
  const generateTimeOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, '0')
    );
    const minutes = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, '0')
    );
    return { hours, minutes };
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

  // คำนวณตำแหน่งให้เป็น dynamic
  const calculatePosition = () => {
    if (inputRef.current && !isSmallScreen) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      // ขนาดของ popup calendar (ประมาณ) - เพิ่มขนาดเมื่อมี time picker
      const popupWidth = Math.max(rect.width, time ? 360 : 320);
      const popupHeight = time ? 500 : 400; // เพิ่มความสูงเมื่อมี time picker

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const availableSpace = {
        left: rect.left,
        right: viewportWidth - rect.right,
        top: rect.top,
        bottom: viewportHeight - rect.bottom,
      };

      let left = rect.left + scrollLeft;
      let isRightAligned = false;

      if (left + popupWidth > viewportWidth) {
        left = rect.right + scrollLeft - popupWidth;
        isRightAligned = true;

        if (left < scrollLeft) {
          left = scrollLeft + 10;
        }
      }

      let top = rect.bottom + scrollTop + 8;

      if (top + popupHeight > viewportHeight + scrollTop) {
        top = rect.top + scrollTop - popupHeight - 8;

        if (top < scrollTop) {
          top = scrollTop + 10;
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
        // เพิ่มเวลาถ้ามี time prop
        ...(time && {
          hour: selectedDate?.hour || new Date().getHours().toString().padStart(2, '0'),
          minute: selectedDate?.minute || new Date().getMinutes().toString().padStart(2, '0')
        })
      };

      setSelectedDate(thaiDate);

      if (time) {
        // ถ้ามี time picker ให้แสดง time selector
        setShowTimeSelector(true);
        setShowYearSelector(false);
      } else {
        // ถ้าไม่มี time picker ให้ปิด popup ทันที
        if (onChange) {
          const apiDate = formatToApiDate(thaiDate);
          onChange(apiDate);
        }
        setIsOpen(false);
      }
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนเวลา
  const handleTimeChange = (type, value) => {
    if (selectedDate) {
      const updatedDate = {
        ...selectedDate,
        [type]: value
      };

      setSelectedDate(updatedDate);

    }
  };

  // ฟังก์ชันยืนยันการเลือกเวลา
  const confirmTimeSelection = () => {
    setShowTimeSelector(false);
    setIsOpen(false);
    if (onChange && selectedDate) {
      const apiDate = formatToApiDate(selectedDate);
      onChange(apiDate);
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
    setShowTimeSelector(false); // ปิด time selector เมื่อเปิด year selector
  };

  const formatSelectedDate = (date) => {
    if (!date) return "";

    let dateStr = `${date.day} ${thaiMonths[date.month - 1]} พ.ศ. ${date.buddhistYear}`;

    // เพิ่มเวลาถ้ามี
    if (time && date.hour !== undefined && date.minute !== undefined) {
      dateStr += ` ${date.hour}:${date.minute} น.`;
    }

    return dateStr;
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

  const goToSelectedDate = () => {
    if (selectedDate && selectedDate.month && selectedDate.year) {
      setCurrentMonth(selectedDate.month - 1);
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
        setShowTimeSelector(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setShowYearSelector(false);
        setShowTimeSelector(false);
      }
    };

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

  const handleInputClick = () => {
    if (!isDisabled && !isReadOnly) {
      if (selectedDate && selectedDate.month && selectedDate.year) {
        setCurrentMonth(selectedDate.month - 1);
        setCurrentYear(selectedDate.year);
      }

      if (!isOpen && !isSmallScreen) {
        calculatePosition();
      }
      setIsOpen(!isOpen);
      setShowYearSelector(false);
      setShowTimeSelector(false);
    }
  };

  // Render Time Selector
  const renderTimeSelector = () => {
    if (!showTimeSelector || !time) return null;

    const { hours, minutes } = generateTimeOptions();

    return (
      <div className={styles.timeSelectorContainer}>
        <div className={styles.timeSelectorHeader}>
          <h4 className={styles.selectorTitle}>เลือกเวลา</h4>
        </div>

        <div className={styles.timeSelectors}>
          <div className={styles.timeGroup}>
            <label className={styles.timeLabel}>ชั่วโมง</label>
            <select
              className={styles.timeSelect}
              value={selectedDate?.hour || '00'}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
          </div>

          <div className={styles.timeSeparator}>:</div>

          <div className={styles.timeGroup}>
            <label className={styles.timeLabel}>นาที</label>
            <select
              className={styles.timeSelect}
              value={selectedDate?.minute || '00'}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
            >
              {minutes.map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.timeActions}>
          <button
            className={styles.timeBackButton}
            onClick={() => setShowTimeSelector(false)}
          >
            ← กลับ
          </button>
          <button
            className={styles.timeConfirmButton}
            onClick={confirmTimeSelection}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    );
  };

  const renderPopupCalendar = () => {
    if (!isOpen || !isMounted || typeof window === "undefined") return null;

    return createPortal(
      <>
        {isSmallScreen && <div className={styles.backdrop} />}

        <div
          className={
            isSmallScreen ? styles.centeredPopup : styles.portalOverlay
          }
          style={
            isSmallScreen
              ? {}
              : {
                position: "absolute",
                top: inputPosition.top,
                left: inputPosition.left,
                width: inputPosition.width,
                zIndex: 99999,
                maxWidth: `${window.innerWidth - 20}px`,
              }
          }
        >
          <div ref={popupRef} className={styles.popupCalendar}>
            {/* แสดง Time Selector หรือ Calendar */}
            {showTimeSelector ? (
              renderTimeSelector()
            ) : (
              <>
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
                    <div className={styles.monthSelector}>
                      <h4 className={styles.selectorTitle}>เลือกเดือน</h4>
                      <div className={styles.monthGrid}>
                        {thaiMonths.map((month, index) => (
                          <button
                            key={index}
                            className={`${styles.monthItem} ${index === currentMonth ? styles.selected : ""
                              }`}
                            onClick={() => handleMonthSelect(index)}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    </div>

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

                {/* Footer with buttons */}
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
                      setShowTimeSelector(false);
                    }}
                  >
                    ล้าง
                  </button>
                </div>
              </>
            )}
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
          sx={{
            color: "#1120A3",
            fontWeight: 600,
            mb: 1,
            // เพิ่ม * สำหรับ required field
            "&::after": required ? {
              content: '" *"',
              color: "#f44336",
              fontWeight: "bold"
            } : {}
          }}
        >
          {label}
        </Typography>
      )}

      <div className={styles.datePickerContainer}>
        <div
          ref={inputRef}
          className={`${styles.inputField} ${selectedDate ? styles.hasValue : ""
            } ${isDisabled ? styles.disabled : ""} ${error ? styles.error : ""}`} // เพิ่ม error class
          onClick={handleInputClick}
        >
          <input
            type="text"
            value={selectedDate ? formatSelectedDate(selectedDate) : ""}
            placeholder={time ? "กรุณาเลือกวันที่และเวลา....." : placeholder}
            readOnly
            disabled={isDisabled}
            name={name}
            className={`${styles.dateInput} ${error ? styles.errorInput : ""}`} // เพิ่ม error class
            style={{
              color: selectedDate ? "#1120A3" : "#999",
              fontWeight: selectedDate ? 500 : 400,
              // เพิ่ม border สีแดงเมื่อมี error
              borderColor: error ? "#f44336" : undefined,
            }}
          />
          <div className={styles.calendarIcon}>
            {time ? "🕒" : "📅"}
          </div>
        </div>

        {/* แสดง helper text (error message) */}
        {helperText && (
          <Typography
            variant="caption"
            sx={{
              color: error ? "#f44336" : "#666",
              mt: 0.5,
              fontSize: "12px"
            }}
          >
            {helperText}
          </Typography>
        )}

        {renderPopupCalendar()}
      </div>
    </FormControl>
  );
};

export const ControlledDateThaiPickerService = ({
  control,
  name,
  defaultValue = "",
  rules = {},
  error: customError,
  helperText: customHelperText,
  ...props
}) => {
  if (!control || !name) {
    return <DateThaiPickerService {...props} />;
  }

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error: formError } }) => (
        <DateThaiPickerService
          {...props}
          value={value}
          onChange={onChange}
          error={customError !== undefined ? customError : !!formError}
          helperText={customHelperText !== undefined ? customHelperText : formError?.message}
        />
      )}
    />
  );
};

export default DateThaiPickerService;