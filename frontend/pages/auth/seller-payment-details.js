  // pages/seller-payments.js
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
    Chip,
    Divider,
    Paper,
    Button,
    Alert,
    AlertTitle,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tab,
    Tabs
  } from "@mui/material";
  import { 
    AttachMoney, 
    DateRange, 
    FilterList,
    GetApp,
    Refresh,
    ArrowBack,
    ArrowForward,
    CreditCard,
    PieChart
  } from "@mui/icons-material";
  import SellerSidebar from "../../components/seller-page-sidebar";
  import SimpleMonthlyChart from "../../components/MonthlyIncomeChart"; 

  import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
  } from 'recharts';

  // Import jsPDF correctly
  import jsPDF from "jspdf";

  const SellerPayments = () => {
    const [payments, setPayments] = useState([]);
    const [originalPayments, setOriginalPayments] = useState([]); // Store original, unfiltered payments
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalRefunded, setTotalRefunded] = useState(0);
    const [totalPlatformFee, setTotalPlatformFee] = useState(0);
    const [totalSellerEarnings, setTotalSellerEarnings] = useState(0);
    const [monthlyData, setMonthlyData] = useState([]);
    const [filteredMonthData, setFilteredMonthData] = useState(null); // Currently selected month data
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth()); // Default to current month
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [sellerInfo, setSellerInfo] = useState({ name: "Seller", id: "" });
    const [activeTab, setActiveTab] = useState(0); // For tab navigation
    const paymentsPerPage = 10;
    const router = useRouter();

    // Client-side pagination
    const startIndex = (page - 1) * paymentsPerPage;
    const paginatedPayments = payments.slice(startIndex, startIndex + paymentsPerPage);
    const totalPages = Math.ceil(payments.length / paymentsPerPage);
    
    // Month names array for easier reference
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    // Format currency
    const formatCurrency = (amount, currency = 'LKR') => {
      return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: currency || 'LKR',
        minimumFractionDigits: 2
      }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      
      try {
        // Try to convert to a Date object
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.log("Invalid date:", dateString);
          return "Invalid Date";
        }
        
        // Format with date and time
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error("Error formatting date:", error);
        return "Date Error";
      }
    };
    
    // Check token and fetch data on component mount
    useEffect(() => {
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found in localStorage");
        router.push("/auth/login");
        return;
      }

      // Check if token is not empty and in expected format
      if (token === "undefined" || token === "null" || token.length < 10) {
        console.log("Invalid token format detected");
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      // If token looks valid, fetch data
      fetchSellerInfo();
      fetchSellerPayments();
      fetchTotalReceived();
      fetchMonthlyData();
    }, [router]);

    // Apply filters when filter values change
    useEffect(() => {
      applyFilters();
    }, [filterMonth, filterStatus, originalPayments]);
    
    // Fetch monthly data when selected year changes
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token && token !== "undefined" && token !== "null") {
        fetchMonthlyData();
      }
    }, [selectedYear]);
    
    // Update filtered month data when monthlyData or selectedMonthIndex changes
    useEffect(() => {
      if (monthlyData.length > 0) {
        setFilteredMonthData(monthlyData[selectedMonthIndex]);
      }
    }, [monthlyData, selectedMonthIndex]);
    
    // Fetch monthly income data
    const fetchMonthlyData = async () => {
      setLoadingMonthly(true);
      try {
        const token = localStorage.getItem("token");
        
        if (!token || token === "undefined" || token === "null") {
          console.error("No valid token for fetchMonthlyData");
          setLoadingMonthly(false);
          return;
        }
        
        const response = await axios.get(`http://localhost:5000/api/payment/seller/post-refund-income?year=${selectedYear}`, {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        console.log("Monthly income data:", response.data);
        setMonthlyData(response.data);
        
        // Set the filtered month data to the currently selected month
        if (response.data.length > 0) {
          setFilteredMonthData(response.data[selectedMonthIndex]);
        }
      } catch (error) {
        console.error("Error fetching monthly income data:", error);
      } finally {
        setLoadingMonthly(false);
      }
    };
    
    // Fetch seller information
    const fetchSellerInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token || token === "undefined" || token === "null") {
          return;
        }
        
        console.log("Fetching seller info with token");
        
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

    // Fetch seller payments
    const fetchSellerPayments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        
        // Check if token exists
        if (!token) {
          console.error("No authentication token found");
          setError("Authentication token not found. Please log in again.");
          router.push("/auth/login");
          return;
        }
        
        console.log("Using token for payments fetch:", token.substring(0, 10) + "..."); // Log only the beginning for security
        
        // Try with Bearer prefix 
        const response = await axios.get("http://localhost:5000/api/payment/seller/payments", {
          headers: { 
            "Authorization": `Bearer ${token}`, // Add Bearer prefix back
            "Content-Type": "application/json"
          }
        });
        
        // Get all payments and normalize the data structure
        const allPayments = response.data.map(payment => {
          // Normalize payment data to ensure consistent field names
          return {
            payment_id: payment.payment_id || payment.id,
            payment_intent_id: payment.payment_intent_id || payment.paymentIntentId || payment.intent_id || '',
            amount: parseFloat(payment.amount) || 0,
            currency: payment.currency || 'LKR',
            status: payment.status || 'Unknown',
            created_at: payment.created_at || payment.payment_date || payment.date || new Date().toISOString(),
            description: payment.description || '',
            buyer_id: payment.buyer_id || payment.buyerId || '',
            seller_id: payment.seller_id || payment.sellerId || ''
          };
        });
        
        console.log("Fetched payments:", allPayments.length);
        
        // Store the original payments
        setOriginalPayments(allPayments);
        
        // Apply any existing filters
        setPayments(allPayments);
        
        // Reset page when new data is loaded
        setPage(1);
        
        // Calculate total received and pending amounts
        calculateTotals(allPayments);
        
      } catch (error) {
        console.error("Error fetching seller payments:", error);
        console.log("Error status:", error.response?.status);
        console.log("Error details:", error.response?.data);
        
        // Check for 403 error specifically
        if (error.response && error.response.status === 403) {
          setError("You don't have permission to access this data. Please contact support.");
        } else if (error.response && error.response.status === 401) {
          setError("Your session has expired. Please log in again.");
          // Clear the invalid token
          localStorage.removeItem("token");
          // Redirect to login
          router.push("/auth/login");
        } else {
          setError("Failed to load payment data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Apply filters
    const applyFilters = () => {
      if (!originalPayments.length) return;
      
      const filtered = originalPayments.filter(payment => {
        // Filter by status if selected
        if (filterStatus && payment.status.toLowerCase() !== filterStatus.toLowerCase()) {
          return false;
        }
        
        // Filter by month if selected
        if (filterMonth) {
          // Use the normalized date field from our standardized data structure
          const dateStr = payment.created_at || payment.payment_date || payment.date;
          
          // Skip records with no valid date
          if (!dateStr) {
            return false;
          }
          
          // Try to convert to a Date object
          const paymentDate = new Date(dateStr);
          
          // Check if date is valid before using it
          if (isNaN(paymentDate.getTime())) {
            console.log("Invalid date found:", dateStr);
            return false;
          }
          
          // Get month as "01", "02", etc.
          const paymentMonth = String(paymentDate.getMonth() + 1).padStart(2, '0');
          
          // Debug logging to help identify issues
          console.log(`Comparing payment month: ${paymentMonth} with filter: ${filterMonth}`);
          
          if (paymentMonth !== filterMonth) {
            return false;
          }
        }
        
        return true;
      });
      
      setPayments(filtered);
      calculateTotals(filtered);
      
      // Reset to first page whenever filters change
      setPage(1);
    };
    
    // Calculate totals
    const calculateTotals = (paymentsArray) => {
      // Calculate successful payments - exclude refunded payments
      const successfulPayments = paymentsArray.filter(p => 
        p.status.toLowerCase() !== 'refunded' && 
        p.status.toLowerCase() !== 'refund_requested'
      );
      
      // Total amount from successful payments
      const successAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate refunded amount - only count refunded payments
      const refundedPayments = paymentsArray.filter(p => 
        p.status.toLowerCase() === 'refunded' || 
        p.status.toLowerCase() === 'refund_requested'
      );
      const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Platform fee is 20% of the successful payments
      const platformFee = successAmount * 0.2;
      
      // Seller earnings is total revenue minus platform fee
      const sellerEarnings = successAmount - platformFee;
      
      setTotalRevenue(successAmount);
      setTotalRefunded(refundedAmount);
      setTotalPlatformFee(platformFee);
      setTotalSellerEarnings(sellerEarnings);
    };
    
    // Fetch total revenue
    const fetchTotalReceived = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Check token validity
        if (!token || token === "undefined" || token === "null") {
          console.error("No valid token for fetchTotalReceived");
          return;
        }
        
        const response = await axios.get("http://localhost:5000/api/orders/seller/total-revenue", {
          headers: { 
            "Authorization": `Bearer ${token}`, // Added Bearer prefix back
            "Content-Type": "application/json"
          }
        });
        
        // Only update if we have no payments yet - otherwise use our calculated value
        if (payments.length === 0) {
          const totalRev = parseFloat(response.data.totalRevenue);
          
          // Assume this is already net of refunds from the API
          setTotalRevenue(totalRev);
          
          // Calculate and set platform fee and seller earnings
          const platformFee = totalRev * 0.2;
          const sellerEarnings = totalRev - platformFee;
          
          setTotalPlatformFee(platformFee);
          setTotalSellerEarnings(sellerEarnings);
        }
      } catch (error) {
        console.error("Error fetching total revenue:", error);
        console.log("Revenue error status:", error.response?.status);
        console.log("Revenue error details:", error.response?.data);
        
        // Handle 401 errors silently - the main fetchSellerPayments will handle the redirect
        if (error.response && error.response.status !== 401) {
          console.error("Non-authentication error when fetching revenue");
        }
      }
    };

    const handleRefresh = () => {
      fetchSellerPayments();
      fetchTotalReceived();
    };

    // Clear filters
    const handleClearFilters = () => {
      setFilterMonth("");
      setFilterStatus("");
    };



    // Handle month selection for monthly data visualization
  const handleMonthChange = (event, newValue) => {
    setSelectedMonthIndex(newValue);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  //PDF Download and the content
 const handleDownloadReport = () => {
  // If no data, show alert
  if (payments.length === 0) {
    alert("No payment data to export.");
    return;
  }
  
  try {
    // Get current date for filename and timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const timeStr = now.toLocaleTimeString(); // Format: HH:MM:SS
    
    // Get month name for better filename
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[now.getMonth()];
    
    // Create a PDF report
    const doc = new jsPDF();
    
    // Set up document margins and initial position
    const margin = 14;
    let yPosition = margin;
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = doc.internal.pageSize.getWidth() - (margin * 2);
    
    // Calculate total pages needed for pagination
    // We'll update this as we go, starting with an estimate
    let totalPagesEstimate = Math.ceil(payments.length / 18) + 1;
    let currentPage = 1;
    
    // Define variables at function scope to avoid reference errors
    let reportTitle;
    let reportMonth;
    
    // Define these variables at function scope to ensure they're always available
    let grossIncome = 0;
    let refundedAmount = 0;
    let totalIncome = 0;
    let platformFee = 0;
    let netIncome = 0;
    let transactionCount = 0;
    
    // Check if we need to start a new page
    const checkPageBreak = (neededSpace) => {
      // If not enough space left on page for the needed content
      if (yPosition + neededSpace > pageHeight - margin - 15) {
        // Add footer to current page
        addFooter(currentPage, "...");
        
        // Add new page
        doc.addPage();
        currentPage++;
        
        // Reset position
        yPosition = margin + 10;
        
        // Add header to new page
        addPageHeader();
        
        return true;
      }
      return false;
    };
    
    // Add header to a new page
    const addPageHeader = () => {
      // Add Thrift Haven header on new page
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(97, 25, 100);
      doc.text("THRIFT HAVEN", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      
      // Continue with same report title in black
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(reportTitle + " (continued)", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
      
      yPosition += 8;
      
      // Add generated date (right-aligned)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${now.toLocaleDateString()} ${timeStr}`, 
        doc.internal.pageSize.getWidth() - margin, 
        yPosition, 
        { align: "right" }
      );
      
      yPosition += 5;
      
      // Add separator line
      doc.setDrawColor(97, 25, 100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, doc.internal.pageSize.getWidth() - margin, yPosition);
      
      yPosition += 12;
    };
    
    // Add footer to page
    const addFooter = (pageNum, totalPages) => {
      // Add footer with page number and company info
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      
      // Page number on left
      doc.text(
        `Page ${pageNum} of ${totalPages}`, 
        margin, 
        doc.internal.pageSize.getHeight() - 10
      );
      
      // Company name centered at bottom
      doc.setFontSize(10);
      doc.setFont("helvetica");
      doc.text(
        'THRIFT HAVEN', 
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    };
    
    // ===== HEADER SECTION =====
    
    // Add Thrift Haven branding
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(97, 25, 100); // #611964 - brand color
    doc.text("THRIFT HAVEN", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
    
    yPosition += 15;
    
    // Generate report title based on filters or selected month from the tab
    // If a specific month is filtered, use that for the report title
    if (filterMonth) {
      const year = new Date().getFullYear();
      reportTitle = `Payment Report - ${getMonthName(filterMonth)} ${year}`;
      reportMonth = getMonthName(filterMonth);
    } 
    // If we're on the Monthly Overview tab with a selected month, use that
    else if (activeTab === 0 && filteredMonthData) {
      reportTitle = `Payment Report - ${monthNames[selectedMonthIndex]} ${selectedYear}`;
      reportMonth = monthNames[selectedMonthIndex];
    }
    // Otherwise, it's a general report
    else {
      reportTitle = `Payment Report - All Transactions`;
      reportMonth = null;
    }
    
    // Add report title as subheading (in black with larger font)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" });
    
    yPosition += 10;
    
    // Add generated date and time (left-aligned)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${now.toLocaleDateString()} ${timeStr}`, 
      margin, 
      yPosition
    );
    
    yPosition += 8;
    
    // Add separator line
    doc.setDrawColor(97, 25, 100); // #611964
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, doc.internal.pageSize.getWidth() - margin, yPosition);
    
    yPosition += 15;
    
    // ===== BODY SECTION =====
    
    // Add seller information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(97, 25, 100); // #611964
    doc.text("Seller Information:", margin, yPosition);
    
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Name: ${sellerInfo.name}`, margin + 5, yPosition);
    
    yPosition += 7;
    
    if (sellerInfo.id) {
      doc.text(`ID: ${sellerInfo.id}`, margin + 5, yPosition);
      yPosition += 7;
    }
    
    yPosition += 10;
    
    // Check if we need a page break for the summary section
    checkPageBreak(60); // Estimate space needed for summary section
    
    // Add summary section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(97, 25, 100); // #611964
    doc.text('Summary', margin, yPosition);
    
    yPosition += 10;
    
    // If we have a specific month selected or filtered, show that month's details
    if ((activeTab === 0 && filteredMonthData) || (filterMonth && reportMonth)) {
      // Use filteredMonthData for monthly tab, or get filtered month data for transaction tab
      const monthData = activeTab === 0 ? filteredMonthData : 
                        monthlyData.find(m => m.month_name === reportMonth);
      
      if (monthData) {
        // Check if we need a page break for the monthly details
        checkPageBreak(50); // Estimate space needed for monthly details
        
        // Monthly details
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        
        // Update our function-scoped variables with the monthly data
        grossIncome = monthData.gross_income || 0;
        refundedAmount = monthData.refunded_amount || 0;
        totalIncome = monthData.total_income || (grossIncome - refundedAmount);
        platformFee = monthData.platform_fees || totalIncome * 0.2;
        netIncome = (monthData.net_income || totalIncome) * 0.8;
        transactionCount = monthData.transaction_count || 0;
        
        // Then in the PDF, display the values:
        doc.text(`Month: ${reportMonth} ${selectedYear}`, margin + 5, yPosition);
        yPosition += 8;
        
        doc.text(`Gross Revenue: ${formatCurrency(grossIncome)}`, margin + 5, yPosition);
        yPosition += 8;
        
        doc.text(`Platform Fee (20%): ${formatCurrency(platformFee)}`, margin + 5, yPosition);
        yPosition += 8;
        
        doc.text(`Your Earnings: ${formatCurrency(netIncome)}`, margin + 5, yPosition);
        yPosition += 8;
        
        if (monthData.refund_count > 0) {
          doc.text(`Refunds: ${formatCurrency(refundedAmount)} (${monthData.refund_count} transactions)`, margin + 5, yPosition);
          yPosition += 8;
        }
        
        doc.text(`Transaction Count: ${transactionCount}`, margin + 5, yPosition);
        yPosition += 15;
        
        // Add a visual indicator for monthly breakdown
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, yPosition - 7, doc.internal.pageSize.getWidth() - margin - 5, yPosition - 7);
        
        // Add note that these are monthly stats
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text("Monthly statistics shown above", margin + 5, yPosition);
        yPosition += 12;
      }
    }
    
    // Check for page break before overall statistics
    checkPageBreak(40); // Estimate space needed for overall statistics
    
    // Always add overall summary stats
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    // If we showed monthly stats, add a heading for overall stats
    if ((activeTab === 0 && filteredMonthData) || (filterMonth && reportMonth)) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Overall Statistics:", margin + 5, yPosition);
      yPosition += 10;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, margin + 5, yPosition);
    
    yPosition += 8;
    doc.text(`Platform Fee (20%): ${formatCurrency(totalPlatformFee)}`, margin + 5, yPosition);
    
    yPosition += 8;
    // Use totalSellerEarnings for the overall statistics, not the monthly netIncome
    doc.text(`Your Earnings: ${formatCurrency(totalSellerEarnings)}`, margin + 5, yPosition);
    
    yPosition += 8;
    doc.text(`Total Refunds: ${formatCurrency(totalRefunded)}`, margin + 5, yPosition);
    
    yPosition += 8;
    doc.text(`Transaction Count: ${payments.length}`, margin + 5, yPosition);
    
    yPosition += 15;
    
    // Filter info
    let filterInfo = 'Applied filters: ';
    if (filterMonth && filterStatus) {
      filterInfo += `Month: ${getMonthName(filterMonth)}, Status: ${filterStatus}`;
    } else if (filterMonth) {
      filterInfo += `Month: ${getMonthName(filterMonth)}`;
    } else if (filterStatus) {
      filterInfo += `Status: ${filterStatus}`;
    } else {
      filterInfo += 'None';
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(filterInfo, margin, yPosition);
    
    yPosition += 15;
    
    // Check for page break before transactions section
    checkPageBreak(50); // Estimate space needed for transactions header + first few rows
    
    // Transactions section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(97, 25, 100); // #611964
    doc.text('Transactions', margin, yPosition);
    
    yPosition += 10;
    
    // Table headers
    doc.setFillColor(97, 25, 100); // #611964
    doc.setDrawColor(97, 25, 100);
    doc.setTextColor(255, 255, 255);
    
    // Header background
    doc.rect(margin, yPosition - 6, contentWidth, 8, 'F');
    
    // Header text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('Payment ID', margin + 5, yPosition);
    doc.text('Amount', margin + 50, yPosition);
    doc.text('Status', margin + 100, yPosition);
    doc.text('Date', margin + 140, yPosition);
    
    yPosition += 8;
    
    // Add rows
    doc.setFont("helvetica", "normal");
    let rowCount = 0;
    
    // Add alternating row colors
    const addRow = (payment, rowY, isAlternate) => {
      if (isAlternate) {
        doc.setFillColor(240, 235, 244); // Light purple for alternating rows
        doc.rect(margin, rowY - 6, contentWidth, 8, 'F');
      }
      
      // Set text color based on status
      doc.setTextColor(0, 0, 0);
      if (payment.status.toLowerCase() === 'succeeded') {
        doc.setTextColor(0, 128, 0); // Green for succeeded
      } else if (payment.status.toLowerCase() === 'pending') {
        doc.setTextColor(255, 128, 0); // Orange for pending
      } else if (payment.status.toLowerCase() === 'failed' || 
                payment.status.toLowerCase().includes('refund')) {
        doc.setTextColor(255, 0, 0); // Red for failed or refund
      }
      
      // Add row data
      doc.setFontSize(9);
      doc.text(payment.payment_id?.toString() || '', margin + 5, rowY);
      doc.text(formatCurrency(payment.amount, payment.currency), margin + 50, rowY);
      doc.text(payment.status || 'Unknown', margin + 100, rowY);
      doc.text(formatDate(payment.created_at), margin + 140, rowY);
      
      return rowY + 8; // Return next Y position
    };
    
    // Iterate through payments
    for (let i = 0; i < payments.length; i++) {
      // Check if we need a new page - need about 8 units of space for each row
      if (checkPageBreak(8)) {
        // If we started a new page, add the transactions header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(97, 25, 100);
        doc.text('Transactions (continued)', margin, yPosition);
        
        yPosition += 10;
        
        // Recreate table headers
        doc.setFillColor(97, 25, 100);
        doc.setDrawColor(97, 25, 100);
        doc.setTextColor(255, 255, 255);
        
        // Header background
        doc.rect(margin, yPosition - 6, contentWidth, 8, 'F');
        
        // Header text
        doc.setFontSize(10);
        doc.text('Payment ID', margin + 5, yPosition);
        doc.text('Amount', margin + 50, yPosition);
        doc.text('Status', margin + 100, yPosition);
        doc.text('Date', margin + 140, yPosition);
        
        yPosition += 8;
        rowCount = 0;
      }
      
      // Add alternating row colors (even rows get background)
      yPosition = addRow(payments[i], yPosition, rowCount % 2 === 1);
      rowCount++;
    }
    
    // Add footer to the last page with the actual page count
    addFooter(currentPage, currentPage);
    
    // Now go back and update all page numbers with the correct total
    // This is a simplification - in a real implementation you might need to
    // track and update each page's footer separately
    for (let i = 1; i < currentPage; i++) {
      doc.setPage(i);
      
      // Re-add the footer with the correct page count
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      
      // Erase previous footer text (by drawing a white rectangle)
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, pageHeight - 15, 50, 10, 'F');
      
      // Add corrected page number
      doc.text(
        `Page ${i} of ${currentPage}`, 
        margin, 
        pageHeight - 10
      );
    }
    
    // Create filename with filtered month or selected month if applicable
    let fileName = `ThriftHaven_Payment_Report_${dateStr}.pdf`;
    if (filterMonth) {
      const monthIndex = parseInt(filterMonth) - 1;
      const filterMonthName = monthNames[monthIndex];
      fileName = `ThriftHaven_Payment_Report_${filterMonthName}_${now.getFullYear()}.pdf`;
    } else if (activeTab === 0 && reportMonth) {
      fileName = `ThriftHaven_Payment_Report_${reportMonth}_${selectedYear}.pdf`;
    }
    
    // Save the PDF
    doc.save(fileName);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};
    
    // Helper function to get month name from number
    const getMonthName = (monthNumber) => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthNames[parseInt(monthNumber) - 1];
    };
    
    const getStatusChipColor = (status) => {
      const statusLower = status.toLowerCase();
      switch(statusLower) {
        case 'succeeded':
          return 'success';
        case 'pending':
          return 'warning';
        case 'failed':
          return 'error';
        case 'refund requested':
        case 'refund_requested':
          return 'error';
        default:
          return 'default';
      }
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
                  Payment History
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Tooltip title="Refresh data">
                    <IconButton onClick={handleRefresh} color="primary">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Button 
                    variant="outlined" 
                    startIcon={<GetApp />}
                    onClick={handleDownloadReport}
                    sx={{ color: "#611964", borderColor: "#611964" }}
                  >
                    Export PDF
                  </Button>
                </Stack>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Summary Cards */}
              {payments.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: "#f0ebf4", p: 2, height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="#611964">
                          {formatCurrency(totalRevenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          After refunds
                        </Typography>
                      </Card>
                    </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: "#f0ebf4", p: 2, height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Platform Fee (20%)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="#611964">
                          {formatCurrency(totalPlatformFee)}
                        </Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: "#f0ebf4", p: 2, height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Your Earnings
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="#611964">
                          {formatCurrency(totalSellerEarnings)}
                        </Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: "#f0ebf4", p: 2, height: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Transaction Count
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="#611964">
                          {payments.length}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Monthly Revenue Dashboard */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                {/* Tabs for navigation */}
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  sx={{ 
                    mb: 2,
                    '& .MuiTab-root': { color: '#611964' },
                    '& .Mui-selected': { color: '#611964', fontWeight: 'bold' },
                    '& .MuiTabs-indicator': { backgroundColor: '#611964' }
                  }}
                >
                  <Tab 
                    icon={<PieChart />} 
                    iconPosition="start" 
                    label="Monthly Overview" 
                  />
                  <Tab 
                    icon={<CreditCard />} 
                    iconPosition="start" 
                    label="Transactions" 
                  />
                </Tabs>

                {/* Monthly Overview Tab */}
                {activeTab === 0 && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography variant="h5" fontWeight="bold" color="#611964">
                        Monthly Revenue Breakdown
                      </Typography>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="year-select-label">Year</InputLabel>
                        <Select
                          labelId="year-select-label"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          label="Year"
                        >
                          {[2025, 2024, 2023].map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Month Selection Tabs */}
                    <Tabs
                      value={selectedMonthIndex}
                      onChange={handleMonthChange}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ 
                        mb: 3,
                        '& .MuiTab-root': { 
                          minWidth: 'auto', 
                          px: 2, 
                          color: '#611964',
                          fontSize: '0.85rem'
                        },
                        '& .Mui-selected': { fontWeight: 'bold' },
                        '& .MuiTabs-indicator': { backgroundColor: '#611964' }
                      }}
                    >
                      {monthNames.map((name, index) => (
                        <Tab key={index} label={name} />
                      ))}
                    </Tabs>
                    
                    {loadingMonthly ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress sx={{ color: "#611964" }} />
                      </Box>
                    ) : filteredMonthData ? (
                      <>
                        {/* Monthly Details Panel */}
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: '#f0ebf4', 
                          borderRadius: 2, 
                          mb: 3,
                          border: '1px solid #d0b6d9'
                        }}>
                          <Typography variant="h6" fontWeight="bold" color="#611964" gutterBottom>
                            {monthNames[selectedMonthIndex]} {selectedYear} Summary
                          </Typography>
                          
                          <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Gross Revenue
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  {formatCurrency(filteredMonthData.gross_income || 0)}
                                </Typography>
                              </Box>


                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Total Revenue
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  {formatCurrency(filteredMonthData.total_income || (filteredMonthData.gross_income || 0) - (filteredMonthData.refunded_amount || 0))}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={3}>
                              <Box>
          <Typography variant="body2" color="text.secondary">
            Platform Fee (20%)
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {formatCurrency(
              (filteredMonthData.total_income || 
              ((filteredMonthData.gross_income || 0) - (filteredMonthData.refunded_amount || 0))) * 0.2
            )}
          </Typography>
        </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={3}>
                              <Box>
          <Typography variant="body2" color="text.secondary">
            Your Earnings
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="#611964">
            {formatCurrency(
              (filteredMonthData.net_income || 
              ((filteredMonthData.gross_income || 0) - (filteredMonthData.refunded_amount || 0))) * 0.8
            )}
          </Typography>
        </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={3}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Transactions
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  {filteredMonthData.transaction_count || 0}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            {filteredMonthData.refund_count > 0 && (
                              <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                  <Typography variant="body2" color="error">
                                    Refunds
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" color="error">
                                    {formatCurrency(filteredMonthData.refunded_amount || 0)}
                                    <Typography variant="caption" display="block">
                                      ({filteredMonthData.refund_count} transactions)
                                    </Typography>
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                        
                        {/* Monthly Visualization */}
                        <Box sx={{ height: 300, mb: 2 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[{
                                name: monthNames[selectedMonthIndex],
                                'Gross Revenue': filteredMonthData.gross_income || 0,
                                'Platform Fee': filteredMonthData.total_income ||   ((filteredMonthData.gross_income || 0) - (filteredMonthData.refunded_amount || 0)) * 0.2,
                                'Your Earnings': (filteredMonthData.net_income || 
            ((filteredMonthData.gross_income || 0) - (filteredMonthData.refunded_amount || 0))) * 0.8,
                                'Refunds': filteredMonthData.refunded_amount || 0
                              }]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip 
                                formatter={(value) => [formatCurrency(value), ""]}
                              />
                              <Legend />
                              <Bar dataKey="Gross Revenue" fill="#611964" />
                              <Bar dataKey="Platform Fee" fill="#8884d8" />
                              <Bar dataKey="Your Earnings" fill="#4CAF50" />
                              <Bar dataKey="Refunds" fill="#f44336" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No data available for {monthNames[selectedMonthIndex]} {selectedYear}.
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Annual Income Visualization */}
                    <Box sx={{ mt: 4 }}>
                  {/* Monthly Income Dashboard - Static Version */}
  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
  
    
    <Divider sx={{ mb: 3 }} />
    
    {/* Use the simple chart component that doesn't require API */}
    <SimpleMonthlyChart />
    
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      This dashboard shows a visualization of your monthly income. The actual data will be updated from your payment history.
    </Typography>
  </Paper>

                      
                    
                      
                      
                    </Box>
                  </>
                )}

                {/* Transactions Tab */}
                {activeTab === 1 && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography variant="h5" fontWeight="bold" color="#611964">
                        Transaction Details
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Filters */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="month-filter-label">Month</InputLabel>
                        <Select
                          labelId="month-filter-label"
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          label="Month"
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="01">January</MenuItem>
                          <MenuItem value="02">February</MenuItem>
                          <MenuItem value="03">March</MenuItem>
                          <MenuItem value="04">April</MenuItem>
                          <MenuItem value="05">May</MenuItem>
                          <MenuItem value="06">June</MenuItem>
                          <MenuItem value="07">July</MenuItem>
                          <MenuItem value="08">August</MenuItem>
                          <MenuItem value="09">September</MenuItem>
                          <MenuItem value="10">October</MenuItem>
                          <MenuItem value="11">November</MenuItem>
                          <MenuItem value="12">December</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                          labelId="status-filter-label"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="succeeded">Succeeded</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="failed">Failed</MenuItem>
                          <MenuItem value="refunded">Refunded</MenuItem>
                          <MenuItem value="refund_requested">Refund Requested</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Button 
                        variant="contained" 
                        startIcon={<FilterList />} 
                        size="small"
                        onClick={handleClearFilters}
                        sx={{ 
                          bgcolor: "#611964", 
                          '&:hover': { bgcolor: "#4a1154" },
                          height: "40px"
                        }}
                      >
                        Clear Filters
                      </Button>
                    </Box>
                    
                    {/* Payment Cards */}
                    {loading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 5 }}>
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
                    ) : payments.length > 0 ? (
                      <>
                        <Grid container spacing={2}>
                          {paginatedPayments.map((payment) => (
                            <Grid item xs={12} sm={6} lg={4} key={payment.payment_id}>
                              <Card 
                                sx={{ 
                                  bgcolor: "white", 
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
                                  borderRadius: 2,
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  '&:hover': {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Chip 
                                      label={payment.status || 'Unknown'} 
                                      color={getStatusChipColor(payment.status)}
                                      size="small"
                                      sx={{
                                        bgcolor: payment.status.toLowerCase() === 'refund requested' || 
                                                payment.status.toLowerCase() === 'refund_requested' ? 
                                                '#e84a28' : undefined,
                                        color: payment.status.toLowerCase() === 'refund requested' || 
                                              payment.status.toLowerCase() === 'refund_requested' ? 
                                              'white' : undefined
                                      }}
                                    />
                                  </Box>
                                  
                                  {/* Date and Time Display */}
                                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <DateRange sx={{ color: "#611964", mr: 1, fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                                      {formatDate(payment.payment_date || payment.created_at || payment.payment_timestamp)}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <AttachMoney sx={{ color: "#611964", mr: 1 }} />
                                    <Typography variant="h5" fontWeight="medium">
                                      {formatCurrency(payment.amount, payment.currency)}
                                    </Typography>
                                  </Box>
                                  
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                      mb: 2,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%"
                                    }}
                                  >
                                    ID: {payment.payment_intent_id}
                                  </Typography>
                                  
                                  <Divider sx={{ mb: 2 }} />
                                  
                                  {/* Only show platform fee and earnings if payment isn't refunded */}
                                  {payment.status.toLowerCase() !== 'refunded' && 
                                  payment.status.toLowerCase() !== 'refund_requested' && (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Platform Fee (20%):
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                          {formatCurrency(payment.amount * 0.2, payment.currency)}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Your Earnings:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium" color="#611964">
                                          {formatCurrency(payment.amount * 0.8, payment.currency)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {/* Show refund notice if payment is refunded */}
                                  {(payment.status.toLowerCase() === 'refunded' || 
                                    payment.status.toLowerCase() === 'refund_requested') && (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                      <Typography variant="body2" color="error" fontWeight="medium">
                                        This payment has been {payment.status.toLowerCase() === 'refunded' ? 'refunded' : 'marked for refund'}.
                                        No platform fee or earnings will be calculated.
                                      </Typography>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                        
                        {/* Pagination */}
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                          <Button 
                            disabled={page === 1}
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            startIcon={<ArrowBack />}
                            sx={{ mr: 2 }}
                          >
                            Previous
                          </Button>
                          <Typography sx={{ alignSelf: "center", mx: 2 }}>
                            Page {page} of {totalPages || 1}
                          </Typography>
                          <Button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(prev => prev + 1)}
                            endIcon={<ArrowForward />}
                            sx={{ ml: 2 }}
                          >
                            Next
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No payments found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Once you start receiving payments, they will appear here.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Paper>
          </Container>
        </Box>
      </Box>
    );
  };

  export default SellerPayments;