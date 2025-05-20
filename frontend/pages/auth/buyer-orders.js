// frontend/pages/order/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from "@mui/material";
import { 
  LocalShipping, 
  CheckCircle, 
  Pending, 
  Cancel, 
  LocalMall,
  ArrowBack,
  ShoppingBag
} from "@mui/icons-material";

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Check if we have an order ID
    if (id) {
      fetchOrderDetails(id, token);
    }
  }, [router, id]);

  const fetchOrderDetails = async (orderId, token) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      
      if (error.response && error.response.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        router.push("/auth/login");
      } else {
        setError("Failed to load order details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusChipColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'processing':
      case 'pending':
        return <Pending fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return <LocalMall fontSize="small" />;
    }
  };

  const getActiveStep = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'completed':
        return 3;
      case 'cancelled':
        return -1; // Special case for cancelled orders
      default:
        return 0;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Button 
        startIcon={<ArrowBack />}
        onClick={() => router.push("/my-orders")}
        sx={{ mb: 3, color: "#611964" }}
      >
        Back to My Orders
      </Button>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="#611964">
            Order Details
          </Typography>
          
          {order && (
            <Chip 
              icon={getStatusIcon(order.status)}
              label={order.status} 
              color={getStatusChipColor(order.status)}
              variant="outlined"
              size="medium"
            />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 5 }}>
            <CircularProgress sx={{ color: "#611964" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
            {error.includes("session") || error.includes("log in") ? (
              <Button 
                variant="contained"
                onClick={() => router.push("/auth/login")}
                sx={{ mt: 2, bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
              >
                Log In Again
              </Button>
            ) : (
              <Button 
                variant="outlined"
                onClick={() => fetchOrderDetails(id, localStorage.getItem("token"))}
                sx={{ mt: 2, color: "#611964", borderColor: "#611964" }}
              >
                Try Again
              </Button>
            )}
          </Alert>
        ) : order ? (
          <>
            {/* Order Progress Tracker */}
            <Box sx={{ mb: 4 }}>
              {order.status?.toLowerCase() !== 'cancelled' ? (
                <Stepper activeStep={getActiveStep(order.status)} alternativeLabel>
                  <Step>
                    <StepLabel>Order Placed</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Processing</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Shipped</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Delivered</StepLabel>
                  </Step>
                </Stepper>
              ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <AlertTitle>Order Cancelled</AlertTitle>
                  This order has been cancelled. If you have any questions, please contact customer support.
                </Alert>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" color="#611964" gutterBottom>
                      Order Information
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                      <Typography variant="body1">{order.order_id}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Date Placed</Typography>
                      <Typography variant="body1">{formatDate(order.created_at)}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                      <Chip 
                        size="small" 
                        label={order.payment_status || "Unknown"} 
                        color={order.payment_status?.toLowerCase() === 'paid' ? 'success' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                      <Typography variant="body1">{order.payment_method || "N/A"}</Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="#611964" gutterBottom>
                      Shipping Details
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Shipping Address</Typography>
                      <Typography variant="body1">{order.address || "N/A"}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{order.phone || "N/A"}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalShipping color="primary" />
                      <Typography variant="body1" fontWeight="medium">
                        {order.status === "shipped" ? 
                          "Your order is on the way!" : 
                          order.status === "completed" ? 
                            "Your order has been delivered" : 
                            "Waiting to be shipped"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" color="#611964" gutterBottom>
                      Order Items
                    </Typography>
                    
                    <Box sx={{ 
                      bgcolor: "#f7f5f9", 
                      p: 2, 
                      borderRadius: 1, 
                      mt: 2, 
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {order.product_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.description ? order.description.substring(0, 100) + "..." : "No description"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" color="text.secondary">
                          {order.quantity} x {formatCurrency(order.price)}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(order.price * order.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="subtitle1">Total:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatCurrency(order.price * order.quantity)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="#611964" gutterBottom>
                      Seller Information
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Seller Name</Typography>
                      <Typography variant="body1">{order.seller_name || "N/A"}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                      <Typography variant="body1">{order.seller_contact || "N/A"}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ShoppingBag />}
                        onClick={() => router.push(`/shop/${order.seller_id}`)}
                        sx={{ 
                          color: "#611964", 
                          borderColor: "#611964",
                          '&:hover': { borderColor: "#4a1154", bgcolor: "#f0ebf4" }
                        }}
                      >
                        Visit Shop
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        ) : (
          <Typography>Order not found</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default OrderDetails;