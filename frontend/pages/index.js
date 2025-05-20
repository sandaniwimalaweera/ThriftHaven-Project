// frontend/pages/index.js
import { AppBar, Toolbar, Typography, Button, Box, Container, Grid, IconButton, Menu, MenuItem, Modal, Avatar, Chip, Divider, ButtonGroup } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import ProductSectionSlider from "../components/ProductSectionSlider";
import DonationSection from "../components/DonationSection";
import axios from "axios";

export default function LandingPage() {
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const imageRef = useRef(null);

  // User authentication state
  const [userData, setUserData] = useState({
    userName: "",
    userType: ""
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  // State for modal popup to show full details of clicked product/donation
  const [selectedItem, setSelectedItem] = useState(null);
  // State for cart login prompt popup
  const [cartLoginPromptOpen, setCartLoginPromptOpen] = useState(false);
  // State for product quantity
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Load user data on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add console logs to debug token
        const token = localStorage.getItem("token");
        console.log("Token from localStorage:", token ? `${token.substring(0, 15)}...` : 'none');
        
        if (!token) {
          console.log("No token found, user not logged in");
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        
        // First attempt: Try to get data from localStorage
        const nameFromStorage = localStorage.getItem("userName");
        const typeFromStorage = localStorage.getItem("userType");
        
        console.log("Data from localStorage:", { nameFromStorage, typeFromStorage });
        
        if (nameFromStorage && typeFromStorage) {
          console.log("Using data from localStorage");
          setUserData({
            userName: nameFromStorage,
            userType: typeFromStorage
          });
          setIsLoggedIn(true);
          setLoading(false);
          return;
        }
        
        // Second attempt: If localStorage doesn't have complete data, try to fetch from API
        console.log("Fetching user data from API");
        
        // Try different authorization header formats if needed
        try {
          const response = await axios.get("http://localhost:5000/api/users/details", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log("API response received successfully");
          console.log("API response:", response.data);
          
          // Check whether name is directly in response.data or nested in user object
          const userName = response.data.name || 
                          (response.data.user && response.data.user.name) || 
                          response.data.userName || 
                          (response.data.user && response.data.user.userName) ||
                          response.data.username ||
                          (response.data.user && response.data.user.username);
                          
          const userType = response.data.userType || 
                          (response.data.user && response.data.user.userType) ||
                          response.data.user_type ||
                          (response.data.user && response.data.user.user_type) ||
                          response.data.type ||
                          (response.data.user && response.data.user.type);
          
          console.log("Extracted userName:", userName);
          console.log("Extracted userType:", userType);
          
          if (userName && userType) {
            // Update localStorage with fresh data
            localStorage.setItem("userName", userName);
            localStorage.setItem("userType", userType);
            
            console.log("Updated localStorage with:", { userName, userType });
            
            setUserData({
              userName: userName,
              userType: userType
            });
            setIsLoggedIn(true);
          } else {
            console.error("User data incomplete:", response.data);
            throw new Error("Incomplete user data");
          }
        } catch (apiError) {
          console.error("API request failed:", apiError);
          
          // Try alternative header format if the first one failed
          if (apiError.response && apiError.response.status === 401) {
            console.log("Trying alternative authorization header format...");
            try {
              // Try without "Bearer" prefix
              const altResponse = await axios.get("http://localhost:5000/api/users/details", {
                headers: {
                  Authorization: token
                }
              });
              
              console.log("Alternative API call succeeded:", altResponse.data);
              
              const userName = altResponse.data.name || 
                            (altResponse.data.user && altResponse.data.user.name) || 
                            altResponse.data.userName || 
                            (altResponse.data.user && altResponse.data.user.userName) ||
                            altResponse.data.username ||
                            (altResponse.data.user && altResponse.data.user.username) ||
                            "User";
                            
              const userType = altResponse.data.userType || 
                            (altResponse.data.user && altResponse.data.user.userType) ||
                            altResponse.data.user_type ||
                            (altResponse.data.user && altResponse.data.user.user_type) ||
                            altResponse.data.type ||
                            (altResponse.data.user && altResponse.data.user.type) ||
                            "Buyer";
              
              localStorage.setItem("userName", userName);
              localStorage.setItem("userType", userType);
              
              setUserData({
                userName: userName,
                userType: userType
              });
              setIsLoggedIn(true);
            } catch (altError) {
              console.error("Alternative API request also failed:", altError);
              throw altError; // Rethrow to be handled in the main catch block
            }
          } else {
            throw apiError; // Rethrow if it's not a 401 error
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        
        // If we already have userName and userType in localStorage, use those instead of clearing
        const nameFromStorage = localStorage.getItem("userName");
        const typeFromStorage = localStorage.getItem("userType");
        
        if (nameFromStorage && typeFromStorage) {
          console.log("Using existing localStorage data despite API error");
          setUserData({
            userName: nameFromStorage,
            userType: typeFromStorage
          });
          setIsLoggedIn(true);
        } else {
          // Only clear token and data if we don't have existing data or if specifically a 401 error
          if (error.response && error.response.status === 401) {
            console.log("Clearing invalid token and user data");
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("userType");
          }
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Debug: Log userData changes
  useEffect(() => {
    console.log("userData updated:", userData);
  }, [userData]);

  // Fetch cart items count when logged in as a buyer
  useEffect(() => {
    const fetchCartItemsCount = async () => {
      if (isLoggedIn && userData.userType === "Buyer") {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          console.log("Fetching cart items count...");
          
          // Try with Bearer prefix first
          try {
            const response = await axios.get("http://localhost:5000/api/cart/count", {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            console.log("Cart response:", response.data);
            const count = response.data.count || 0;
            setCartItemCount(count);
          } catch (error) {
            // If first attempt fails, try without Bearer prefix
            if (error.response && error.response.status === 401) {
              console.log("Trying cart count with alternative auth header...");
              const altResponse = await axios.get("http://localhost:5000/api/cart/count", {
                headers: {
                  Authorization: token
                }
              });
              
              console.log("Alternative cart response:", altResponse.data);
              const count = altResponse.data.count || 0;
              setCartItemCount(count);
            } else {
              throw error; // Re-throw if not a 401 error
            }
          }
        } catch (error) {
          console.error("Error fetching cart count:", error);
          // Don't reset cart count on error, keep the current value
        }
      } else {
        // Reset cart count when not logged in as buyer
        setCartItemCount(0);
      }
    };

    fetchCartItemsCount();
  }, [isLoggedIn, userData.userType]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset quantity when selecting a new item
  useEffect(() => {
    if (selectedItem) {
      setSelectedQuantity(1);
    }
  }, [selectedItem]);

  const handleMobileMenuOpen = (event) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchorEl(null);
  
  const handleUserMenuOpen = (event) => setUserMenuAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchorEl(null);

  // Quantity handlers for modal
  const handleQuantityIncrease = () => {
    if (selectedItem && selectedItem.quantity && selectedQuantity < selectedItem.quantity) {
      setSelectedQuantity(prevQuantity => prevQuantity + 1);
    } else {
      // If no explicit quantity is set or we're at the max, cap at 10 as a reasonable default
      if (selectedQuantity < 10) {
        setSelectedQuantity(prevQuantity => prevQuantity + 1);
      } else {
        alert("Maximum quantity reached");
      }
    }
  };

  const handleQuantityDecrease = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(prevQuantity => prevQuantity - 1);
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    
    // Update state
    setIsLoggedIn(false);
    setUserData({
      userName: "",
      userType: ""
    });
    
    // Close menu
    handleUserMenuClose();
    handleMobileMenuClose();
    
    // Refresh current page
    window.location.reload();
  };

  const handleNavigate = (path) => {
    handleMobileMenuClose();
    handleUserMenuClose();
    router.push(path);
  };

  // Donation button click handler
  const handleDonationClick = () => {
    if (isLoggedIn) {
      router.push("/auth/donation");
    } else {
      setSelectedItem({ type: "donationPrompt" });
    }
  };

  // Handlers for item clicks from child components:
  const handleProductClick = (product) => {
    setSelectedItem(product);
  };

  const handleDonationCardClick = (donation) => {
    setSelectedItem(donation);
  };

  // Add to cart functionality
  const handleAddToCart = async (productId) => {
    if (isLoggedIn && userData.userType === "Buyer") {
      try {
        const token = localStorage.getItem("token");
        
        // First, get the product details
        if (!selectedItem) {
          alert("No product selected");
          return;
        }
        
        console.log("Adding to cart:", selectedItem);
        
        // Create payload with all required fields from cartRoutes.js
        const cartPayload = {
          product_id: productId || selectedItem._id || selectedItem.product_id,
          product_name: selectedItem.product_name || selectedItem.name,
          product_description: selectedItem.description || selectedItem.product_description || "",
          category: selectedItem.category || "",
          type: selectedItem.type || "",
          size: selectedItem.size || "",
          status: selectedItem.status || "unknown",
          quantity: selectedQuantity,
          price: parseFloat(selectedItem.price) || 0,
          original_price: parseFloat(selectedItem.original_price) || parseFloat(selectedItem.price) || 0,
          image: selectedItem.image || "",
          seller_id: selectedItem.seller_id || selectedItem.user_id || selectedItem.sellerId
        };
        
        console.log("Cart payload:", cartPayload);
        
        // Try with Bearer prefix first
        try {
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
          
          console.log("Cart response:", response.data);
          
          // Update cart count after adding
          setCartItemCount(prevCount => prevCount + selectedQuantity);
          
          // Show confirmation message
          alert(`${selectedQuantity} item(s) added to your cart!`);
          
          // Close modal and reset quantity
          handleModalClose();
        } catch (error) {
          // If first attempt fails with 401, try without Bearer prefix
          if (error.response && error.response.status === 401) {
            console.log("Trying add to cart with alternative auth header...");
            
            const altResponse = await axios.post(
              "http://localhost:5000/api/cart/add", 
              cartPayload,
              { 
                headers: { 
                  Authorization: token,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log("Alternative cart response:", altResponse.data);
            
            // Update cart count after adding
            setCartItemCount(prevCount => prevCount + selectedQuantity);
            
            // Show confirmation message
            alert(`${selectedQuantity} item(s) added to your cart!`);
            
            // Close modal and reset quantity
            handleModalClose();
          } else {
            // Handle other errors including quantity issues
            if (error.response?.data?.error === "Not enough quantity available") {
              alert(`Only ${error.response.data.available} items available. You requested ${error.response.data.requested}.`);
              return;
            }
            
            throw error; // Re-throw other errors
          }
        }
      } catch (error) {
        console.error("Error adding to cart:", error.response?.data || error.message);
        alert(`Failed to add item to cart: ${error.response?.data?.error || "Please try again"}`);
      }
    } else if (isLoggedIn && userData.userType === "Seller") {
      // Show message that sellers can't add to cart
      alert("Sellers cannot add items to cart. Please login as a buyer.");
    } else {
      // Show login prompt for guests
      setCartLoginPromptOpen(true);
    }
  };

  // Update cart count (called from ProductSectionSlider)
  const handleCartUpdate = async () => {
    if (isLoggedIn && userData.userType === "Buyer") {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        // Try with Bearer prefix first
        try {
          const response = await axios.get("http://localhost:5000/api/cart/count", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log("Updated cart count:", response.data);
          const count = response.data.count || 0;
          setCartItemCount(count);
        } catch (error) {
          // If first attempt fails, try without Bearer prefix
          if (error.response && error.response.status === 401) {
            console.log("Trying cart update with alternative auth header...");
            const altResponse = await axios.get("http://localhost:5000/api/cart/count", {
              headers: {
                Authorization: token
              }
            });
            
            console.log("Alternative cart update response:", altResponse.data);
            const count = altResponse.data.count || 0;
            setCartItemCount(count);
          } else {
            throw error; // Re-throw if not a 401 error
          }
        }
      } catch (error) {
        console.error("Error updating cart count:", error);
      }
    }
  };

  // Close main modal
  const handleModalClose = () => {
    setSelectedItem(null);
    setSelectedQuantity(1); // Reset quantity when closing modal
  };

  // Close cart login prompt modal
  const handleCartLoginPromptClose = () => {
    setCartLoginPromptOpen(false);
  };

  // Get display name - handle empty values gracefully
  const getDisplayName = () => {
    return userData?.userName || "User";
  };

  // Log current state for debugging
  console.log("Current state:", { isLoggedIn, userData, loading });

  return (
    <>
      {/* Navigation Bar */}
      <AppBar position="fixed" style={{ backgroundColor: "#611964" }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            THRIFT HAVEN
          </Typography>
          
          {/* Desktop Menu */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
            <Button color="inherit" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button color="inherit" onClick={() => router.push("/auth/products")}>
              Shop
            </Button>
            
            {loading ? (
              // Show loading state while checking authentication
              <Button color="inherit" disabled>
                Loading...
              </Button>
            ) : isLoggedIn ? (
              <>
                {/* User dropdown menu */}
                <Box>
                  <Button 
                    color="inherit" 
                    onClick={handleUserMenuOpen}
                    endIcon={<KeyboardArrowDownIcon />}
                    startIcon={
                      <Avatar 
                        sx={{ 
                          bgcolor: "#f0f0f0", 
                          color: "#611964",
                          width: 32,
                          height: 32
                        }}
                      >
                        {getDisplayName().charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    sx={{ textTransform: 'none' }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
                      {getDisplayName()}
                    </Typography>
                    <Chip 
                      label={userData.userType} 
                      size="small" 
                      sx={{ 
                        bgcolor: userData.userType === "Seller" ? "#ffc107" : "#4caf50", 
                        color: "white",
                        fontSize: "0.7rem",
                        height: 20
                      }} 
                    />
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchorEl}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    keepMounted
                  >
                    <MenuItem onClick={() => handleNavigate(userData.userType === "Seller" ? "/auth/seller-dashboard" : "/auth/buyer-dashboard")}>
                      <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                      Dashboard
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
                
                {/* Cart icon for Buyers */}
                {userData.userType === "Buyer" && (
                  <Box sx={{ position: "relative" }}>
                    <IconButton color="inherit" onClick={() => handleNavigate("/auth/cart")}>
                      <ShoppingCartIcon />
                    </IconButton>
                    {cartItemCount > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "red",
                          color: "white",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: "bold"
                        }}
                      >
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigate("/auth/login")}
                >
                  Login
                </Button>
               
              </>
            )}
          </Box>
          
          {/* Mobile Menu */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            {/* Mobile cart icon for logged-in Buyers */}
            {isLoggedIn && userData.userType === "Buyer" && (
              <Box sx={{ position: "relative", mr: 1 }}>
                <IconButton color="inherit" onClick={() => handleNavigate("/auth/cart")}>
                  <ShoppingCartIcon />
                </IconButton>
                {cartItemCount > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      backgroundColor: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}
                  >
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </Box>
                )}
              </Box>
            )}
            
            <IconButton color="inherit" onClick={handleMobileMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchorEl}
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              keepMounted
            >
              {isLoggedIn && (
                <MenuItem sx={{ pointerEvents: 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "#f0f0f0", 
                        color: "#611964",
                        width: 32,
                        height: 32,
                        mr: 1
                      }}
                    >
                      {getDisplayName().charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {getDisplayName()}
                    </Typography>
                    <Chip 
                      label={userData.userType} 
                      size="small" 
                      sx={{ 
                        ml: 1,
                        bgcolor: userData.userType === "Seller" ? "#ffc107" : "#4caf50", 
                        color: "white" 
                      }} 
                    />
                  </Box>
                </MenuItem>
              )}
              {isLoggedIn && <Divider />}
              <MenuItem onClick={() => handleNavigate("/")}>Home</MenuItem>
              <MenuItem onClick={() => handleNavigate("/auth/products")}>Shop</MenuItem>
              
              {isLoggedIn ? (
                <>
                  <MenuItem onClick={() => handleNavigate(userData.userType === "Seller" ? "/auth/seller-dashboard" : "/auth/buyer-dashboard")}>
                    <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </>
              ) : (
                <>
                  <Divider />
                  <MenuItem onClick={() => handleNavigate("/auth/login")}>
                    <LoginIcon fontSize="small" sx={{ mr: 1 }} />
                    Login
                  </MenuItem>
              
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ mt: 25 }}></Box>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            >
              {isLoggedIn ? (
                <>
                  <Typography variant="h3" fontWeight="bold" style={{ color: "#611964" }}>
                    Welcome, {getDisplayName()}
                  </Typography>
                  <Typography variant="h5" color="textSecondary" mt={2}>
                    {userData.userType === "Seller" 
                      ? "Manage your listings and see what's trending in the thrift community."
                      : "Discover unique thrift items and add your favorites to your collection."}
                  </Typography>

                  <Button
                    variant="contained"
                    style={{ backgroundColor: "#611964" }}
                    sx={{ mt: 3, mr: 2, px: 3, py: 1.2 }}
                    onClick={() => router.push(userData.userType === "Seller" ? "/auth/seller-dashboard" : "/auth/buyer-dashboard")}
                    component={motion.button}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Go to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="h3" fontWeight="bold" style={{ color: "#611964" }}>
                    THRIFT HAVEN
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="textPrimary" mt={2}>
                    Cloth Thrifting Platform
                  </Typography>
                  <Typography variant="h5" color="textSecondary" mt={1}>
                    Your new favorite, someone's old treasure
                  </Typography>
                  
                  <Button
                    variant="contained"
                    style={{ backgroundColor: "#611964" }}
                    sx={{ mt: 3, mr: 2, px: 3, py: 1.2 }}
                    onClick={() => router.push("/auth/register")}
                    component={motion.button}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    JOIN WITH US!
                  </Button>
                </>
              )}
              
              <Button 
                variant="outlined" 
                sx={{ 
                  mt: 3, 
                  mr: 2,
                  px: 3,
                  py: 1,
                  borderColor: "#611964", 
                  color: "#611964",
                  borderWidth: 2,
                  borderRadius: 1
                }}
                onClick={handleDonationClick}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoggedIn ? "Donate Now" : "Login to Donate"}
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="center">
            <motion.div
              ref={imageRef}
              initial={{ y: 0 }}
              animate={{ y: -50 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <Image src="/img2.svg" alt="Thrift Haven" width={600} height={450} />
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Product Section as a Slider */}
      <Box sx={{ mt: 20 }}>
        <ProductSectionSlider 
          onProductClick={handleProductClick} 
          onCartUpdate={handleCartUpdate}
        />
      </Box>

      {/* Donation Section */}
      <Box sx={{ mt: 10 }}>
        <DonationSection onItemClick={handleDonationCardClick} />
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: "center", mt: 10, mb: 5 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <Typography variant="body1" color="textSecondary">
            © 2025 Thrift Haven. All rights reserved.
          </Typography>
        </motion.div>
      </Box>

     {/* Modal for Full Product Details */}
<Modal
  open={Boolean(selectedItem)}
  onClose={handleModalClose}
  sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
>
  <Box
    sx={{
      bgcolor: "white",
      borderRadius: 2,
      p: 4,
      boxShadow: 24,
      width: { xs: "90%", sm: "80%", md: "70%" },
      maxWidth: 900, // Increased width from 400
      maxHeight: "85vh", // Decreased from 90vh
      overflowY: "auto",
      position: "relative",
    }}
  >
    {selectedItem && selectedItem.type === "donationPrompt" ? (
      <>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#611964" }}>
          Please log in to donate.
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              handleModalClose();
              router.push("/auth/login");
            }}
            sx={{ flex: 1, bgcolor: "#611964", "&:hover": { bgcolor: "#4a124b" } }}
          >
            OK
          </Button>
          <Button variant="outlined" onClick={handleModalClose} sx={{ flex: 1, borderColor: "#611964", color: "#611964" }}>
            Cancel
          </Button>
        </Box>
      </>
    ) : selectedItem && selectedItem.donation_id ? (
      // Modal for Donation Card (without Add to Cart button)
      <>
        <IconButton
          onClick={handleModalClose}
          sx={{ 
            position: "absolute", 
            top: 12, 
            right: 12,
            bgcolor: "rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Left Column: Image */}
          <Box sx={{ flex: 5, textAlign: "center" }}>
            {selectedItem?.image && (
              <Box
                component="img"
                src={`http://localhost:5000/${selectedItem.image}`}
                alt={selectedItem?.product_name || selectedItem?.name}
                sx={{
                  width: "100%",
                  height: "400px", // Fixed height
                  objectFit: "contain",
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              />
            )}
          </Box>
          {/* Right Column: Donation Details (no Add to Cart button) */}
          <Box sx={{ flex: 7 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
              {selectedItem?.product_name || selectedItem?.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
              {selectedItem?.description}
            </Typography>
            
            <Box sx={{ mb: 3, p: 2, backgroundColor: "rgba(97, 25, 100, 0.03)", borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Product Details
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {selectedItem?.size && (
                  <Typography variant="body2">
                    <strong>Size:</strong> {selectedItem.size}
                  </Typography>
                )}
                {selectedItem?.category && (
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedItem.category}
                  </Typography>
                )}
                {selectedItem?.type && (
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedItem.type}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Typography variant="h5" component="span" sx={{ fontWeight: "bold", color: "#611964", mr: 2 }}>
                Rs. {selectedItem?.price}
              </Typography>
              {selectedItem?.original_price && (
                <Typography variant="h6" component="span" sx={{ textDecoration: "line-through", color: "red" }}>
                  Rs. {selectedItem?.original_price}
                </Typography>
              )}
            </Box>
            
            {selectedItem?.sellerName && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Seller:</strong> {selectedItem.sellerName}
              </Typography>
            )}
            {selectedItem?.donation_date && (
              <Typography variant="caption" sx={{ mt: 3, display: "block", color: "#666" }}>
                Donated on: {new Date(selectedItem.donation_date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>
      </>
    ) : (
      // Modal for Product Card with Add to Cart button
      <>
        <IconButton
          onClick={handleModalClose}
          sx={{ 
            position: "absolute", 
            top: 16, 
            right: 16,
            bgcolor: "rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Left Column: Image */}
          <Box sx={{ flex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {selectedItem?.image && (
              <Box
                component="img"
                src={`http://localhost:5000/${selectedItem.image}`}
                alt={selectedItem?.product_name || selectedItem?.name}
                sx={{
                  width: "100%",
                  height: "400px", // Fixed height
                  objectFit: "contain",
                  borderRadius: 3,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  mb: 2
                }}
              />
            )}
            <Box 
              sx={{ 
                width: "100%", 
                display: "flex", 
                justifyContent: "center", 
                gap: 2, 
                mt: 2,
                display: { xs: "none", md: "flex" } // Only show on medium screens and up
              }}
            >
              <Typography variant="body2" sx={{ 
                color: "#666", 
                py: 1, 
                px: 2, 
                bgcolor: "rgba(97, 25, 100, 0.05)", 
                borderRadius: 1,
                display: "flex",
                alignItems: "center"
              }}>
                Available: {selectedItem?.quantity || 0} items
              </Typography>
              {selectedItem?.sellerName && (
                <Typography variant="body2" sx={{ 
                  color: "#666", 
                  py: 1, 
                  px: 2, 
                  bgcolor: "rgba(97, 25, 100, 0.05)", 
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center"
                }}>
                  Seller: {selectedItem.sellerName}
                </Typography>
              )}
            </Box>
          </Box>
          {/* Right Column: Product Details and Add to Cart Button */}
          <Box sx={{ flex: 7, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: "#333" }}>
                {selectedItem?.product_name || selectedItem?.name}
              </Typography>
              
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                mb: 3, 
                pb: 2, 
                borderBottom: "1px solid rgba(0,0,0,0.08)" 
              }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: "bold", color: "#611964", mr: 2 }}>
                  Rs. {selectedItem?.price}
                </Typography>
                {selectedItem?.original_price && (
                  <>
                    <Typography variant="h6" component="span" sx={{ textDecoration: "line-through", color: "#888", mr: 2 }}>
                      Rs. {selectedItem?.original_price}
                    </Typography>
                    
                  </>
                )}
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3, color: "#555", lineHeight: 1.7 }}>
                {selectedItem?.description}
              </Typography>
              
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: "rgba(97, 25, 100, 0.03)", 
                borderRadius: 2,
                border: "1px solid rgba(97, 25, 100, 0.08)"
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#611964" }}>
                  Product Details
                </Typography>
                <Box sx={{ 
                  display: "grid", 
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, 
                  gap: 2 
                }}>
                  {selectedItem?.size && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "#555" }}>
                        Size:
                      </Typography>
                      <Chip 
                        label={selectedItem.size} 
                        size="small" 
                        sx={{ 
                          bgcolor: "rgba(97, 25, 100, 0.08)", 
                          color: "#611964",
                          fontWeight: "medium"
                        }} 
                      />
                    </Box>
                  )}
                  {selectedItem?.category && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "#555" }}>
                        Category:
                      </Typography>
                      <Chip 
                        label={selectedItem.category} 
                        size="small" 
                        sx={{ 
                          bgcolor: "rgba(97, 25, 100, 0.08)", 
                          color: "#611964",
                          fontWeight: "medium"
                        }} 
                      />
                    </Box>
                  )}
                  {selectedItem?.type && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "#555" }}>
                        Type:
                      </Typography>
                      <Chip 
                        label={selectedItem.type} 
                        size="small" 
                        sx={{ 
                          bgcolor: "rgba(97, 25, 100, 0.08)", 
                          color: "#611964",
                          fontWeight: "medium"
                        }} 
                      />
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "#555" }}>
                      Status:
                    </Typography>
                {selectedItem?.status && (
  <Chip 
    label={selectedItem.status} 
    size="small" 
    sx={{ 
      bgcolor: selectedItem?.quantity > 0 ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
      color: selectedItem?.quantity > 0 ? "#388e3c" : "#d32f2f",
      fontWeight: "medium"
    }} 
  />
)}

                  </Box>
                </Box>
              </Box>
              
              {/* Mobile view only info */}
              <Box sx={{ 
                mb: 3, 
                display: { xs: "block", md: "none" }
              }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Available:</strong> {selectedItem?.quantity || 0} items
                </Typography>
                {selectedItem?.sellerName && (
                  <Typography variant="body2">
                    <strong>Seller:</strong> {selectedItem.sellerName}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Quantity Selector */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#611964" }}>
                Select Quantity
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
                <ButtonGroup 
                  sx={{ 
                    backgroundColor: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid rgba(97, 25, 100, 0.15)"
                  }}
                >
                  <IconButton 
                    onClick={handleQuantityDecrease}
                    disabled={selectedQuantity <= 1}
                    sx={{ 
                      borderRadius: 0, 
                      width: 48, 
                      height: 48,
                      color: "#611964"
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Box sx={{ 
                    padding: "8px 24px", 
                    minWidth: "70px", 
                    textAlign: "center", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    borderLeft: "1px solid rgba(97, 25, 100, 0.15)",
                    borderRight: "1px solid rgba(97, 25, 100, 0.15)",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    color: "#333"
                  }}>
                    {selectedQuantity}
                  </Box>
                  <IconButton 
                    onClick={handleQuantityIncrease}
                    disabled={selectedItem && selectedItem.quantity ? selectedQuantity >= selectedItem.quantity : selectedQuantity >= 10}
                    sx={{ 
                      borderRadius: 0, 
                      width: 48, 
                      height: 48,
                      color: "#611964" 
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </ButtonGroup>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: selectedItem && selectedItem.quantity && selectedQuantity >= selectedItem.quantity * 0.8 
                      ? "#d32f2f" 
                      : "#666" 
                  }}
                >
                  {selectedItem && selectedItem.quantity && selectedQuantity >= selectedItem.quantity * 0.8 
                    ? `Only ${selectedItem.quantity} available!` 
                    : `${selectedItem?.quantity || 0} items available`}
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
                  py: 1.7,
                  borderRadius: 2,
                  fontSize: "1.1rem",
                  textTransform: "none",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(97, 25, 100, 0.3)",
                  transition: "all 0.3s ease",
                  "&:active": {
                    transform: "scale(0.98)"
                  }
                }}
                onClick={() => {
                  if (selectedItem && selectedItem.product_id) {
                    handleAddToCart(selectedItem.product_id);
                  } else if (selectedItem && selectedItem._id) {
                    handleAddToCart(selectedItem._id);
                  } else {
                    alert("Cannot add item to cart: Missing product ID");
                  }
                }}
              >
                Add to Cart ({selectedQuantity})
              </Button>
            </Box>
          </Box>
        </Box>
      </>
    )}
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
            boxShadow: 24,
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#611964", fontWeight: "bold" }}>
            You need to log in to add items to the cart.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                handleCartLoginPromptClose();
                router.push("/auth/login");
              }}
              sx={{ flex: 1, bgcolor: "#611964", "&:hover": { bgcolor: "#4a124b", width:"130px" } }}
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
    </>
  );
}