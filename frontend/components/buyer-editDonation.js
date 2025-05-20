// components/buyer-editDonation.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Paper,
  IconButton,
  Grid,
  Divider,
  Chip
} from "@mui/material";

import { Close as CloseIcon } from "@mui/icons-material";

// Updated dropdown options
const categoryOptions = [
    "Male", 
  "Female",
  "Kids", 
  "Other"

];

const typeOptions = [
   "Frock",	
  "Blouse",	
  "Skirt",
  "Pant",
  "Shirt",
  "sarees",
  "TShirt",	
  "Denim",
  "Short",
  "Trouser",
  "Other"
];

const sizeOptions = [
  "XS", 
  "Small",
  "Medium",
  "Large",
  "Extra Large",
];

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "#4caf50";
    case "pending":
      return "#f57c00";
    default:
      return "#757575";
  }
};

const EditDonationModal = ({ open, handleClose, donation, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    category: "",
    type: "",
    size: "",
    quantity: 1
  });

  useEffect(() => {
    if (donation) {
      setFormData({
        product_name: donation.product_name || "",
        description: donation.description || "",
        category: donation.category || "",
        type: donation.type || "",
        size: donation.size || "",
        quantity: donation.quantity || 1
      });
    }
  }, [donation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!donation) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-donation-modal-title"
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Paper
        sx={{
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          p: 4,
          position: "relative",
          borderRadius: 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Typography id="edit-donation-modal-title" variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600, color: "#611964" }}>
          Edit Donation
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Read-only Product Name field */}
            <Grid item xs={12}>
              <TextField
                label="Product Name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true, // Product name cannot be changed
                }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.7)", 
                  },
                  mb: 1
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Product name cannot be changed
              </Typography>
            </Grid>

            {/* Read-only Status field */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={donation.status || "Pending"}
                  sx={{
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    bgcolor: donation.status === "Approved" ? "#e8f5e9" : "#fff8e1",
                    color: getStatusColor(donation.status)
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Status cannot be changed directly
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categoryOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Type"
                >
                  {typeOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="size-label">Size</InputLabel>
                <Select
                  labelId="size-label"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  label="Size"
                >
                  {sizeOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                borderColor: "#611964",
                color: "#611964",
                '&:hover': {
                  borderColor: "#4a1151",
                  backgroundColor: "rgba(97, 25, 100, 0.04)"
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                backgroundColor: "#611964",
                '&:hover': {
                  backgroundColor: "#4a1151"
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Modal>
  );
};

export default EditDonationModal;