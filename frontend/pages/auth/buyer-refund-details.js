// frontend/pages/buyer/refunds.js
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
  Modal,
  IconButton,
  Grid as MuiGrid,
  Collapse,
  useMediaQuery,
  Drawer,
  Tooltip,
  Avatar,
  TablePagination,
  Badge
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import axios from "axios";
import { format } from "date-fns";
import BuyerSidebar from "../../components/buyer-page-sidebar";

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
    case "processed":
      return "info";
    default:
      return "default";
  }
};

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case "approved":
      return <CheckCircleOutlineIcon fontSize="small" />;
    case "pending":
      return <HourglassEmptyIcon fontSize="small" />;
    case "rejected":
      return <ErrorOutlineIcon fontSize="small" />;
    case "processed":
      return <ReceiptIcon fontSize="small" />;
    default:
      return null;
  }
};

// Helper function to format currency with 2 decimal places
const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2);
};

// Helper function to format date
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "PPP");
  } catch (error) {
    return "Invalid date";
  }
};

// Helper function to get reason display text
const getReasonText = (reasonCode) => {
  const reasons = {
    damaged: "Item Damaged or Defective",
    wrong_item: "Wrong Item Received",
    not_as_described: "Item Not as Described",
    late_delivery: "Late Delivery",
    changed_mind: "Changed My Mind",
    other: "Other Reason"
  };
  return reasons[reasonCode] || reasonCode;
};

export default function BuyerRefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Alert notification state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");

  // Fetch user details
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

  const fetchRefunds = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login?redirect=/buyer/refunds");
        return;
      }
      
      const response = await axios.get(
        "http://localhost:5000/api/orders/refund-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRefunds(response.data);
      if (refreshing) {
        showAlert("Refund requests refreshed successfully");
      }
    } catch (err) {
      console.error("Error fetching refund requests:", err);
      setError("Failed to load your refund requests. Please try again later.");
      if (refreshing) {
        showAlert("Failed to refresh refund requests", "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [router]);
  
  // Show alert message
  const showAlert = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    
    // Auto hide the alert after 6 seconds
    setTimeout(() => {
      setAlertOpen(false);
    }, 6000);
  };
  
  // Handle view details button click
  const handleViewDetails = (refund) => {
    setSelectedRefund(refund);
    setDetailsModalOpen(true);
  };
  
  // Close details modal
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedRefund(null);
  };
  
  // Navigate to order details
  const handleViewOrder = (paymentId) => {
    router.push(`/orders/payment/${paymentId}`);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchRefunds();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate refund statistics
  const pendingRefunds = refunds.filter(r => r.status.toLowerCase() === "pending").length;
  const approvedRefunds = refunds.filter(r => r.status.toLowerCase() === "approved").length;
  const rejectedRefunds = refunds.filter(r => r.status.toLowerCase() === "rejected").length;

  // Get paginated refunds
  const paginatedRefunds = refunds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar for desktop */}
      {!isSmallScreen && (
        <Box sx={{ 
          width: 280, 
          flexShrink: 0,
          position: "fixed",
          zIndex: 1,
          height: "100vh",
          overflowY: "auto",
          boxShadow: 2
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
              top: 16, 
              left: 16, 
              color: "#611964",
              bgcolor: "white",
              boxShadow: 3,
              zIndex: 1200,
              "&:hover": { bgcolor: "#f5f5f5" }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
              sx: { width: 280, boxShadow: 3 }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <BuyerSidebar userName={userName} />
          </Drawer>
        </>
      )}
      
      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        ml: isSmallScreen ? 0 : '280px', 
        pl: isSmallScreen ? 0 : 4, // Add left padding for spacing between sidebar and content
        width: isSmallScreen ? '100%' : 'calc(100% - 280px)',
        minHeight: '100vh',
        bgcolor: "#f9f9f9"
      }}>
        {/* Bottom-centered Alert Message */}
        <Collapse in={alertOpen}>
          <Box 
            sx={{ 
              position: "fixed",
              bottom: 20,
              left: "50%",
              boxShadow: 3,
              transform: "translateX(-50%)",
              zIndex: 9999,
              width: { xs: "90%", sm: "60%", md: "40%" },
              mx: "auto"
            }}
          >
            <Alert 
              severity={alertSeverity}
              variant="filled"
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
                boxShadow: 3,
                width: "100%",
                borderRadius: 2
              }}
            >
              {alertMessage}
            </Alert>
          </Box>
        </Collapse>
        
        <Container maxWidth="lg" sx={{ py: 2 }}>

          <Container maxWidth="lg" sx={{ mb: 4 }}>
                    <MuiGrid container alignItems="center" spacing={5}>
                     
                      <MuiGrid item xs>
                        <Typography variant="h4" sx={{ color: "#611964", fontWeight: 600 }}>
                          Refund Requests
                        </Typography>
                      </MuiGrid>
        
                      <MuiGrid item>
                      <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading || refreshing}
                sx={{ 
                  bgcolor: "white", 
                  boxShadow: 1,
                  "&:hover": { bgcolor: "#f5f5f5" }
                }}
              >
                <RefreshIcon sx={{ color: refreshing ? "#ccc" : "#611964" }} />
              </IconButton>
            </Tooltip>
                      </MuiGrid>
                     
                    </MuiGrid>
                  </Container>
         
          

          {/* Status Cards */}
          {!loading && !error && refunds.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} sm={4}>
                  <Card sx={{ 
                    boxShadow: 2, 
                    height: '100%',
                    borderLeft: '4px solid #f0ad4e',
                    transition: 'transform 0.2s',
                    bgcolor: '#f0ebf4',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Pending
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                            {pendingRefunds}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: '#f7e4be' }}>
                          <HourglassEmptyIcon sx={{ color: '#f0ad4e' }} />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </MuiGrid>
                
                <MuiGrid item xs={12} sm={4}>
                  <Card sx={{ 
                    boxShadow: 2, 
                    height: '100%',
                    borderLeft: '4px solid #5cb85c',
                    transition: 'transform 0.2s',
                    bgcolor: '#f0ebf4',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Approved
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                            {approvedRefunds}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: '#d8ecd8' }}>
                          <CheckCircleOutlineIcon sx={{ color: '#5cb85c' }} />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </MuiGrid>
                
                <MuiGrid item xs={12} sm={4}>
                  <Card sx={{ 
                    boxShadow: 2, 
                    height: '100%',
                    borderLeft: '4px solid #d9534f',
                    transition: 'transform 0.2s',
                    bgcolor: '#f0ebf4',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Rejected
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                            {rejectedRefunds}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: '#f5d6d5' }}>
                          <ErrorOutlineIcon sx={{ color: '#d9534f' }} />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </MuiGrid>
              </MuiGrid>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#611964" }} />
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              variant="outlined"
              sx={{ mb: 4, borderRadius: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              }
            >
              {error}
            </Alert>
          ) : refunds.length === 0 ? (
            <Card sx={{ p: 4, textAlign: "center", boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <ReceiptIcon sx={{ fontSize: 60, color: "#ccc" }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  You haven't made any refund requests yet
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push("/orders")}
                  sx={{ 
                    bgcolor: "#611964", 
                    "&:hover": { bgcolor: "#4a1350" },
                    borderRadius: 8,
                    px: 3
                  }}
                >
                  View Your Orders
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#f0e6f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Request Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRefunds.map((refund) => (
                      <TableRow 
                        key={refund.refund_id} 
                        hover 
                        sx={{ 
                          '&:hover': { bgcolor: '#f9f5fc' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>{formatDate(refund.requested_at)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                            {refund.payment_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 'medium' }}>
                            LKR {formatCurrency(refund.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={getReasonText(refund.reason)}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 180,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {getReasonText(refund.reason)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(refund.status)}
                            label={refund.status} 
                            color={getStatusColor(refund.status)}
                            size="small"
                            sx={{ 
                              borderRadius: 1.5,
                              '& .MuiChip-label': { px: 1 },
                              '& .MuiChip-icon': { ml: 1 }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDetails(refund)}
                            sx={{ 
                              borderColor: "#611964", 
                              color: "#611964",
                              borderRadius: 6,
                              "&:hover": { 
                                borderColor: "#4a1350",
                                bgcolor: "#f3e8f5"
                              }
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={refunds.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ 
                    borderTop: '1px solid rgba(224, 224, 224, 1)',
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      my: 1
                    }
                  }}
                />
              </TableContainer>
            </Card>
          )}
          
          {/* Refund Details Modal */}
          <Modal
            open={detailsModalOpen}
            onClose={handleCloseDetailsModal}
            aria-labelledby="refund-details-modal"
          >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              p: 0,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#611964', 
                color: 'white',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Refund Request Details
                </Typography>
                <IconButton 
                  aria-label="close" 
                  onClick={handleCloseDetailsModal}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              
              {selectedRefund && (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 3 
                  }}>
                    <Chip 
                      icon={getStatusIcon(selectedRefund.status)}
                      label={selectedRefund.status} 
                      color={getStatusColor(selectedRefund.status)}
                      sx={{ 
                        px: 1, 
                        py: 3,
                        borderRadius: 3,
                        fontSize: '1rem',
                        '& .MuiChip-label': { px: 2 },
                        '& .MuiChip-icon': { 
                          fontSize: '1.5rem',
                          ml: 1.5
                        }
                      }}
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <MuiGrid container spacing={3}>
                    <MuiGrid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Refund ID
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2, 
                          fontFamily: 'monospace',
                          bgcolor: '#f5f5f5',
                          p: 1,
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {selectedRefund.refund_id}
                      </Typography>
                    </MuiGrid>
                    
                    <MuiGrid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Request Date
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formatDate(selectedRefund.requested_at)}
                      </Typography>
                    </MuiGrid>
                    
                    <MuiGrid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Order ID
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}
                      >
                        {selectedRefund.payment_id}
                      </Typography>
                    </MuiGrid>
                    
                    <MuiGrid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Amount
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 'bold',
                          color: '#611964'
                        }}
                      >
                        LKR {formatCurrency(selectedRefund.amount)}
                      </Typography>
                    </MuiGrid>
                    
                    <MuiGrid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reason
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {getReasonText(selectedRefund.reason)}
                      </Typography>
                    </MuiGrid>
                    
                    {selectedRefund.description && (
                      <MuiGrid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Additional Information
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, bgcolor: '#f9f9f9', mb: 2, borderRadius: 2 }}
                        >
                          <Typography variant="body2">
                            {selectedRefund.description}
                          </Typography>
                        </Paper>
                      </MuiGrid>
                    )}
                    
                    {selectedRefund.processed_at && (
                      <MuiGrid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Processed Date
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {formatDate(selectedRefund.processed_at)}
                        </Typography>
                      </MuiGrid>
                    )}
                    
                    {selectedRefund.admin_notes && (
                      <MuiGrid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Admin Response
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{ 
                            p: 2, 
                            bgcolor: '#f0e6f5', 
                            mb: 2, 
                            borderRadius: 2,
                            borderLeft: '4px solid #611964'
                          }}
                        >
                          <Typography variant="body2">
                            {selectedRefund.admin_notes}
                          </Typography>
                        </Paper>
                      </MuiGrid>
                    )}
                  </MuiGrid>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        handleCloseDetailsModal();
                        handleViewOrder(selectedRefund.payment_id);
                      }}
                      startIcon={<ReceiptIcon />}
                      sx={{ 
                        bgcolor: "#611964",
                        borderRadius: 6,
                        px: 3,
                        "&:hover": { 
                          bgcolor: "#4a1350"
                        }
                      }}
                    >
                      View Original Order
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Modal>
        </Container>
      </Box>
    </Box>
  );
}