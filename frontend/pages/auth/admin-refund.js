// AdminRefundPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, TextField,useMediaQuery, IconButton, Tooltip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Badge, Card, CardContent, Grid, Avatar, InputAdornment, CircularProgress,
  Tab, Tabs
} from "@mui/material";
import {
  CheckCircle, Cancel, Refresh, Visibility, Search, AttachMoney,
  CalendarToday, ArrowBack, Logout, PendingActions,
  ThumbUp, ThumbDown
} from "@mui/icons-material";
import Sidebar from "../../components/admin-sidebar";
import { useRouter } from "next/router";

const StatusChip = ({ status }) => {
  const colorMap = {
    pending: "warning",
    approved: "success",
    rejected: "error"
  };
  const labelMap = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected"
  };
  return (
    <Chip
      label={labelMap[status] || status}
      color={colorMap[status] || "default"}
      sx={{
        fontWeight: 500,
        borderRadius: '8px',
        '&.MuiChip-colorWarning': {
          backgroundColor: 'rgba(255, 167, 38, 0.12)',
          color: '#F57C00',
        },
        '&.MuiChip-colorSuccess': {
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          color: '#388E3C',
        },
        '&.MuiChip-colorError': {
          backgroundColor: 'rgba(244, 67, 54, 0.12)',
          color: '#D32F2F',
        }
      }}
    />
  );
};

const AdminRefundPage = () => {
  const router = useRouter();
  const [refunds, setRefunds] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [totalApprovedRefund, setTotalApprovedRefund] = useState(0);
  const [totalCompletedRefund, setTotalCompletedRefund] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const axiosAuth = axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    } else {
      fetchRefunds();
      fetchRefundTotals();
    }
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("http://localhost:5000/api/orders/admin/refund-requests");
      const data = res.data;
      setRefunds(data);
      setFiltered(data);
      setPendingCount(data.filter(r => r.status === "pending").length);
      setApprovedCount(data.filter(r => r.status === "approved").length);
      setRejectedCount(data.filter(r => r.status === "rejected").length);
      const totalApprovedAmount = data
        .filter(r => r.status === "approved")
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching refunds:", err);
      setLoading(false);
    }
  };

  const fetchRefundTotals = async () => {
    try {
      const [approvedRes, completedRes, countRes] = await Promise.all([
        axiosAuth.get("http://localhost:5000/api/orders/admin/total-approved-refunded"),
        axiosAuth.get("http://localhost:5000/api/orders/admin/total-completed-refunded"),
        axiosAuth.get("http://localhost:5000/api/orders/admin/total-completed-refund-count")
      ]);
      setTotalApprovedRefund(approvedRes.data.total_approved_refunded || 0);
      setTotalCompletedRefund(completedRes.data.total_completed_refunded || 0);
      setCompletedCount(countRes.data.total_completed_count || 0);
    } catch (err) {
      console.error("Error fetching refund totals:", err);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
    filterRefundsByStatus(tabValue, term);
  };

  const filterRefundsByStatus = (tabIndex, keyword = search) => {
    const term = keyword.toLowerCase();
    if (tabIndex === 0) {
      setFiltered(refunds.filter(r =>
        r.buyer_name.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term)
      ));
    } else {
      const statusMap = {
        1: 'pending',
        2: 'approved',
        3: 'rejected'
      };
      setFiltered(refunds.filter(r =>
        r.status === statusMap[tabIndex] &&
        (r.buyer_name.toLowerCase().includes(term) ||
          r.reason.toLowerCase().includes(term))
      ));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterRefundsByStatus(newValue);
  };

  const updateRefundStatus = async (refundId, action) => {
    try {
      const url = `http://localhost:5000/api/orders/refund/${action}/${refundId}`;
      await axiosAuth.post(url);
      const updatedRefunds = refunds.map(r => {
        if (r.refund_id === refundId) {
          return {
            ...r,
            status: action === 'approve' ? 'approved' : 'rejected',
            processed_at: new Date().toISOString()
          };
        }
        return r;
      });
      setRefunds(updatedRefunds);
      filterRefundsByStatus(tabValue);
    } catch (err) {
      console.error("Error updating refund status:", err);
    }
  };

  const handleViewDetails = async (refund) => {
    setSelectedRefund(refund);
    setOpenDialog(true);
    try {
      const res = await axiosAuth.get(`http://localhost:5000/api/orders/admin/refund-order-details/${refund.payment_id}`);
      setOrderDetails(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/admin-login");
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8f9fa", minHeight: "100vh" }}>
        <Box sx={{ position: "fixed", height: "100vh", zIndex: 1200 }}>
        <Sidebar />
      </Box>

      {/* Added spacing between sidebar and main content */}
            {!isSmallScreen && (
              <Box 
                sx={{ 
                  width: 80, 
                  flexShrink: 0,
                  backgroundColor: "#f5f5f7",
                }}
              />
            )}
            
            <Box sx={{ 
              flexGrow: 1, 
              overflowY: "auto", 
              minHeight: "100vh",
              p: { xs: isSmallScreen ? 2 : 0, sm: 0 },
              pt: { xs: isSmallScreen ? 6 : 0, sm: 0 },
              position: "relative"
            }}></Box>
      <Box sx={{ flexGrow: 1, p: 3, maxWidth: '100%' }}>
        <Card elevation={0} sx={{ mb: 2}}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={600} color="#611964">
                Refund Details
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search refunds..."
                  value={search}
                  onChange={handleSearch}
                  sx={{ 
                    width: 280,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Tooltip title="Refresh">
                  <IconButton 
                    onClick={fetchRefunds} 
                    sx={{ 
                      color: 'primary',
                      '&:hover': { bgcolor: '#d0cfd1' }
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton 
                    onClick={handleLogout} 
                    sx={{ 
                      color: 'error',
                      '&:hover': { bgcolor: '#d0cfd1' }
                    }}
                  >
                    <Logout />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
        

        {/*summary cards*/}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                    <PendingActions />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
                    <Typography variant="h4" fontWeight={600}>{pendingCount}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Awaiting your review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                    <ThumbUp />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Approved</Typography>
                    <Typography variant="h4" fontWeight={600}>{approvedCount}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Successfully processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                    <ThumbDown />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Rejected</Typography>
                    <Typography variant="h4" fontWeight={600}>{rejectedCount}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Declined requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
<Typography variant="h4" fontWeight={600}>{completedCount}</Typography>

                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Approved refund 
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>


    {/*summary card section 2*/}
 <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                     <ThumbUp />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Approved</Typography>
                     <Typography variant="h5" fontWeight={600}>{formatCurrency(totalApprovedRefund)}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Awaiting seller processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      color: '#611964',
                      width: 48,
                      height: 48,
                      mr: 2,
                      bgcolor: 'transparent'
                    }}
                  >
                    <ThumbUp />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
                     <Typography variant="h5" fontWeight={600}>{formatCurrency(totalCompletedRefund)}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  seller accepted and processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>  
        </Grid>


        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="All Refunds" />
              <Tab 
                label={
                  <Badge badgeContent={pendingCount} color="warning" max={99}>
                    <Box sx={{ pr: pendingCount > 0 ? 2 : 0 }}>Pending</Box>
                  </Badge>
                }
              />
              <Tab label="Approved" />
              <Tab label="Rejected" />
            </Tabs>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 'calc(100vh - 240px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Buyer</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Requested At</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow 
                      key={row.refund_id} 
                      hover 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              backgroundColor: '#e3d48f',
                              color: 'white',
                              fontSize: '0.875rem',
                              mr: 1.5
                            }}
                          >
                            {row.buyer_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{row.buyer_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.buyer_email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {row.reason}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <CalendarToday fontSize="small" sx={{ color: 'text.secondary', mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {new Date(row.requested_at).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton 
                              onClick={() => handleViewDetails(row)} 
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.light' },
                                width: 34,
                                height: 34
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {row.status === "pending" && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton 
                                  onClick={() => updateRefundStatus(row.refund_id, "approve")} 
                                  sx={{ 
                                    color: 'success.main',
                                    '&:hover': { backgroundColor: 'success.light' },
                                    width: 34,
                                    height: 34
                                  }}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton 
                                  onClick={() => updateRefundStatus(row.refund_id, "reject")} 
                                  sx={{ 
                                    color: 'error.main',
                                    '&:hover': { backgroundColor: 'error.light' },
                                    width: 34,
                                    height: 34
                                  }}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box textAlign="center" p={3}>
                          <img 
                            src="/empty-state.svg" 
                            alt="No refunds" 
                            style={{ width: 150, height: 150, marginBottom: 16, opacity: 0.6 }}
                          />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No refund requests found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search ? "Try adjusting your search term" : "There are no refund requests to display"}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>




{/*view popup*/}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              maxHeight: '85vh'
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              px: 3, 
              py: 2, 
              bgcolor: '#611964', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box display="flex" alignItems="center">
              <IconButton 
                edge="start" 
                color="inherit"
                sx={{ mr: 1 }} 
                onClick={() => setOpenDialog(false)}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Refund Request Details</Typography>
            </Box>
            <Box>
              {selectedRefund && selectedRefund.status === "pending" && (
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle fontSize="small" />}
                    onClick={() => {
                      updateRefundStatus(selectedRefund.refund_id, "approve");
                      setOpenDialog(false);
                    }}
                    sx={{ borderRadius: 1, textTransform: 'none' }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<Cancel fontSize="small" />}
                    onClick={() => {
                      updateRefundStatus(selectedRefund.refund_id, "reject");
                      setOpenDialog(false);
                    }}
                    sx={{ borderRadius: 1, textTransform: 'none' }}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {selectedRefund && (
              <Box>
                <Grid container spacing={0}>
                  <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #e0e0e0' }, p: 2.5 }}>
                    <Typography variant="subtitle1" color="black" fontWeight={500} gutterBottom>
                      Refund Information
                    </Typography>
                    
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: '',
                          color: 'white',
                          mr: 1.5,
                          fontSize: '0.9rem'
                        }}
                      >
                        {selectedRefund.buyer_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>{selectedRefund.buyer_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedRefund.buyer_email}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <StatusChip status={selectedRefund.status} />
                    </Box>
                    
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Refund Amount
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="black">
                          {formatCurrency(selectedRefund.amount)}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reason for Refund
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedRefund.reason}
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                        {selectedRefund.description || "No description provided."}
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Request Timeline
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Chip 
                          size="small" 
                          label="Requested" 
                          sx={{ mr: 1, bgcolor: 'info.light', color: 'info.dark', fontSize: '0.75rem' }} 
                        />
                        <Typography variant="caption">
                          {new Date(selectedRefund.requested_at).toLocaleString()}
                        </Typography>
                      </Box>
                      {selectedRefund.processed_at && (
                        <Box display="flex" alignItems="center">
                          <Chip 
                            size="small" 
                            label={selectedRefund.status === 'approved' ? 'Approved' : 'Rejected'} 
                            sx={{ 
                              mr: 1, 
                              bgcolor: selectedRefund.status === 'approved' ? 'success.light' : 'error.light',
                              color: selectedRefund.status === 'approved' ? 'success.dark' : 'error.dark',
                              fontSize: '0.75rem'
                            }} 
                          />
                          <Typography variant="caption">
                            {new Date(selectedRefund.processed_at).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {selectedRefund.admin_notes && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Admin Notes
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                          {selectedRefund.admin_notes}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={8} sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" color="black" fontWeight={500} gutterBottom>
                      Order Details
                    </Typography>
                    
                    {orderDetails.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <Typography color="text.secondary" variant="body2">No order details available</Typography>
                      </Box>
                    ) : (
                      <TableContainer sx={{ maxHeight: '50vh' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Image</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Product</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Size</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Price</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Qty</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {orderDetails.map((item) => (
                              <TableRow key={item.order_id} hover>
                                <TableCell sx={{ py: 1 }}>
                                  {item.product_image ? (
                                    <Box
                                      sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        border: '1px solid #eee'
                                      }}
                                    >
                                      <img
                                        src={`http://localhost:5000/${item.product_image}`}
                                        alt={item.product_name}
                                        style={{ width: '100%', height: '100%', objectFit: "cover" }}
                                      />
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.100'
                                      }}
                                    >
                                      <Typography variant="caption" color="text.secondary">No image</Typography>
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {item.product_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.product_description ? 
                                      (item.product_description.length > 50 ? 
                                        `${item.product_description.substring(0, 50)}...` : 
                                        item.product_description) : 
                                      "N/A"}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Chip 
                                    label={item.product_size || "N/A"} 
                                    size="small"
                                    sx={{ 
                                      borderRadius: 1,
                                      bgcolor: 'grey.100',
                                      color: 'text.primary',
                                      fontWeight: 500,
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {formatCurrency(item.price)}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {item.quantity}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Chip 
                                    label={item.status} 
                                    size="small"
                                    sx={{ 
                                      borderRadius: 1,
                                      bgcolor: item.status === 'delivered' ? 'success.light' : 
                                             item.status === 'processing' ? 'primary.light' :
                                             item.status === 'cancelled' ? 'error.light' : 'warning.light',
                                      color: item.status === 'delivered' ? 'white' : 
                                            item.status === 'processing' ? 'white' :
                                            item.status === 'cancelled' ? 'white' : 'whites',
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              size="small"
              sx={{ borderRadius: 1, textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminRefundPage;