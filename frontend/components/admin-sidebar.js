import React, { useState, useEffect } from "react";
import {
  Box, Drawer, Typography, Avatar, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Button
} from "@mui/material";
import {
  AccountCircle, ShoppingBag, Redeem, Lock, Message,
  Logout, Menu, AssignmentReturn, Star
} from "@mui/icons-material";
import StarIcon from "@mui/icons-material/Star";
import Dashboard from "@mui/icons-material/Dashboard";
import { useRouter } from "next/router";

const AdminSidebar = ({ username }) => {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");

  const toggleDrawer = () => setIsMobileOpen(!isMobileOpen);

  const menuItems = [
    { label: "Dashboard", icon: <Dashboard />, path: "/auth/admin-dashboard", key: "dashboard" },
    { label: "Sellers Details", icon: <AccountCircle />, path: "/auth/seller-detail", key: "sellers" },
    { label: "Buyers Details", icon: <AccountCircle />, path: "/auth/buyer-detail", key: "buyers" },
    { label: "Products Details", icon: <ShoppingBag  />, path: "/auth/product-detail", key: "products" },
    { label: "Donations Details", icon: <Redeem />, path: "/auth/approveddonation", key: "donations" },
    { label: "Messages", icon: <Message />, path: "/auth/AdminMessagingPage", key: "messages" },
    { label: "Change Password", icon: <Lock />, path: "/auth/admin-pc", key: "password" },
    { label: "Sales Details", icon: <ShoppingBag />, path: "/auth/admin-sales-details", key: "sales" },
    { label: "Refund Details", icon: <AssignmentReturn />, path: "/auth/admin-refund", key: "refunds" },
    { label: "Review Details", icon: <StarIcon />, path: "/auth/admin-review", key: "reviews" }
  ];

  useEffect(() => {
    const currentPath = router.pathname;
    const currentItem = menuItems.find(item => currentPath.includes(item.path.split("/auth/")[1]));
    if (currentItem) setActiveItem(currentItem.key);
  }, [router.pathname]);

  const handleNav = (path, key) => {
    setActiveItem(key);
    router.push(path);
    setIsMobileOpen(false);
  };

  const getItemStyle = (key) => ({
    bgcolor: activeItem === key ? "#7A3182" : "transparent",
    '&:hover': {
      bgcolor: "#7A3182",
      transition: "background-color 0.3s"
    }
  });

  const drawerContent = (
    <Box sx={{ bgcolor: "#611964", color: "white", height: "100%", p: 2 }}>
      <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: "white", color: "#611964" }}>
          <AccountCircle fontSize="large" />
        </Avatar>
        <Typography variant="h6" fontWeight="bold" mt={1}>
          {username}
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.key}
            sx={getItemStyle(item.key)}
            onClick={() => handleNav(item.path, item.key)}
          >
            <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Button
        startIcon={<Logout />}
        fullWidth
        sx={{
          color: "white",
          justifyContent: "flex-start",
          mt: 3,
          '&:hover': {
            bgcolor: "#7A3182",
            transition: "background-color 0.3s"
          }
        }}
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/auth/admin-login");
        }}
      >
        Log out
      </Button>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <IconButton
        onClick={toggleDrawer}
        sx={{ display: { xs: "block", md: "none" }, position: "absolute", top: 16, left: 16, zIndex: 1300 }}
      >
        <Menu sx={{ color: "#611964" }} />
      </IconButton>

      {/* Mobile Drawer */}
      <Drawer
        open={isMobileOpen}
        onClose={toggleDrawer}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { width: 280 } }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        sx={{
          width: 330,
          bgcolor: "#611964",
          color: "white",
          p: 2,
          height: "100vh",
          display: { xs: "none", md: "flex" },
          flexDirection: "column"
        }}
      >
        {drawerContent}
      </Box>
    </>
  );
};

export default AdminSidebar;