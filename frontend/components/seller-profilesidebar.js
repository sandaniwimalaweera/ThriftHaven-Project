// frontend/components/SellerSidebar.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Rating,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Paper,
  Badge,
  Chip,
  Button,
  alpha,
  Tooltip,
  useTheme
} from "@mui/material";
import axios from "axios";
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';

const SellerSidebar = ({ seller = {}, onSectionSelect, onLogout }) => {
  const theme = useTheme();
  // Local state to store the total number of ratings and the average rating
  const [ratingsData, setRatingsData] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  useEffect(() => {
    const fetchRatings = async () => {
      // Ensure seller ID is available
      if (!seller?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Use the public endpoint instead of the protected one
        const response = await axios.get(
          `http://localhost:5000/api/reviews/public/${seller.id}`
        );
        const reviews = response.data; // expecting an array of review objects

        // Calculate the total number of ratings and the sum of all rating values,
        // filtering out any invalid ratings first
        const validReviews = reviews.filter(review => 
          review.rating !== null && review.rating !== undefined);
        const count = validReviews.length;
        const total = validReviews.reduce(
          (acc, review) => acc + Number(review.rating || 0),
          0
        );
        // Calculate the average rating (avoid division by zero)
        const average = count ? (total / count).toFixed(1) : 0;
        setRatingsData({ count, average });
      } catch (error) {
        console.error("Error fetching ratings:", error);
        // Default to empty ratings on error
        setRatingsData({ count: 0, average: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [seller]);

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: "320px" },
        bgcolor: "#fff",
        boxShadow: "2px 0 10px rgba(0,0,0,0.05)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #f0f0f0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top banner */}
      <Box 
        sx={{ 
          height: "100px", 
          width: "100%", 
          bgcolor: "#611964",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          pt: 2,
          pb: 6
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: "white", 
            fontWeight: "bold",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <StorefrontIcon sx={{ mr: 1 }} />
          Seller Profile
        </Typography>
      </Box>
      
      {/* Profile Card */}
      <Paper
        elevation={0}
        sx={{
          mx: 3,
          mt: -5,
          mb: 3,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #f0f0f0"
        }}
      >
        {/* Avatar & Verified Badge */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 3,
            pb: 2,
            position: "relative"
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              seller?.verified ? 
                <Tooltip title="Verified Seller">
                  <Box
                    sx={{
                      bgcolor: "#611964",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid white"
                    }}
                  >
                    <VerifiedIcon sx={{ color: "white", fontSize: 14 }} />
                  </Box>
                </Tooltip> : null
            }
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "#611964",
                color: "#fff",
                fontSize: 32,
                mb: 1,
                boxShadow: "0 4px 12px rgba(97, 25, 100, 0.2)",
                border: "3px solid white"
              }}
              src={seller?.avatar}
            >
              {seller?.name ? seller.name.charAt(0).toUpperCase() : "?"}
            </Avatar>
          </Badge>

          {/* Seller Name */}
          <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1.5, textAlign: "center" }}>
            {seller?.name || "Unknown Seller"}
          </Typography>

          {/* Calculated Rating Display - Clickable */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              my: 1.5,
              cursor: "pointer",
              width: "100%"
            }}
            onClick={() => onSectionSelect?.("reviews")}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#611964" }} />
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={ratingsData.count > 0 ? "#611964" : "text.secondary"}
                  >
                    {ratingsData.average}
                  </Typography>
                  <StarIcon 
                    sx={{ 
                      color: ratingsData.count > 0 ? "#FFC107" : "text.secondary", 
                      ml: 0.5,
                      fontSize: 20
                    }} 
                  />
                </Box>
                
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontSize: "0.85rem" }}
                >
                  {ratingsData.count > 0 ? 
                    `${ratingsData.count} ${ratingsData.count === 1 ? "review" : "reviews"}` : 
                    "No reviews yet"}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Seller Details */}
        <Box sx={{ px: 2.5, py: 2 }}>
         

          {/* Email */}
          {seller?.email && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <EmailIcon sx={{ color: "text.secondary", fontSize: 18, mr: 1.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                {seller.email}
              </Typography>
            </Box>
          )}

          {/* Contact */}
          {seller?.contact && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <PhoneIcon sx={{ color: "text.secondary", fontSize: 18, mr: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                {seller.contact}
              </Typography>
            </Box>
          )}

          {/* Location */}
          {seller?.location && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LocationOnIcon sx={{ color: "text.secondary", fontSize: 18, mr: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                {seller.location}
              </Typography>
            </Box>
          )}
          
          {/* Seller Bio */}
          {seller?.bio && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                {seller.bio}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Navigation */}
      <Box sx={{ px: 2.5, flexGrow: 1 }}>
        
        
        <List sx={{ width: "100%" }} component="nav">
          <ListItemButton 
            onClick={() => onSectionSelect?.("products")}
            sx={{ 
              borderRadius: 1.5,
              mb: 1,
              "&:hover": {
                bgcolor: alpha("#611964", 0.08)
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ShoppingBagIcon sx={{ color: "#611964" }} />
            </ListItemIcon>
            <ListItemText
              primary="Products"
              primaryTypographyProps={{ 
                sx: { fontWeight: "medium" } 
              }}
            />
          </ListItemButton>
          
          <ListItemButton 
            onClick={() => onSectionSelect?.("reviews")}
            sx={{ 
              borderRadius: 1.5,
              mb: 1,
              "&:hover": {
                bgcolor: alpha("#611964", 0.08)
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <RateReviewIcon sx={{ color: "#611964" }} />
            </ListItemIcon>
            <ListItemText
              primary="Reviews"
              primaryTypographyProps={{ 
                sx: { fontWeight: "medium" } 
              }}
            />
            {ratingsData.count > 0 && (
              <Chip 
                size="small" 
                label={ratingsData.count}
                sx={{ 
                  height: 24, 
                  bgcolor: alpha("#611964", 0.1),
                  color: "#611964",
                  fontWeight: "bold"
                }} 
              />
            )}
          </ListItemButton>

          {/* User Actions Section - only show if it's the user's own profile */}
      
        </List>
      </Box>
      
   
    </Box>
  );
};

export default SellerSidebar;