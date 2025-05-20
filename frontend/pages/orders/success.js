// frontend/pages/orders/success.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";
import Link from "next/link";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch order details if orderId is available
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderDetails(response.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please check your orders history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: "center",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push("/orders")}
            >
              View My Orders
            </Button>
          </Box>
        ) : (
          <Box>
            <CheckCircleOutlineIcon 
              sx={{ fontSize: 80, color: "success.main", mb: 2 }} 
            />
            <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
              Thank You for Your Order!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
              Your order has been successfully placed.
            </Typography>
            
            {orderDetails && (
              <Box sx={{ mt: 4, textAlign: "left" }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        Order Reference
                      </Typography>
                      <Typography variant="body1">
                        #{orderDetails.order.id}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Order Summary
                      </Typography>
                      
                      <List disablePadding>
                        {orderDetails.items.map((item) => (
                          <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                            <ListItemText
                              primary={item.product_name}
                              secondary={`Quantity: ${item.quantity}`}
                            />
                            <Typography variant="body2">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                          Total
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                          ₹{(orderDetails.order.total_amount / 100).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Shipping Information
                      </Typography>
                      <Typography variant="body1">{orderDetails.order.address}</Typography>
                      <Typography variant="body1">Phone: {orderDetails.order.phone}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => router.push("/products")}
              >
                Continue Shopping
              </Button>
              <Button 
                variant="contained" 
                onClick={() => router.push("/orders")}
                sx={{ bgcolor: "#611964", "&:hover": { bgcolor: "#4a1350" } }}
              >
                View My Orders
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}