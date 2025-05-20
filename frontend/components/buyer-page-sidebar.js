import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Avatar,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  ShoppingBag,
  ListAlt,
  Redeem,
  Payment,
  Lock,
  Message,
  AssignmentReturn,
  Logout,
  Home,
  Dashboard,
  ShoppingCart
} from "@mui/icons-material";
import { useRouter } from "next/router";

// This component remains independent and can be used across multiple pages
const BuyerSidebar = ({ userName, isSidebarOpen = true }) => {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("");

  // Set active item based on current route when component mounts or route changes
  useEffect(() => {
    const path = router.pathname;
    const hash = router.asPath.split('#')[1] || "";
    
    if (path === "/") {
      setActiveItem("home");
    } else if (path === "/auth/buyer-dashboard") {
      if (hash === "donations") {
        setActiveItem("donations");
      } else {
        setActiveItem("dashboard");
      }
    } else if (path === "/auth/cart") {
      setActiveItem("cart");
    } else if (path === "/auth/buyer-pc") {
      setActiveItem("changePassword");
    } else if (path === "/orders") {
      setActiveItem("orderDetails");
    } else if (path === "/auth/buyer-refund-details") {
      setActiveItem("refundDetails");
    } else if (hash === "messages") {
      setActiveItem("messages");
    }
  }, [router.pathname, router.asPath]);

  // This function navigates to the seller dashboard with a hash (e.g. #products)
  const navigateToSection = (section, itemName) => {
    setActiveItem(itemName);
    router.push(`/auth/buyer-dashboard#${section}`);
  };
  
  // Helper function to scroll to a section with a given id
  const handleScroll = (id, itemName) => {
    setActiveItem(itemName);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper function for navigation with active state tracking
  const navigateTo = (path, itemName) => {
    setActiveItem(itemName);
    router.push(path);
  };

  // Style for active and inactive menu items
  const getItemStyle = (itemName) => {
    return {
      bgcolor: activeItem === itemName ? '#7A3182' : 'transparent',
      '&:hover': {
        bgcolor: '#7A3182',
        transition: 'background-color 0.3s'
      }
    };
  };

  return (
    <Box
      sx={{
        width: 330,
        bgcolor: "#611964",
        color: "white",
        p: 2,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed", // Added fixed positioning
        top: 0,            // Position at top
        left: 0,           // Position at left
        overflowY: "auto"  // Add scrolling for sidebar content if needed
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center">
        <Avatar sx={{ width: 80, height: 80, bgcolor: "white", color: "#611964" }}>
          <AccountCircle fontSize="large" />
        </Avatar>
        <Typography variant="h6" fontWeight="bold" mt={1}>
          {userName}
        </Typography>
      </Box>
      
      <Box mt={3}>
        <List sx={{ width: "100%" }}>

          <ListItemButton 
            onClick={() => navigateTo("/", "home")}
            sx={getItemStyle("home")}
          >
            <ListItemIcon>
              <Home sx={{ color: "white" }} /> 
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/auth/buyer-dashboard", "dashboard")}
            sx={getItemStyle("dashboard")}
          >
            <ListItemIcon>
              <Dashboard sx={{ color: "white" }} /> 
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/auth/cart", "cart")}
            sx={getItemStyle("cart")}
          >
            <ListItemIcon>
              <ShoppingCart sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="My Cart" />
          </ListItemButton>
         
          <ListItemButton 
            onClick={() => navigateToSection("donations", "donations")}
            sx={getItemStyle("donations")}
          >
            <ListItemIcon>
              <Redeem sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="My Donations" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/auth/buyer-pc", "changePassword")}
            sx={getItemStyle("changePassword")}
          >
            <ListItemIcon>
              <Lock sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Change Password" />
          </ListItemButton>

          <ListItemButton 
           onClick={() => navigateTo("/auth/UserMessaging", "messages")}
            sx={getItemStyle("messages")}
          >
            <ListItemIcon>
              <Message sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Messages" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/orders", "orderDetails")}
            sx={getItemStyle("orderDetails")}
          >
            <ListItemIcon>
              <ShoppingBag sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Order Details" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/auth/buyer-refund-details", "refundDetails")}
            sx={getItemStyle("refundDetails")}
          >
            <ListItemIcon>
              <AssignmentReturn sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Refund Details" />
          </ListItemButton>
        </List>
      </Box>
      <Button
        startIcon={<Logout />}
        fullWidth
        sx={{ 
          color: "white", 
          justifyContent: "flex-start", 
          mt: 3,
          '&:hover': {
            bgcolor: '#7A3182',
            transition: 'background-color 0.3s'
          }
        }}
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/auth/login");
        }}
      >
        Log out
      </Button>
    </Box>
  );
};

export default BuyerSidebar;