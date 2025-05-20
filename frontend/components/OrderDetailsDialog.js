// components/OrderDetailsDialog.js
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import {
  LocalShipping,
  CheckCircle,
  Pending,
  LocalMall,
  ReceiptLong,
  CreditCard,
  Person,
  Phone,
  HomeWork
} from "@mui/icons-material";

const OrderDetailsDialog = ({ open, handleClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`http://localhost:5000/api/orders/seller/${orderId}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      // Fetch product details for this order
      const productResponse = await axios.get(`http://localhost:5000/api/products/approved?productId=${response.data.product_id}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      const productDetails = productResponse.data.length > 0 ? productResponse.data[0] : null;
      
      // Combine order and product details
      setOrderDetails({
        ...response.data,
        productDetails
      });
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusChipColor = (status) => {
    switch(status.toLowerCase()) {
      case 'received':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'shipped':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'received':
        return <CheckCircle fontSize="small" />;
      case 'processing':
      case 'pending':
        return <Pending fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      default:
        return <LocalMall fontSize="small" />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: "#f7f5f9", display: "flex", alignItems: "center" }}>
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            bgcolor: "#611964",
            color: "white",
            width: 40,
            height: 40,
            borderRadius: "50%",
            mr: 2
          }}
        >
          <ReceiptLong />
        </Box>
        <Typography variant="h6">
          Order Details - #{orderId}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress sx={{ color: "#611964" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : orderDetails ? (
          <Grid container spacing={3}>
            {/* Order Status Section */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Order Status
                </Typography>
                <Chip 
                  icon={getStatusIcon(orderDetails.status)}
                  label={orderDetails.status} 
                  color={getStatusChipColor(orderDetails.status)}
                  variant="outlined"
                  size="medium"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {/* Order Summary */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Order Summary
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Order Date</TableCell>
                      <TableCell align="right">{formatDate(orderDetails.created_at)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Payment Status</TableCell>
                      <TableCell align="right">
                        <Chip 
                          size="small" 
                          label={orderDetails.payment_status || "Unknown"} 
                          color={orderDetails.payment_status?.toLowerCase() === 'paid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Payment ID</TableCell>
                      <TableCell align="right">{orderDetails.payment_id || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Total Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {formatCurrency(orderDetails.price * orderDetails.quantity)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            {/* Shipping Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Shipping Information
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                  <HomeWork sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body2">{orderDetails.address}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body2">{orderDetails.phone}</Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Product Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Product Details
              </Typography>
              <Card sx={{ display: "flex", mb: 2 }}>
                {orderDetails.productDetails?.image && (
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      objectFit: "cover",
                      borderRight: "1px solid #eeeeee"
                    }}
                    image={`http://localhost:5000/${orderDetails.productDetails.image.replace(/\\/g, '/')}`}
                    alt={orderDetails.product_name}
                  />
                )}
                <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {orderDetails.product_name}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Category</Typography>
                        <Typography variant="body2">
                          {orderDetails.productDetails?.category || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Type</Typography>
                        <Typography variant="body2">
                          {orderDetails.productDetails?.type || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Size</Typography>
                        <Typography variant="body2">
                          {orderDetails.productDetails?.size || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Typography variant="body2">
                          {orderDetails.productDetails?.status || "N/A"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Box>
              </Card>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f7f5f9" }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{orderDetails.product_name}</TableCell>
                      <TableCell align="right">{formatCurrency(orderDetails.price)}</TableCell>
                      <TableCell align="right">{orderDetails.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {formatCurrency(orderDetails.price * orderDetails.quantity)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {orderDetails.productDetails?.description && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Product Description
                  </Typography>
                  <Typography variant="body2">
                    {orderDetails.productDetails.description}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", my: 4 }}>
            No data available
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            color: "#611964", 
            borderColor: "#611964", 
            "&:hover": { borderColor: "#4a1154", bgcolor: "#f0ebf4" }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsDialog;