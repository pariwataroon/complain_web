import React from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ImageUpload = ({ images, setImages }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
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