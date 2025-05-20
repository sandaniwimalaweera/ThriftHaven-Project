// frontend/pages/checkout.js
import { useState, useEffect } from "react";
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  TextField, 
  Box, 
  Grid,
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Alert,
  Snackbar,
  Button
} from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../../components/PaymentForm";
import { useRouter } from "next/router";

// Load Stripe outside of component to avoid recreating Stripe object on renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  // Load cart data and calculate total amount
  useEffect(() => {
    const loadCartData = () => {
      try {
        if (typeof window !== "undefined") {
          const storedItems = localStorage.getItem("selectedCartItems");
          if (storedItems) {
            const items = JSON.parse(storedItems);
            setCartItems(items);
            
            // Calculate total amount
            const total = items.reduce((sum, item) => {
              const itemPrice = parseFloat(item.price) || 0;
              const itemQuantity = parseInt(item.quantity, 10) || 0;
              return sum + (itemPrice * itemQuantity);
            }, 0);
            
            // Convert to smallest currency unit (cents) and handle decimal values
            // Multiply by 100 and round to ensure we have whole numbers
            setTotalAmount(Math.round(total * 100));
          } else {
            setCartItems([]);
            setTotalAmount(0);
          }
        }
      } catch (err) {
        console.error("Error loading cart data:", err);
        setError("Failed to load cart items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCartData();
  }, []);

  const handlePaymentSuccess = (data) => {
    setPaymentSuccess(true);
    setAlertOpen(true);
    
    // Clear cart data
    localStorage.removeItem("selectedCartItems");
    
    // Redirect after a short delay to show success message
    // Using payment ID instead of order ID for redirection
    setTimeout(() => {
      router.push(`/orders/payment/${data.paymentId}`);
    }, 2000);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setAlertOpen(true);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#611964", fontWeight: "bold" }}>
        Checkout
      </Typography>
      
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography>Loading your cart items...</Typography>
        </Box>
      ) : cartItems.length > 0 ? (
        <Grid container spacing={3}>
          {/* Order Summary */}
          <Grid item xs={12} md={5}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <List>
                {cartItems.map((item, index) => (
                  <ListItem key={index} sx={{ py: 1, px: 0 }}>
                    <ListItemText
                      primary={item.product_name}
                      secondary={`Qty: ${item.quantity}`}
                    />
                    <Typography variant="body1">
                      LKR {(parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  LKR {(totalAmount / 100).toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Payment Form */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                  Shipping Information
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Shipping Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                {/* Payment Success Message */}
                {paymentSuccess && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Payment was successful! Your order is being processed.
                  </Alert>
                )}
                
                {/* Stripe Elements Integration */}
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={totalAmount}
                    cartItems={cartItems}
                    address={address}
                    phone={phone}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your cart is empty
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/products')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      )}
      
      {/* Feedback Snackbar */}
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={paymentSuccess ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {paymentSuccess 
            ? "Payment successful! Redirecting to payment details..." 
            : error
          }
        </Alert>
      </Snackbar>
    </Container>
  );
}