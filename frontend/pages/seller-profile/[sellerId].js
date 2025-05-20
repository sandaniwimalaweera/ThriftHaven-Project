// pages/seller-profile/[sellerId].js
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Rating,
  Paper,
  Tabs,
  Tab,
  Divider,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Alert,
  Backdrop,
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import SellerSidebar from "../../components/seller-profilesidebar";
import DashboardProductSectionSlider from "../../components/sellerproductcardslider";
import ReviewSection from "../../components/reviewSection";
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Head from "next/head";

// Section divider component
function SectionDivider({ title, icon }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 3,
        mt: 6,
        position: "relative"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "1px",
          bgcolor: "#e0e0e0",
          zIndex: 0
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "#f8f9fa",
          pr: 2,
          position: "relative",
          zIndex: 1
        }}
      >
        {icon}
        <Typography variant="h5" sx={{ fontWeight: "bold", ml: 1.5, color: "#611964" }}>
          {title}
        </Typography>
      </Box>
    </Box>
  );
}

export default function SellerProfile() {
  const router = useRouter();
  const { sellerId } = router.query;
  const [seller, setSeller] = useState(null);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check if logged-in user is viewing their own profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Simple JWT check (not decoding, just to detect presence of user)
        setIsCurrentUser(true);
      } catch (error) {
        setIsCurrentUser(false);
      }
    } else {
      setIsCurrentUser(false);
    }
  }, [sellerId]);

  // Fetch seller details
  useEffect(() => {
    if (!sellerId) return;
    
    const fetchSeller = async () => {
      setLoadingSeller(true);
      setError(null);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/users/profile/${sellerId}`);
        
        // Add isCurrentUser flag to seller data
        setSeller({
          ...response.data,
          isCurrentUser: isCurrentUser
        });
      } catch (error) {
        console.error("Error fetching seller details:", error);
        setError("We couldn't load this seller's information. Please try again later.");
        setSeller(null);
      } finally {
        setLoadingSeller(false);
      }
    };
    
    fetchSeller();
  }, [sellerId, isCurrentUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const handleSectionSelect = (section) => {
    if (section === "edit") {
      router.push("/profile/edit");
    } else if (section === "products" || section === "reviews") {
      // Scroll to the section
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loadingSeller) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'rgba(255, 255, 255, 0.9)'
        }}
        open={true}
      >
        <CircularProgress color="primary" sx={{ color: "#611964" }} />
        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
          Loading seller profile...
        </Typography>
      </Backdrop>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'white',
            border: '1px solid #f0f0f0'
          }}
        >
          <StorefrontIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            Seller Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The seller profile you're looking for doesn't exist or has been removed.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Chip 
              label="Go Home" 
              onClick={() => router.push('/')} 
              sx={{ 
                bgcolor: '#611964', 
                color: 'white', 
                '&:hover': { 
                  bgcolor: '#4b1250' 
                },
                mr: 1,
                px: 2,
                fontWeight: 'medium'
              }}
            />
            <Chip 
              label="Browse Sellers" 
              onClick={() => router.push('/sellers')} 
              variant="outlined"
              sx={{ 
                borderColor: '#611964', 
                color: '#611964',
                '&:hover': { 
                  bgcolor: 'rgba(97, 25, 100, 0.04)'
                },
                px: 2,
                fontWeight: 'medium'
              }}
            />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!seller) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'white',
            border: '1px solid #f0f0f0'
          }}
        >
          <StorefrontIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            Seller Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The seller profile you're looking for doesn't exist or has been removed.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Chip 
              label="Go Home" 
              onClick={() => router.push('/')} 
              sx={{ 
                bgcolor: '#611964', 
                color: 'white', 
                '&:hover': { 
                  bgcolor: '#4b1250' 
                },
                mr: 1,
                px: 2,
                fontWeight: 'medium'
              }}
            />
            <Chip 
              label="Browse Sellers" 
              onClick={() => router.push('/sellers')} 
              variant="outlined"
              sx={{ 
                borderColor: '#611964', 
                color: '#611964',
                '&:hover': { 
                  bgcolor: 'rgba(97, 25, 100, 0.04)'
                },
                px: 2,
                fontWeight: 'medium'
              }}
            />
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>{seller.name || "Seller"} Profile | Your Marketplace</title>
        <meta name="description" content={`View ${seller.name}'s profile and products`} />
      </Head>
      
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8f9fa" }}>
        {/* Sidebar with seller details - only show on larger screens */}
        {!isMobile && (
          <SellerSidebar
            seller={seller}
            onSectionSelect={handleSectionSelect}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, md: 3 }, 
            overflowY: "auto", 
            height: "100vh",
            width: "100%"
          }}
        >
          {/* Seller Header Card - Show on mobile instead of sidebar */}
          {isMobile && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: "white",
                position: "relative",
                overflow: "hidden",
                border: "1px solid #f0f0f0"
              }}
            >
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "60px", bgcolor: "#611964" }} />
              
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", pt: 1 }}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    border: "4px solid white",
                    bgcolor: "#611964",
                    fontSize: "1.8rem"
                  }}
                  src={seller.avatar}
                >
                  {seller.name ? seller.name.charAt(0).toUpperCase() : "S"}
                </Avatar>
                
                <Box sx={{ textAlign: "center", mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {seller.name || "Unknown Seller"}
                  </Typography>
                  
                  {seller.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {seller.location}
                    </Typography>
                  )}
                </Box>
                
                {seller.bio && (
                  <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
                    {seller.bio}
                  </Typography>
                )}
              </Box>
            </Paper>
          )}

          {/* Main content in single page to scroll */}
          <Box>
            {/* Products Section */}
            <Box id="products" sx={{ scrollMarginTop: 16 }}>
              <SectionDivider title="Products" icon={<ShoppingBagIcon color="primary" sx={{ color: "#611964" }} />} />
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "white",
                  border: "1px solid #f0f0f0",
                  p: 3,
                  mb: 5
                }}
              >
                <DashboardProductSectionSlider sellerId={sellerId} />
              </Paper>
            </Box>
            
            {/* Reviews Section */}
            <Box id="reviews" sx={{ scrollMarginTop: 16, mb: 6 }}>
              <SectionDivider title="Reviews" icon={<RateReviewIcon color="primary" sx={{ color: "#611964" }} />} />
              <ReviewSection sellerId={sellerId} />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}