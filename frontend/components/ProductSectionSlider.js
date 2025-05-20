// frontend/components/ProductSectionSlider.js
import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, Box, IconButton, CircularProgress } from "@mui/material";
import axios from "axios";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRouter } from "next/router";

const ProductSectionSlider = ({ onProductClick, onCartUpdate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch from approvedproducts endpoint instead of products
      const response = await axios.get("http://localhost:5000/api/products/approved");
      // Limit to the first 6 approved products for the slider
      setProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error("Error fetching approved products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      if (
        scrollRef.current.scrollLeft + scrollRef.current.clientWidth >=
        scrollRef.current.scrollWidth
      ) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }
  };

  // Auto slide every 3 seconds
  useEffect(() => {
    const autoSlideInterval = setInterval(() => {
      scrollRight();
    }, 3000);
    return () => clearInterval(autoSlideInterval);
  }, [products]);

  // Handle cart update when a product is added to the cart
  const handleAddToCart = () => {
    if (onCartUpdate) {
      onCartUpdate();
    }
  };

  return (
    <Container sx={{ mt: 4, position: "relative" }}>
      <Typography variant="h4" fontWeight="bold" color="#611964" sx={{ mb: 3 }}>
        Featured Products
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ position: "relative" }}>
          {/* Left Arrow */}
          <IconButton
            onClick={scrollLeft}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              bgcolor: "rgba(97, 25, 100, 0.8)",
              color: "white",
              "&:hover": { bgcolor: "rgba(74, 18, 75, 0.9)" },
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          {/* Slider Container */}
          <Box
            ref={scrollRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollBehavior: "smooth",
              py: 2,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {products.map((product) => (
              <Box
                key={product.product_id || product._id}
                sx={{ minWidth: 300, mr: 2 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <ProductCard 
                    product={product} 
                    onClick={() => onProductClick && onProductClick(product)}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              </Box>
            ))}
          </Box>
          {/* Right Arrow */}
          <IconButton
            onClick={scrollRight}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              bgcolor: "rgba(97, 25, 100, 0.8)",
              color: "white",
              "&:hover": { bgcolor: "rgba(74, 18, 75, 0.9)" },
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      )}
      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography
          variant="body1"
          sx={{ cursor: "pointer", color: "#611964", fontWeight: "bold" }}
          onClick={() => router.push("/auth/products")}
        >
          see all products &gt;&gt;
        </Typography>
      </Box>
    </Container>
  );
};

export default ProductSectionSlider;