// pages/buyer-dashboard.js
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
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
  CircularProgress,
  Divider,
  Paper,
  alpha,
  LinearProgress,
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
  Favorite as FavoriteIcon,
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
  CheckCircle,
  Cancel,
  CalendarToday,
  Inventory2,
  VolunteerActivism,
  CreditCard,
  LocalShipping,
  Receipt,
  NotificationsActive
} from "@mui/icons-material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useRouter } from "next/router";
import DonationCard from "../../components/DonationCard";
import Sidebar from "../../components/buyer-sidebar";
// Add this import at the top of your buyer-dashboard.js file
import EditDonationModal from "../../components/buyer-editDonation"; 
import NotificationsList from '../../components/NotificationsList';


const ADMIN_CONTACT_INFO = {
  address: "Vidyala Street, Colombo",
  contact: "+94 77 123 4567"
};
// Custom color palette matching admin dashboard
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

const BuyerDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userContact, setUserContact] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const isMobileScreen = useMediaQuery("(max-width:600px)");
  const myDonationsRef = useRef(null);
  const recentOrdersRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [adminInfoOpen, setAdminInfoOpen] = useState(false);
  
  // State for buyer donation details and search input
  const [donations, setDonations] = useState([]);
  const [donationSearch, setDonationSearch] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  
  // State for total orders
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // State for recent orders
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(false);
  
  // State for cart count
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  
  // State for refund requests
  const [refundCount, setRefundCount] = useState(0);
  const [refundLoading, setRefundLoading] = useState(false);

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

  // Fetch buyer user details on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login...");
      router.push("/auth/login");
      return;
    }
    
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/users/details", {
          headers: { Authorization: token },
        });
        if (response.data.userType !== "Buyer") {
          console.log("Not a buyer, redirecting...");
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

  // Fetch cart items count
  const fetchCartCount = async () => {
    setCartLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/cart/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartCount(response.data.count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    } finally {
      setCartLoading(false);
    }
  };

  // Fetch total orders for the buyer
  const fetchTotalOrders = async () => {
    setOrderLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders/total-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalOrders(response.data.totalOrders);
    } catch (err) {
      console.error("Error fetching total orders:", err);
    } finally {
      setOrderLoading(false);
    }
  };
  
  // Fetch refund requests count
  const fetchRefundCount = async () => {
    setRefundLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders/refund-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefundCount(response.data.length);
    } catch (err) {
      console.error("Error fetching refund count:", err);
    } finally {
      setRefundLoading(false);
    }
  };

  // Fetch buyer donation details for the logged-in buyer
  const fetchDonations = async (searchName = "") => {
    setDonationLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = searchName
        ? `http://localhost:5000/api/donations/buyer/mydonations?name=${encodeURIComponent(searchName)}`
        : "http://localhost:5000/api/donations/buyer/mydonations";
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Ensure collection_status has a default value if not present
      const donationsWithCollectionStatus = response.data.map(donation => ({
        ...donation,
        collection_status: donation.collection_status || "not_collected"
      }));
      
      setDonations(donationsWithCollectionStatus);
    } catch (err) {
      console.error("Error fetching donation details:", err);
    } finally {
      setDonationLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDonations();
    fetchTotalOrders();
    fetchCartCount();
    fetchRefundCount();
  }, []);

  // Debounce donation search input
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchDonations(donationSearch);
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [donationSearch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userType");
    router.push("/auth/login");
  };

  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
  };

  // Navigate to cart page
  const handleCartClick = () => {
    router.push("/auth/cart");
  };
  
  // Navigate to refunds page
  const handleRefundsClick = () => {
    router.push("/auth/buyer-refund-details");
  };

  // Navigate to orders page
  const handleOrdersClick = () => {
    router.push("/orders");
  };

  // Inside your BuyerDashboard component, add these new state variables
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);


  const handleEditClick = (donation, e) => {
    if (e) e.stopPropagation(); // Prevent the row click event if event exists
    setEditingDonation(donation);
    setEditModalOpen(true);
    setSelectedDonation(null); // Close the detail modal when opening edit
  };

  // Add this function to handle the save of edited donation
  const handleSaveDonation = async (formData) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      
      const requestData = {
        donationId: editingDonation.donation_id,
        ...formData
      };
      
      const response = await axios.put(
        "http://localhost:5000/api/donations/edit",
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success) {
        // Update the local state with the edited donation
        setDonations(prevDonations => 
          prevDonations.map(d => 
            d.donation_id === editingDonation.donation_id 
              ? { ...d, ...formData } 
              : d
          )
        );
        
        // Close the modal and show success notification
        setEditModalOpen(false);
        setEditingDonation(null);
        // If you have a notification system, show success here
        alert("Donation updated successfully!");
      }
    } catch (error) {
      console.error("Error updating donation:", error);
      alert("Failed to update donation. Please try again.");
    } finally {
      setIsUpdating(false);
    }
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
           <Sidebar userName={userName} />

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
         <Sidebar userName={userName} />

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
            <Tooltip title="Shopping Cart">
              <IconButton
                onClick={handleCartClick}
                sx={{
                  bgcolor: alpha(colors.secondary, 0.1),
                  color: colors.secondary,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(colors.secondary, 0.2)
                  }
                }}
              >
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Tooltip>
           
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

        <Box sx={{ mb: 3 }}> {/* Adds bottom margin */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("../auth/donation")}
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
        
        {/* Quick Stats Section */}
        <Grid container spacing={3}>
          {/* My Profile Card */}
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
                  <>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email: {userEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contact: {userContact}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Total Orders Card */}
          <Grid item xs={12} sm={6} lg={3}>
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
              onClick={handleOrdersClick}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Orders
                    </Typography>
                    {orderLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {totalOrders}
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
                    View order history
                  </Typography>
                  <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* My Donations Card */}
          <Grid item xs={12} sm={6} lg={3}>
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
                      My Donations
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
                    <VolunteerActivism fontSize="large" />
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
                    View all donations
                  </Typography>
                  <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Refunds Card */}
          <Grid item xs={12} sm={6} lg={3}>
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
              onClick={handleRefundsClick}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Refund Requests
                    </Typography>
                    {refundLoading ? (
                      <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>...</Typography>
                    ) : (
                      <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                        {refundCount}
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
                    <RefundIcon fontSize="large" />
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
                    Manage refund requests
                  </Typography>
                  <ArrowForward fontSize="small" sx={{ ml: 1, fontSize: 16 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        
        {/* My Donations Section */}
        <Card 
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
              <FavoriteIcon 
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
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Collection Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow
                      key={donation.donation_id}
                      hover
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(97, 25, 100, 0.04)"
                        }
                      }}
                      onClick={() => handleDonationClick(donation)}
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
                        <Chip 
                          label={donation.category || 'Clothing'} 
                          size="small"
                          sx={{ 
                            bgcolor: "rgba(97, 25, 100, 0.1)",
                            color: colors.primary,
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {donation.size}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={donation.status || "Pending"} 
                          size="small"
                          sx={{ 
                            bgcolor: donation.status === "Approved" ? "#e8f5e9" : "#fff8e1",
                            color: donation.status === "Approved" ? "#4caf50" : "#f57c00",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={donation.collection_status === "collected" ? "Collected" : "Not Collected"} 
                          size="small"
                          sx={{ 
                            bgcolor: donation.collection_status === "collected" ? "#e8f5e9" : "#f5f5f5",
                            color: donation.collection_status === "collected" ? "#4caf50" : "#9e9e9e",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="edit">
                          <IconButton 
                            size="small" 
                            sx={{ 
                              mr: 1,
                              color: colors.primary
                            }}
                            onClick={(e) => handleEditClick(donation, e)}
                          >
                            <Edit sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <FavoriteIcon sx={{ fontSize: 60, color: alpha(colors.textLight, 0.3), mb: 2 }} />
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

        {/* Modal for Full Donation Details */}
        <Modal
          open={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
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
            {selectedDonation && (
              <>
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
                    onClick={() => setSelectedDonation(null)} 
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
                    {selectedDonation.product_name}
                  </Typography>

                  <Box sx={{ display: "flex", mb: 3 }}>
                    <Chip 
                      label={selectedDonation.category || "Clothing"} 
                      sx={{ 
                        mr: 1,
                        bgcolor: "rgba(97, 25, 100, 0.1)",
                        color: colors.primary
                      }} 
                    />
                    <Chip 
                      label={selectedDonation.status || "Pending"} 
                      sx={{ 
                        bgcolor: selectedDonation.status === "Approved" ? "#e8f5e9" : "#fff8e1",
                        color: selectedDonation.status === "Approved" ? "#4caf50" : "#f57c00"
                      }} 
                    />
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                    {selectedDonation.description}
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
                      <Typography variant="body2" color="text.secondary">
                        Collection Status
                      </Typography>
                      <Chip 
                        label={selectedDonation.collection_status === "collected" ? "Collected" : "Not Collected"} 
                        size="small"
                        sx={{ 
                          bgcolor: selectedDonation.collection_status === "collected" ? "#e8f5e9" : "#f5f5f5",
                          color: selectedDonation.collection_status === "collected" ? "#4caf50" : "#9e9e9e",
                          fontWeight: 500,
                          mt: 0.5
                        }}
                      />
                    </Grid>
                    {selectedDonation.collection_status === "collected" && selectedDonation.collection_date && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Collection Date
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date(selectedDonation.collection_date).toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </Typography>
                      </Grid>
                    )}
                {selectedDonation.collection_status === "collected" && (
             <Box sx={{ mt: 3, p: 2, bgcolor: "#f3e5f5", borderRadius: 2 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} color="#611964">
                      Admin Collection Info
                    </Typography>
                <Typography variant="body1" fontWeight="500">
                  Address: {ADMIN_CONTACT_INFO.address}<br />
                  Contact: {ADMIN_CONTACT_INFO.contact}
                </Typography>
              </Grid>
              </Box>
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
                      onClick={() => setSelectedDonation(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={(e) => handleEditClick(selectedDonation, e)}
                      sx={{
                        backgroundColor: colors.primary,
                        "&:hover": {
                          backgroundColor: alpha(colors.primary, 0.9)
                        }
                      }}
                    >
                      Edit Donation
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Modal>
        
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
      
      {/* Edit Donation Modal */}
      <EditDonationModal
        open={editModalOpen}
        handleClose={() => {
          setEditModalOpen(false);
          setEditingDonation(null);
        }}
        donation={editingDonation}
        onSave={handleSaveDonation}
        isLoading={isUpdating}
      />
    </Box>
  );
};

export default BuyerDashboard;