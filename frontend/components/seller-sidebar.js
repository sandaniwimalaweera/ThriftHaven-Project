// frontend/components/seller-sidebar.js
import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Avatar, List, ListItemButton, ListItemText, ListItemIcon, Divider } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';
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
  Dashboard
} from "@mui/icons-material";
import { useRouter } from "next/router";

const SellerSidebar = ({ userName }) => {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("");
  
  // Set active item based on current route when component mounts
  useEffect(() => {
    const path = router.pathname;
    if (path === "/auth/seller-order-details") {
      setActiveItem("ordres");
    } else if (path === "/orders/seller-payment-details") {
      setActiveItem("payments");
    } else if (path === "/auth/seller-pc") {
      setActiveItem("changePassword");
    } else if (path === "/auth/messages") {
      setActiveItem("messages");
    } else if (path === "/orders/seller-refund-details") {
      setActiveItem("refundDetails");
    }
  }, [router.pathname]);

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
             onClick={() => navigateTo("/auth/seller-dashboard", "dashboard")}
             sx={getItemStyle("dashboard")}
           >
             <ListItemIcon>
               <Dashboard sx={{ color: "white" }} /> 
             </ListItemIcon>
             <ListItemText primary="Dashboard" />
           </ListItemButton>


          <ListItemButton 
            onClick={() => handleScroll("products", "products")}
            sx={getItemStyle("products")}
          >
            <ListItemIcon>
              <ShoppingBag sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="My Products" />
          </ListItemButton>
         
          <ListItemButton 
                     onClick={() => handleScroll("donations", "donations")}
            sx={getItemStyle("donations")}
          >
            <ListItemIcon>
              <Redeem sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="My Donations" />
          </ListItemButton>
         
         
         
         
          <ListItemButton 
                  onClick={() => navigateTo("/auth/seller-order-details", "orders")}
            sx={getItemStyle("orders")}
          >
            <ListItemIcon>
              <ListAlt sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Order Details" />
          </ListItemButton>
         




          <ListItemButton 
            onClick={() => navigateTo("/auth/seller-payment-details", "payments")}
            sx={getItemStyle("payments")}
          >
            <ListItemIcon>
              <Payment sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Payment History" />
          </ListItemButton>



          <ListItemButton 
            onClick={() => navigateTo("/auth/seller-pc", "changePassword")}
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
            onClick={() => navigateTo("/auth/seller-refund-details", "refundDetails")}
            sx={getItemStyle("refundDetails")}
          >
            <ListItemIcon>
              <AssignmentReturn sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Refund Details" />
          </ListItemButton>

          <ListItemButton 
            onClick={() => navigateTo("/auth/SellerReviews", "reviews")}
            sx={getItemStyle("reviews")}
          >
            <ListItemIcon>
              <StarIcon sx={{ color: "white" }} />
            </ListItemIcon>
            <ListItemText primary="Customer Reviews" />
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

export default SellerSidebar;