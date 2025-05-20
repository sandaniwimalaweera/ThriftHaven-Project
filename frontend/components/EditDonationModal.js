// components/EditDonationModal.js
import React from "react";
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

const typeOptions = [
  "Male", 
  "Female",
  "Kids", 
  "Other"
];

const sizeOptions = [
  "XS", 
  "Small",
  "Medium",
  "Large",
  "Extra Large",
 
];


 


// Status options (read-only)
const statusOptions = ["new", "used"];

// Helper function to get status color (duplicated from DonationCard for consistency)
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "success";
    case "reserved":
      return "warning";
    case "donated":
      return "#611964"; // Using purple instead of primary blue
    case "pending":
      return "info";
    default:
      return "default";
  }
};

const EditDonationModal = ({ open, onClose, donation, formData, onChange, onSubmit, isSubmitting = false }) => {
  if (!donation || !formData) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
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
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Typography id="edit-donation-modal-title" variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600, color: "#611964" }}>
          Edit Donation
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={onSubmit}>
          <Grid container spacing={3}>
            {/* Read-only Product Name field */}
            <Grid item xs={12}>
              <TextField
                label="Product Name"
                name="product_name"
                value={formData.product_name}
                onChange={onChange}
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
                  label={donation.status || "Available"}
                  color={getStatusColor(donation.status)}
                  sx={{
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    ...(donation.status?.toLowerCase() === "donated" && {
                      bgcolor: 'rgba(97, 25, 100, 0.08)',
                      color: '#611964',
                    })
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
                onChange={onChange}
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
                  onChange={onChange}
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
                  onChange={onChange}
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
                  onChange={onChange}
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
                onChange={onChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
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
              disabled={isSubmitting}
              sx={{
                backgroundColor: "#611964",
                '&:hover': {
                  backgroundColor: "#4a1151"
                }
              }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Modal>
  );
};

export default EditDonationModal;