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
  sx,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const customColors = {
    ย้อนกลับ: {
      background: "#FEFAEF",
      text: "#F1D079",
      hover: "#f7f0d8",
    },
    ถัดไป: {
      background: "#EDC458",
      text: "#FFFFFF",
      hover: "#e0b849",
    },
    แก้ไข: {
      background: "#EAF5FF",
      text: "#2499FF",
      hover: "#d5ebff",
    },
    ยืนยัน: {
      background: "#2499FF",
      text: "#FFFFFF",
      hover: "#1786e0",
    },
    ส่งออก: {
      background: "#EAF5FF",
      text: "#2499FF",
      hover: "#d5ebff",
    },
    ล้าง: {
      background: "#EAF5FF",
      text: "#2499FF",
      hover: "#d5ebff",
    },
    บันทึก: {
      background: "#2499FF",
      text: "#FFFFFF",
      hover: "#1786e0",
    },
  };



  const isCustom = color in customColors;

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
    width: "100%",
  };

  let variantStyle = {};
  if (variant === "outlined") {
    variantStyle = {
      backgroundColor: "#FFF",
      border: `2px solid ${isCustom ? customColors[color].text : color}`,
      color: isCustom ? customColors[color].text : color,
    };
  } else {
    variantStyle = {
      backgroundColor: isCustom ? customColors[color].background : color,
      color: isCustom ? customColors[color].text : "#FFF",
    };
  }

  const hoverStyle =
    isHovered && !isActive
      ? {
          transform: "translateY(-3px)",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
        }
      : { transform: "translateY(0)" };

  const activeStyle = isActive
    ? {
        transform: "translateY(3px)",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
      }
    : {};

  const combinedTransformStyle = isActive ? activeStyle : hoverStyle;

  const combinedStyle = {
    ...baseStyle,
    ...variantStyle,
    ...combinedTransformStyle,
    ...style,
    ...sx,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      {...rest}
    >
      {iconLeft && <span style={{ marginBottom: "-7px" }}>{iconLeft}</span>}
      {label}
      {iconRight && <span style={{ marginBottom: "-7px" }}>{iconRight}</span>}
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
  sx: PropTypes.object,
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
  sx: {},
};

export default ButtonService;
