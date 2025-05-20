// frontend/pages/auth/change-password.js
import React from "react";
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent 
} from "@mui/material";
import SellerSidebar from "../../components/seller-sidebar";

export default function ChangePasswordPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement password change logic here (e.g., API call)
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Seller Sidebar */}
      <SellerSidebar userName="Kevin Nick" />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f3f3f3 0%, #e9e9e9 100%)",
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" align="center" sx={{ mb: 3, color: "#611964", fontWeight: "bold" }}>
                Change Password
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  sx={{
                    bgcolor: "#611964",
                    color: "#fff",
                    py: 1.5,
                    fontWeight: "bold",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#4a124b" },
                  }}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
