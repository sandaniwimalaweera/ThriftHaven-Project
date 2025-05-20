// frontend/pages/orders/[orderId].js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Alert
} from "@mui/material";
import axios from "axios";
import { format } from "date-fns";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";


// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "paid":
    case "succeeded":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    default:
      return "default";
  }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push(`/auth/login?redirect=/orders/${orderId}`);
          return;
        }
        
        const response = await axios.get(
          `http://localhost:5000/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setOrderDetails(response.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, router]);

  const handleBackToOrders = () => {
    router.push("/orders");
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOrders}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  if (!orderDetails) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Order not found
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOrders}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  const { order, items } = orderDetails;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOrders}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ color: "#611964", fontWeight: "bold" }}>
          Order Details
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        {/* Order Header */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Number
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              #{order.id}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Date
            </Typography>
            <Typography variant="h6">
              {format(new Date(order.created_at), "PPP p")}
            </Typography>
          </Grid>
        </Grid>

        {/* Order Status */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Status
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Order Status:
                </Typography>
                <Chip 
                  label={order.status} 
                  color={getStatusColor(order.status)} 
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Payment Status:
                </Typography>
                <Chip 
                  label={order.payment_status || "N/A"} 
                  color={getStatusColor(order.payment_status)} 
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Order Items */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Order Items
        </Typography>
        
        <List disablePadding>
          {items.map((item) => (
            <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
              <ListItemText
                primary={item.product_name}
                secondary={`Quantity: ${item.quantity}`}
              />
              <Typography variant="body1">
                ₹{(parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Total */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Box sx={{ width: "50%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="subtitle1">Subtotal:</Typography>
              <Typography variant="subtitle1">
                ₹{(order.total_amount / 100).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="subtitle1">Shipping:</Typography>
              <Typography variant="subtitle1">
                Free
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ₹{(order.total_amount / 100).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Shipping Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Shipping Address
            </Typography>
            <Typography variant="body1">{order.address}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Contact Information
            </Typography>
            <Typography variant="body1">Phone: {order.phone}</Typography>
          </Grid>
        </Grid>
        
        {/* Payment Information */}
        {order.payment_intent_id && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Payment Information
              </Typography>
              <Typography variant="body2">
                Payment ID: {order.payment_intent_id}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}