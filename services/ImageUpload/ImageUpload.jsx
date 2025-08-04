import React from 'react';
import { Box, Button, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ImageUpload = ({ images, setImages }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const getTokenFromCookie = () => {
    const match = document.cookie.match(/(^| )access_token=([^;]+)/);
    return match ? match[2] : null;
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const token = getTokenFromCookie();

    const uploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Upload failed");

        const result = await response.json();
        const fileUrl = `https://complain.mof.go.th/api${result.res_data.fileUrl}`;

        uploaded.push(fileUrl);
      } catch (err) {
        console.error("Upload error:", err);
        alert("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
      }
    }

    if (uploaded.length > 0) {
      const newImageList = [...images, ...uploaded];
      // console.log("✅ Uploaded images:", newImageList);
      setImages(newImageList); // ✅ สำคัญ! ต้องเป็น array
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