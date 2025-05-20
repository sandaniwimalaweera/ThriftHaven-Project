// pages/seller-orders.js
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from "@mui/material";
import { 
  LocalShipping, 
  CheckCircle, 
  Pending, 
  Cancel, 
  LocalMall,
  Refresh,
  ReceiptLong,
  Search,
  FilterList,
  Update
} from "@mui/icons-material";
import SellerSidebar from "../../components/seller-page-sidebar";
import OrderDetailsDialog from "../../components/OrderDetailsDialog";



const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sellerInfo, setSellerInfo] = useState({ name: "Seller", id: "" });
  const [orderMetrics, setOrderMetrics] = useState({
    total: 0,
    received: 0,
    processing: 0,
    shipped: 0
  });
  // State for status update functionality
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
const [selectedOrderId, setSelectedOrderId] = useState(null);

  
  const router = useRouter();

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Check if token is valid
    if (token === "undefined" || token === "null" || token.length < 10) {
      localStorage.removeItem("token");
      router.push("/auth/login");
      return;
    }

    // If token looks valid, fetch data
    fetchSellerInfo();
    fetchSellerOrders();
  }, [router, statusFilter, dateFilter, tabValue]);

  const fetchSellerInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token || token === "undefined" || token === "null") {
        return;
      }
      
      console.log("Fetching seller info with token");
      
      // Let's try both formats to see which one works
      // First try: Just the token without Bearer prefix
      const response = await axios.get("http://localhost:5000/api/users/details", {
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Seller info response:", response.data);
      
      // Get the user data
      const { name, id, email, contact } = response.data;
      
      setSellerInfo({
        name: name || "Seller",
        id: id || ""
      });
    } catch (error) {
      console.error("Error fetching seller info:", error);
      console.log("Error status:", error.response?.status);
      console.log("Error data:", error.response?.data);
      
      // Use default values from localStorage as fallback
      setSellerInfo({
        name: localStorage.getItem("userName") || "Seller",
        id: localStorage.getItem("userId") || ""
      });
    }
  };

  const fetchSellerOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get("http://localhost:5000/api/orders/seller/my-orders", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      const allOrders = response.data;
      
      // Calculate metrics with separate counts for shipped, processing, and received
      const metrics = {
        total: allOrders.length,
        received: allOrders.filter(order => order.status.toLowerCase() === 'received').length,
        processing: allOrders.filter(order => ['processing', 'pending'].includes(order.status.toLowerCase())).length,
        shipped: allOrders.filter(order => order.status.toLowerCase() === 'shipped').length
      };
      
      setOrderMetrics(metrics);
      
      // Filter orders based on tab and filters
      let filteredOrders = [...allOrders];
      
      // Apply tab filters
      if (tabValue === 1) { // Processing
        filteredOrders = filteredOrders.filter(order => 
          ['processing', 'pending'].includes(order.status.toLowerCase())
        );
      } else if (tabValue === 2) { // Shipped
        filteredOrders = filteredOrders.filter(order => 
          order.status.toLowerCase() === 'shipped'
        );
      } else if (tabValue === 3) { // Received
        filteredOrders = filteredOrders.filter(order => 
          order.status.toLowerCase() === 'received'
        );
      }
      
      // Apply status filter if selected
      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => 
          order.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Apply date filter if selected
      if (dateFilter) {
        const today = new Date();
        let filterDate = new Date();
        
        switch(dateFilter) {
          case "today":
            // Already set to today
            break;
          case "yesterday":
            filterDate.setDate(today.getDate() - 1);
            break;
          case "week":
            filterDate.setDate(today.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(today.getMonth() - 1);
            break;
          default:
            filterDate = null;
            break;
        }
        
        if (filterDate) {
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= filterDate;
          });
        }
      }
      
      // Sort orders by date (newest first)
      filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      
      if (error.response && error.response.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        router.push("/auth/login");
      } else {
        setError("Failed to load orders. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle opening status update dialog
  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status.toLowerCase());
    setStatusDialogOpen(true);
  };

  // Function to handle closing status update dialog
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  // Function to handle status update
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setStatusUpdateLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Make API call to update order status
      await axios.put(`http://localhost:5000/api/orders/${selectedOrder.order_id}/status`, 
        { status: newStatus },
        { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
          }
        }
      );
      
      // Close dialog
      handleCloseStatusDialog();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Order #${selectedOrder.order_id} status updated to ${newStatus}`,
        severity: "success"
      });
      
      // Refresh orders
      fetchSellerOrders();
      
    } catch (error) {
      console.error("Error updating order status:", error);
      
      setSnackbar({
        open: true,
        message: `Failed to update status: ${error.response?.data?.message || error.message}`,
        severity: "error"
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Helper function to determine if status update is allowed for an order
  const canUpdateStatus = (status) => {
    const lowerStatus = status.toLowerCase();
    // Prevent updating if already received
    return lowerStatus !== "received";
  };

  const handleRefresh = () => {
    fetchSellerOrders();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChipColor = (status) => {
    switch(status.toLowerCase()) {
      case 'received':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'shipped':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'received':
        return <CheckCircle fontSize="small" />;
      case 'processing':
      case 'pending':
        return <Pending fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      default:
        return <LocalMall fontSize="small" />;
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
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };


  const handleOpenDetailsDialog = (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsDialogOpen(true);
  };
  
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedOrderId(null);
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

      <Container sx={{ flexGrow: 1, p: 3, maxWidth: "xl" }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" color="#611964">
              My Orders
            </Typography>
            
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Order Summary Cards */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#611964">
                    {orderMetrics.total}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Processing
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#FFA000">
                    {orderMetrics.processing}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipped
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#2196F3">
                    {orderMetrics.shipped}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: "#f0ebf4", p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Received
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                    {orderMetrics.received}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          {/* Filters */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="received">Received</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="date-filter-label">Time Period</InputLabel>
              <Select
                labelId="date-filter-label"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Time Period"
              >
                <MenuItem value="">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              startIcon={<FilterList />} 
              size="small"
              onClick={() => {
                setStatusFilter("");
                setDateFilter("");
              }}
              sx={{ 
                bgcolor: "#611964", 
                '&:hover': { bgcolor: "#4a1154" },
                height: "40px"
              }}
            >
              Clear Filters
            </Button>
          </Box>
          
          {/* Tabs for order status filtering */}
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
              <Tab label="All Orders" />
              <Tab label="Processing" />
              <Tab label="Shipped" />
              <Tab label="Received" />
            </Tabs>
          </Box>
          
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 5 }}>
              <CircularProgress sx={{ color: "#611964" }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
              {error.includes("session") || error.includes("log in") ? (
                <Button 
                  variant="contained"
                  onClick={() => router.push("/auth/login")}
                  sx={{ mt: 2, bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
                >
                  Log In Again
                </Button>
              ) : (
                <Button 
                  variant="outlined"
                  onClick={handleRefresh}
                  sx={{ mt: 2, color: "#611964", borderColor: "#611964" }}
                >
                  Try Again
                </Button>
              )}
            </Alert>
          ) : orders.length > 0 ? (
            <Grid container spacing={2}>
              {orders.map((order) => (
                <Grid item xs={12} key={order.order_id}>
                  <Card 
                    sx={{ 
                      bgcolor: "white", 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      '&:hover': {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        p: 2,
                        bgcolor: "#f7f5f9",
                        borderBottom: "1px solid #eeeeee"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box 
                          sx={{ 
                            display: "flex", 
                            justifyContent: "center", 
                            alignItems: "center",
                            bgcolor: "#611964",
                            color: "white",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            mr: 2
                          }}
                        >
                          <ReceiptLong />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            Order {order.order_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Placed: {formatDate(order.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          icon={getStatusIcon(order.status)}
                          label={order.status} 
                          color={getStatusChipColor(order.status)}
                          variant="outlined"
                          size="medium"
                        />
                        
                        {/* Update Status Button - only show for eligible orders */}
                        {canUpdateStatus(order.status) && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Update />}
                            onClick={() => handleOpenStatusDialog(order)}
                            sx={{ 
                              bgcolor: "#611964", 
                              '&:hover': { bgcolor: "#4a1154" }
                            }}
                          >
                            Update Status
                          </Button>
                        )}
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight="medium" color="#611964" gutterBottom>
                            {order.product_name}
                          </Typography>
                          
                          <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Quantity</Typography>
                              <Typography variant="body1" fontWeight="medium">{order.quantity}</Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="caption" color="text.secondary">Unit Price</Typography>
                              <Typography variant="body1" fontWeight="medium">{formatCurrency(order.price)}</Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="caption" color="text.secondary">Total</Typography>
                              <Typography variant="body1" fontWeight="medium">{formatCurrency(order.price * order.quantity)}</Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                            <Chip 
                              size="small" 
                              label={order.payment_status || "Unknown"} 
                              color={order.payment_status?.toLowerCase() === 'paid' ? 'success' : 'warning'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Shipping Details
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {order.address}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Contact: {order.phone}
                          </Typography>
                          
                          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    
  <Button 
    variant="outlined" 
    onClick={() => handleOpenDetailsDialog(order.order_id)}
    size="small"
    sx={{ 
      color: "#611964", 
      borderColor: "#611964", 
      "&:hover": { borderColor: "#4a1154", bgcolor: "#f0ebf4" }
    }}
  >
    View Details
  </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {statusFilter || dateFilter || tabValue > 0 ? 
                  "Try changing your filters to see more results." : 
                  "Once you start receiving orders, they will appear here."}
              </Typography>
              
              {(statusFilter || dateFilter || tabValue > 0) && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setStatusFilter("");
                    setDateFilter("");
                    setTabValue(0);
                  }}
                  sx={{ bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
                >
                  Clear All Filters
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Container>
</Box>
  

{/* Order Details Dialog */}
<OrderDetailsDialog 
  open={detailsDialogOpen}
  handleClose={handleCloseDetailsDialog}
  orderId={selectedOrderId}
/>
    


      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={handleCloseStatusDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Update Order Status
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1, pb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status: <Chip 
                label={selectedOrder?.status || ""} 
                color={getStatusChipColor(selectedOrder?.status || "")} 
                size="small"
              />
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="new-status-label">New Status</InputLabel>
              <Select
                labelId="new-status-label"
                id="new-status-select"
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
              </Select>
            </FormControl>
            
            {newStatus === "shipped" && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Order will be marked as shipped</AlertTitle>
                Please ensure that you have prepared the package and it's ready for delivery.
              </Alert>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseStatusDialog}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={statusUpdateLoading || !newStatus || newStatus === selectedOrder?.status?.toLowerCase()}
            startIcon={statusUpdateLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: "#611964", '&:hover': { bgcolor: "#4a1154" } }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>

    
  );
  
};

export default SellerOrders;