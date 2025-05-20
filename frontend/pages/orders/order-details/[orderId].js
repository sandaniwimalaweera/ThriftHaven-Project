// pages/seller/order-details/[orderId].js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Breadcrumbs
} from "@mui/material";
import {
  LocalShipping,
  CheckCircle,
  Pending,
  ArrowBack,
  ReceiptLong,
  Update,
  MoneyOff,
  Info,
  Person,
  Phone,
  Home,
  History,
  Payment
} from "@mui/icons-material";
import Link from "next/link";
import SellerSidebar from "../../../components/seller-sidebar";

const SellerOrderDetails = () => {
  const router = useRouter();
  const { orderId } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({ name: "Seller", id: "" });
  const [refundDetails, setRefundDetails] = useState(null);
  const [loadingRefund, setLoadingRefund] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    
    // Only fetch if orderId is available (router might not be ready immediately)
    if (orderId) {
      fetchSellerInfo();
      fetchOrderDetails(orderId);
    }
  }, [router, orderId]);
  
  const fetchSellerInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) return;
      
      const response = await axios.get("http://localhost:5000/api/users/details", {
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json"
        }
      });
      
      // Get the user data
      const { name, id } = response.data;
      
      setSellerInfo({
        name: name || "Seller",
        id: id || ""
      });
    } catch (error) {
      console.error("Error fetching seller info:", error);
      
      // Use default values from localStorage as fallback
      setSellerInfo({
        name: localStorage.getItem("userName") || "Seller",
        id: localStorage.getItem("userId") || ""
      });
    }
  };
  
  const fetchOrderDetails = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`http://localhost:5000/api/orders/seller/${id}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      const orderData = response.data;
      setOrder(orderData);
      
      // Set initial status value for dialog
      if (orderData && orderData.status) {
        setNewStatus(orderData.status.toLowerCase());
      }
      
      // Check if there's a refund request for this order
      await fetchRefundDetails(id);
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details. Please try again.");
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
      } else if (error.response && error.response.status === 404) {
        setError("Order not found or you don't have permission to view it.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRefundDetails = async (id) => {
    setLoadingRefund(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get("http://localhost:5000/api/orders/seller/refund-requests", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      // Find refund for this specific order
      const refundForOrder = response.data.find(refund => refund.order_id === parseInt(id));
      
      if (refundForOrder) {
        setRefundDetails(refundForOrder);
      }
      
    } catch (error) {
      console.error("Error fetching refund details:", error);
    } finally {
      setLoadingRefund(false);
    }
  };
  
  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setStatusUpdateLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Make API call to update order status
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
          }
        }
      );
      
      // Close dialog
      setStatusDialogOpen(false);
      
      // Refresh order data
      fetchOrderDetails(orderId);
      
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(`Failed to update status: ${error.response?.data?.error || error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Helper function to determine if status update is allowed
  const canUpdateStatus = (status) => {
    if (!status) return false;
    const lowerStatus = status.toLowerCase();
    // Prevent updating if already received
    return lowerStatus !== "received";
  };
  
  const getStatusChipColor = (status) => {
    if (!status) return "default";
    
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
    if (!status) return <Info fontSize="small" />;
    
    switch(status.toLowerCase()) {
      case 'received':
        return <CheckCircle fontSize="small" />;
      case 'processing':
      case 'pending':
        return <Pending fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      default:
        return <Info fontSize="small" />;
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
    if (!amount) return "LKR 0.00";
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getReasonChip = (reason) => {
    if (!reason) return null;
    
    // Convert reason format: replace underscores with spaces and capitalize
    const formattedReason = reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return <Chip 
      size="small" 
      label={formattedReason}
      variant="outlined"
      sx={{ 
        borderColor: '#9e9e9e', 
        color: 'text.primary',
        textTransform: 'none' 
      }} 
    />;
  };
  
  return (
    <Box sx={{ display: "flex", bgcolor: "#f9f9f9", minHeight: "100vh" }}>
      <SellerSidebar userName={sellerInfo.name} />
      
      <Container sx={{ flexGrow: 1, p: 3, maxWidth: "xl" }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          {/* Breadcrumbs and back button */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton 
              sx={{ mr: 1, color: "#611964" }}
              onClick={() => router.back()}
            >
              <ArrowBack />
            </IconButton>
            
            <Breadcrumbs aria-label="breadcrumb">
              <Link href="/seller/dashboard" passHref>
                <Typography 
                  component="a" 
                  color="inherit" 
                  sx={{ 
                    textDecoration: 'none', 
                    '&:hover': { 
                      textDecoration: 'underline' 
                    } 
                  }}
                >
                  Dashboard
                </Typography>
              </Link>
              <Link href="/seller/orders" passHref>
                <Typography 
                  component="a" 
                  color="inherit" 
                  sx={{ 
                    textDecoration: 'none', 
                    '&:hover': { 
                      textDecoration: 'underline' 
                    } 
                  }}
                >
                  Orders
                </Typography>
              </Link>
              <Typography color="text.primary">Order Details</Typography>
            </Breadcrumbs>
          </Box>
          
          <Typography variant="h4" fontWeight="bold" color="#611964" sx={{ mb: 3 }}>
            Order Details
          </Typography>
          
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
              <CircularProgress size={60} sx={{ color: "#611964", mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading order details...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
              <Button 
                variant="outlined"
                onClick={() => fetchOrderDetails(orderId)}
                sx={{ mt: 2, color: "#611964", borderColor: "#611964" }}
              >
                Try Again
              </Button>
            </Alert>
          ) : order ? (
            <Box>
              {/* Order ID and status header */}
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                bgcolor: "#f7f5f9",
                p: 2,
                borderRadius: 2,
                mb: 3
              }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      bgcolor: "#611964", 
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2
                    }}
                  >
                    <ReceiptLong />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      Order #{orderId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Placed on {formatDate(order.created_at)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip 
                    icon={getStatusIcon(order.status)}
                    label={order.status}
                    color={getStatusChipColor(order.status)}
                    sx={{ fontWeight: "medium", mr: 2 }}
                  />
                  
                  {canUpdateStatus(order.status) && (
                    <Button
                      variant="contained"
                      startIcon={<Update />}
                      onClick={() => setStatusDialogOpen(true)}
                      sx={{ 
                        bgcolor: "#611964", 
                        '&:hover': { bgcolor: "#4a1154" }
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                {/* Order content column */}
                <Grid item xs={12} md={8}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: "1px solid #eee" 
                      }}>
                        <LocalShipping sx={{ color: "#611964", mr: 1 }} />
                        <Typography variant="h6" fontWeight="medium">
                          Product Details
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Typography variant="subtitle1" fontWeight="medium" color="#611964">
                              {order.product_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Product ID: {order.product_id}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={4} sx={{ textAlign: { sm: "right" } }}>
                            <Typography variant="body2" color="text.secondary">
                              Unit Price
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {formatCurrency(order.price)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Quantity
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {order.quantity}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Subtotal
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(order.price * order.quantity)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="#611964">
                            {formatCurrency(order.price * order.quantity)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: "1px solid #eee" 
                      }}>
                        <Person sx={{ color: "#611964", mr: 1 }} />
                        <Typography variant="h6" fontWeight="medium">
                          Buyer Information
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Buyer ID
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {order.buyer_id}
                          </Typography>
                          
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Phone sx={{ color: "#611964", fontSize: 18, mr: 1 }} />
                            <Typography variant="body1">
                              {order.phone}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Shipping Address
                          </Typography>
                          <Box sx={{ display: "flex", mt: 1 }}>
                            <Home sx={{ color: "#611964", fontSize: 18, mr: 1, mt: 0.5 }} />
                            <Typography variant="body1">
                              {order.address}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: "1px solid #eee" 
                      }}>
                        <History sx={{ color: "#611964", mr: 1 }} />
                        <Typography variant="h6" fontWeight="medium">
                          Order Timeline
                        </Typography>
                      </Box>
                      
                      <Box sx={{ position: "relative", ml: 1.5, pl: 2.5, borderLeft: "2px dashed #e0e0e0" }}>
                        <Box sx={{ mb: 3, position: "relative" }}>
                          <Box 
                            sx={{ 
                              position: "absolute", 
                              width: 12, 
                              height: 12, 
                              borderRadius: "50%", 
                              bgcolor: "#9575cd", 
                              left: -27,
                              top: 6
                            }} 
                          />
                          <Typography variant="subtitle2" fontWeight="medium">
                            Order Created
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(order.created_at)}
                          </Typography>
                        </Box>
                        
                        {(order.status === "processing" || order.status === "shipped" || order.status === "received") && (
                          <Box sx={{ mb: 3, position: "relative" }}>
                            <Box 
                              sx={{ 
                                position: "absolute", 
                                width: 12, 
                                height: 12, 
                                borderRadius: "50%", 
                                bgcolor: "#ffa726", 
                                left: -27,
                                top: 6
                              }} 
                            />
                            <Typography variant="subtitle2" fontWeight="medium">
                              Processing Started
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {/* This is just a placeholder as we don't have this timestamp */}
                              Status updated to processing
                            </Typography>
                          </Box>
                        )}
                        
                        {(order.status === "shipped" || order.status === "received") && (
                          <Box sx={{ mb: 3, position: "relative" }}>
                            <Box 
                              sx={{ 
                                position: "absolute", 
                                width: 12, 
                                height: 12, 
                                borderRadius: "50%", 
                                bgcolor: "#29b6f6", 
                                left: -27,
                                top: 6
                              }} 
                            />
                            <Typography variant="subtitle2" fontWeight="medium">
                              Shipped
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {/* This is just a placeholder as we don't have this timestamp */}
                              Order has been shipped
                            </Typography>
                          </Box>
                        )}
                        
                        {order.status === "received" && (
                          <Box sx={{ position: "relative" }}>
                            <Box 
                              sx={{ 
                                position: "absolute", 
                                width: 12, 
                                height: 12, 
                                borderRadius: "50%", 
                                bgcolor: "#66bb6a", 
                                left: -27,
                                top: 6
                              }} 
                            />
                            <Typography variant="subtitle2" fontWeight="medium">
                              Delivered & Received
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {/* This is just a placeholder as we don't have this timestamp */}
                              Customer confirmed receipt
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Payment info and refund column */}
                <Grid item xs={12} md={4}>
                  {/* Payment info card */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: "1px solid #eee" 
                      }}>
                        <Payment sx={{ color: "#611964", mr: 1 }} />
                        <Typography variant="h6" fontWeight="medium">
                          Payment Information
                        </Typography>
                      </Box>
                      
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Payment ID
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {order.payment_id}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Payment Intent ID
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: "break-all" }}>
                            {order.payment_intent_id || "N/A"}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Payment Status
                          </Typography>
                          <Chip 
                            size="small" 
                            label={order.payment_status} 
                            color={order.payment_status === "succeeded" || order.payment_status === "paid" ? "success" : "warning"}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Payment Amount
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="#611964">
                            {formatCurrency(order.amount)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                  
                  {/* Refund card - only show if there's a refund request */}
                  {loadingRefund ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                      <CircularProgress size={30} sx={{ color: "#611964" }} />
                    </Box>
                  ) : refundDetails && (
                    <Card sx={{ 
                      borderTop: '4px solid',
                      borderColor: 
                        refundDetails.refund_status?.toLowerCase() === 'pending' ? '#ED6C02' :
                        refundDetails.refund_status?.toLowerCase() === 'approved' ? '#2E7D32' :
                        refundDetails.refund_status?.toLowerCase() === 'rejected' ? '#D32F2F' : 
                        '#9e9e9e'
                    }}>
                      <CardContent>
                        <Box sx={{ 
                          display: "flex", 
                          alignItems: "center", 
                          mb: 2, 
                          pb: 1, 
                          borderBottom: "1px solid #eee" 
                        }}>
                          <MoneyOff sx={{ color: "#d32f2f", mr: 1 }} />
                          <Typography variant="h6" fontWeight="medium" color="#d32f2f">
                            Refund Request
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip 
                            label={refundDetails.refund_status}
                            color={
                              refundDetails.refund_status?.toLowerCase() === 'pending' ? 'warning' :
                              refundDetails.refund_status?.toLowerCase() === 'approved' ? 'success' :
                              refundDetails.refund_status?.toLowerCase() === 'rejected' ? 'error' : 
                              'default'
                            }
                            variant="outlined"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Refund Amount
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="#d32f2f">
                            {formatCurrency(refundDetails.amount)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Reason
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {getReasonChip(refundDetails.reason)}
                          </Box>
                        </Box>
                        
                        {refundDetails.description && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Customer Notes
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              mt: 0.5, 
                              p: 1.5, 
                              bgcolor: "#f5f5f5", 
                              borderRadius: 1,
                              fontStyle: "italic"
                            }}>
                              "{refundDetails.description}"
                            </Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Requested On
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(refundDetails.requested_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity="info" sx={{ my: 4 }}>
              <AlertTitle>No Data</AlertTitle>
              No order details available.
            </Alert>
          )}
        </Paper>
      </Container>
      
      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Update Order Status
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1, pb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status: <Chip 
                label={order?.status || ""} 
                color={getStatusChipColor(order?.status || "")} 
                size="small"
              />
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="new-status-label">New Status</InputLabel>
              <Select
                labelId="new-status-label"
                id="new-status-select"
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
              </Select>
            </FormControl>
            
            {newStatus === "shipped" && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Order will be marked as shipped</AlertTitle>
                Please ensure that you have prepared the package and it's ready for delivery.
              </Alert>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={statusUpdateLoading || !newStatus || newStatus === order?.status?.toLowerCase()}
            startIcon={statusUpdateLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerOrderDetails;