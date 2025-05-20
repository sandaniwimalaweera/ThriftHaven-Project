// frontend/components/ProductCard.js
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  IconButton, 
  Box, 
  Modal, 
  Button, 
  TextField, 
  Grid,
  Divider,
  Paper,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  alpha,
  Tooltip
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
  MonetizationOn as MonetizationOnIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Help as HelpIcon,
  Category as CategoryIcon,
  Lock as LockIcon,
  Info as InfoIcon
} from "@mui/icons-material";

// Custom color palette
const colors = {
  primary: "#611964",
  secondary: "#8e24aa", 
  accent: "#ff5722",
  background: "#f8f9fa",
  cardBg: "#ffffff",
  text: "#2c3e50",
  textLight: "#7f8c8d",
  border: "#e0e6ed",
  success: "#4caf50",
  pending: "#ff9800",
  error: "#f44336"
};

// Product Card component
const ProductCard = ({ product, onClick, onDeleteProduct, onEditProduct }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({ ...product });
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle delete product click - opens confirmation dialog
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    setOpenDeleteDialog(true);
  };
  
  // Handle confirm delete - actually deletes the product
  const handleConfirmDelete = () => {
    onDeleteProduct(product.product_id);
    setOpenDeleteDialog(false);
  };
  
  // Handle cancel delete - closes the dialog without deleting
  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  // Open the edit modal
  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    setFormData({ ...product });
    setFormErrors({});
    setOpenModal(true);
  };

  // Close the modal without saving
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // For number fields, handle empty strings and invalid numbers
    if (type === "number") {
      // Allow empty field during typing, but don't convert to NaN
      const parsedValue = value === "" ? "" : Number(value);
      setFormData({
        ...formData,
        [name]: parsedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Validate the form data
  const validateForm = () => {
    const errors = {};
    
    // Check required fields (excluding product_name which is disabled)
    if (!formData.description?.trim()) errors.description = "Description is required";
    if (!formData.category?.trim()) errors.category = "Category is required";
    if (!formData.type?.trim()) errors.type = "Type is required";
    
    // Validate number fields (excluding original_price which is disabled)
    if (formData.quantity === "" || isNaN(formData.quantity) || formData.quantity < 0) {
      errors.quantity = "Please enter a valid quantity";
    }
    
    if (formData.price === "" || isNaN(formData.price) || formData.price < 0) {
      errors.price = "Please enter a valid price";
    }
    
    // Check if the new price is higher than the current price
    if (Number(formData.price) > Number(product.price)) {
      errors.price = "Sale price can only be reduced, not increased";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for editing the product
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }
    
    // Prepare data for submission - ensure all number fields are proper numbers
    const submissionData = {
      ...formData,
      quantity: Number(formData.quantity),
      original_price: Number(formData.original_price),
      price: Number(formData.price)
    };
    
    // Call the edit function passed as a prop to update the product
    try {
      await onEditProduct(product.product_id, submissionData);
      setOpenModal(false); // Close modal only if update is successful
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      {/* Product Card Display */}
      <Card
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": { transform: "translateY(-5px)", boxShadow: "0 8px 15px rgba(0,0,0,0.1)" },
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden"
        }}
        onClick={() => onClick(product)}
      >
        {product.image && (
          <CardMedia
            component="img"
            image={`http://localhost:5000/${product.image}`}
            alt={product.product_name}
            sx={{
              height: 180,
              objectFit: "cover",
            }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: "bold", color: colors.text }}>
            {product.product_name}
          </Typography>
          
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            <Chip 
              label={product.category} 
              size="small"
              sx={{ 
                bgcolor: "rgba(97, 25, 100, 0.1)",
                color: colors.primary,
                fontWeight: 500,
                fontSize: "0.7rem"
              }}
            />
            <Chip 
              label={product.type} 
              size="small"
              sx={{ 
                bgcolor: "rgba(97, 25, 100, 0.1)",
                color: colors.primary,
                fontWeight: 500,
                fontSize: "0.7rem"
              }}
            />
          </Box>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography variant="body2" color={colors.textLight}>
              Status: <span style={{ color: product.status === "new" ? colors.success : colors.pending }}>
                {product.status === "new" ? "New" : "Used"}
              </span>
            </Typography>
            <Typography variant="body2" color={colors.textLight}>
              Qty: {product.quantity}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 1, display: "flex", alignItems: "baseline" }}>
            <Typography
              variant="body2"
              component="span"
              sx={{ textDecoration: "line-through", color: alpha(colors.error, 0.8), mr: 1 }}
              noWrap
            >
              {formatCurrency(product.original_price)}
            </Typography>
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: "bold", color: colors.primary }}
              noWrap
            >
              {formatCurrency(product.price)}
            </Typography>
          </Box>
        </CardContent>

        <Box sx={{ 
          position: "absolute", 
          bottom: 8, 
          right: 8, 
          display: "flex",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "20px",
          padding: "0 4px"
        }}>
          <Tooltip title="Edit Product">
            <IconButton 
              onClick={handleEditClick} 
              size="small"
              sx={{ 
                color: colors.primary,
                '&:hover': { backgroundColor: alpha(colors.primary, 0.1) } 
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product">
            <IconButton 
              onClick={handleDeleteClick} 
              size="small"
              sx={{ 
                color: colors.error,
                '&:hover': { backgroundColor: alpha(colors.error, 0.1) } 
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Card>

      {/* Modal for Editing Product */}
      <Modal 
        open={openModal} 
        onClose={handleCloseModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Paper
          sx={{
            width: { xs: "95%", sm: 600 },
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            position: "relative",
            outline: "none"
          }}
        >
          {/* Modal Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: colors.primary, 
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Edit Product
            </Typography>
            <IconButton 
              onClick={handleCloseModal} 
              sx={{ 
                color: "white",
                '&:hover': { bgcolor: alpha("#fff", 0.2) } 
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Tabs for different sections */}
          <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: colors.primary,
                },
                '& .Mui-selected': {
                  color: `${colors.primary} !important`,
                },
              }}
            >
              <Tab icon={<DescriptionIcon />} label="Details" />
              <Tab icon={<CategoryIcon />} label="Category" />
              <Tab icon={<InventoryIcon />} label="Inventory" />
            </Tabs>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ p: 3 }}>
              {/* Basic Details Tab */}
              {activeTab === 0 && (
                <Box>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="product_name"
                    value={formData.product_name || ""}
                    disabled
                    sx={{ 
                      mb: 2,
                      "& .Mui-disabled": {
                        color: colors.text,
                        WebkitTextFillColor: colors.text,
                        opacity: 0.8
                      }
                    }}
                    InputProps={{
                      sx: { borderRadius: 1 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Product name cannot be edited">
                            <LockIcon fontSize="small" sx={{ color: colors.textLight }} />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    required
                    multiline
                    rows={4}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    sx={{ mb: 2 }}
                    InputProps={{
                      sx: { borderRadius: 1 }
                    }}
                  />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Product Image
                      </Typography>
                      <Tooltip title="Product image cannot be changed">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LockIcon fontSize="small" sx={{ color: colors.textLight, mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">Cannot be changed</Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {product.image && (
                        <Box 
                          component="img" 
                          src={`http://localhost:5000/${product.image}`}
                          alt={product.product_name}
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: `1px solid ${colors.border}`
                          }} 
                        />
                      )}
                      {!product.image && (
                        <Box 
                          sx={{ 
                            width: 80, 
                            height: 80,
                            borderRadius: 1,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f5f5f5'
                          }}
                        >
                          <ImageIcon sx={{ color: colors.textLight, fontSize: 36 }} />
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Product images can only be set during initial product creation
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Category Tab */}
              {activeTab === 1 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!formErrors.category} sx={{ mb: 2 }}>
                        <InputLabel>Category *</InputLabel>
                        <Select
                          name="category"
                          value={formData.category || ""}
                          onChange={handleInputChange}
                          required
                          label="Category *"
                          sx={{ borderRadius: 1 }}
                        >
                          <MenuItem value="">Select Category</MenuItem>
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="kids">Kids</MenuItem>
                          <MenuItem value="accessories">Accessories</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                        {formErrors.category && (
                          <Typography variant="caption" color="error">
                            {formErrors.category}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!formErrors.type} sx={{ mb: 2 }}>
                        <InputLabel>Type *</InputLabel>
                        <Select
                          name="type"
                          value={formData.type || ""}
                          onChange={handleInputChange}
                          required
                          label="Type *"
                          sx={{ borderRadius: 1 }}
                        >
                          <MenuItem value="">Select Type</MenuItem>
                          <MenuItem value="frock">Frock</MenuItem>
                          <MenuItem value="blouse">Blouse</MenuItem>
                          <MenuItem value="skirt">Skirt</MenuItem>
                          <MenuItem value="saree">Saree</MenuItem>
                          <MenuItem value="pant">Pant</MenuItem>
                          <MenuItem value="shirt">Shirt</MenuItem>
                          <MenuItem value="tshirt">T-Shirt</MenuItem>
                          <MenuItem value="denim">Denim</MenuItem>
                          <MenuItem value="short">Short</MenuItem>
                          <MenuItem value="trouser">Trouser</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                        {formErrors.type && (
                          <Typography variant="caption" color="error">
                            {formErrors.type}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Size</InputLabel>
                        <Select
                          name="size"
                          value={formData.size || ""}
                          onChange={handleInputChange}
                          label="Size"
                          sx={{ borderRadius: 1 }}
                        >
                          <MenuItem value="">Select Size</MenuItem>
                          <MenuItem value="xsmall">X-Small</MenuItem>
                          <MenuItem value="small">Small</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="large">Large</MenuItem>
                          <MenuItem value="xlarge">X-Large</MenuItem>
                          <MenuItem value="xxlarge">XX-Large</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ 
                          "&.Mui-disabled": { 
                            color: colors.text,
                            opacity: 0.7
                          }
                        }}>
                          Status
                        </InputLabel>
                        <Select
                          name="status"
                          value={formData.status || ""}
                          label="Status"
                          disabled
                          sx={{ 
                            borderRadius: 1,
                            "& .MuiSelect-select": {
                              color: colors.text,
                              opacity: 0.8
                            }
                          }}
                          IconComponent={() => (
                            <Tooltip title="Status cannot be changed">
                              <LockIcon fontSize="small" sx={{ color: colors.textLight, mr: 1 }} />
                            </Tooltip>
                          )}
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="used">Used</MenuItem>
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          Status is fixed after creation
                        </Typography>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Inventory Tab */}
                              {activeTab === 2 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        name="quantity"
                        value={formData.quantity ?? ""}
                        onChange={handleInputChange}
                        type="number"
                        required
                        error={!!formErrors.quantity}
                        helperText={formErrors.quantity}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <InventoryIcon sx={{ color: colors.textLight }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1 },
                          inputProps: { min: 0 }
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Original Price"
                        name="original_price"
                        value={formData.original_price ?? ""}
                        disabled
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MonetizationOnIcon sx={{ color: colors.textLight }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  LKR
                                </Typography>
                                <Tooltip title="Original price cannot be changed">
                                  <LockIcon fontSize="small" sx={{ color: colors.textLight }} />
                                </Tooltip>
                              </Box>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1 }
                        }}
                        sx={{ 
                          mb: 2,
                          "& .Mui-disabled": {
                            color: colors.text,
                            WebkitTextFillColor: colors.text,
                            opacity: 0.7
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        bgcolor: 'rgba(97, 25, 100, 0.05)', 
                        borderRadius: 1,
                        border: '1px dashed rgba(97, 25, 100, 0.3)'
                      }}>
                        <Typography variant="subtitle2" sx={{ color: colors.primary, display: 'flex', alignItems: 'center' }}>
                          <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                          Price Information
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">Current Price:</Typography>
                          <Typography variant="body2" fontWeight="bold">{formatCurrency(product.price)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">Original Price:</Typography>
                          <Typography variant="body2">{formatCurrency(product.original_price)}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Note: You can only reduce the current price, not increase it.
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        label="Sale Price"
                        name="price"
                        value={formData.price ?? ""}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Original Price"
                        name="original_price"
                        value={formData.original_price ?? ""}
                        disabled
                        type="number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MonetizationOnIcon sx={{ color: colors.textLight }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  LKR
                                </Typography>
                                <Tooltip title="Original price cannot be changed">
                                  <LockIcon fontSize="small" sx={{ color: colors.textLight }} />
                                </Tooltip>
                              </Box>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1 }
                        }}
                        sx={{ 
                          mb: 2,
                          "& .Mui-disabled": {
                            color: colors.text,
                            WebkitTextFillColor: colors.text,
                            opacity: 0.7
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sale Price"
                        name="price"
                        value={formData.price ?? ""}
                        onChange={handleInputChange}
                        type="number"
                        required
                        error={!!formErrors.price}
                        helperText={formErrors.price || "Price can only be reduced, not increased"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MonetizationOnIcon sx={{ color: colors.primary }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  LKR
                                </Typography>
                                <Tooltip title="Price can only be reduced from current value">
                                  <InfoIcon fontSize="small" sx={{ color: colors.textLight }} />
                                </Tooltip>
                              </Box>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1 },
                          inputProps: { 
                            min: 0,
                            max: product.price // Set maximum to current price
                          }
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Save & Cancel Buttons */}
              <Box sx={{ 
                mt: 3, 
                pt: 2, 
                display: "flex", 
                justifyContent: "space-between",
                borderTop: `1px solid ${colors.border}`
              }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCloseModal}
                  sx={{ 
                    borderColor: colors.border,
                    color: colors.textLight,
                    '&:hover': { 
                      borderColor: colors.border,
                      backgroundColor: "#f5f5f5" 
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  type="submit"
                  startIcon={<SaveIcon />}
                  sx={{ 
                    backgroundColor: colors.primary, 
                    '&:hover': { 
                      backgroundColor: alpha(colors.primary, 0.9)
                    } 
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <Modal 
        open={openDeleteDialog} 
        onClose={handleCancelDelete}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Paper
          sx={{
            width: { xs: "95%", sm: 400 },
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            overflow: "hidden"
          }}
        >
          <Box sx={{ 
            p: 2, 
            bgcolor: colors.error, 
            color: "white",
            display: "flex",
            alignItems: "center"
          }}>
            <DeleteIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Confirm Delete
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Are you sure you want to delete "<strong>{product.product_name}</strong>"? This action cannot be undone.
            </Typography>
            
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleCancelDelete}
                sx={{ 
                  borderColor: colors.border,
                  color: colors.textLight,
                  '&:hover': { 
                    borderColor: colors.border,
                    backgroundColor: "#f5f5f5" 
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleConfirmDelete}
                startIcon={<DeleteIcon />}
                sx={{ 
                  backgroundColor: colors.error, 
                  '&:hover': { backgroundColor: alpha(colors.error, 0.9) }
                }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Paper>
      </Modal>
    </>
  );
};

export default ProductCard;