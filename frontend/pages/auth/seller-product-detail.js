import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
} from "@mui/material";
import axios from "axios";
import Sidebar from "../../components/admin-sidebar"; // Assuming you have a Sidebar component

const ProductDetail = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering

  // Fetch products for the logged-in seller
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const sellerId = localStorage.getItem("sellerId"); // Get seller ID from localStorage or session
      if (!sellerId) {
        console.error("Seller is not logged in.");
        return;
      }

      // Add search query if provided
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("q", searchQuery); // Add search query to the request
      }

      // Fetch products from the backend using the /api/products/seller/approved route
      const url = `http://localhost:5000/api/products/seller/approved?sellerId=${sellerId}&${params.toString()}`;
      const response = await axios.get(url);
      console.log("Fetched products from backend:", response.data); // Check if the products data is received
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch total products count for display
  const fetchTotalProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products/count");
      setTotalProducts(response.data.totalProducts);
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
  };

  // Run the fetch functions when the component loads or when searchQuery changes
  useEffect(() => {
    fetchProducts();
    fetchTotalProducts();
  }, [searchQuery]);

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5">Loading products...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <Container sx={{ flexGrow: 1, mt: 4 }}>
        <Typography variant="h4" sx={{ mt: 2, mb: 2, color: "#611964" }}>
          Product Details
        </Typography>

        {/* Total Product Count */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Total Products: {totalProducts}
        </Typography>

        {/* Search Bar */}
        <TextField
          label="Search by seller name, type, or category"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Table to display products */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#611964" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Product ID</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Product Name</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Size</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Quantity</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Original Price</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Price</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Image</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Seller Name</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell>{product.product_id}</TableCell>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.type}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.status}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{product.original_price}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>
                      {product.image && (
                        <Box
                          component="img"
                          src={`http://localhost:5000/${product.image}`}
                          alt={product.product_name}
                          sx={{ width: "80px", height: "auto" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{product.sellerName}</TableCell>
                    <TableCell>{new Date(product.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default ProductDetail;
