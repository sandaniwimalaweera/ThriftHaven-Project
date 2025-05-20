// frontend/pages/admin-dashboard.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from 'next/link';
// MUI Components
import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  alpha,
  Grid,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Drawer,
  IconButton,
  useMediaQuery,
  Modal,
  Avatar,
  Chip,
  LinearProgress,
  Badge,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

// MUI Icons
import {
  Menu,
  Close,
  Logout,
  CheckCircle,
  Cancel,
  ArrowForward,
  Visibility,
  LocalShipping,
} from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import StorefrontIcon from "@mui/icons-material/Storefront";
import NotificationsIcon from "@mui/icons-material/Notifications";

// Components
import Sidebar from "../../components/admin-sidebar";
import AdminNotificationsBadge from '../../components/AdminNotificationBadge';

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



const AdminDashboard = () => {
  const router = useRouter();
  const [userName] = useState("Admin");
  const isSmallScreen = useMediaQuery("(max-width:768px)");

  // State for seller and buyer counts
  const [sellersCount, setSellersCount] = useState(0);
  const [buyersCount, setBuyersCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  // State for top donor and top seller
  const [topDonor, setTopDonor] = useState({ name: "Loading...", donation_count: 0 });
  const [topSeller, setTopSeller] = useState({ name: "Loading...", sales_count: 0 });
  const [loadingTop, setLoadingTop] = useState(true);

  // Pending Donations from the donations table
  const [pendingDonations, setPendingDonations] = useState([]);
  const [loadingPendingDonations, setLoadingPendingDonations] = useState(true);

  // Approved Donations for total count
  const [approvedDonations, setApprovedDonations] = useState([]);
  const [loadingApprovedDonations, setLoadingApprovedDonations] = useState(true);

  // Pending Products from the products table
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingPendingProducts, setLoadingPendingProducts] = useState(true);

  // Approved Products for total count
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [loadingApprovedProducts, setLoadingApprovedProducts] = useState(true);

  // Modals for details view
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Snackbar for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [open, setOpen] = useState(false);

  // Check for token authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    }
  }, [router]);

  // Fetch sellers and buyers counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoadingCounts(true);
        
        // Fetch sellers count using dedicated endpoint
        const sellersResponse = await axios.get("http://localhost:5000/api/sellers/count");
        setSellersCount(sellersResponse.data.totalSellers);
        
        // Fetch buyers count using dedicated endpoint
        const buyersResponse = await axios.get("http://localhost:5000/api/buyers/count");
        setBuyersCount(buyersResponse.data.totalBuyers);
      } catch (error) {
        console.error("Error fetching user counts:", error.response?.data || error.message);
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchCounts();
  }, []);

  // Fetch Top Donor and Top Seller
  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setLoadingTop(true);
        
        // Fetch top donor from new endpoint
        const topDonorResponse = await axios.get("http://localhost:5000/api/donations/top-donor");
        setTopDonor(topDonorResponse.data);
        
        // Fetch top seller from new endpoint
        const topSellerResponse = await axios.get("http://localhost:5000/api/products/top-seller");
        setTopSeller(topSellerResponse.data);
      } catch (error) {
        console.error("Error fetching top users:", error.response?.data || error.message);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopUsers();
  }, []);

  // Fetch Pending Donations (from donations table)
  const fetchPendingDonations = async () => {
    try {
      setLoadingPendingDonations(true);
      const response = await axios.get("http://localhost:5000/api/donations");
      setPendingDonations(response.data);
      setLoadingPendingDonations(false);
    } catch (error) {
      console.error("Error fetching pending donations:", error.response?.data || error.message);
      setLoadingPendingDonations(false);
    }
  };

  useEffect(() => {
    fetchPendingDonations();
  }, []);

  // Fetch Approved Donations (from approveddonations table)
  const fetchApprovedDonations = async () => {
    try {
      setLoadingApprovedDonations(true);
      const response = await axios.get("http://localhost:5000/api/donations/approved");
      setApprovedDonations(response.data);
      setLoadingApprovedDonations(false);
    } catch (error) {
      console.error("Error fetching approved donations:", error.response?.data || error.message);
      setLoadingApprovedDonations(false);
    }
  };

  useEffect(() => {
    fetchApprovedDonations();
  }, []);

  // Fetch Pending Products (from products table)
  useEffect(() => {
    const fetchPendingProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        setPendingProducts(response.data);
      } catch (error) {
        console.error("Error fetching pending products:", error.response?.data || error.message);
      } finally {
        setLoadingPendingProducts(false);
      }
    };
    fetchPendingProducts();
  }, []);

  // Fetch Approved Products (from approvedproducts table)
  useEffect(() => {
    const fetchApprovedProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products/approved");
        setApprovedProducts(response.data);
      } catch (error) {
        console.error("Error fetching approved products:", error.response?.data || error.message);
      } finally {
        setLoadingApprovedProducts(false);
      }
    };
    fetchApprovedProducts();
  }, []);

  // Handler for approving pending donation (using donation id)
  const handleApproveDonation = async (donationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/donations/approve",
        { donationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success snackbar
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      // Update local state
      setPendingDonations(pendingDonations.filter((d) => d.donation_id !== donationId));
      
      // Refresh top donor after approval
      const topDonorResponse = await axios.get("http://localhost:5000/api/donations/top-donor");
      setTopDonor(topDonorResponse.data);
      
      // Refresh approved donations count
      fetchApprovedDonations();
    } catch (error) {
      setSnackbarMessage("Error approving donation: " + (error.response?.data.error || error.message));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handler for rejecting pending donation
const handleRejectDonation = async (donationId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/donations/reject",
      { donationId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Show success snackbar with notification info
    if (response.data.notification_created) {
      setSnackbarMessage("Donation rejected successfully! The donor has been notified.");
    } else {
      setSnackbarMessage(response.data.message || "Donation rejected successfully!");
    }
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    
    // Update local state
    setPendingDonations(pendingDonations.filter((d) => d.donation_id !== donationId));
  } catch (error) {
    console.error("Error rejecting donation:", error);
    setSnackbarMessage("Error rejecting donation: " + (error.response?.data?.error || error.message));
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};
  


  // Handler for approving pending product
const handleApproveProduct = async (productId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/products/approve",
      { productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Show success snackbar with notification info
    if (response.data.notification_created) {
      setSnackbarMessage("Product approved successfully! The seller has been notified.");
    } else {
      setSnackbarMessage("Product approved successfully!");
    }
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    
    // Update local state
    setPendingProducts(pendingProducts.filter((p) => p.product_id !== productId));
    
    // Refresh top seller after approval
    const topSellerResponse = await axios.get("http://localhost:5000/api/products/top-seller");
    setTopSeller(topSellerResponse.data);
    
    // Refresh approved products count
    const approvedProductsResponse = await axios.get("http://localhost:5000/api/products/approved");
    setApprovedProducts(approvedProductsResponse.data);
  } catch (error) {
    setSnackbarMessage("Error approving product: " + (error.response?.data.error || error.message));
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

// Handler for rejecting pending product
const handleRejectProduct = async (productId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/products/reject",
      { productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Show success snackbar with notification info
    if (response.data.notification_created) {
      setSnackbarMessage("Product rejected successfully! The seller has been notified.");
    } else {
      setSnackbarMessage("Product rejected successfully!");
    }
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    
    // Update local state
    setPendingProducts(pendingProducts.filter((p) => p.product_id !== productId));
  } catch (error) {
    setSnackbarMessage("Error rejecting product: " + (error.response?.data.error || error.message));
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};


  // Handler for collecting approved donation
const handleCollectDonation = async (donationId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/donations/collect",
      { donationId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updatedDonations = approvedDonations.map((donation) => {
      if (donation.donation_id === donationId) {
        return {
          ...donation,
          collection_status: "collected",
          collection_date: new Date().toISOString(),
          adminInfo: response.data.adminInfo
        };
      }
      return donation;
    });

    setApprovedDonations(updatedDonations);

    setSnackbarMessage("Donation collected and admin info shown.");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (error) {
    setSnackbarMessage("Error collecting donation: " + (error.response?.data.error || error.message));
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};




  // Logout handler function
  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");
    // Redirect to login page
    router.push("/auth/admin-login");
  };

  // Open modal to view donation details
  const handleRowClickDonation = (donation) => {
    setSelectedDonation(donation);
  };

  // Open modal to view product details
  const handleRowClickProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseDonationModal = () => {
    setSelectedDonation(null);
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Calculate pending items count for notification badge
  const pendingItemsCount = pendingDonations.length + pendingProducts.length;

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Sidebar for mobile */}
      {isSmallScreen ? (
        <>
          <IconButton 
            onClick={() => setOpen(true)} 
            sx={{ 
              position: "absolute", 
              top: 16, 
              left: 16, 
              color: "#611964",
              backgroundColor: "white",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "#f0f0f0"
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
                backgroundColor: "#611964",
                color: "white"
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <Close />
              </IconButton>
            </Box>
            <Sidebar />
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            backgroundColor: "#611964",
            color: "white",
            height: "100vh",
            position: "sticky",
            top: 0,
            boxShadow: "4px 0px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Added spacing between sidebar and main content */}
      {!isSmallScreen && (
        <Box 
          sx={{ 
            width: 80, 
            flexShrink: 0,
            backgroundColor: "#f8f9fa",
          }}
        />
      )}
      
      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 6, sm: 3 },
          overflowY: "auto", 
          height: "100vh",
          backgroundColor: "#f8f9fa"
        }}
      >
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbarSeverity} 
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        
        {/* Header Section */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 4,
            p: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar 
              sx={{ 
                bgcolor: "#611964", 
                width: 48, 
                height: 48,
                mr: 2
              }}
            >
              {userName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="600" color="#611964">
                Welcome, {userName}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Logout">
              <Button 
                onClick={handleLogout}
                startIcon={<Logout />}
                sx={{ 
                  color: "#611964", 
                  "&:hover": {
                    backgroundColor: "#f0ebf4",
                    borderColor: "#611964"
                  }
                }}
              >
              </Button>
            </Tooltip>


<AdminNotificationsBadge />

          </Box>
        </Box>



          <Box sx={{ mb: 3 }}> {/* Adds bottom margin */}
          <Button
            variant="contained"
            onClick={() => router.push("../auth/admin-donations")}
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
            View Donations
          </Button>
        </Box>

        

        {/* Quick Stats Section */}
        <Grid container spacing={3}>
          {/* Total Sellers */}
          <Grid item xs={12} sm={6} lg={3}>
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
                      Total Sellers
                    </Typography>
                    {loadingCounts ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {sellersCount}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964",
                      width: 56,
                      height: 56
                    }}
                  >
                    <PersonIcon fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: "#611964"
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all sellers
                  </Typography>
                
               <Link href="/auth/seller-detail" passHref>
                 <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16, cursor: 'pointer' }} />
               </Link>            
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Buyers */}
          <Grid item xs={12} sm={6} lg={3}>
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
                      Total Buyers
                    </Typography>
                    {loadingCounts ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {buyersCount}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964",
                      width: 56,
                      height: 56
                    }}
                  >
                    <PersonIcon fontSize="large" />
                  </Avatar>
                </Box>
                <Box 
                  sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    color: "#611964"
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all buyers
                  </Typography>
                  <Link href="/auth/buyer-detail" passHref>
                 <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16, cursor: 'pointer' }} />
               </Link> 
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Products */}
          <Grid item xs={12} sm={6} lg={3}>
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
                      Total Products
                    </Typography>
                    {loadingApprovedProducts ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {approvedProducts.length}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964",
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
                    color: "#611964"
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all products
                  </Typography>
                  <Link href="/auth/product-detail" passHref>
                 <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16, cursor: 'pointer' }} />
               </Link> 
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Donations */}
          <Grid item xs={12} sm={6} lg={3}>
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
                    {loadingApprovedDonations ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {approvedDonations.length}
                      </Typography>
                    )}
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964",
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
                    color: "#611964"
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View all donations
                  </Typography>
                  <Link href="/auth/approveddonation" passHref>
                 <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16, cursor: 'pointer' }} />
               </Link> 
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Performers Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Top Donor Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                overflow: "hidden"
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
                <Typography variant="h5" fontWeight="600" color="#611964">
                  Top Donor
                </Typography>
                <Chip 
                  icon={<VolunteerActivismIcon fontSize="small" />} 
                  label="Donations" 
                  size="small"
                  sx={{ 
                    bgcolor: "rgba(97, 25, 100, 0.1)",
                    color: "#611964"
                  }}
                />
              </Box>
              <CardContent sx={{ pt: 2 }}>
                {loadingTop ? (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress color="secondary" />
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "#611964", 
                        width: 64, 
                        height: 64,
                        fontSize: 32,
                        mr: 2
                      }}
                    >
                      {topDonor.name?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {topDonor.name}
                      </Typography>
                      <Chip 
                        label={`${topDonor.donation_count} donations`} 
                        size="small"
                        color=""
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Seller Card */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                overflow: "hidden"
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
                <Typography variant="h5" fontWeight="600" color="#611964">
                  Top Seller
                </Typography>
                <Chip 
                  icon={<StorefrontIcon fontSize="small" />} 
                  label="Sales" 
                  size="small"
                  sx={{ 
                    bgcolor: "rgba(97, 25, 100, 0.1)",
                    color: "#611964"
                  }}
                />
              </Box>
              <CardContent sx={{ pt: 2 }}>
                {loadingTop ? (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress color="secondary" />
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "#611964", 
                        width: 64, 
                        height: 64,
                        fontSize: 32,
                        mr: 2
                      }}
                    >
                      {topSeller.name?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {topSeller.name}
                      </Typography>
                    
                      <Chip 
                        label={`${topSeller.sales_count} sales`} 
                        size="small"
                        color=""
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Donations Section */}
        <Card 
          sx={{ 
            mt: 4, 
            borderRadius: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            overflow: "hidden"
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
                  color: "#611964", 
                  mr: 1.5,
                  fontSize: 28 
                }} 
              />
              <Typography variant="h6" fontWeight="600">
                Pending Donations
              </Typography>
            </Box>
            <Chip 
              label={`${pendingDonations.length} pending`} 
              color="primary"
              size="small"
              sx={{ 
                bgcolor: pendingDonations.length > 0 ? "#611964" : "#888",
                fontWeight: 500
              }}
            />
          </Box>
          
          {loadingPendingDonations ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress color="secondary" />
            </Box>
          ) : pendingDonations.length > 0 ? (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingDonations.map((donation) => (
                    <TableRow
                      key={donation.donation_id}
                      hover
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(97, 25, 100, 0.04)"
                        }
                      }}
                      onClick={() => handleRowClickDonation(donation)}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={donation.image ? `http://localhost:5000/${donation.image}` : ""}
                            variant="rounded"
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Typography variant="body2" fontWeight="500">
                            {donation.product_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {donation.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={donation.category} 
                          size="small"
                          sx={{ 
                            bgcolor: "rgba(97, 25, 100, 0.1)",
                            color: "#611964",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label="Pending" 
                          size="small"
                          sx={{ 
                            bgcolor: "#fff8e1",
                            color: "#f57c00",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              sx={{ mr: 1 }}
                              onClick={() => handleRowClickDonation(donation)}
                            >
                              <Visibility sx={{ fontSize: 20, color: "#611964" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                mr: 1,
                                color: "white",
                                bgcolor: "#4caf50",
                                "&:hover": {
                                  bgcolor: "#43a047"
                                }
                              }}
                              onClick={() => handleApproveDonation(donation.donation_id)}
                            >
                              <CheckCircle sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: "white",
                                bgcolor: "#f44336",
                                "&:hover": {
                                  bgcolor: "#e53935"
                                }
                              }}
                              onClick={() => handleRejectDonation(donation.donation_id)}
                            >
                              <Cancel sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No pending donations found.
              </Typography>
            </Box>
          )}
        </Card>

        {/* Approved Donations Section */}
        <Card 
          sx={{ 
            mt: 4, 
            borderRadius: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            id:"donations"
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
                  color: "#4caf50", 
                  mr: 1.5,
                  fontSize: 28 
                }} 
              />
              <Typography variant="h6" fontWeight="600">
                Approved Donations
              </Typography>
            </Box>
            <Link href="/auth/approveddonation" passHref>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "#611964",
                  color: "#611964",
                  "&:hover": {
                    borderColor: "#4a1050",
                    backgroundColor: "rgba(97, 25, 100, 0.04)"
                  }
                }}
              >
                View All
              </Button>
            </Link>
          </Box>
          
          {loadingApprovedDonations ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress color="secondary" />
            </Box>
          ) : approvedDonations.length > 0 ? (
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Collection Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedDonations.slice(0, 5).map((donation) => (
                    <TableRow
                      key={donation.donation_id}
                      hover
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(97, 25, 100, 0.04)"
                        }
                      }}
                      onClick={() => handleRowClickDonation(donation)}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={donation.image ? `http://localhost:5000/${donation.image}` : ""}
                            variant="rounded"
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Typography variant="body2" fontWeight="500">
                            {donation.product_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {donation.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={donation.status || "N/A"} 
                          size="small"
                          sx={{ 
                            bgcolor: donation.status === "New" ? "#e8f5e9" : 
                                    donation.status === "Like New" ? "#e3f2fd" :
                                    donation.status === "Gently Used" ? "#fff8e1" : "#fafafa",
                            color: donation.status === "New" ? "#2e7d32" :
                                  donation.status === "Like New" ? "#1565c0" :
                                  donation.status === "Gently Used" ? "#f57c00" : "#757575",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {donation.collection_status === "collected" ? (
                          <Chip 
                            icon={<CheckCircle fontSize="small" />}
                            label="Collected" 
                            size="small"
                            sx={{ 
                              bgcolor: "#e8f5e9",
                              color: "#2e7d32",
                              fontWeight: 500
                            }}
                          />
                        ) : (
                          <Chip 
                            label="Awaiting Collection" 
                            size="small"
                            sx={{ 
                              bgcolor: "#fff8e1",
                              color: "#f57c00",
                              fontWeight: 500
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              sx={{ mr: 1 }}
                              onClick={() => handleRowClickDonation(donation)}
                            >
                              <Visibility sx={{ fontSize: 20, color: "#611964" }} />
                            </IconButton>
                          </Tooltip>
                          
                          {donation.collection_status !== "collected" && (
                            <Tooltip title="Mark as Collected">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<LocalShipping />}
                                onClick={() => handleCollectDonation(donation.donation_id)}
                                sx={{
                                  bgcolor: "#611964",
                                  "&:hover": {
                                    bgcolor: "#4a1050"
                                  }
                                }}
                              >
                                Collect
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No approved donations found.
              </Typography>
            </Box>
          )}
        </Card>

        {/* Pending Products Section */}
        <Card 
          sx={{ 
            mt: 4, 
            borderRadius: 2,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            mb: 4,
            id:"products"
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
              <ShoppingBagIcon 
                sx={{ 
                  color: "#611964", 
                  mr: 1.5,
                  fontSize: 28 
                }} 
              />
              <Typography variant="h6" fontWeight="600">
                Pending Products
              </Typography>
            </Box>
            <Chip 
              label={`${pendingProducts.length} pending`} 
              color="primary"
              size="small"
              sx={{ 
                bgcolor: pendingProducts.length > 0 ? "#611964" : "#888",
                fontWeight: 500
              }}
            />
          </Box>
          
          {loadingPendingProducts ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress color="secondary" />
            </Box>
          ) : pendingProducts.length > 0 ? (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Seller</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingProducts.map((product) => (
                    <TableRow
                      key={product.product_id}
                      hover
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(97, 25, 100, 0.04)"
                        }
                      }}
                      onClick={() => handleRowClickProduct(product)}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={product.image ? `http://localhost:5000/${product.image}` : ""}
                            variant="rounded"
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Typography variant="body2" fontWeight="500">
                            {product.product_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.sellerName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category} 
                          size="small"
                          sx={{ 
                            bgcolor: "rgba(97, 25, 100, 0.1)",
                            color: "#611964",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Rs.{product.price}
                          </Typography>
                          {product.original_price && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                textDecoration: "line-through", 
                                color: "text.secondary" 
                              }}
                            >
                              Rs.{product.original_price}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              sx={{ mr: 1 }}
                              onClick={() => handleRowClickProduct(product)}
                            >
                              <Visibility sx={{ fontSize: 20, color: "#611964" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                mr: 1,
                                color: "white",
                                bgcolor: "#4caf50",
                                "&:hover": {
                                  bgcolor: "#43a047"
                                }
                              }}
                              onClick={() => handleApproveProduct(product.product_id)}
                            >
                              <CheckCircle sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: "white",
                                bgcolor: "#f44336",
                                "&:hover": {
                                  bgcolor: "#e53935"
                                }
                              }}
                              onClick={() => handleRejectProduct(product.product_id)}
                            >
                              <Cancel sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No pending products found.
              </Typography>
            </Box>
          )}
        </Card>

        {/* Donation Detail Modal */}
        {selectedDonation && (
          <Modal 
            open={Boolean(selectedDonation)} 
            onClose={handleCloseDonationModal} 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
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
              {selectedDonation.image && (
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
                    src={`http://localhost:5000/${selectedDonation.image}`}
                    alt={selectedDonation.product_name}
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
                  width: { xs: "100%", sm: selectedDonation.image ? "55%" : "100%" }, 
                  p: 3,
                  position: "relative",
                  overflow: "auto"
                }}
              >
                <IconButton 
                  onClick={handleCloseDonationModal} 
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
                    color: "#611964",
                    pr: 4
                  }}
                >
                  {selectedDonation.product_name}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                  <Chip 
                    label={selectedDonation.category} 
                    sx={{ 
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964"
                    }} 
                  />
                  <Chip 
                    label={selectedDonation.status} 
                    sx={{ 
                      bgcolor: "#fff8e1",
                      color: "#f57c00"
                    }} 
                  />
                  
                  {/* Collection Status Chip */}
                  {selectedDonation.collection_status === "collected" ? (
                    <Chip 
                      icon={<CheckCircle fontSize="small" />}
                      label="Collected" 
                      sx={{ 
                        bgcolor: "#e8f5e9",
                        color: "#2e7d32"
                      }} 
                    />
                  ) : (
                    <Chip 
                      label="Awaiting Collection" 
                      sx={{ 
                        bgcolor: "#fff8e1",
                        color: "#f57c00"
                      }} 
                    />
                  )}
                </Box>
                
                <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                  {selectedDonation.description || "No description provided."}
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedDonation.type || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Size
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedDonation.size || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedDonation.quantity || "1"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                   
                  </Grid>
                </Grid>
                
                {/* Display collection date if collected */}
                {selectedDonation.collection_status === "collected" && selectedDonation.collection_date && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CheckCircle sx={{ color: "#2e7d32", mr: 1 }} />
                      <Typography variant="body1" color="#2e7d32" fontWeight="500">
                        Collected on: {new Date(selectedDonation.collection_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: "#611964", mr: 2 }}>
                    {selectedDonation.userName?.charAt(0) || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="500">
                      {selectedDonation.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Donor
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  {!selectedDonation.approved ? (
                    <>
                      <Button
                        variant="outlined"
                        size="large"
                        sx={{
                          mr: 2,
                          borderColor: "#f44336",
                          color: "#f44336",
                          "&:hover": {
                            borderColor: "#e53935",
                            backgroundColor: "rgba(244, 67, 54, 0.08)"
                          }
                        }}
                        onClick={() => {
                          handleRejectDonation(selectedDonation.donation_id);
                          handleCloseDonationModal();
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        sx={{
                          backgroundColor: "#611964",
                          "&:hover": {
                            backgroundColor: "#4a1050"
                          }
                        }}
                        onClick={() => {
                          handleApproveDonation(selectedDonation.donation_id);
                          handleCloseDonationModal();
                        }}
                      >
                        Approve
                      </Button>
                    </>
                  ) : selectedDonation.collection_status !== "collected" ? (
                    <Button
                      variant="contained"
                      startIcon={<LocalShipping />}
                      size="large"
                      sx={{
                        backgroundColor: "#611964",
                        "&:hover": {
                          backgroundColor: "#4a1050"
                        }
                      }}
                      onClick={() => {
                        handleCollectDonation(selectedDonation.donation_id);
                        handleCloseDonationModal();
                      }}
                    >
                      Mark as Collected
                    </Button>
                  ) : null}
                </Box>
              </Box>
            </Box>
          </Modal>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <Modal 
            open={Boolean(selectedProduct)} 
            onClose={handleCloseProductModal} 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
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
                    alt={selectedProduct.product_name}
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
                  onClick={handleCloseProductModal} 
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
                    color: "#611964",
                    pr: 4
                  }}
                >
                  {selectedProduct.product_name}
                </Typography>

                <Box sx={{ display: "flex", mb: 3 }}>
                  <Chip 
                    label={selectedProduct.category} 
                    sx={{ 
                      mr: 1,
                      bgcolor: "rgba(97, 25, 100, 0.1)",
                      color: "#611964"
                    }} 
                  />
                  <Chip 
                    label={selectedProduct.status} 
                    sx={{ 
                      bgcolor: "#fff8e1",
                      color: "#f57c00"
                    }} 
                  />
                </Box>
                
             <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                  {selectedProduct.description || "No description provided."}
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedProduct.type || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Size
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedProduct.size || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedProduct.quantity || "1"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Price
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="h6" fontWeight="600" color="#611964">
                          Rs.{selectedProduct.price}
                        </Typography>
                        {selectedProduct.original_price && (
                          <Typography
                            variant="body2"
                            sx={{
                              ml: 1,
                              textDecoration: "line-through",
                              color: "text.secondary"
                            }}
                          >
                            Rs.{selectedProduct.original_price}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: "#611964", mr: 2 }}>
                    {selectedProduct.sellerName?.charAt(0) || "S"}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="500">
                      {selectedProduct.sellerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seller
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      mr: 2,
                      borderColor: "#f44336",
                      color: "#f44336",
                      "&:hover": {
                        borderColor: "#e53935",
                        backgroundColor: "rgba(244, 67, 54, 0.08)"
                      }
                    }}
                    onClick={() => {
                      handleRejectProduct(selectedProduct.product_id);
                      handleCloseProductModal();
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: "#611964",
                      "&:hover": {
                        backgroundColor: "#4a1050"
                      }
                    }}
                    onClick={() => {
                      handleApproveProduct(selectedProduct.product_id);
                      handleCloseProductModal();
                    }}
                  >
                    Approve
                  </Button>
                </Box>
              </Box>
            </Box>
          </Modal>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;