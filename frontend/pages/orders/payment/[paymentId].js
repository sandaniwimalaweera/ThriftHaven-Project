// frontend/pages/orders/payment/[paymentId].js
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
  Divider,
  Alert,
  Tooltip
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { format } from "date-fns";
import dynamic from 'next/dynamic';

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "paid":
    case "succeeded":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    default:
      return "default";
  }
};

// Helper function to format currency with 2 decimal places
const formatCurrency = (amount) => {
  // Since amount is already a decimal value in the database, just format it
  return parseFloat(amount).toFixed(2);
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { paymentId } = router.query;
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!paymentId) return;

      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Your session has expired. Please log in again.");
          router.push(`/auth/login?redirect=/orders/payment/${paymentId}`);
          return;
        }
        
        const response = await axios.get(
          `http://localhost:5000/api/orders/payment/${paymentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setPaymentDetails(response.data);
      } catch (err) {
        console.error("Error fetching payment details:", err);
        
        // Handle 401 Unauthorized error specifically
        if (err.response && err.response.status === 401) {
          setError("Your session has expired. Please log in again.");
          localStorage.removeItem("token"); // Clear invalid token
          setTimeout(() => {
            router.push(`/auth/login?redirect=/orders/payment/${paymentId}`);
          }, 2000);
        } else {
          setError("Failed to load payment details. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, router]);

  const handleContinueShopping = () => {
    router.push("/auth/products");
  };

  const handleViewOrders = () => {
    router.push("/orders");
  };

  const handleDownloadInvoice = async () => {
    if (!paymentDetails) return;
    
    setDownloading(true);
    
    try {
      // Create blob URL for the HTML content
      const invoiceHtml = generateInvoiceHtml(paymentDetails);
      const blob = new Blob([invoiceHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      
      // Add onload handler to automatically print
      if (printWindow) {
        printWindow.onload = () => {
          // Small delay to ensure content is fully loaded
          setTimeout(() => {
            printWindow.print();
            setDownloading(false);
          }, 500);
        };
      } else {
        // If popup was blocked
        setDownloading(false);
        alert("Please allow popups to download the receipt.");
      }
      
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Failed to generate invoice. Please try again later.");
      setDownloading(false);
    }
  };
  
  // Helper function to generate HTML invoice content
  const generateInvoiceHtml = (paymentDetails) => {
    const { payment, orders } = paymentDetails;
    const formattedDate = format(new Date(payment.payment_date), "PPP p");
    
    // Calculate order totals
    const orderRows = orders.map(order => {
      const itemTotal = parseFloat(order.price) * parseInt(order.quantity, 10);
      return `
        <tr>
          <td>${order.product_name}</td>
          <td>LKR ${formatCurrency(order.price)}</td>
          <td>${order.quantity}</td>
          <td>LKR ${formatCurrency(itemTotal)}</td>
        </tr>
      `;
    }).join('');
    
    // Generate HTML content
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${payment.payment_intent_id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #611964;
            padding-bottom: 20px;
          }
          .title {
            color: #611964;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title1 {
            color: #611964;
            font-size: 23px;
            margin-bottom: 10px;
          }
          .title3{
            color: #611964;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #611964;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          table th {
            background-color: #f7f7f7;
          }
          .total-row {
            font-weight: bold;
          }
          .payment-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            color: white;
            background-color: ${payment.status === 'paid' || payment.status === 'succeeded' ? '#4caf50' : 
                             payment.status === 'pending' ? '#ff9800' : 
                             payment.status === 'failed' ? '#f44336' : '#9e9e9e'};
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 14px;
            color: #777;
          }
          .browser-print-btn {
            display: block;
            background-color: #611964;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 30px auto 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .browser-print-btn:hover {
            background-color: #4a1350;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .browser-print-btn {
              display: none !important;
            }
          }
        </style>
        <script>
          // Auto-print when page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title1">THRIFT HAVEN</div>
            <div class="title3">Your new favorite, someone's old treasure</div>
            <div class="title">Payment Receipt</div>
            <div>Thank you for your purchase!</div>
          </div>
          
          <div class="section">
            <div class="section-title">Payment Information</div>
            <p><strong>Payment Reference:</strong> ${payment.payment_intent_id}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Status:</strong> <span class="payment-status">${payment.status.toUpperCase()}</span></p>
          </div>
          
          <div class="section">
            <div class="section-title">Shipping Information</div>
            <p><strong>Address:</strong> ${orders[0]?.address || "No address provided"}</p>
            <p><strong>Phone:</strong> ${orders[0]?.phone || "No phone provided"}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Order Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total</td>
                  <td>LKR ${formatCurrency(payment.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>This is an automatically generated receipt from THRIFT HAVEN.</p>
            
          </div>
          
          <!-- This button will only show in browser, not in print -->
          <button class="browser-print-btn" onclick="window.print()">Print Receipt</button>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button 
            variant="contained"
            onClick={handleViewOrders}
            sx={{ mr: 2 }}
          >
            View My Orders
          </Button>
          <Button 
            variant="outlined"
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!paymentDetails) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Alert severity="warning" sx={{ mb: 4 }}>
            Payment details not found
          </Alert>
          <Button 
            variant="contained"
            onClick={handleViewOrders}
            sx={{ mr: 2 }}
          >
            View My Orders
          </Button>
          <Button 
            variant="outlined"
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  const { payment, orders } = paymentDetails;
  const formattedDate = format(new Date(payment.payment_date), "PPP p");

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: "center",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Tooltip title="Download Receipt">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadInvoice}
              disabled={downloading}
              sx={{ mb: 2 }}
            >
              {downloading ? "Preparing..." : "Download Receipt"}
            </Button>
          </Tooltip>
        </Box>
        
        <CheckCircleOutlineIcon 
          sx={{ fontSize: 80, color: "success.main", mb: 2 }} 
        />
        <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
          Thank You for Your Order!
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
          Your payment was successful and your order has been placed.
        </Typography>
        
        <Box sx={{ mt: 4, textAlign: "left" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Payment Reference
            </Typography>
            <Typography variant="body1">
              {payment.payment_intent_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Date: {formattedDate}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Order Summary
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell>{order.product_name}</TableCell>
                      <TableCell align="right">LKR {formatCurrency(order.price)}</TableCell>
                      <TableCell align="right">{order.quantity}</TableCell>
                      <TableCell align="right">
                        LKR {formatCurrency(parseFloat(order.price) * parseInt(order.quantity, 10))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="subtitle1">Total</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    LKR {formatCurrency(payment.amount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Shipping Information
            </Typography>
            <Typography variant="body1">{orders[0]?.address || "No address provided"}</Typography>
            <Typography variant="body1">Phone: {orders[0]?.phone || "No phone provided"}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Payment Status
            </Typography>
            <Chip 
              label={payment.status} 
              color={getStatusColor(payment.status)} 
            />
          </Box>
        </Box>
        
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </Button>
          <Button 
            variant="contained" 
            onClick={handleViewOrders}
            sx={{ bgcolor: "#611964", "&:hover": { bgcolor: "#4a1350" } }}
          >
            View My Orders
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}