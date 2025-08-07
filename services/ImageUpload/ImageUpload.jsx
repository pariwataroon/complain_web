import React from 'react';
import { Box, Button, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { NewsUploadAttachments } from '@pages/api/complaint/complaint'
import { showLoading, closeAlert, alertSuccess, alertError } from '@utils/Alerts';

const ImageUpload = ({ images, setImages }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    showLoading("กำลังอัปโหลดรูปภาพ...");

    const uploaded = [];
    const failed = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploadResult = await NewsUploadAttachments(formData);

        const result = uploadResult.data || uploadResult;

        console.log('Upload result:', result);

        if (result.res_code !== "0001") {
          throw new Error(result.res_message || "Upload failed");
        }

        const fileUrl = `https://complain.mof.go.th/api${result.res_data.fileUrl}`;
        uploaded.push(fileUrl);

      } catch (err) {
        console.error("Upload error:", err);
        failed.push(file.name);
      }
    }

    closeAlert();
    if (uploaded.length > 0) {
      const newImageList = [...images, ...uploaded];
      setImages(newImageList);

      if (failed.length === 0) {
        alertSuccess(
          "อัปโหลดสำเร็จ",
          `อัปโหลดรูปภาพสำเร็จ ${uploaded.length} ไฟล์`
        );
      } else {
        alertWarning(
          "อัปโหลดบางส่วน",
          `อัปโหลดสำเร็จ ${uploaded.length} ไฟล์<br>ไม่สำเร็จ ${failed.length} ไฟล์: ${failed.join(', ')}`,
          true
        );
      }
    } else {
      alertError(
        "อัปโหลดไม่สำเร็จ",
        failed.length > 1
          ? `ไม่สามารถอัปโหลดไฟล์ ${failed.join(', ')} ได้<br>กรุณาลองใหม่อีกครั้ง`
          : "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
        failed.length > 1
      );
    }
  };

  const removeImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        component="label"
        variant="outlined"
        endIcon={<AddIcon />}
        size="small"
        sx={{
          color: '#1120A3',
          backgroundColor: '#E8E9F6',
          border: '1px solid #1120A3',
          borderRadius: '12px',
          fontWeight: 'bold',
          px: 2.5,
          py: 1,
          textTransform: 'none'
        }}
      >
        เพิ่มรูปภาพ
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleImageChange}
        />
      </Button>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {images.map((img, index) => (
          <Grid item xs={6} sm="auto" key={index}>
            <Box
              sx={{
                width: isXs ? 80 : 120,
                height: isXs ? 80 : 120,
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #ccc'
              }}
            >
              <img
                src={img}
                alt={`uploaded-${index}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <IconButton
                size="small"
                onClick={() => removeImage(index)}
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: 1
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ImageUpload;