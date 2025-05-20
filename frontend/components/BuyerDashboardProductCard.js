// frontend/components/BuyerDashboardProductCard.js
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
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/router";
import axios from "axios";

const BuyerDashboardProductCard = ({ product, onClick, onAddToCart }) => {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  const handleCartClick = (e) => {
    e.stopPropagation();
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleConfirmAdd = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_description: product.description || "", // Make sure it's not undefined
        category: product.category || "",
        type: product.type || "",
        size: product.size || "",
        status: product.status || "",
        quantity: 1, // Default to 1
        price: product.price,
        original_price: product.original_price || product.price, // Fallback to price if original_price is not available
        image: product.image || "",
        seller_id: product.seller_id || product.user_id, // Try both possible field names
      };
      
      console.log("Adding product to cart with payload:", payload);
      
      // Verify that required fields are present
      if (!payload.product_id || !payload.product_name || !payload.price || !payload.seller_id) {
        throw new Error("Missing required product details");
      }
      
      const response = await axios.post(
        "http://localhost:5000/api/cart/add",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(response.data.message);
      if (onAddToCart) onAddToCart(product);
    } catch (error) {
      console.error("Error adding product to cart:", error.response?.data || error.message);
      alert(`Error adding product to cart: ${error.response?.data?.error || error.message}`);
    }
    setOpenModal(false);
  };





  // When seller's name is clicked, stop propagation and redirect to the seller profile page.
  const handleSellerClick = (e) => {
    e.stopPropagation();
    // Using product.user_id as the seller's identifier
    router.push(`/seller-profile/${product.user_id}`);
  };







  return (
    <>
      <Card
        onClick={() => onClick && onClick(product)}
        sx={{
          cursor: "pointer",
          boxShadow: 1,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": { transform: "translateY(-3px)", boxShadow: 10 },
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
              height: 120,
              objectFit: "cover",
            }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, p: 1 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: "bold" }}>
            {product.product_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {product.category} | {product.type}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
            Rs.{product.price}
          </Typography>
        </CardContent>
        <Box sx={{ position: "absolute", bottom: 4, right: 4 }}>
          <IconButton
            onClick={handleCartClick}
            sx={{
              backgroundColor: "rgba(97, 25, 100, 0.8)",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(74, 18, 75, 0.9)" },
              p: 0.5,
            }}
          >
            <ShoppingCartIcon fontSize="small" />
          </IconButton>
        </Box>
      </Card>

      {/* Modal Popup for Full Product Details */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 800 },
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 0.5,
            boxShadow: 24,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          {/* Left Side: Full Product Image */}
          {product.image && (
            <Box
              component="img"
              src={`http://localhost:5000/${product.image}`}
              alt={product.product_name}
              sx={{
                width: { xs: "100%", sm: "50%" },
                height: "auto",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 0.5,
              }}
            />
          )}
          {/* Right Side: Product Details */}
          <Box sx={{ width: { xs: "100%", sm: "50%" }, position: "relative" }}>
            <IconButton onClick={handleCloseModal} sx={{ position: "absolute", top: 8, right: 8 }}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#611964" }}>
              {product.product_name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Category:</strong> {product.category}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Type:</strong> {product.type}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Status:</strong> {product.status}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Quantity:</strong> {product.quantity}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textDecoration: "line-through", color: "red" }}>
              <strong>Original Price:</strong> Rs.{product.original_price}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#611964" }}>
              <strong>Price:</strong> Rs.{product.price}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2,cursor: "pointer",
    textDecoration: "underline",
    color: "#611964", }} onClick={handleSellerClick} >
              <strong>Seller:</strong> {product.sellerName}
            </Typography>
            {/* Buttons: Add to Cart and Cancel in one line */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirmAdd}
                sx={{
                  bgcolor: "#611964",
                  "&:hover": { bgcolor: "#4a124b" },
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Add to Cart
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleCloseModal}
                sx={{
                  borderColor: "#611964",
                  color: "#611964",
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default BuyerDashboardProductCard;
