import React, { useState, useEffect, useRef } from "react";
import { Box, TextField, Typography } from "@mui/material";
import styles from "./IDCardInput.module.scss";

const IDCardInput = ({ value = "", onChange }) => {
    const [digits, setDigits] = useState(Array(13).fill(""));
    const inputsRef = useRef([]);

    useEffect(() => {
        if (value.length === 13) {
            setDigits(value.split(""));
        }
    }, [value]);

    const handleInputChange = (e, index) => {
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
        <Box className={styles.container}>
            <Typography variant="body2" className={styles.label}>
                เลขประจำตัวประชาชน
            </Typography>
            <Box className={styles.inputGroup}>
                {digits.map((digit, idx) => (
                    <React.Fragment key={idx}>
                        <TextField
                            inputRef={(el) => (inputsRef.current[idx] = el)}
                            value={digit}
                            onChange={(e) => handleInputChange(e, idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className={styles.inputBox}
                            inputProps={{
                                maxLength: 1,
                                style: { textAlign: "center", fontWeight: "bold", fontSize: "18px" },
                            }}
                        />
                        {hyphenIndexSet.has(idx) && (
                            <Box component="span" className={styles.hyphen}>
                                -
                            </Box>
                        )}
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    );
};

export default IDCardInput;
