// frontend/pages/cart.js
import React, { useEffect, useState } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CircularProgress, 
  Button 
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const fetchCartItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/cart/mycart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(response.data);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [router]);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        My Cart
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : cartItems.length === 0 ? (
        <Typography>No items in your cart.</Typography>
      ) : (
        <Grid container spacing={2}>
          {cartItems.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ mb: 2, display: "flex" }}>
                {item.image && (
                  <CardMedia
                    component="img"
                    image={`http://localhost:5000/${item.image}`}
                    alt={item.product_name}
                    sx={{ width: 150, objectFit: "cover" }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6">{item.product_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: Rs.{item.price} | Quantity: {item.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buyer: {item.buyer_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seller: {item.seller_name} (ID: {item.seller_id})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Added on: {new Date(item.created_at).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => router.push("/checkout")}
          sx={{ bgcolor: "#611964", "&:hover": { bgcolor: "#4a124b" } }}
        >
          Proceed to Checkout
        </Button>
      </Box>
    </Container>
  );
};

export default Cart;
