// // frontend/components/DashboardProductSectionSlider.js
// import React, { useState, useEffect, useRef } from "react";
// import { Container, Typography, Box, IconButton, CircularProgress } from "@mui/material";
// import axios from "axios";
// import DashboardProductCard from "./BuyerDashboardProductCard";
// import { motion } from "framer-motion";
// import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
// import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// const DashboardProductSectionSlider = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const scrollRef = useRef(null);

//   const fetchProducts = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get("http://localhost:5000/api/products/approved");
//       // Limit to first 6 products for the slider
//       setProducts(response.data.slice(0, 6));
//     } catch (error) {
//       console.error("Error fetching products:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const scrollLeft = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollRef.current) {
//       if (scrollRef.current.scrollLeft + scrollRef.current.clientWidth >= scrollRef.current.scrollWidth) {
//         scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
//       } else {
//         scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
//       }
//     }
//   };

//   // Auto slide every 3 seconds
//   useEffect(() => {
//     const autoSlideInterval = setInterval(() => {
//       scrollRight();
//     }, 3000);
//     return () => clearInterval(autoSlideInterval);
//   }, [products]);

//   return (
//     <Container sx={{ mt: 1, position: "relative" }}>

//       {loading ? (
//         <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <Box sx={{ position: "relative" }}>
//           {/* Left Arrow */}
//           <IconButton
//             onClick={scrollLeft}
//             sx={{
//               position: "absolute",
//               left: 0,
//               top: "50%",
//               transform: "translateY(-50%)",
//               zIndex: 1,
//               bgcolor: "rgba(97, 25, 100, 0.8)",
//               color: "white",
//               "&:hover": { bgcolor: "rgba(74, 18, 75, 0.9)" },
//             }}
//           >
//             <ArrowBackIosNewIcon fontSize="small" />
//           </IconButton>
//           {/* Slider Container */}
//           <Box
//             ref={scrollRef}
//             sx={{
//               display: "flex",
//               overflowX: "auto",
//               scrollBehavior: "smooth",
//               py: 2,
//               "&::-webkit-scrollbar": { display: "none" },
//             }}
//           >
//             {products.map((product) => (
//               <Box key={product.product_id} sx={{ minWidth: 200, mr: 2 }}>
//                 <motion.div
//                   initial={{ opacity: 0, x: 30 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5 }}
//                   viewport={{ once: true }}
//                 >
//                   <DashboardProductCard product={product} />
//                 </motion.div>
//               </Box>
//             ))}
//           </Box>
//           {/* Right Arrow */}
//           <IconButton
//             onClick={scrollRight}
//             sx={{
//               position: "absolute",
//               right: 0,
//               top: "50%",
//               transform: "translateY(-50%)",
//               zIndex: 1,
//               bgcolor: "rgba(97, 25, 100, 0.8)",
//               color: "white",
//               "&:hover": { bgcolor: "rgba(74, 18, 75, 0.9)" },
//             }}
//           >
//             <ArrowForwardIosIcon fontSize="small" />
//           </IconButton>
//         </Box>
        
//       )}
//       <Box sx={{ textAlign: "right", mt: 2 }}>
//               <Typography
//                 variant="body1"
//                 sx={{ cursor: "pointer", color: "#611964", fontWeight: "bold" }}
//                 onClick={() => router.push("/auth/products")}
//               >
//                 see all products &gt;&gt;
//               </Typography>
//             </Box>
//     </Container>
//   );
// };

// export default DashboardProductSectionSlider;
