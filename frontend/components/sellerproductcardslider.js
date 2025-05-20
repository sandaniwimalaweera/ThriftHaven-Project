// frontend/components/sellerproductcardslider.js
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import axios from "axios";
import DashboardProductCard from "./BuyerDashboardProductCard"; // Your individual product card component
import { motion } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const DashboardProductSectionSlider = ({ sellerId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch only approved products for this seller
      const response = await axios.get(`http://localhost:5000/api/products/approved?sellerId=${sellerId}`);
      // Limit to the first 6 products for the slider
      setProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      fetchProducts();
    }
  }, [sellerId]);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      if (sliderRef.current.scrollLeft + sliderRef.current.clientWidth >= sliderRef.current.scrollWidth) {
        sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        sliderRef.current.scrollBy({ left: 260, behavior: "smooth" });
      }
    }
  };

  return (
    <Box sx={{ mt: 2, position: "relative" }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length > 0 ? (
        <Box sx={{ position: "relative" }}>
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
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Box
            ref={sliderRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollBehavior: "smooth",
              pl: 2,
              pr: 2,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {products.map((prod) => (
              <Box key={prod.product_id} sx={{ width: 250, mr: 2, flexShrink: 0 }}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <DashboardProductCard product={prod} />
                </motion.div>
              </Box>
            ))}
          </Box>
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
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Typography variant="body1">No products found for this seller.</Typography>
      )}
    </Box>
  );
};

export default DashboardProductSectionSlider;
