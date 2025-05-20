// pages/seller-refund-requests.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Stack,
  LinearProgress,
  Avatar,
  Badge
} from "@mui/material";
import { 
  MoneyOff, 
  RefreshRounded, 
  InfoOutlined, 
  AssignmentReturn,
  ReceiptLong,
  ErrorOutline,
  ArrowBack
} from "@mui/icons-material";
import SellerSidebar from "../../components/seller-sidebar"; 

const SellerRefundRequests = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerInfo, setSellerInfo] = useState({ name: "Seller", id: "" });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [tabValue, setTabValue] = useState(0);
  // Add this state variable with your other useState declarations
const [loadingAcceptRefund, setLoadingAcceptRefund] = useState({});
  const [loadingOrderDetails, setLoadingOrderDetails] = useState({});
  
  const router = useRouter();

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    fetchSellerInfo();
    fetchSellerRefunds();
  }, [router, tabValue]);

  const fetchSellerInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) return;
      
      const response = await axios.get("http://localhost:5000/api/users/details", {
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json"
        }
      });
      
      // Get the user data
      const { name, id } = response.data;
      
      setSellerInfo({
        name: name || "Seller",
        id: id || ""
      });
    } catch (error) {
      console.error("Error fetching seller info:", error);
      
      // Use default values from localStorage as fallback
      setSellerInfo({
        name: localStorage.getItem("userName") || "Seller",
        id: localStorage.getItem("userId") || ""
      });
    }
  };



  // Add this fetchSellerRefunds function to your SellerRefundRequests component
// It should be placed after the fetchSellerInfo function and before handleAcceptRefund

const fetchSellerRefunds = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const token = localStorage.getItem("token");
    
    const response = await axios.get("http://localhost:5000/api/orders/seller/refund-requests", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });
    
    const allRefunds = response.data;
    
    // Calculate statistics
    const statsData = {
      total: allRefunds.length,
      pending: allRefunds.filter(r => r.refund_status?.toLowerCase() === 'pending').length,
      approved: allRefunds.filter(r => r.refund_status?.toLowerCase() === 'approved').length,
      rejected: allRefunds.filter(r => r.refund_status?.toLowerCase() === 'rejected').length
    };
    
    setStats(statsData);
    
    // Filter refunds based on active tab
    let filteredRefunds = [...allRefunds];
    
    if (tabValue === 1) { // Pending
      filteredRefunds = filteredRefunds.filter(r => 
        r.refund_status?.toLowerCase() === 'pending'
      );
    } else if (tabValue === 2) { // Approved
      filteredRefunds = filteredRefunds.filter(r => 
        r.refund_status?.toLowerCase() === 'approved'
      );
    } else if (tabValue === 3) { // Rejected
      filteredRefunds = filteredRefunds.filter(r => 
        r.refund_status?.toLowerCase() === 'rejected'
      );
    }
    
    // Sort by requested date (newest first)
    filteredRefunds.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
    
    setRefunds(filteredRefunds);
  } catch (error) {
    console.error("Error fetching seller refund requests:", error);
    setError("Failed to load refund requests. Please try again.");
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      router.push("/auth/login");
    }
  } finally {
    setLoading(false);
  }
};


 // Updated handleAcceptRefund function with error handling
const handleAcceptRefund = async (refundId) => {
  setLoadingAcceptRefund(prev => ({ ...prev, [refundId]: true }));
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("You need to be logged in to accept refunds. Please log in again.");
      return;
    }
    
    // Find the refund in our state to display better messages
    const refund = refunds.find(r => r.refund_id == refundId) || {};
    
    // Make the API call
    const response = await axios.put(
      `http://localhost:5000/api/orders/seller/accept-refund/${refundId}`,
      {}, // Empty body
      {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      }
    );
    
    if (response.status === 200) {
      // Success! Show a nice message
      alert(`Refund for ${refund.product_name || 'product'} has been successfully processed.`);
      
      // Refresh the data
      fetchSellerRefunds();
    }
  } catch (error) {
    console.error("Error accepting refund:", error);
    
    // Get any available error message
    let errorMessage = "Failed to accept refund. Please try again.";
    
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error;
    }
    
    alert(errorMessage);
  } finally {
    setLoadingAcceptRefund(prev => ({ ...prev, [refundId]: false }));
  }
};

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchSellerRefunds();
  };

  const handleViewOrderDetails = async (orderId) => {
    // Set loading state for this specific button
    setLoadingOrderDetails(prev => ({ ...prev, [orderId]: true }));
    
    try {
      // Navigate to the order details page
      router.push(`/seller/order-details/${orderId}`);
      
    } catch (error) {
      console.error("Error navigating to order details:", error);
    } finally {
      // Clear loading state after a short delay (for better UX)
      setTimeout(() => {
        setLoadingOrderDetails(prev => ({ ...prev, [orderId]: false }));
      }, 1000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "LKR 0.00";
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getRefundStatusChip = (status) => {
    if (!status) return <Chip label="Unknown" />;
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'pending') {
      return <Chip color="warning" variant="outlined" icon={<InfoOutlined />} label="Pending" />;
    } else if (statusLower === 'approved') {
      return <Chip color="success" variant="outlined" icon={<AssignmentReturn />} label="Approved" />;
    } else if (statusLower === 'rejected') {
      return <Chip color="error" variant="outlined" icon={<ErrorOutline />} label="Rejected" />;
    } else {
      return <Chip label={status} />;
    }
  };



  
  const getReasonChip = (reason) => {
    if (!reason) return null;
    
    // Convert reason format: replace underscores with spaces and capitalize
    const formattedReason = reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return <Chip 
      size="small" 
      label={formattedReason}
      variant="outlined"
      sx={{ 
        borderColor: '#9e9e9e', 
        color: 'text.primary',
        textTransform: 'none' 
      }} 
    />;
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar - Fixed position with full viewport height */}
      <Box sx={{ 
        width: "280px", 
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh", // Full viewport height
        zIndex: 1000, // Higher z-index to ensure it stays above content
        bgcolor: "background.paper", // Match your sidebar background
        borderRight: "1px solid",
        borderColor: "divider"
      }}>
        <SellerSidebar userName={sellerInfo.name} />
      </Box>
      
      {/* Main Content - Add left margin to account for fixed sidebar with extra spacing */}
      <Box 
        component="main" 
        sx={{ 
          marginLeft: "300px", // Added extra 20px spacing between sidebar and content
          width: "calc(100% - 300px)",
          minHeight: "100vh",
          bgcolor: "#f9f9f9",
          flexGrow: 1,
          px: 2 // Add horizontal padding
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 4 } }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h4" fontWeight="bold" color="#611964">
                  Refund Requests
                </Typography>
              </Box>
              
              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} color="primary">
                  <RefreshRounded />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Refund Stats Cards */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#611964">
                      {stats.total}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#ED6C02">
                      {stats.pending}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#2E7D32">
                      {stats.approved}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#D32F2F">
                      {stats.rejected}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
            
            {/* Tabs for status filtering */}
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
                sx={{ 
                  '& .MuiTab-root': { fontWeight: 'medium' },
                  '& .Mui-selected': { color: '#611964' },
                  '& .MuiTabs-indicator': { backgroundColor: '#611964' }
                }}
              >
                <Tab label="All Requests" />
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
              </Tabs>
            </Box>
            
            {loading ? (
              <Box sx={{ width: '100%', mt: 4, mb: 4 }}>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  Loading refund requests...
                </Typography>
                <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Error</AlertTitle>
                {error}
                <Button 
                  variant="outlined"
                  onClick={handleRefresh}
                  sx={{ mt: 2, color: "#611964", borderColor: "#611964" }}
                >
                  Try Again
                </Button>
              </Alert>
            ) : refunds.length > 0 ? (
              <Grid container spacing={3}>
                {refunds.map((refund) => (
                  <Grid item xs={12} sm={6} md={4} key={refund.refund_id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: "white", 
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
                        borderRadius: 2,
                        overflow: "hidden",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        '&:hover': {
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                        },
                        borderTop: '4px solid',
                        borderColor: 
                          refund.refund_status?.toLowerCase() === 'pending' ? '#ED6C02' :
                          refund.refund_status?.toLowerCase() === 'approved' ? '#2E7D32' :
                          refund.refund_status?.toLowerCase() === 'rejected' ? '#D32F2F' : 
                          '#9e9e9e'
                      }}
                    >
                      <Box sx={{ p: 2, bgcolor: "#f7f5f9", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#611964', width: 36, height: 36, mr: 1.5 }}>
                            <MoneyOff fontSize="small" />
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight="600">
                            Refund {refund.refund_id}
                          </Typography>
                        </Box>
                        {getRefundStatusChip(refund.refund_status)}
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium" color="#611964" gutterBottom>
                          {refund.product_name}
                        </Typography>
                        
                        <Box sx={{ mt: 1.5, mb: 2.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Order Details
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2">Order ID:</Typography>
                            <Typography variant="body2" fontWeight="medium">#{refund.order_id}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2">Quantity:</Typography>
                            <Typography variant="body2" fontWeight="medium">{refund.quantity}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2">Unit Price:</Typography>
                            <Typography variant="body2" fontWeight="medium">{formatCurrency(refund.price)}</Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Refund Amount
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="#611964">
                            {formatCurrency(refund.amount)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Reason
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            {getReasonChip(refund.reason)}
                          </Box>
                          {refund.description && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                              "{refund.description}"
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ mt: 'auto', pt: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Requested on {formatDate(refund.requested_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      
<Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
  {/* Show Accept Refund button only for approved refunds */}
  {refund.refund_status?.toLowerCase() === 'approved' && (
    <Button 
      variant="contained"
      fullWidth
      startIcon={loadingAcceptRefund[refund.refund_id] ? <CircularProgress size={16} color="inherit" /> : <AssignmentReturn />}
      onClick={() => handleAcceptRefund(refund.refund_id)}
      disabled={loadingAcceptRefund[refund.refund_id]}
      sx={{ 
        bgcolor: "#2E7D32", 
        "&:hover": { bgcolor: "#1b5e20" },
        position: "relative",
        overflow: "hidden",
        mb: 1
      }}
    >
      {loadingAcceptRefund[refund.refund_id] ? "Processing..." : "Accept Refund"}
      {loadingAcceptRefund[refund.refund_id] && (
        <Box 
          sx={{ 
            position: "absolute", 
            bottom: 0, 
            left: 0, 
            height: 2, 
            bgcolor: "#fff", 
            animation: "progressAnimation 1s infinite linear",
            "@keyframes progressAnimation": {
              "0%": { width: 0, opacity: 0.7 },
              "50%": { width: "50%", opacity: 1 },
              "100%": { width: "100%", opacity: 0.7 }
            }
          }} 
        />
      )}
    </Button>
  )}
  
  <Button 
    variant="outlined" 
    fullWidth
    startIcon={loadingOrderDetails[refund.order_id] ? <CircularProgress size={16} color="inherit" /> : <ReceiptLong />}
    onClick={() => handleViewOrderDetails(refund.order_id)}
    disabled={loadingOrderDetails[refund.order_id]}
    sx={{ 
      color: "#611964", 
      borderColor: "#611964", 
      "&:hover": { borderColor: "#4a1154", bgcolor: "#f0ebf4" },
      position: "relative",
      overflow: "hidden"
    }}
  >
    {loadingOrderDetails[refund.order_id] ? "Loading..." : "View Order Details"}
    {loadingOrderDetails[refund.order_id] && (
      <Box 
        sx={{ 
          position: "absolute", 
          bottom: 0, 
          left: 0, 
          height: 2, 
          bgcolor: "#611964", 
          animation: "progressAnimation 1s infinite linear",
          "@keyframes progressAnimation": {
            "0%": { width: 0, opacity: 0.7 },
            "50%": { width: "50%", opacity: 1 },
            "100%": { width: "100%", opacity: 0.7 }
          }
        }} 
      />
    )}
  </Button>
</Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 8,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px dashed #ddd'
              }}>
                <Box 
                  sx={{ 
                    width: 70, 
                    height: 70, 
                    borderRadius: '50%', 
                    bgcolor: '#f0ebf4', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <MoneyOff sx={{ fontSize: 40, color: '#9575cd' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No refund requests found
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
                  {tabValue > 0 ? 
                    "There are no refund requests with the selected status filter." : 
                    "When customers request refunds for their orders, they will appear here."}
                </Typography>
                
                {tabValue > 0 && (
                  <Button
                    variant="contained"
                    onClick={() => setTabValue(0)}
                    sx={{ bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
                  >
                    View All Requests
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default SellerRefundRequests;