// components/BuyerLayout.js
import { useState, useEffect } from "react";
import { Box, Container } from "@mui/material";
import BuyerSidebar from "./buyer-sidebar";
import RefundNotification from "./RefundNotification";

const BuyerLayout = ({ children }) => {
  const [userName, setUserName] = useState("Buyer");
  
  useEffect(() => {
    // Get user name from localStorage if available
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);
  
  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Box sx={{ 
        width: "280px", 
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 1000,
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider"
      }}>
        <BuyerSidebar userName={userName} />
      </Box>
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          marginLeft: "300px",
          width: "calc(100% - 300px)",
          minHeight: "100vh",
          bgcolor: "#f9f9f9",
          flexGrow: 1,
          px: 2
        }}
      >
        {/* Add the notification component */}
        <RefundNotification />
        
        {/* Main content */}
        <Container sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default BuyerLayout;