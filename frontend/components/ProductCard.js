// frontend/components/ProductCard.js
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  IconButton, 
  Box, 
  Modal, 
  Button,
  Snackbar,
  Alert,
  ButtonGroup
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket"; // Added for view cart button
import { useRouter } from "next/router";
import axios from "axios";

const ProductCard = ({ product, onClick, onAddToCart }) => {
  const router = useRouter();
  // State for full details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // State for cart login prompt modal
  const [cartLoginPromptOpen, setCartLoginPromptOpen] = useState(false);
  // State for "already in cart" modal
  const [alreadyInCartModalOpen, setAlreadyInCartModalOpen] = useState(false);
  // State for user authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("");
  // State for notification
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  // State for product quantity
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("userType");
    
    if (token && storedUserType) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
    }
  }, []);

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      setDetailsModalOpen(true);
    }
  };

  const handleDetailsModalClose = () => {
    setDetailsModalOpen(false);
  };

  const handleQuantityIncrease = (e) => {
    e.stopPropagation();
    // Make sure we don't exceed available quantity
    if (selectedQuantity < product.quantity) {
      setSelectedQuantity(prevQuantity => prevQuantity + 1);
    } else {
      setNotification({
        open: true,
        message: "Cannot add more. Maximum available quantity reached.",
        severity: "warning"
      });
    }
  };

  const handleQuantityDecrease = (e) => {
    e.stopPropagation();
    if (selectedQuantity > 1) {
      setSelectedQuantity(prevQuantity => prevQuantity - 1);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setCartLoginPromptOpen(true);
      return;
    }

    if (userType !== "Buyer") {
      setNotification({
        open: true,
        message: "Sellers cannot add items to cart. Please login as a buyer.",
        severity: "warning"
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Get all necessary fields from the product object
      const productId = product._id || product.product_id || product.id;
      
      if (!productId) {
        console.error("Product object missing ID:", product);
        setNotification({
          open: true,
          message: "Cannot add item to cart: Missing product ID",
          severity: "error"
        });
        return;
      }

      // Create payload with all required fields from cartRoutes.js
      const cartPayload = {
        product_id: productId,
        product_name: product.product_name || product.name,
        product_description: product.description || product.product_description || "",
        category: product.category || "",
        type: product.type || "",
        size: product.size || "",
        status: product.status || "Available",
        quantity: selectedQuantity, // Use the selected quantity
        price: parseFloat(product.price) || 0,
        original_price: parseFloat(product.original_price) || parseFloat(product.price) || 0,
        image: product.image || "",
        seller_id: product.seller_id || product.user_id || product.sellerId
      };

      // Call API to add item to cart with the complete payload
      const response = await axios.post(
        "http://localhost:5000/api/cart/add", 
        cartPayload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Show success notification
      setNotification({
        open: true,
        message: `${selectedQuantity} item(s) added to your cart!`,
        severity: "success"
      });
      
      // Reset quantity back to 1 after adding to cart
      setSelectedQuantity(1);
      
      // Call the parent component's onAddToCart if provided (to update cart count)
      if (onAddToCart) {
        onAddToCart();
      }
      
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      
      // Handle the case where product is already in cart (new response from backend)
      if (error.response?.status === 409) {
        setAlreadyInCartModalOpen(true);
        return;
      }
      
      // Handle the case where not enough quantity is available
      if (error.response?.data?.error === "Not enough quantity available") {
        setNotification({
          open: true,
          message: `Only ${error.response.data.available} items available. You requested ${error.response.data.requested}.`,
          severity: "error"
        });
        return;
      }
      
      setNotification({
        open: true,
        message: `Failed to add item to cart: ${error.response?.data?.error || error.message || "Unknown error"}`,
        severity: "error"
      });
    }
  };

  const handleCartLoginPromptClose = () => {
    setCartLoginPromptOpen(false);
  };

  const handleAlreadyInCartModalClose = () => {
    setAlreadyInCartModalOpen(false);
  };

  const handleLoginRedirect = () => {
    setCartLoginPromptOpen(false);
    router.push("/auth/login");
  };

  const handleViewCartRedirect = () => {
    setAlreadyInCartModalOpen(false);
    router.push("/auth/cart");
  };

  // When seller's name is clicked, stop propagation and redirect to the seller profile page.
  const handleSellerClick = (e) => {
    e.stopPropagation();
    // Using product.user_id as the seller's identifier
    router.push(`/seller-profile/${product.user_id}`);
  };

  // Close notification
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          cursor: "pointer",
          borderRadius: 1,
          boxShadow: 2,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "linear-gradient(135deg, #ffffff, #f9f9f9)",
        }}
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
          <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: "bold" }}>
            {product.product_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.category} | {product.type}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Status: {product.status} | Qty: {product.quantity}
          </Typography>
          <Box sx={{ mt: 1, display: "flex", alignItems: "baseline" }}>
            <Typography
              variant="body2"
              component="span"
              sx={{ textDecoration: "line-through", color: "red", mr: 1 }}
              noWrap
            >
              Rs.{product.original_price}
            </Typography>
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: "bold", color: "#611964" }}
              noWrap
            >
              Rs.{product.price}
            </Typography>
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Seller:{" "}
            <span
              onClick={handleSellerClick}
              style={{ textDecoration: "underline", cursor: "pointer", color: "#611964" }}
            >
              {product.sellerName || "Unknown Seller"}
            </span>
          </Typography>
        </CardContent>

        {/* Bottom action bar with quantity selector and add to cart button */}
        <Box 
          sx={{ 
            p: 1.5, 
            display: "flex", 
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "rgba(97, 25, 100, 0.03)"
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Quantity selector */}
          <ButtonGroup 
            size="small" 
            sx={{ 
              backgroundColor: "white", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderRadius: 1,
              overflow: "hidden"
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleQuantityDecrease}
              disabled={selectedQuantity <= 1}
              sx={{ 
                padding: "4px",
                borderRadius: 0
              }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Box 
              sx={{ 
                padding: "4px 10px", 
                minWidth: "32px", 
                textAlign: "center", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                borderLeft: "1px solid rgba(0,0,0,0.08)",
                borderRight: "1px solid rgba(0,0,0,0.08)",
                fontSize: "0.875rem",
                fontWeight: "medium"
              }}>
              {selectedQuantity}
            </Box>
            <IconButton 
              size="small" 
              onClick={handleQuantityIncrease}
              disabled={selectedQuantity >= product.quantity}
              sx={{ 
                padding: "4px",
                borderRadius: 0
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </ButtonGroup>
          
          <IconButton
            onClick={handleAddToCart}
            sx={{
              backgroundColor: "#611964",
              color: "#fff",
              "&:hover": { backgroundColor: "#4a124b" },
              boxShadow: 2,
              width: 40,
              height: 40
            }}
          >
            <ShoppingCartIcon fontSize="small" />
          </IconButton>
        </Box>
      </Card>

      {/* Modal for Full Product Details */}
      <Modal
        open={detailsModalOpen}
        onClose={handleDetailsModalClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
            width: "90%",
            maxWidth: 800,
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleDetailsModalClose}
            sx={{ 
              position: "absolute", 
              top: 12, 
              right: 12,
              backgroundColor: "rgba(0,0,0,0.05)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
            {/* Left Column: Image */}
            <Box sx={{ flex: 1, textAlign: "center" }}>
              {product.image && (
                <Box
                  component="img"
                  src={`http://localhost:5000/${product.image}`}
                  alt={product.product_name}
                  sx={{
                    width: "100%",
                    maxHeight: { xs: 300, md: 450 },
                    objectFit: "contain",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                />
              )}
            </Box>

            {/* Right Column: Product Details and Add to Cart Button */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                  {product.product_name}
                </Typography>
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Typography
                    variant="h5"
                    component="span"
                    sx={{ fontWeight: "bold", color: "#611964", mr: 2 }}
                  >
                    Rs.{product.price}
                  </Typography>
                  {product.original_price && (
                    <Typography
                      variant="h6"
                      component="span"
                      sx={{ textDecoration: "line-through", color: "red" }}
                    >
                      Rs.{product.original_price}
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                  {product.description}
                </Typography>
                
                <Box sx={{ mb: 3, p: 2, backgroundColor: "rgba(97, 25, 100, 0.03)", borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Product Details
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {product.category && (
                      <Typography variant="body2">
                        <strong>Category:</strong> {product.category}
                      </Typography>
                    )}
                    {product.type && (
                      <Typography variant="body2">
                        <strong>Type:</strong> {product.type}
                      </Typography>
                    )}
                    {product.size && (
                      <Typography variant="body2">
                        <strong>Size:</strong> {product.size}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Status:</strong> {product.status}
                    </Typography>
                    <Typography variant="body2" sx={{ color: product.quantity > 0 ? "green" : "red" }}>
                      <strong>Availability:</strong> {product.quantity} items available
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Seller:</strong>{" "}
                  <span
                    onClick={handleSellerClick}
                    style={{ textDecoration: "underline", cursor: "pointer", color: "#611964" }}
                  >
                    {product.sellerName || "Unknown Seller"}
                  </span>
                </Typography>
              </Box>
              
              {/* Quantity selector in modal */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                  Select Quantity
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <ButtonGroup 
                    sx={{ 
                      backgroundColor: "white",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      borderRadius: 1,
                      overflow: "hidden"
                    }}
                  >
                    <IconButton 
                      onClick={(e) => handleQuantityDecrease(e)}
                      disabled={selectedQuantity <= 1}
                      sx={{ borderRadius: 0 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Box sx={{ 
                      padding: "8px 20px", 
                      minWidth: "50px", 
                      textAlign: "center", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      borderLeft: "1px solid rgba(0,0,0,0.1)",
                      borderRight: "1px solid rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                      fontSize: "1rem"
                    }}>
                      {selectedQuantity}
                    </Box>
                    <IconButton 
                      onClick={(e) => handleQuantityIncrease(e)}
                      disabled={selectedQuantity >= product.quantity}
                      sx={{ borderRadius: 0 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </ButtonGroup>
                  
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {product.quantity} items available
                  </Typography>
                </Box>
                
                {/* Add to Cart Button with Icon and Text */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  sx={{ 
                    bgcolor: "#611964", 
                    "&:hover": { bgcolor: "#4a124b" },
                    py: 1.5,
                    borderRadius: 1,
                    fontSize: "1rem",
                    textTransform: "none",
                    fontWeight: "bold",
                    boxShadow: 3
                  }}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Modal for Cart Login Prompt */}
      <Modal
        open={cartLoginPromptOpen}
        onClose={handleCartLoginPromptClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: 320,
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#611964", fontWeight: "bold" }}>
            You need to log in as a buyer to add items to the cart.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoginRedirect}
              sx={{ flex: 1, bgcolor: "#611964", "&:hover": { bgcolor: "#4a124b" } }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              onClick={handleCartLoginPromptClose}
              sx={{ flex: 1, borderColor: "#611964", color: "#611964" }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* New Modal for Already in Cart Notification */}
      <Modal
        open={alreadyInCartModalOpen}
        onClose={handleAlreadyInCartModalClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: 350,
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#611964", fontWeight: "bold" }}>
            This item is already in your cart
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You can adjust the quantity from your cart page.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<ShoppingBasketIcon />}
              onClick={handleViewCartRedirect}
              sx={{ flex: 1, bgcolor: "#611964", "&:hover": { bgcolor: "#4a124b" } }}
            >
              View Cart
            </Button>
            <Button
              variant="outlined"
              onClick={handleAlreadyInCartModalClose}
              sx={{ flex: 1, borderColor: "#611964", color: "#611964" }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={3000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductCard;