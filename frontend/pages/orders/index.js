// frontend/pages/orders/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid as MuiGrid,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Collapse,
  useMediaQuery,
  Drawer,
  Badge,
  Avatar,
  Tooltip,
  Skeleton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { format } from "date-fns";
import BuyerSidebar from "../../components/buyer-page-sidebar";

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "paid":
    case "succeeded":
    case "completed":
    case "received":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "failed":
    case "refund_requested":
    case "refunded":
    case "cancelled":
      return "error";
    case "shipped":
      return "info";
    default:
      return "default";
  }
};

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case "paid":
    case "succeeded":
      return <PaymentIcon fontSize="small" />;
    case "processing":
      return <InventoryIcon fontSize="small" />;
    case "shipped":
      return <LocalShippingIcon fontSize="small" />;
    case "completed":
    case "received":
      return <CheckCircleIcon fontSize="small" />;
    case "cancelled":
      return <CancelIcon fontSize="small" />;
    default:
      return null;
  }
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2);
};

// Helper function to get the dominant status from items
const getDominantStatus = (items) => {
  if (!items || items.length === 0) return "pending";
  
  // Priority: shipped > processing > completed > paid > others
  if (items.some(item => item.status === "shipped")) return "shipped";
  if (items.some(item => item.status === "processing")) return "processing";
  if (items.some(item => item.status === "completed")) return "completed";
  if (items.some(item => item.status === "paid")) return "paid";
  
  // Default to the first item's status
  return items[0].status;
};

// NEW: Function to get friendly status text
const getFriendlyStatusText = (status) => {
  switch (status) {
    case "paid":
    case "succeeded":
      return "Payment Complete";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "completed":
    case "received":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "refund_requested":
      return "Refund Requested";
    case "refunded":
      return "Refunded";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const isMobile = useMediaQuery("(max-width:600px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Refund modal states
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundDescription, setRefundDescription] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Order received confirmation modal states
  const [confirmReceivedModalOpen, setConfirmReceivedModalOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Alert notification states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/users/details", {
          headers: { Authorization: token },
        });
        setUserName(response.data.name);
      } catch (error) {
        console.error("Error fetching user details:", error.response?.data || error.message);
      }
    };
    fetchUserDetails();
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/auth/login?redirect=/orders");
          return;
        }

        const [ordersResponse, countResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/orders/my-orders", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("http://localhost:5000/api/orders/total-count", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setOrders(ordersResponse.data);
        setTotalOrders(countResponse.data.totalOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load your orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const handleViewPayment = (paymentId) => {
    router.push(`/orders/payment/${paymentId}`);
  };

  const handleRequestRefund = (order) => {
    setSelectedOrder(order);
    setRefundModalOpen(true);
  };

  const handleCloseRefundModal = () => {
    setRefundModalOpen(false);
    setRefundReason("");
    setRefundDescription("");
    setSelectedOrder(null);
  };

  const handleConfirmReceived = (order) => {
    setOrderToConfirm(order);
    setConfirmReceivedModalOpen(true);
  };

  const handleCloseConfirmReceivedModal = () => {
    setConfirmReceivedModalOpen(false);
    setOrderToConfirm(null);
  };

  const showAlert = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);

    setTimeout(() => {
      setAlertOpen(false);
    }, 6000);
  };

  const handleSubmitReceived = async () => {
    setConfirmSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/orders/confirm-received",
        {
          paymentId: orderToConfirm.payment_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders state to reflect the new status
      const updatedOrders = orders.map(order => {
        if (order.payment_id === orderToConfirm.payment_id) {
          // Update order items to "received" status
          const updatedItems = order.items.map(item => {
            if (item.status === "shipped") {
              return { ...item, status: "received" };
            }
            return item;
          });
          
          return {
            ...order,
            items: updatedItems
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      showAlert("Order has been marked as received. Thank you!");
      handleCloseConfirmReceivedModal();
    } catch (err) {
      console.error("Error confirming order receipt:", err);
      showAlert("Failed to confirm order receipt. Please try again.", "error");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleSubmitRefund = async () => {
    if (!refundReason) {
      showAlert("Please select a reason for refund", "error");
      return;
    }

    setRefundSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/orders/refund-request",
        {
          paymentId: selectedOrder.payment_id,
          reason: refundReason,
          description: refundDescription
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedOrders = orders.map(order => {
        if (order.payment_id === selectedOrder.payment_id) {
          return {
            ...order,
            payment_status: "refund_requested"
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      showAlert("Refund request submitted successfully");
      handleCloseRefundModal();
    } catch (err) {
      console.error("Error submitting refund request:", err);
      showAlert("Failed to submit refund request. Please try again.", "error");
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Function to count items with specific status
  const countItemsWithStatus = (items, status) => {
    return items.filter(item => item.status === status).length;
  };

  // Function to check if order has shippable items
  const hasShippedItems = (items) => {
    return items.some(item => item.status === "shipped");
  };

  // Function to render order status timeline
  const renderOrderTimeline = (order) => {
    const hasProcessing = order.items.some(item => item.status === "processing");
    const hasShipped = order.items.some(item => item.status === "shipped");
    const hasReceived = order.items.some(item => item.status === "received" || item.status === "completed");
    const hasPaid = order.payment_status === "succeeded" || order.payment_status === "paid";
    
    return (
      <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1, px: 2 }}>
        {/* Payment Step */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: hasPaid ? "#4caf50" : "grey.300",
              mb: 1
            }}
          >
            <PaymentIcon fontSize="small" />
          </Avatar>
          <Typography variant="caption" color={hasPaid ? "text.primary" : "text.secondary"}>
            Paid
          </Typography>
        </Box>
        
        {/* Connector */}
        <Box sx={{ 
          flex: 1, 
          height: 4, 
          bgcolor: hasProcessing ? "#4caf50" : "grey.300", 
          mx: 1 
        }} />
        
        {/* Processing Step */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: hasProcessing ? "#ff9800" : "grey.300",
              mb: 1
            }}
          >
            <InventoryIcon fontSize="small" />
          </Avatar>
          <Typography variant="caption" color={hasProcessing ? "text.primary" : "text.secondary"}>
            Processing
          </Typography>
        </Box>
        
        {/* Connector */}
        <Box sx={{ 
          flex: 1, 
          height: 4, 
          bgcolor: hasShipped ? "#ff9800" : "grey.300", 
          mx: 1 
        }} />
        
        {/* Shipped Step */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: hasShipped ? "#2196f3" : "grey.300",
              mb: 1
            }}
          >
            <LocalShippingIcon fontSize="small" />
          </Avatar>
          <Typography variant="caption" color={hasShipped ? "text.primary" : "text.secondary"}>
            Shipped
          </Typography>
        </Box>
        
        {/* Connector */}
        <Box sx={{ 
          flex: 1, 
          height: 4, 
          bgcolor: hasReceived ? "#2196f3" : "grey.300", 
          mx: 1 
        }} />
        
        {/* Delivered Step */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: hasReceived ? "#4caf50" : "grey.300",
              mb: 1
            }}
          >
            <CheckCircleIcon fontSize="small" />
          </Avatar>
          <Typography variant="caption" color={hasReceived ? "text.primary" : "text.secondary"}>
            Delivered
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Sidebar for desktop */}
      {!isSmallScreen && (
        <Box sx={{ 
          width: 280, 
          flexShrink: 0,
          position: "fixed",
          zIndex: 1,
          height: "100vh",
          overflowY: "auto",
          bgcolor: "#fff",
          boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.05)"
        }}>
          <BuyerSidebar userName={userName} />
        </Box>
      )}

      {/* Mobile drawer */}
      {isSmallScreen && (
        <>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ 
              position: "fixed", 
              top: 10, 
              left: 10, 
              color: "#611964",
              bgcolor: "white",
              boxShadow: 2,
              zIndex: 1200,
              "&:hover": { bgcolor: "#f5f5f5" }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <Box sx={{ width: 280 }}>
              <BuyerSidebar userName={userName} />
            </Box>
          </Drawer>
        </>
      )}
      
      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        ml: isSmallScreen ? 0 : '280px', 
        pl: isSmallScreen ? 0 : 3, // Add left padding when sidebar is visible
        width: isSmallScreen ? '100%' : 'calc(100% - 280px)',
        minHeight: '100vh',
        pb: 8
      }}>
        <Collapse in={alertOpen}>
          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              width: { xs: "90%", sm: "60%", md: "40%" },
              mx: "auto"
            }}
          >
            <Alert
              severity={alertSeverity}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setAlertOpen(false)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                width: "100%",
                borderRadius: "8px"
              }}
            >
              {alertMessage}
            </Alert>
          </Box>
        </Collapse>

        {/* Header */}
        <Box
          sx={{
            bgcolor: "white",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            py: 2,
            px: { xs: 2, sm: 3, md: 4 },
            top: 0,
            zIndex: 10,
            flexGrow: 1, 
           // ml: isSmallScreen ? 0 : '280px',  // This sets left margin
          }}
        >
          <Container maxWidth="lg">
            <MuiGrid container alignItems="center" spacing={5}>
             
              <MuiGrid item xs>
                <Typography variant="h4" sx={{ color: "#611964", fontWeight: 600 }}>
                  My Orders
                </Typography>
              </MuiGrid>

              <MuiGrid item>
                <Badge badgeContent={totalOrders} color="primary" max={99}>
                  <ShoppingBagIcon color="action" />
                </Badge>
              </MuiGrid>
              
            </MuiGrid>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          {loading ? (
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3].map((skeleton) => (
                <Paper key={skeleton} sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ p: 3, bgcolor: "#f8f9ff" }}>
                    <MuiGrid container spacing={2}>
                      <MuiGrid item xs={12} sm={3}>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="text" width="60%" height={24} />
                      </MuiGrid>
                      <MuiGrid item xs={12} sm={3}>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="text" width="60%" height={24} />
                      </MuiGrid>
                      <MuiGrid item xs={12} sm={3}>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="text" width="50%" height={24} />
                      </MuiGrid>
                      <MuiGrid item xs={12} sm={3} sx={{ textAlign: { sm: "right" } }}>
                        <Skeleton variant="rectangular" width={120} height={36} sx={{ ml: { sm: "auto" } }} />
                      </MuiGrid>
                    </MuiGrid>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={100} />
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                borderRadius: 2, 
                boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.1)" 
              }}
            >
              {error}
            </Alert>
          ) : orders.length === 0 ? (
            <Card 
              sx={{ 
                p: 4, 
                textAlign: "center", 
                mt: 4, 
                borderRadius: 2,
                boxShadow: "0px 3px 15px rgba(0, 0, 0, 0.07)" 
              }}
            >
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <ShoppingBagIcon sx={{ fontSize: 60, color: "#ddd", mb: 2 }} />
                  <Typography variant="h5" sx={{ mb: 1, color: "#555" }}>
                    No Orders Yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    You haven't placed any orders yet. Start shopping to see your orders here.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => router.push("/products")}
                  sx={{ 
                    bgcolor: "#611964", 
                    "&:hover": { bgcolor: "#4a1350" },
                    borderRadius: 28,
                    px: 4,
                    py: 1,
                    textTransform: "none",
                    fontSize: "1rem"
                  }}
                >
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {/* Order statistics */}
              <Paper 
                sx={{ 
                  borderRadius: 2, 
                  boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.06)",
                  mb: 4,
                  overflow: "hidden",
                  bgcolor: "#fff"
                }}
              >
                <Box sx={{ p: 3, borderBottom: "1px solid #f0f0f0" }}>
                  <Typography variant="h6" fontWeight={600}>
                    Order Summary
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <MuiGrid container spacing={2}>
                    <MuiGrid item xs={6} sm={3}>
                      <Card sx={{ 
                        p: 2, 
                        bgcolor: "#f0ebf4", 
                        textAlign: "center",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Typography variant="h4" color="#2e7d32" fontWeight={600}>
                          {totalOrders}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Orders
                        </Typography>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={6} sm={3}>
                      <Card sx={{ 
                        p: 2, 
                        bgcolor: "#f0ebf4", 
                        textAlign: "center",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Typography variant="h4" color="#e65100" fontWeight={600}>
                          {orders.filter(order => order.items.some(item => item.status === "processing")).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Processing
                        </Typography>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={6} sm={3}>
                      <Card sx={{ 
                        p: 2, 
                        bgcolor: "#f0ebf4", 
                        textAlign: "center",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Typography variant="h4" color="#0277bd" fontWeight={600}>
                          {orders.filter(order => order.items.some(item => item.status === "shipped")).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Shipped
                        </Typography>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={6} sm={3}>
                      <Card sx={{ 
                        p: 2, 
                        bgcolor: "#f0ebf4", 
                        textAlign: "center",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Typography variant="h4" color="#388e3c" fontWeight={600}>
                          {orders.filter(order => order.items.some(item => item.status === "received" || item.status === "completed")).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Delivered
                        </Typography>
                      </Card>
                    </MuiGrid>
                  </MuiGrid>
                </Box>
              </Paper>

              {/* Order list */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  mt: 4, 
                  color: "#555",
                  fontWeight: 600,
                  pl: 1
                }}
              >
                Order History
              </Typography>

              {orders.map((order) => {
                // Get the dominant status among items
                const dominantStatus = getDominantStatus(order.items);
                const processingItems = countItemsWithStatus(order.items, "processing");
                const shippedItems = countItemsWithStatus(order.items, "shipped");
                const completedItems = countItemsWithStatus(order.items, "completed");
                const receivedItems = countItemsWithStatus(order.items, "received");
                
                // Status color for the order card
                const statusColor = 
                  shippedItems > 0 ? "#2196f3" : 
                  processingItems > 0 ? "#ff9800" : 
                  (completedItems > 0 || receivedItems > 0) ? "#388e3c" : 
                  "#9e9e9e";
                
                return (
                  <Paper 
                    key={order.payment_id} 
                    sx={{ 
                      mb: 4, 
                      overflow: "hidden", 
                      boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.05)",
                      borderRadius: "12px",
                      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.08)"
                      },
                      position: "relative",
                      borderTop: `4px solid ${statusColor}`
                    }}
                  >
                    {/* Order Header */}
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: "#fff",
                      borderBottom: "1px solid #f0f0f0"
                    }}>
                      <MuiGrid container spacing={2} alignItems="center">
                        <MuiGrid item xs={12} sm={4} md={3}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ReceiptIcon sx={{ color: "#611964" }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Order Date
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {format(new Date(order.created_at), "PPP")}
                              </Typography>
                            </Box>
                          </Stack>
                        </MuiGrid>
                        <MuiGrid item xs={12} sm={4} md={3}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PaymentIcon sx={{ color: "#611964" }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Total Amount
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                LKR {formatCurrency(order.total_amount)}
                              </Typography>
                            </Box>
                          </Stack>
                        </MuiGrid>
                        <MuiGrid item xs={12} sm={4} md={3}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {getStatusIcon(order.payment_status) || <InfoOutlinedIcon sx={{ color: "#611964" }} />}
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Payment Status
                              </Typography>
                              <Chip
                                label={getFriendlyStatusText(order.payment_status)}
                                color={getStatusColor(order.payment_status)}
                                size="small"
                                sx={{ fontWeight: "medium" }}
                              />
                            </Box>
                          </Stack>
                        </MuiGrid>
                        <MuiGrid item xs={12} md={3} sx={{ textAlign: { md: "right" } }}>
                          <Stack direction={{ xs: "column", sm: "column" }} spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewPayment(order.payment_id)}
                              startIcon={<InfoOutlinedIcon />}
                              sx={{ 
                                borderRadius: 28,
                                px: 2,
                                borderColor: "#611964",
                                color: "#611964",
                                "&:hover": { 
                                  bgcolor: "rgba(97, 25, 100, 0.04)",
                                  borderColor: "#4a1350" 
                                }
                              }}
                            >
                              View Details
                            </Button>

                            {/* Order Received Button */}
                            {hasShippedItems(order.items) && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleConfirmReceived(order)}
                                startIcon={<CheckCircleIcon />}
                                sx={{ 
                                  borderRadius: 28,
                                  px: 2,
                                  color: "white",
                                  bgcolor: "#2e7d32",
                                  "&:hover": { 
                                    bgcolor: "#1b5e20"
                                  }
                                }}
                              >
                                Confirm Receipt
                              </Button>
                            )}

                            {(order.payment_status === "succeeded" || order.payment_status === "paid") && (
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => handleRequestRefund(order)}
                                sx={{ 
                                  borderRadius: 28,
                                  px: 2
                                }}
                              >
                                Request Refund
                              </Button>
                            )}
                          </Stack>
                        </MuiGrid>
                      </MuiGrid>
                    </Box>

                    {/* Order Timeline - NEW */}
                    {!isMobile && renderOrderTimeline(order)}

                    {/* Order Status Summary */}
                    {(processingItems > 0 || shippedItems > 0 || completedItems > 0 || receivedItems > 0) && (
                      <Box sx={{ p: 2, bgcolor: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                        <MuiGrid container spacing={2} alignItems="center">
                          {processingItems > 0 && (
                            <MuiGrid item>
                              <Chip
                                icon={<InventoryIcon />}
                                label={`${processingItems} ${processingItems === 1 ? 'item' : 'items'} processing`}
                                color="warning"
                                sx={{ fontWeight: "medium" }}
                              />
                            </MuiGrid>
                          )}
                          
                          {shippedItems > 0 && (
                            <MuiGrid item>
                              <Chip
                                icon={<LocalShippingIcon />}
                                label={`${shippedItems} ${shippedItems === 1 ? 'item' : 'items'} shipped`}
                                color="info"
                                sx={{ fontWeight: "medium" }}
                              />
                            </MuiGrid>
                          )}
                          
                          {(completedItems > 0 || receivedItems > 0) && (
                            <MuiGrid item>
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={`${completedItems + receivedItems} ${completedItems + receivedItems === 1 ? 'item' : 'items'} delivered`}
                                color="success"
                                sx={{ fontWeight: "medium" }}
                              />
                            </MuiGrid>
                          )}
                        </MuiGrid>
                      </Box>
                    )}

                    {/* Order Items Accordion */}
                    <Box sx={{ p: 0 }}>
                      <Accordion sx={{ 
                        "&:before": { display: "none" },
                        boxShadow: "none",
                      }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon sx={{ color: "#611964" }} />}
                          sx={{ 
                            "&:hover": { bgcolor: "rgba(97, 25, 100, 0.04)" },
                            transition: "background-color 0.2s"
                          }}
                        >
                          <Typography fontWeight="medium">
                            {order.items.length} {order.items.length === 1 ? "Item" : "Items"} in this order
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer sx={{ borderRadius: 1, overflow: "hidden" }}>
                            <Table>
                              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Price</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Total</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow 
                                    key={item.order_id}
                                    sx={{
                                      backgroundColor: 
                                        item.status === "processing" ? "rgba(255, 191, 0, 0.04)" :
                                        item.status === "shipped" ? "rgba(2, 136, 209, 0.04)" :
                                        (item.status === "received" || item.status === "completed") ? "rgba(46, 125, 50, 0.04)" :
                                        "inherit",
                                      "&:hover": {
                                        backgroundColor: "rgba(0, 0, 0, 0.02)"
                                      }
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: "medium" }}>{item.product_name}</TableCell>
                                    <TableCell align="right">LKR {formatCurrency(item.price)}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "medium" }}>
                                      LKR {formatCurrency(item.price * item.quantity)}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title={getFriendlyStatusText(item.status)}>
                                        <Chip 
                                          icon={getStatusIcon(item.status)} 
                                          label={getFriendlyStatusText(item.status)} 
                                          color={getStatusColor(item.status)} 
                                          size="small" 
                                          sx={{ fontWeight: "medium" }}
                                        />
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>

      {/* Refund Modal */}
      <Modal
        open={refundModalOpen}
        onClose={handleCloseRefundModal}
        aria-labelledby="refund-modal-title"
        aria-describedby="refund-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 500 },
            bgcolor: "background.paper",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            p: { xs: 3, sm: 4 },
            borderRadius: 2
          }}
        >
          <Typography id="refund-modal-title" variant="h6" component="h2" sx={{ mb: 2, color: "#611964", fontWeight: "600" }}>
            Request Refund
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, fontSize: "0.95rem" }}>
            Order Total: <span style={{ fontWeight: "500" }}>LKR {selectedOrder?.total_amount ? formatCurrency(selectedOrder.total_amount) : "0.00"}</span>
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="refund-reason-label">Reason for Refund *</InputLabel>
            <Select
              labelId="refund-reason-label"
              id="refund-reason"
              value={refundReason}
              label="Reason for Refund *"
              onChange={(e) => setRefundReason(e.target.value)}
            >
              <MenuItem value="damaged">Product Damaged</MenuItem>
              <MenuItem value="wrong_item">Wrong Item Received</MenuItem>
              <MenuItem value="quality_issue">Quality Issue</MenuItem>
              <MenuItem value="not_as_described">Not as Described</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            id="refund-description"
            label="Description (Optional)"
            multiline
            rows={4}
            fullWidth
            value={refundDescription}
            onChange={(e) => setRefundDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCloseRefundModal}
              disabled={refundSubmitting}
              sx={{ borderRadius: 28 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitRefund}
              disabled={refundSubmitting}
              sx={{ 
                bgcolor: "#611964", 
                "&:hover": { bgcolor: "#4a1350" },
                borderRadius: 28
              }}
            >
              {refundSubmitting ? <CircularProgress size={24} /> : "Submit Request"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Order Received Confirmation Modal */}
      <Modal
        open={confirmReceivedModalOpen}
        onClose={handleCloseConfirmReceivedModal}
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 500 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}
        >
          <Typography id="confirm-modal-title" variant="h6" component="h2" sx={{ mb: 2, color: "#611964", fontWeight: "600" }}>
            Confirm Order Received
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
            Are you sure you want to mark this order as received? This confirms that all shipped items have been delivered to you. This action cannot be undone.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCloseConfirmReceivedModal}
              disabled={confirmSubmitting}
              sx={{ borderRadius: 28 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReceived}
              disabled={confirmSubmitting}
              sx={{ 
                bgcolor: "#611964", 
                "&:hover": { bgcolor: "#4a1350" },
                borderRadius: 28
              }}
            >
              {confirmSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Receipt"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}