// pages/auth/payment-details/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AttachMoney,
  DateRange,
  LocalShipping,
  Receipt,
  ShoppingBag,
  ArrowBack,
  Person,
  Home,
  Phone,
  Print,
  Download,
} from "@mui/icons-material";
import SellerSidebar from "../../../components/seller-page-sidebar";
import jsPDF from "jspdf";

const PaymentDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [paymentData, setPaymentData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerInfo, setSellerInfo] = useState({ name: "Seller", id: "" });

  // Format currency
  const formatCurrency = (amount, currency = "LKR") => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date Error";
    }
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    if (!status) return "default";
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "succeeded":
      case "completed":
      case "delivered":
        return "success";
      case "pending":
      case "processing":
      case "shipped":
        return "warning";
      case "failed":
      case "cancelled":
        return "error";
      case "refund requested":
      case "refund_requested":
      case "refunded":
        return "error";
      default:
        return "default";
    }
  };

  // Fetch seller info
  const fetchSellerInfo = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || token === "undefined" || token === "null") {
        return;
      }

      const response = await axios.get("http://localhost:5000/api/users/details", {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      const { name, id } = response.data;

      setSellerInfo({
        name: name || "Seller",
        id: id || "",
      });
    } catch (error) {
      console.error("Error fetching seller info:", error);
      
      // Use default values from localStorage as fallback
      setSellerInfo({
        name: localStorage.getItem("userName") || "Seller",
        id: localStorage.getItem("userId") || "",
      });
    }
  };

  // Fetch payment details
  const fetchPaymentDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        router.push("/auth/login");
        return;
      }

      // Fetch payment details
      const paymentResponse = await axios.get(`http://localhost:5000/api/payment/details/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const payment = paymentResponse.data;
      setPaymentData(payment);

      // Fetch related order details if available
      if (payment && payment.order_id) {
        const orderResponse = await axios.get(`http://localhost:5000/api/orders/${payment.order_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        setOrderData(orderResponse.data);
      } else {
        // Try to find order by payment_id
        try {
          const ordersResponse = await axios.get(`http://localhost:5000/api/orders/by-payment/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (ordersResponse.data && ordersResponse.data.length > 0) {
            setOrderData(ordersResponse.data[0]);
          }
        } catch (orderError) {
          console.error("Could not find order for payment:", orderError);
          // This is expected in some cases, so we don't set an error
        }
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      
      if (error.response && error.response.status === 403) {
        setError("You don't have permission to access this data.");
      } else if (error.response && error.response.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        router.push("/auth/login");
      } else {
        setError("Failed to load payment details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF invoice/receipt
  const generatePDF = () => {
    if (!paymentData) return;

    try {
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Add header
      doc.setFontSize(22);
      doc.setTextColor(97, 25, 100); // #611964
      doc.text("THRIFT HAVEN", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 10;
      doc.setFontSize(16);
      doc.text("Payment Receipt", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 15;
      doc.setLineWidth(0.5);
      doc.setDrawColor(97, 25, 100); // #611964
      doc.line(margin, yPos, pageWidth - margin, yPos);
      
      yPos += 15;

      // Payment information
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Payment Information", margin, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.text(`Payment ID: ${paymentData.payment_id || "N/A"}`, margin, yPos);
      
      yPos += 8;
      doc.text(`Payment Intent ID: ${paymentData.payment_intent_id || "N/A"}`, margin, yPos);
      
      yPos += 8;
      doc.text(`Status: ${paymentData.status || "N/A"}`, margin, yPos);
      
      yPos += 8;
      doc.text(`Amount: ${formatCurrency(paymentData.amount, paymentData.currency)}`, margin, yPos);
      
      yPos += 8;
      doc.text(`Date: ${formatDate(paymentData.payment_date || paymentData.created_at)}`, margin, yPos);
      
      yPos += 15;

      // Order information (if available)
      if (orderData) {
        doc.setFontSize(14);
        doc.text("Order Information", margin, yPos);
        
        yPos += 10;
        doc.setFontSize(11);
        doc.text(`Order ID: ${orderData.order_id || "N/A"}`, margin, yPos);
        
        yPos += 8;
        doc.text(`Product: ${orderData.product_name || "N/A"}`, margin, yPos);
        
        yPos += 8;
        doc.text(`Quantity: ${orderData.quantity || "N/A"}`, margin, yPos);
        
        yPos += 8;
        doc.text(`Delivery Address: ${orderData.address || "N/A"}`, margin, yPos);
        
        yPos += 8;
        doc.text(`Order Status: ${orderData.status || "N/A"}`, margin, yPos);
        
        yPos += 8;
        doc.text(`Order Date: ${formatDate(orderData.created_at)}`, margin, yPos);
      }
      
      yPos += 20;

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("This is an electronic receipt for your purchase.", margin, yPos);
      
      yPos += 6;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
      
      yPos += 15;
      doc.text("Thank you for shopping with Thrift Haven!", pageWidth / 2, yPos, { align: "center" });
      
      // Save the PDF
      const fileName = `ThriftHaven_Receipt_${paymentData.payment_id}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate receipt. Please try again.");
    }
  };

  // Load data when component mounts or id changes
  useEffect(() => {
    fetchSellerInfo();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPaymentDetails();
    }
  }, [id, router]);

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: "280px",
          flexShrink: 0,
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: 1000,
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <SellerSidebar userName={sellerInfo.name} />
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
          px: 2,
        }}
      >
        <Container sx={{ flexGrow: 1, p: 3, maxWidth: "lg" }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            {/* Header with back button */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => router.back()}
                sx={{ mr: 2, color: "#611964" }}
              >
                Back
              </Button>
              <Typography variant="h4" fontWeight="bold" color="#611964">
                Payment Details
              </Typography>
              
              {/* Actions */}
              <Box sx={{ ml: "auto" }}>
                <Tooltip title="Download Receipt">
                  <IconButton
                    onClick={generatePDF}
                    sx={{ color: "#611964" }}
                    disabled={!paymentData}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print Receipt">
                  <IconButton
                    onClick={() => window.print()}
                    sx={{ color: "#611964" }}
                    disabled={!paymentData}
                  >
                    <Print />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                <CircularProgress sx={{ color: "#611964" }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Error</AlertTitle>
                {error}
                {error.includes("session") || error.includes("token") ? (
                  <Button
                    variant="contained"
                    onClick={() => router.push("/auth/login")}
                    sx={{ mt: 2, bgcolor: "#611964", "&:hover": { bgcolor: "#4a1154" } }}
                  >
                    Log In Again
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => fetchPaymentDetails()}
                    sx={{ mt: 2, color: "#611964", borderColor: "#611964" }}
                  >
                    Try Again
                  </Button>
                )}
              </Alert>
            ) : paymentData ? (
              <Grid container spacing={4}>
                {/* Payment Information Card */}
                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: "#f0ebf4",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      height: "100%",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Receipt sx={{ color: "#611964", mr: 2 }} />
                        <Typography variant="h6" fontWeight="bold" color="#611964">
                          Payment Information
                        </Typography>
                      </Box>

                      <List disablePadding>
                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Payment ID"
                            secondary={paymentData.payment_id || "N/A"}
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Payment Intent ID"
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {paymentData.payment_intent_id || "N/A"}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Amount"
                            secondary={
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="#611964"
                              >
                                {formatCurrency(paymentData.amount, paymentData.currency)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Status"
                            secondary={
                              <Chip
                                label={paymentData.status || "Unknown"}
                                size="small"
                                color={getStatusChipColor(paymentData.status)}
                                sx={{
                                  mt: 0.5,
                                  bgcolor:
                                    paymentData.status &&
                                    (paymentData.status.toLowerCase() === "refund requested" ||
                                      paymentData.status.toLowerCase() === "refund_requested" ||
                                      paymentData.status.toLowerCase() === "refunded")
                                      ? "#e84a28"
                                      : undefined,
                                  color:
                                    paymentData.status &&
                                    (paymentData.status.toLowerCase() === "refund requested" ||
                                      paymentData.status.toLowerCase() === "refund_requested" ||
                                      paymentData.status.toLowerCase() === "refunded")
                                      ? "white"
                                      : undefined,
                                }}
                              />
                            }
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Payment Date"
                            secondary={formatDate(
                              paymentData.payment_date || paymentData.created_at
                            )}
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Currency"
                            secondary={paymentData.currency || "LKR"}
                          />
                        </ListItem>
                        <Divider component="li" />

                        <ListItem sx={{ py: 1 }}>
                          <ListItemText
                            primary="Payment Method"
                            secondary={paymentData.payment_method_id || "Credit/Debit Card"}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Order Information Card */}
                <Grid item xs={12} md={6}>
                  {orderData ? (
                    <Card
                      elevation={0}
                      sx={{
                        bgcolor: "white",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        height: "100%",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                          <ShoppingBag sx={{ color: "#611964", mr: 2 }} />
                          <Typography variant="h6" fontWeight="bold" color="#611964">
                            Order Details
                          </Typography>
                        </Box>

                        <List disablePadding>
                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Order ID"
                              secondary={orderData.order_id || "N/A"}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Product Name"
                              secondary={orderData.product_name || "N/A"}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Quantity"
                              secondary={orderData.quantity || "N/A"}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Order Status"
                              secondary={
                                <Chip
                                  label={orderData.status || "Unknown"}
                                  size="small"
                                  color={getStatusChipColor(orderData.status)}
                                  sx={{ mt: 0.5 }}
                                />
                              }
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Order Date"
                              secondary={formatDate(orderData.created_at)}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Delivery Address"
                              secondary={orderData.address || "N/A"}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Phone Number"
                              secondary={orderData.phone || "N/A"}
                            />
                          </ListItem>
                          <Divider component="li" />

                          <ListItem sx={{ py: 1 }}>
                            <ListItemText
                              primary="Buyer ID"
                              secondary={orderData.buyer_id || "N/A"}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      elevation={0}
                      sx={{
                        bgcolor: "white",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        height: "100%",
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 3,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <ShoppingBag
                          sx={{ color: "#e0e0e0", fontSize: 60, mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          textAlign="center"
                        >
                          No Order Information Available
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                          sx={{ mt: 1 }}
                        >
                          This payment is not linked to any specific order.
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>

                {/* Additional Actions */}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={generatePDF}
                      sx={{
                        bgcolor: "#611964",
                        "&:hover": { bgcolor: "#4a1154" },
                      }}
                    >
                      Download Receipt
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => router.push("/seller-payments")}
                      sx={{
                        color: "#611964",
                        borderColor: "#611964",
                      }}
                    >
                      Back to Payments
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Payment Not Found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  The payment details you're looking for could not be found.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => router.push("/seller-payments")}
                  sx={{
                    bgcolor: "#611964",
                    "&:hover": { bgcolor: "#4a1154" },
                  }}
                >
                  Go to Payments
                </Button>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default PaymentDetails;