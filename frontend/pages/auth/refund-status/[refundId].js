// pages/buyer/refund-status/[refundId].js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Box, 
  Typography, 
  Paper,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip
} from "@mui/material";
import { 
  Home, 
  NavigateNext, 
  Receipt,
  MoneyOff,
  CheckCircle,
  AccessTime
} from "@mui/icons-material";
import axios from "axios";
import BuyerLayout from "../../../components/BuyerLayout";

const RefundStatusPage = () => {
  const router = useRouter();
  const { refundId } = router.query;
  const [refundData, setRefundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch when refundId is available
    if (refundId) {
      fetchRefundDetails();
    }
  }, [refundId]);

  const fetchRefundDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/orders/refund/${refundId}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      setRefundData(response.data);
    } catch (err) {
      console.error("Error fetching refund details:", err);
      setError(err.response?.data?.error || "Failed to load refund details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Pending";
    
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

  // Helper function to parse steps for the stepper
  const getRefundSteps = (refund) => {
    if (!refund) return [];
    
    // Default steps for the refund process
    const steps = [
      { 
        label: "Refund Requested", 
        completed: true, 
        date: refund.requested_at,
        icon: <AccessTime />
      },
      { 
        label: "Admin Review", 
        completed: refund.status !== 'pending', 
        date: refund.processed_at,
        icon: <AccessTime />
      },
      { 
        label: "Seller Processing", 
        completed: refund.status === 'completed', 
        date: refund.seller_accepted_at,
        icon: <AccessTime />
      },
      { 
        label: "Refund Complete", 
        completed: refund.status === 'completed', 
        date: refund.status === 'completed' ? refund.seller_accepted_at : null,
        icon: <CheckCircle />
      }
    ];
    
    // If refund was rejected, modify steps
    if (refund.status === 'rejected') {
      steps[1].label = "Refund Rejected";
      steps[1].icon = <MoneyOff />;
      steps.splice(2, 2); // Remove processing and completion steps
    }
    
    return steps;
  };
  
  // Get current step index
  const getCurrentStep = (refund) => {
    if (!refund) return 0;
    
    switch (refund.status) {
      case 'pending':
        return 1; // Waiting for admin review
      case 'approved':
        return 2; // Waiting for seller processing
      case 'completed':
        return 3; // Complete
      case 'rejected':
        return 1; // Rejected (same step as admin review)
      default:
        return 0;
    }
  };

  return (
    <BuyerLayout>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link 
          underline="hover" 
          color="inherit" 
          href="/buyer/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/buyer/orders"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Receipt sx={{ mr: 0.5 }} fontSize="small" />
          My Orders
        </Link>
        <Typography color="text.primary">Refund Status</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" sx={{ mb: 3, color: "#611964", fontWeight: "bold" }}>
        Refund Status
      </Typography>
      
      <Divider sx={{ mb: 4 }} />
      
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress sx={{ color: "#611964" }} />
        </Box>
      ) : error ? (
        <Alert 
          severity="error"
          action={
            <Link href="/buyer/orders" underline="none">
              View Orders
            </Link>
          }
        >
          {error}
        </Alert>
      ) : refundData?.refund ? (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          {/* Status Alert */}
          {refundData.refund.status === 'completed' ? (
            <Alert severity="success" sx={{ mb: 4 }}>
              <Typography variant="subtitle1">
                Refund Successfully Processed!
              </Typography>
              <Typography variant="body2">
                Your refund has been completed. The amount of {formatCurrency(refundData.refund.amount)} has been processed.
              </Typography>
            </Alert>
          ) : refundData.refund.status === 'approved' ? (
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="subtitle1">
                Refund Approved - Waiting for Seller Processing
              </Typography>
              <Typography variant="body2">
                Your refund has been approved by our admin team and is currently being processed by the seller.
              </Typography>
            </Alert>
          ) : refundData.refund.status === 'rejected' ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              <Typography variant="subtitle1">
                Refund Request Rejected
              </Typography>
              <Typography variant="body2">
                {refundData.refund.admin_notes || "Your refund request has been rejected. Please contact support for more information."}
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography variant="subtitle1">
                Refund Request Pending
              </Typography>
              <Typography variant="body2">
                Your refund request is under review. We'll notify you once the admin team has made a decision.
              </Typography>
            </Alert>
          )}
          
          {/* Stepper showing progress */}
          <Stepper 
            activeStep={getCurrentStep(refundData.refund)} 
            alternativeLabel 
            sx={{ mb: 5 }}
          >
            {getRefundSteps(refundData.refund).map((step, index) => (
              <Step key={step.label} completed={step.completed}>
                <StepLabel 
                  StepIconComponent={() => (
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: step.completed ? '#611964' : '#e0e0e0',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  {step.label}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {step.completed ? formatDate(step.date) : "Pending"}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Refund Details */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="#611964" gutterBottom>
                    Refund Details
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Refund ID:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2" fontWeight="medium">
                          #{refundData.refund.refund_id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Amount:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2" fontWeight="medium" color="#611964">
                          {formatCurrency(refundData.refund.amount)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Chip 
                          label={refundData.refund.status.toUpperCase()}
                          size="small"
                          color={
                            refundData.refund.status === 'completed' ? 'success' :
                            refundData.refund.status === 'approved' ? 'primary' :
                            refundData.refund.status === 'rejected' ? 'error' :
                            'warning'
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Requested On:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">
                          {formatDate(refundData.refund.requested_at)}
                        </Typography>
                      </Grid>
                      
                      {refundData.refund.processed_at && (
                        <>
                          <Grid item xs={5}>
                            <Typography variant="body2" color="text.secondary">
                              Reviewed On:
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography variant="body2">
                              {formatDate(refundData.refund.processed_at)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      {refundData.refund.seller_accepted_at && (
                        <>
                          <Grid item xs={5}>
                            <Typography variant="body2" color="text.secondary">
                              Completed On:
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography variant="body2">
                              {formatDate(refundData.refund.seller_accepted_at)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="#611964" gutterBottom>
                    Product Information
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Product:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2" fontWeight="medium">
                          {refundData.refund.product_name}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Order ID:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">
                          #{refundData.refund.order_id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Price:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">
                          {formatCurrency(refundData.refund.price)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Seller:
                          </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Typography variant="body2">
                          {refundData.refund.seller_name}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                      </Grid>
                      
                      <Grid item xs={5}>
                        <Typography variant="body2" color="text.secondary">
                          Reason:
                        </Typography>
                      </Grid>
                      <Grid item xs={7}>
                        <Chip 
                          label={refundData.refund.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      
                      {refundData.refund.description && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Description:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                              "{refundData.refund.description}"
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Payment Status Card */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="#611964" gutterBottom>
                    Payment Status
                  </Typography>
                  
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: refundData.refund.payment_status === 'refunded' ? '#e8f5e9' : '#fff8e1',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: refundData.refund.payment_status === 'refunded' ? '#a5d6a7' : '#ffe082',
                  }}>
                    <Typography variant="body1" color={refundData.refund.payment_status === 'refunded' ? '#2e7d32' : '#ed6c02'}>
                      {refundData.refund.payment_status === 'refunded' 
                        ? 'Your payment has been refunded.' 
                        : 'Your refund is being processed by the payment provider.'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Payment ID: {refundData.refund.payment_intent_id}
                    </Typography>
                    {refundData.refund.status === 'completed' && refundData.refund.payment_status !== 'refunded' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Please note: The refund has been approved and processed by the seller. 
                        It might take 5-10 business days for the amount to be credited to your original payment method.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Support message */}
          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              If you have any questions about your refund, please contact our customer support.
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              Support Email: support@thrifthaven.com
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Alert severity="warning">
          No refund information found. Please check the refund ID and try again.
        </Alert>
      )}
    </BuyerLayout>
  );
};

export default RefundStatusPage;