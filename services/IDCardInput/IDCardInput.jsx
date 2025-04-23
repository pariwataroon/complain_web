import React, { useState, useEffect, useRef } from "react";
import styles from "./IDCardInput.module.scss";

const IDCardInput = ({ value = "", onChange }) => {
    const [digits, setDigits] = useState(Array(13).fill(""));
    const inputsRef = useRef([]);

    useEffect(() => {
        if (value.length === 13) {
            setDigits(value.split(""));
        }
    }, [value]);

    const handleChange = (e, index) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 1);
        const updated = [...digits];
        updated[index] = val;
        setDigits(updated);
        onChange(updated.join(""));

        if (val && index < 12) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const hyphenIndexSet = new Set([0, 4, 9, 11]);

    return (
        <div className={styles.container}>
            <label className={styles.label}>เลขประจำตัวประชาชน</label>
            <div className={styles.inputGroup}>
                {digits.map((digit, idx) => (
                    <React.Fragment key={idx}>
                        <input
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e, idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            ref={(el) => (inputsRef.current[idx] = el)}
                            className={styles.inputBox}
                        />
                        {hyphenIndexSet.has(idx) && (
                            <span className={styles.hyphen}>-</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default IDCardInput;
