import React, { useState } from "react";
import PropTypes from "prop-types";

const ButtonService = ({
  label,
  color,
  variant,
  onClick,
  disabled,
  iconLeft,
  iconRight,
  className,
  style,
  sx, // ใช้ sx แทน width
  ...rest
}) => {
  // State สำหรับจับสถานะ hover
  const [isHovered, setIsHovered] = useState(false);
  // State สำหรับจับสถานะ active (เมื่อกดปุ่ม)
  const [isActive, setIsActive] = useState(false);

  // สไตล์พื้นฐาน (Base Style)
  const baseStyle = {
    padding: "6px 20px",
    borderRadius: "15px",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    width: "100%", // ค่า default สำหรับ width เป็น auto
  };

  // สไตล์ตาม variant
  let variantStyle = {};
  if (variant === "outlined") {
    variantStyle = {
      backgroundColor: "#FFF",
      border: `2px solid ${color}`,
      color: color,
    };
  } else {
    variantStyle = {
      backgroundColor: color,
      color: "#FFF",
    };
  }

  // สไตล์สำหรับ hover effect (เลื่อนขึ้นนิดๆ)
  const hoverStyle =
    isHovered && !isActive
      ? {
          transform: "translateY(-3px)",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
        }
      : { transform: "translateY(0)" };

  // สไตล์สำหรับ active effect (กดแล้วเด้งลง)
  const activeStyle = isActive
    ? {
        transform: "translateY(3px)",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
      }
    : {};

  // หาก active อยู่ ให้ใช้ activeStyle แทน hoverStyle
  const combinedTransformStyle = isActive ? activeStyle : hoverStyle;

  // รวมสไตล์ทั้งหมด
  const combinedStyle = {
    ...baseStyle,
    ...variantStyle,
    ...combinedTransformStyle,
    ...style,
    ...sx, // ใช้ sx prop เพื่อกำหนดสไตล์เพิ่มเติม
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyle} // ใช้ combinedStyle รวมทั้ง sx ที่ส่งมา
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      {...rest}
    >
      {iconLeft && <span style={{ marginBottom: "-7px" }}>{iconLeft}</span>}{" "}
      {/* Added marginTop to iconLeft */}
      {label}
      {iconRight && (
        <span style={{ marginBottom: "-7px" }}>{iconRight}</span>
      )}{" "}
      {/* Added marginTop to iconRight */}
    </button>
  );
};

ButtonService.propTypes = {
  label: PropTypes.string,
  color: PropTypes.string,
  variant: PropTypes.oneOf(["contained", "outlined"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  iconLeft: PropTypes.node,
  iconRight: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.object, // ใช้ prop sx แทน width
};

ButtonService.defaultProps = {
  label: "",
  color: "#0088FF",
  variant: "contained",
  onClick: null,
  disabled: false,
  iconLeft: null,
  iconRight: null,
  className: "",
  style: {},
  sx: {}, // ค่า default สำหรับ sx เป็นอ็อบเจ็กต์ว่าง
};

export default ButtonService;
