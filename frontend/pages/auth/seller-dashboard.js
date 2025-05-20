// pages/seller-dashboard.js
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Drawer,
  IconButton,
  useMediaQuery,
  Modal,
  TextField,
  Badge,
  Tooltip,
  Fab,
  Chip,
  Divider,
  Paper,
  alpha,
  LinearProgress,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";

import {
  Person as PersonIcon,
  ShoppingBag as ShoppingBagIcon,
  VolunteerActivism as VolunteerActivismIcon,
  MonetizationOn as MonetizationOnIcon,
  AssignmentReturn as RefundIcon,
  Add,
  Logout,
  Menu,
  Close,
  ShoppingCart,
  Search,
  Edit,
  KeyboardArrowUp,
  Visibility,
  ArrowForward,
  CalendarToday,
  Inventory2,
  CreditCard,
  LocalShipping,
  Receipt,
  NotificationsActive,
  AssessmentOutlined,
  StorefrontOutlined
} from "@mui/icons-material";
import { useRouter } from "next/router";
import DonationCard from "../../components/DonationCard";
import ProductCard from "../../components/SellerDashboardProductCard";
import SellerSidebar from "../../components/seller-sidebar";
import EditDonationModal from "../../components/EditDonationModal";
import NotificationsList from '../../components/NotificationsList';

// Custom color palette matching buyer dashboard
const colors = {
  primary: "#611964",
  secondary: "#8e24aa", 
  accent: "#ff5722",
  background: "#f8f9fa",
  cardBg: "#ffffff",
  text: "#2c3e50",
  textLight: "#7f8c8d",
  border: "#e0e6ed",
  success: "#4caf50",
  pending: "#ff9800",
  error: "#f44336"
};

const SellerDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userContact, setUserContact] = useState("");
  const [open, setOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const myProductsRef = useRef(null);
  const myDonationsRef = useRef(null);

  const [pendingProducts, setPendingProducts] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [donations, setDonations] = useState([]);
  const [donationSearch, setDonationSearch] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  const [pendingDonations, setPendingDonations] = useState(0);
  const [pendingDonationLoading, setPendingDonationLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesLoading, setSalesLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [editDonationModalOpen, setEditDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [editDonationFormData, setEditDonationFormData] = useState({
    product_name: "",
    description: "",
    size: "",
    category: "",
    type: "",
    quantity: 1
  });
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);

  // Check scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditDonation = async (donationId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      
      // Ensure quantity is a number
      const processedData = {
        ...updatedData,
        quantity: parseInt(updatedData.quantity, 10)
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/donations/edit`,
        { donationId, ...processedData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // If the server returned the updated donation object
        if (response.data.donation) {
          const updatedDonation = response.data.donation;
          
          // Update the donations state with the new data
          setDonations((prevDonations) => 
            prevDonations.map((donation) => 
              donation.donation_id === updatedDonation.donation_id ? updatedDonation : donation
            )
          );
        } else {
          // If the server didn't return the updated object, fetch the donations again
          fetchDonations();
        }
        
        alert("Donation updated successfully!");
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating donation:", error);
      throw error;
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete("http://localhost:5000/api/donations/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { donationId }
      });
    
      if (response.data.success) {
        // Remove the donation from the state
        setDonations((prevDonations) => 
          prevDonations.filter((donation) => donation.donation_id !== donationId)
        );
        alert("Donation deleted successfully!");
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting donation:", error);
      alert(`Failed to delete donation: ${error.message || "Please try again."}`);
    }
  };

  const handleOpenEditDonationModal = (donation) => {
    setEditingDonation(donation);
    setEditDonationFormData({
      product_name: donation.product_name || "",
      description: donation.description || "",
      size: donation.size || "",
      category: donation.category || "",
      type: donation.type || "",
      quantity: donation.quantity ||"",
      status: donation.status || ""
    });
    setEditDonationModalOpen(true);
  };

  const handleEditDonationFormChange = (e) => {
    const { name, value, type } = e.target;
    
    // For number fields, handle empty strings and invalid numbers
    if (type === "number") {
      // Allow empty field during typing, but don't convert to NaN
      const parsedValue = value === "" ? "" : parseInt(value, 10);
      setEditDonationFormData({
        ...editDonationFormData,
        [name]: parsedValue
      });
    } else {
      setEditDonationFormData({
        ...editDonationFormData,
        [name]: value
      });
    }
  };

  const handleEditDonationFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form data
    if (!editDonationFormData.product_name.trim()) {
      alert("Product name is required.");
      return;
    }
    
    if (!editDonationFormData.quantity || editDonationFormData.quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }
    
    setIsSubmittingDonation(true);
    
    try {
      await handleEditDonation(editingDonation.donation_id, editDonationFormData);
      setEditDonationModalOpen(false);
    } catch (error) {
      console.error("Error submitting donation edit:", error);
      alert("Failed to update donation. Please try again.");
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/users/details", {
          headers: { Authorization: token },
        });
        if (response.data.userType !== "Seller") {
          router.push("/auth/login");
        } else {
          setUserName(response.data.name);
          setUserEmail(response.data.email);
          setUserContact(response.data.contact);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [router]);

  // Replace the fetchDonations function in seller-dashboard.js

const fetchDonations = async (searchTerm = "") => {
  setDonationLoading(true);
  try {
    const token = localStorage.getItem("token");
    
    // Update the API endpoint to support multiple search parameters
    const params = new URLSearchParams();
    if (searchTerm) {
      // Search both product name and user name
      params.append("productName", searchTerm);
      params.append("userName", searchTerm);
    }
    
    const endpoint = searchTerm
      ? `http://localhost:5000/api/donations/seller/search?${params.toString()}`
      : "http://localhost:5000/api/donations/seller/mydonations";
      
    console.log("Fetching donations from:", endpoint); // Debug log
    
    const response = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDonations(response.data);
  } catch (err) {
    console.error("Error fetching donation details:", err);
  } finally {
    setDonationLoading(false);
  }
};

  const fetchProducts = async (searchTerm = "") => {
    setProductLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = searchTerm
        ? `http://localhost:5000/api/products/seller/approved?q=${encodeURIComponent(searchTerm)}`
        : "http://localhost:5000/api/products/seller/approved";
      console.log("Fetching approved products from:", endpoint);
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching approved product details:", err);
    } finally {
      setProductLoading(false);
    }
  };
  
  const fetchTotalSales = async () => {
    setSalesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders/seller/total-sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalSales(response.data.totalSales);
    } catch (err) {
      console.error("Error fetching total sales:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchTotalRevenue = async () => {
    setRevenueLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders/seller/total-revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalRevenue(response.data.totalRevenue);
    } catch (err) {
      console.error("Error fetching total revenue:", err);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchProducts();
    fetchTotalSales();
    fetchTotalRevenue();
    fetchPendingProductCount();
    fetchPendingDonationCount();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchDonations(donationSearch);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [donationSearch]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchProducts(productSearch);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [productSearch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete("http://localhost:5000/api/products/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId }
      });
  
      setProducts((prevProducts) => 
        prevProducts.filter((product) => product.product_id !== productId)
      );
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };
  
  const handleEditProduct = async (productId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`http://localhost:5000/api/products/edit`, 
        { productId, ...updatedData }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = response.data.product;
      setProducts((prevProducts) => 
        prevProducts.map((product) => 
          product.product_id === updatedProduct.product_id ? updatedProduct : product
        )
      );
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const fetchPendingProductCount = async () => {
    setPendingLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching pending product count...");
      const response = await axios.get("http://localhost:5000/api/products/seller/pending-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Pending product response:", response.data);
      setPendingProducts(response.data.totalProducts);
    } catch (err) {
      console.error("Error fetching pending product count:", err);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchPendingDonationCount = async () => {
    setPendingDonationLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/donations/seller/pending-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingDonations(response.data.pendingDonations);
    } catch (err) {
      console.error("Error fetching pending donation count:", err);
    } finally {
      setPendingDonationLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box sx={{ display: "flex", bgcolor: colors.background, minHeight: "100vh" }}>
      {/* Sidebar */}
      {isSmallScreen ? (
        <>
          <IconButton
            onClick={() => setOpen(true)}
            sx={{ 
              position: "fixed", 
              top: 16, 
              left: 16, 
              color: colors.primary,
              bgcolor: colors.cardBg,
              boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
              zIndex: 1100,
              "&:hover": {
                bgcolor: colors.cardBg
              }
            }}
          >
            <Menu />
          </IconButton>
          <Drawer 
            open={open} 
            onClose={() => setOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                backgroundColor: colors.primary,
                color: "white"
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <Close />
              </IconButton>
            </Box>
            <SellerSidebar userName={userName} />
          </Drawer>
        </>
      ) : (
        <Box sx={{ 
          width: 260, 
          flexShrink: 0,
          backgroundColor: colors.primary,
          color: "white",
          height: "100vh",
          position: "sticky",
          top: 0,
          boxShadow: "4px 0px 10px rgba(0,0,0,0.05)",
        }}>
          <SellerSidebar userName={userName} />
        </Box>
      )}

      {/* Added spacing between sidebar and main content */}
      {!isSmallScreen && (
        <Box 
          sx={{ 
            width: 80, 
            flexShrink: 0,
            backgroundColor: colors.background,
          }}
        />
      )}

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 6, sm: 3 },
          overflowY: "auto", 
          height: "100vh",
          backgroundColor: colors.background
        }}
      >
        {/* Header Section */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 4,
            p: 2,
            borderRadius: 2,
            bgcolor: colors.cardBg,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar 
              sx={{ 
                bgcolor: colors.primary, 
                width: 48, 
                height: 48,
                mr: 2
              }}
            >
              {userName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="600" color={colors.primary}>
                Welcome, {userName}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            
   <NotificationsList />
            
            <Tooltip title="Logout">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: colors.primary, 
                  "&:hover": {
                    backgroundColor: "#f0ebf4",
                    borderColor: colors.primary
                  }
                }}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/auth/add-product")}
            sx={{
              bgcolor: colors.primary,
              fontWeight: 500,
              boxShadow: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: alpha(colors.primary, 0.9),
                boxShadow: 4
              }
            }}
          >
            Add Product
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/auth/donation")}
            sx={{
              bgcolor: colors.primary,
              fontWeight: 500,
              boxShadow: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: alpha(colors.primary, 0.9),
                boxShadow: 4
              }
            }}
          >
            Add Donation
          </Button>
        </Box>
        
        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          {/* My Profile Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      My Profile
                    </Typography>
                    {loading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h6" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {userName}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                    <PersonIcon fontSize="large" />
                  </Avatar>
                </Box>
                
                {loading ? (
                  <LinearProgress color="secondary" sx={{ mt: 2 }} />
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Email: {userEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contact: {userContact}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Total Products Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                },
                cursor: "pointer"
              }}
              onClick={() => myProductsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Products
                    </Typography>
                    {productLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {products.length}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                    <Inventory2 fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: colors.primary
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all products
                  </Typography>
                  <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Sales Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Sales
                    </Typography>
                    {salesLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {totalSales}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                    <ShoppingBagIcon fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: colors.primary
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {totalSales === 1 ? "Order" : "Orders"} completed
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Revenue Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Donations
                    </Typography>
                    {donationLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {donations.length}
                      </Typography>
                    )}
                   
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                  
                    <VolunteerActivismIcon fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: colors.primary,
                    cursor: "pointer"
                  
                  }}
           
              onClick={() => myDonationsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
                
                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all donations
                  </Typography>
                  <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16 }} />
                  
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Secondary Stats */}
        <Grid container spacing={3} mb={4}>
          {/* Total Donations Card */}
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                },
                cursor: "pointer"
              }}
              onClick={() => myDonationsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    {revenueLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {formatCurrency(totalRevenue)}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                    <MonetizationOnIcon fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: colors.primary
                  }}
                >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Revenue generated
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Products Card */}
          <Grid item xs={12} sm={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Products to Approve
                    </Typography>
                    {pendingLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h5" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {pendingProducts}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: colors.primary,
                      width: 56,
                      height: 56
                    }}
                  >
                    <AssessmentOutlined fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: colors.primary
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {pendingProducts === 1 ? "Product" : "Products"} awaiting approval
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>


           
          {/* Donations to Approve card */}
<Grid item xs={12} sm={4}>
  <Card 
    sx={{ 
      borderRadius: 2,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      transition: "transform 0.2s",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Donations to Approve
          </Typography>
          {pendingDonationLoading ? (
            <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
          ) : (
            <Typography variant="h5" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
              {pendingDonations}
            </Typography>
          )}
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: "rgba(97, 25, 100, 0.1)",
            color: colors.primary,
            width: 56,
            height: 56
          }}
        >
          <AssessmentOutlined fontSize="large" />
        </Avatar>
      </Box>
      <Box 
        sx={{ 
          mt: 2, 
          pt: 1, 
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          color: colors.primary
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {pendingDonations === 1 ? "Donation" : "Donations"} awaiting approval
        </Typography>
      </Box>
    </CardContent>
  </Card>
</Grid>
          
        </Grid>

        {/* My Products Section */}
        <Card 
        id="products"  
          ref={myProductsRef} 
          sx={{ 
            mt: 4, 
            borderRadius: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            mb: 4
          }}
        >
          <Box 
            sx={{ 
              p: 3,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <StorefrontOutlined 
                sx={{ 
                  color: colors.primary, 
                  mr: 1.5,
                  fontSize: 28 
                }} 
              />
              <Typography variant="h6" fontWeight="600">
                My Products
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: { xs: '100%', sm: 300 },
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              px: 2,
              py: 0.5,
              bgcolor: colors.cardBg
            }}>
              <Search sx={{ color: colors.textLight, mr: 1 }} />
              <TextField
                placeholder="Search products..."
                variant="standard"
                fullWidth
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                }}
                sx={{ 
                  "& input": { 
                    py: 1,
                    fontSize: "0.9rem"
                  }
                }}
              />
            </Box>
          </Box>
          
          {productLoading ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress color="secondary" />
            </Box>
          ) : products.length > 0 ? (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.product_id}>
                    <ProductCard
                      product={product}
                      onClick={() => handleProductClick(product)}
                      onDeleteProduct={handleDeleteProduct}
                      onEditProduct={handleEditProduct}
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href="/auth/SellerProductTable">
                    <span style={{ 
                      cursor: 'pointer', 
                      color: colors.primaryBg, 
                      fontWeight: 'medium', 
                      fontSize: '14px',
                      textDecoration: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3e8f3'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      View All Products →
                    </span>
                  </Link>
                </Box>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Inventory2 sx={{ fontSize: 60, color: alpha(colors.textLight, 0.3), mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No products found
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("/auth/add-product")}
                sx={{
                  bgcolor: colors.primary,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { 
                    bgcolor: alpha(colors.primary, 0.9)
                  }
                }}
              >
                Add Your First Product
              </Button>
            </Box>
          )}
        </Card>

        {/* My Donations Section */}
        <Card 
        id="donations"	
          ref={myDonationsRef} 
          sx={{ 
            mt: 4, 
            borderRadius: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            mb: 4
          }}
        >
          <Box 
            sx={{ 
              p: 3,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <VolunteerActivismIcon 
                sx={{ 
                  color: colors.primary, 
                  mr: 1.5,
                  fontSize: 28 
                }} 
              />
              <Typography variant="h6" fontWeight="600">
                My Donations
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: { xs: '100%', sm: 300 },
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              px: 2,
              py: 0.5,
              bgcolor: colors.cardBg
            }}>
              <Search sx={{ color: colors.textLight, mr: 1 }} />
              <TextField
                placeholder="Search donations..."
                variant="standard"
                fullWidth
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                }}
                sx={{ 
                  "& input": { 
                    py: 1,
                    fontSize: "0.9rem"
                  }
                }}
              />
            </Box>
          </Box>
          
          {donationLoading ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress color="secondary" />
            </Box>
          ) : donations.length > 0 ? (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {donations.map((donation) => (
                  <Grid item xs={12} sm={6} md={4} key={donation.donation_id}>
                    <DonationCard
                      donation={donation}
                      onEditDonation={handleOpenEditDonationModal}
                      onDeleteDonation={handleDeleteDonation}
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href="/auth/SellerDonationTable">
                    <span style={{ 
                      cursor: 'pointer', 
                      color: colors.primaryBg, 
                      fontWeight: 'medium', 
                      fontSize: '14px',
                      textDecoration: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3e8f3'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      View All Donations →
                    </span>
                  </Link>
                </Box>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <VolunteerActivismIcon sx={{ fontSize: 60, color: alpha(colors.textLight, 0.3), mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No donations found
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("../auth/donation")}
                sx={{
                  bgcolor: colors.primary,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { 
                    bgcolor: alpha(colors.primary, 0.9)
                  }
                }}
              >
                Add Your First Donation
              </Button>
            </Box>
          )}
        </Card>

        {/* Modal for Full Product/Donation Details */}
        <Modal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Box 
            sx={{ 
              width: { xs: "90%", sm: 800 }, 
              bgcolor: "background.paper", 
              borderRadius: 2, 
              boxShadow: 24, 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" }, 
              gap: 2,
              p: 0,
              overflow: "hidden",
              maxHeight: "90vh"
            }}
          >
            {selectedProduct && (
              <>
                {selectedProduct.image && (
                  <Box 
                    sx={{ 
                      width: { xs: "100%", sm: "45%" }, 
                      bgcolor: "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2
                    }}
                  >
                    <Box
                      component="img"
                      src={`http://localhost:5000/${selectedProduct.image}`}
                      alt={selectedProduct.product_name || selectedProduct.name}
                      sx={{ 
                        width: "100%", 
                        height: "auto", 
                        maxHeight: 400, 
                        objectFit: "contain", 
                        borderRadius: 1 
                      }}
                    />
                  </Box>
                )}
                <Box 
                  sx={{ 
                    width: { xs: "100%", sm: selectedProduct.image ? "55%" : "100%" }, 
                    p: 3,
                    position: "relative",
                    overflow: "auto"
                  }}
                >
                  <IconButton 
                    onClick={() => setSelectedProduct(null)} 
                    sx={{ 
                      position: "absolute", 
                      top: 8, 
                      right: 8,
                      bgcolor: "#f5f5f5",
                      "&:hover": {
                        bgcolor: "#e0e0e0"
                      }
                    }}
                  >
                    <Close />
                  </IconButton>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: "bold", 
                      color: colors.primary,
                      pr: 4
                    }}
                  >
                    {selectedProduct.product_name || selectedProduct.name}
                  </Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                    {selectedProduct.category && (
                      <Chip 
                        label={selectedProduct.category} 
                        sx={{ 
                          bgcolor: "rgba(97, 25, 100, 0.1)",
                          color: colors.primary
                        }} 
                      />
                    )}
                    <Chip 
                      label={`Size: ${selectedProduct.size}`} 
                      sx={{ 
                        bgcolor: "rgba(97, 25, 100, 0.1)",
                        color: colors.primary
                      }} 
                    />
                    {selectedProduct.type && (
                      <Chip 
                        label={`Type: ${selectedProduct.type}`} 
                        sx={{ 
                          bgcolor: "rgba(97, 25, 100, 0.1)",
                          color: colors.primary
                        }} 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                    {selectedProduct.description}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {selectedProduct.quantity && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {selectedProduct.quantity}
                        </Typography>
                      </Grid>
                    )}
                    {selectedProduct.price && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {formatCurrency(selectedProduct.price)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{
                        mr: 2,
                        borderColor: colors.border,
                        color: colors.textLight,
                        "&:hover": {
                          borderColor: colors.border
                        }
                      }}
                      onClick={() => setSelectedProduct(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: colors.primary,
                        "&:hover": {
                          backgroundColor: alpha(colors.primary, 0.9)
                        }
                      }}
                      onClick={() => {
                        // Handle edit action
                        setSelectedProduct(null);
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Modal>
      
        {/* Edit Donation Modal */}
        <EditDonationModal
          open={editDonationModalOpen}
          onClose={() => setEditDonationModalOpen(false)}
          donation={editingDonation}
          formData={editDonationFormData}
          onChange={handleEditDonationFormChange}
          onSubmit={handleEditDonationFormSubmit}
          isSubmitting={isSubmittingDonation}
        />
        
        {/* Scroll to top FAB */}
        <Fab
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            bgcolor: colors.primary,
            opacity: showScrollTop ? 1 : 0,
            transition: 'all 0.2s',
            pointerEvents: showScrollTop ? 'auto' : 'none',
            "&:hover": {
              bgcolor: alpha(colors.primary, 0.9)
            }
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Box>
    </Box>
  );
};

export default SellerDashboard;