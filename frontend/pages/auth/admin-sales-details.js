import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Stack
} from "@mui/material";
import {
  Assessment,
  PersonSearch,
  FileDownload,
  CurrencyExchange
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  TextField,
  Button,
  Chip,
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem as MenuItemOriginal,
  Badge,
  Drawer
} from "@mui/material";
import {
  ReceiptLong,
  Payments,
  Refresh,
  Logout,
  Search,
  FilterList,
  Dashboard,
  TrendingUp,
  AttachMoney,
  ShoppingBag,
  Menu as MenuIcon,
  Close
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import Sidebar from "../../components/admin-sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MonthlySellerFilter from "../../components/MonthlySellerFilter";
import PlatformFeeCard from "../../components/PlatformFeeCard";
import MonthlyOrderFilter from "../../components/MonthlyOrderFilter";




// Custom styled components
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
}));

const StyledSearch = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
  let color = '#4caf50'; // completed/default
  if (status === 'pending') color = '#ff9800';
  else if (status === 'cancelled') color = '#f44336';
  else if (status === 'processing') color = '#2196f3';

  return {
    backgroundColor: alpha(color, 0.1),
    color: color,
    borderColor: color,
    fontWeight: 600,
  };
});

const formatCurrency = (amount) => `Rs. ${parseFloat(amount).toFixed(2)}`;

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

// Component Definition and State
const AdminSalesDashboard = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [sellerSummary, setSellerSummary] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [open, setOpen] = useState(false);
  const [totalRefundedAmount, setTotalRefundedAmount] = useState(0);
  const [platformFeeSummary, setPlatformFeeSummary] = useState({
    total_platform_fee: 0,
    total_sellers: 0,
    total_orders: 0
  });
  
  // New state variables to track filter period
  const [currentFilterMonth, setCurrentFilterMonth] = useState(null);
  const [currentFilterYear, setCurrentFilterYear] = useState(null);
  
  // Utility functions for chart data
  const getStatusData = () => {
    const statusCount = { shipped: 0, processing: 0, received: 0 };
    orders.forEach(order => {
      order.items?.forEach(item => {
        const status = item.status?.toLowerCase();
        if (statusCount[status] !== undefined) {
          statusCount[status]++;
        }
      });
    });

    return Object.keys(statusCount).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: statusCount[key]
    }));
  };


  const handleOrderPeriodFilter = async (year, month) => {
  setFilterLoading(true);
  try {
    let url = "http://localhost:5000/api/orders/admin/orders-by-period";
    const params = [];

    if (year) params.push(`year=${year}`);
    if (month && month !== "all") params.push(`month=${month}`);
    if (params.length) url += `?${params.join("&")}`;

    const res = await axios.get(url);
    setFilteredOrders(res.data);
  } catch (err) {
    console.error("Error filtering orders by period:", err.response?.data || err.message);
  } finally {
    setFilterLoading(false);
  }
};




  const getTopSellersData = () => {
    return sellerSummary
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 5)
      .map(seller => ({
        name: seller.seller_name?.split(' ')[0] || 'Unnamed',
        revenue: parseFloat(seller.total_revenue || 0)
      }));
  };

  // Helper functions for dashboard metrics
  const getTotalRevenue = () => {
    return sellerSummary.reduce((total, seller) => total + parseFloat(seller.total_revenue || 0), 0);
  };

  const getTotalOrders = () => {
    return orders.length;
  };
  
  const getAverageOrderValue = () => {
    const totalRevenue = getTotalRevenue();
    const totalOrders = getTotalOrders();
    return totalOrders ? totalRevenue / totalOrders : 0;
  };

  // Pending orders count
  const getPendingOrdersCount = () => {
    return orders.filter(order => 
      order.items?.some(item => item.status?.toLowerCase() === 'pending')
    ).length;
  };

  // Data Fetching and Event Handlers
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    } else {
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
     try {
    console.log("Starting to fetch data for dashboard...");
    
    // First try to get the order statistics
    let orderStatsRes;
    try {
      console.log("Fetching order statistics...");
      orderStatsRes = await axios.get("http://localhost:5000/api/orders/admin/statistics");
      console.log("Order statistics fetched successfully");
    } catch (error) {
      console.error("Error fetching order statistics:", error.response?.data || error.message);
      orderStatsRes = { data: { stats: {}, monthlySales: [] } };
    }
    
    // Then try to get the orders data
    let ordersRes;
    try {
      console.log("Fetching all orders...");
      ordersRes = await axios.get("http://localhost:5000/api/orders/admin/all-orders");
      console.log("Orders fetched successfully");
    } catch (error) {
      console.error("Error fetching orders:", error.response?.data || error.message);
      ordersRes = { data: [] };
    }
    
    // Then try to get the seller summary data
    let sellerSummaryRes;
    try {
      console.log("Fetching seller monthly summary...");
      sellerSummaryRes = await axios.get("http://localhost:5000/api/payment/admin/seller-monthly-summary");
      console.log("Seller summary fetched successfully:", sellerSummaryRes.data);
    } catch (error) {
      console.error("Error fetching seller summary:", error.response?.data || error.message);
      sellerSummaryRes = { data: [] };
    }
    
    // Finally try to get the platform fee summary
    let platformFeeSummaryRes;
    try {
      console.log("Fetching platform fee summary...");
      platformFeeSummaryRes = await axios.get("http://localhost:5000/api/payment/admin/platform-fee-summary");
      console.log("Platform fee summary fetched successfully:", platformFeeSummaryRes.data);
    } catch (error) {
      console.error("Error fetching platform fee summary:", error.response?.data || error.message);
      platformFeeSummaryRes = { 
        data: {
          total_platform_fee: 0,
          total_sellers: 0,
          total_orders: 0
        } 
      };
    }


    // Fetch total refunded amount
let refundedRes;
try {
  console.log("Fetching total refunded amount...");
  refundedRes = await axios.get("http://localhost:5000/api/orders/admin/total-refunded");
  console.log("Total refunded amount:", refundedRes.data);
  setTotalRefundedAmount(refundedRes.data.total_refunded || 0);
} catch (error) {
  console.error("Error fetching total refunded amount:", error.response?.data || error.message);
  setTotalRefundedAmount(0);
}


    setOrderStats(orderStatsRes.data);
    setOrders(ordersRes.data);
    setSellerSummary(sellerSummaryRes.data);
    setFilteredSellers(sellerSummaryRes.data);
    setFilteredOrders(ordersRes.data);
    setPlatformFeeSummary(platformFeeSummaryRes.data);
    // Reset filter period when data is refreshed
    setCurrentFilterMonth(null);
    setCurrentFilterYear(null);
  } catch (err) {
    console.error("General error in fetchData:", err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/admin-login");
  };

  const handleSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    setFilteredSellers(sellerSummary.filter(seller =>
      seller.seller_name?.toLowerCase().includes(value) ||
      seller.seller_email?.toLowerCase().includes(value)
    ));
  };

  const handleOrderSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setOrderSearchTerm(value);
    
    let filteredResults = orders.filter(order =>
      order.buyer_name?.toLowerCase().includes(value) ||
      order.items?.some(item => 
        item.product_name?.toLowerCase().includes(value) ||
        (item.seller_name && item.seller_name.toLowerCase().includes(value))
      )
    );
    
    // Apply status filter if not "all"
    if (statusFilter !== "all") {
      filteredResults = filteredResults.filter(order =>
        order.items?.some(item => item.status?.toLowerCase() === statusFilter)
      );
    }
    
    setFilteredOrders(filteredResults);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setFilterAnchorEl(null);
    
    let filteredResults = orders;
    
    // Apply search term filter
    if (orderSearchTerm) {
      filteredResults = filteredResults.filter(order =>
        order.buyer_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.product_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          (item.seller_name && item.seller_name.toLowerCase().includes(orderSearchTerm.toLowerCase()))
        )
      );
    }
    
    // Apply status filter if not "all"
    if (status !== "all") {
      filteredResults = filteredResults.filter(order =>
        order.items?.some(item => item.status?.toLowerCase() === status)
      );
    }
    
    setFilteredOrders(filteredResults);
  };
  
  // Handle monthly filter data
  const handleFilterData = async (filteredData, year, month) => {
    if (filteredData === null) {
      // Reset to original data
      fetchData();
      setCurrentFilterMonth(null);
      setCurrentFilterYear(null);
    } else {
      setSellerSummary(filteredData);
      setFilteredSellers(filteredData);
      // Store the current filter period
      setCurrentFilterMonth(month);
      setCurrentFilterYear(year);
    }
  };

  // Function to handle filtering platform fee data
  const handlePlatformFeeFilter = async (year, month) => {
    setFilterLoading(true);
    try {
      let url = 'http://localhost:5000/api/payments/admin/platform-fee-summary';
      
      // Add query parameters if selected
      const params = [];
      if (year) params.push(`year=${year}`);
      if (month && month !== 'all') params.push(`month=${month}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await axios.get(url);
      setPlatformFeeSummary(response.data);
    } catch (error) {
      console.error('Error fetching platform fee data:', error);
    } finally {
      setFilterLoading(false);
    }
  };

//get top seller by orders
const getTopSellerByOrders = () => {
  return [...sellerSummary]
    .sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))[0];
};


//get top seller chart
const getTopSellersByOrdersData = () => {
  return [...sellerSummary]
    .sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))
    .slice(0, 5)
    .map((seller, index) => ({
      name: `${index + 1} ${seller.seller_name?.split(" ")[0] || "Seller"}`,
      orders: seller.total_orders || 0
    }));
};


// Total orders placed (number of order objects)
const getTotalOrdersPlaced = () => {
  return orders.length;
};

// Total individual order items (across all orders)
const getTotalOrderItems = () => {
  return orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
};





  // PDF Utilities
// Get formatted month name
const getMonthName = (monthNum) => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  return months[parseInt(monthNum) - 1] || "";
};
  
  // Get formatted filter period for PDF title
const getFilterPeriodText = () => {
  if (currentFilterMonth && currentFilterYear) {
    return `${getMonthName(currentFilterMonth)} ${currentFilterYear}`;
  } else if (currentFilterYear) {
    return `Year ${currentFilterYear}`;
  }
  return "All Time";
};

const addPDFHeader = (doc, title, subtitle = null) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Set background for header
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 75, 'F');
  
  // Add shop name centered
  doc.setTextColor(97, 25, 100); // #611964 - Main brand color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const shopName = "Thrift Haven";
  const shopNameWidth = doc.getStringUnitWidth(shopName) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  doc.text(shopName, (pageWidth - shopNameWidth) / 2, 25);
  
  // Add main title centered
  doc.setFontSize(18);
  const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  doc.text(title, (pageWidth - titleWidth) / 2, 40);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    const subtitleWidth = doc.getStringUnitWidth(subtitle) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 50);
  }
  
  // Add date and time aligned left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Dark gray
  const currentDate = format(new Date(), "PPpp"); // Format: Apr 29, 2023, 10:30 AM
  doc.text(`Generated: ${currentDate}`, 14, 65);
  
  // Add a divider line
  doc.setDrawColor(97, 25, 100);
  doc.setLineWidth(0.5);
  doc.line(14, 70, pageWidth - 14, 70);
  
  return 80; // Return the Y position after the header
};

// Add footer with page numbers
const addPDFFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150); // Light gray
    
    // Footer text
    doc.text("Thrift Haven", 14, doc.internal.pageSize.height - 10);
    
    // Page numbers
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 30,
      doc.internal.pageSize.height - 10
    );
  }
};

// Simple function to add a continuation header for multi-page reports
const addContinuationHeader = (doc, mainTitle, subtitle = null) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Add lightweight header background
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Add title with "Continued" text
  doc.setTextColor(97, 25, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const continuationTitle = `${mainTitle} - Continued`;
  doc.text(continuationTitle, 14, 20);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, 14, 30);
  }
  
  // Add a divider line
  doc.setDrawColor(97, 25, 100);
  doc.setLineWidth(0.5);
  doc.line(14, 35, pageWidth - 14, 35);
  
  return 45; // Return the Y position after the header
};







// Enhanced seller summary export with proper multi-page handling
const exportSellerSummaryPDF = () => {
  const doc = new jsPDF();
  const filterPeriod = getFilterPeriodText();
  const mainTitle = "Seller-wise Sales Summary";
  const subtitle = filterPeriod !== "All Time" ? filterPeriod : null;
  
  let startY = addPDFHeader(doc, mainTitle, subtitle);
  
  // Calculate summary statistics
  const totalRevenue = filteredSellers.reduce((sum, seller) => sum + parseFloat(seller.total_revenue || 0), 0);
  const totalOrders = filteredSellers.reduce((sum, seller) => sum + parseInt(seller.total_orders || 0), 0);
  const totalPlatformFees = filteredSellers.reduce((sum, seller) => sum + parseFloat(seller.total_platform_fee || 0), 0);
  const totalSellerEarnings = filteredSellers.reduce((sum, seller) => sum + parseFloat(seller.total_seller_earnings || 0), 0);
  
  // Add summary statistics BEFORE the table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(97, 25, 100);
  doc.text("Summary Statistics", 14, startY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  // Add stats in two columns for better space usage
  const col1X = 14;
  const col2X = doc.internal.pageSize.width / 2 + 10;
  const lineHeight = 7;
  let currentY = startY + 10;
  
  doc.text(`Total Sellers: ${filteredSellers.length}`, col1X, currentY);
  doc.text(`Total Orders: ${totalOrders}`, col2X, currentY);
  currentY += lineHeight;
  
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, col1X, currentY);
  doc.text(`Total Platform Fees: ${formatCurrency(totalPlatformFees)}`, col2X, currentY);
  currentY += lineHeight;
  
  doc.text(`Total Seller Earnings: ${formatCurrency(totalSellerEarnings)}`, col1X, currentY);
  currentY += lineHeight;
  
  // Add filter information if filtered
  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`* This report shows data for ${filterPeriod}`, col1X, currentY);
    currentY += lineHeight;
  }
  
  // Add divider line before table
  doc.setDrawColor(97, 25, 100);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, doc.internal.pageSize.width - 14, currentY);
  currentY += lineHeight;
  
  // Add table heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(97, 25, 100);
  doc.text("Seller Details", 14, currentY);
  currentY += 7;
  
  // Use autoTable with proper pagination handling
  autoTable(doc, {
    startY: currentY,
    head: [["Seller Name", "Email", "Total Orders", "Total Revenue", "Platform Fee", "Seller Earnings"]],
    body: filteredSellers.map(seller => [
      seller.seller_name || "",
      seller.seller_email || "",
      seller.total_orders || '-',
      formatCurrency(seller.total_revenue || 0),
      formatCurrency(seller.total_platform_fee || 0),
      formatCurrency(seller.total_seller_earnings || 0)
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [97, 25, 100], // #611964
      fontSize: 11,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray
    },
    // Handle page break events for multi-page reports
    didDrawPage: (data) => {
      // Add header to new pages (but not the first one)
      if (data.pageNumber > 1) {
        // Add lightweight header for continuation pages
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
        
        doc.setTextColor(97, 25, 100);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        const continuationTitle = `${mainTitle} - Continued`;
        doc.text(continuationTitle, 14, 20);
        
        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(subtitle, 14, 30);
        }
        
        // Add a divider line
        doc.setDrawColor(97, 25, 100);
        doc.setLineWidth(0.5);
        doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
      }
    },
    margin: { top: 40 }, // Give space for the continued header
  });
  
  // Add footer with page numbers
  addPDFFooter(doc);
  
  // Save the PDF with period in the filename if filtered
  const filename = subtitle 
    ? `seller_summary_${filterPeriod.replace(/\s+/g, '_').toLowerCase()}.pdf`
    : "seller_summary.pdf";
  
  doc.save(filename);
};



const exportOrderDetailsPDF = () => {
  const doc = new jsPDF();
  const mainTitle = "Order Details Report";
  let subtitle = getFilterPeriodText(); // use the same logic as seller summary

  
  // Add status filter to subtitle if not "all"
  if (statusFilter !== "all") {
    subtitle = `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
  }
  
  // Add search term to subtitle if searched
  // if (orderSearchTerm) {
  //   if (subtitle) {
  //     subtitle += ` | Search: "${orderSearchTerm}"`;
  //   } else {
  //     subtitle = `Search: "${orderSearchTerm}"`;
  //   }
  // }
  
  let startY = addPDFHeader(doc, mainTitle, subtitle);
  
  // Calculate summary statistics
  const visibleOrders = filteredOrders.flatMap(order => 
    order.items?.filter(item => statusFilter === "all" || item.status?.toLowerCase() === statusFilter) || []
  );
  
  const totalOrders = visibleOrders.length;
  const totalValue = visibleOrders.reduce((sum, item) => 
    sum + (parseFloat(item.price || 0) * (item.quantity || 0)), 0
  );
  
  // Count by status
  const statusCounts = visibleOrders.reduce((acc, item) => {
    const status = (item.status || "").toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Add summary statistics BEFORE the table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(97, 25, 100);
  doc.text("Order Summary", 14, startY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  let currentY = startY + 10;
  const lineHeight = 7;
  
  // Main summary stats
  doc.text(`Total Orders: ${totalOrders}`, 14, currentY);
  doc.text(`Total Value: ${formatCurrency(totalValue)}`, doc.internal.pageSize.width / 2 + 10, currentY);
  currentY += lineHeight;
  
  if (statusFilter === "all") {
    // Only show status breakdown if not already filtered by status
    doc.setFont("helvetica", "bold");
    doc.text("Order Status Breakdown:", 14, currentY);
    currentY += lineHeight;
    
    doc.setFont("helvetica", "normal");
    // Display count for each status
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (status) {
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        doc.text(`${formattedStatus}: ${count} orders`, 25, currentY);
        currentY += lineHeight - 1; // Tighter spacing for status counts
      }
    });
    currentY += 3; 
  }
  
  // Add filter information
  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    let filterText = "";
    if (statusFilter !== "all") {
      filterText = `Filtered by status: "${statusFilter}"`;
    }
    if (orderSearchTerm) {
      if (filterText) filterText += " and ";
      filterText += `search term: "${orderSearchTerm}"`;
    }
    
    doc.text(`* This report is ${filterText}`, 14, currentY);
    currentY += lineHeight;
  }
  
  // Add divider line before table
  doc.setDrawColor(97, 25, 100);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, doc.internal.pageSize.width - 14, currentY);
  currentY += lineHeight;
  
  // Add table heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(97, 25, 100);
  doc.text("Order Details", 14, currentY);
  currentY += 7;
  
  // Add the table with pagination support
  autoTable(doc, {
    startY: currentY,
    head: [["Order ID", "Buyer", "Product", "Seller", "Price", "Quantity", "Status"]],
    body: filteredOrders.flatMap(order =>
      order.items?.map(item => {
        // Skip this item if status filter is applied and doesn't match
        if (statusFilter !== "all" && item.status?.toLowerCase() !== statusFilter) {
          return null;
        }
        
        return [
          `#${item.order_id}`,
          order.buyer_name || "",
          item.product_name || "",
          item.seller_name || "",
          formatCurrency(item.price || 0),
          item.quantity || 0,
          item.status || ""
        ];
      }).filter(Boolean) || []
    ),
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [97, 25, 100], // #611964
      fontSize: 11,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Order ID
      1: { cellWidth: 30 }, // Buyer
      2: { cellWidth: 40 }, // Product
      3: { cellWidth: 30 }, // Seller
      4: { cellWidth: 25 }, // Price
      5: { cellWidth: 15 }, // Quantity
      6: { cellWidth: 25 }, // Status
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], 
    },
    // Handle page break events for multi-page reports
    didDrawPage: (data) => {
      // Add header to new pages (but not the first one)
      if (data.pageNumber > 1) {
        // Add lightweight header for continuation pages
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
        
        doc.setTextColor(97, 25, 100);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        const continuationTitle = `${mainTitle} - Continued`;
        doc.text(continuationTitle, 14, 20);
        
        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(subtitle, 14, 30);
        }
        
        // Add a divider line
        doc.setDrawColor(97, 25, 100);
        doc.setLineWidth(0.5);
        doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
      }
    },
    // Status cell formatting with text-only status indicators, no background colors
    didDrawCell: (data) => {
      // No custom background colors for status cells
      // Just use text formatting instead
      if (data.column.index === 6 && data.section === 'body' && data.cell.raw) {
        
      }
    },
    margin: { top: 40 }, // Give space for the continued header
  });
  
  // Add footer
  addPDFFooter(doc);
  
  // Save the PDF with appropriate filename
  let filename = "order_details";
  if (statusFilter !== "all") {
    filename += `_${statusFilter}`;
  }
  if (orderSearchTerm) {
    filename += "_filtered";
  }
  filename += ".pdf";
  
  doc.save(filename);
};


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#611964' }} />
      </Box>
    );
  }











  return (
    <Box sx={{ display: "flex", bgcolor: "#f5f5f7", minHeight: "100vh" }}>
      {/* Sidebar for mobile */}
      {isSmallScreen ? (
        <>
          <IconButton 
            onClick={() => setOpen(true)} 
            sx={{ 
              position: "absolute", 
              top: 16, 
              left: 16, 
              color: "#611964",
              backgroundColor: "white",
              boxShadow: 1,
              zIndex: 1200,
              "&:hover": {
                backgroundColor: "#f0f0f0"
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer 
            open={open} 
            onClose={() => setOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                backgroundColor: "#611964",
                color: "white"
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <Close />
              </IconButton>
            </Box>
            <Sidebar />
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            backgroundColor: "#611964",
            color: "white",
            height: "100vh",
            position: "sticky",
            top: 0,
            boxShadow: "4px 0px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Sidebar />
        </Box>
      )}
      
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
      }}>
        {/* Header Bar */}
        <Box sx={{ 
          p: 2, 
          bgcolor: "white", 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 10,
          zIndex: 1100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#611964' }}>
              Sales Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchData} sx={{ color: "#611964" }}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <Button 
                onClick={handleLogout}
                startIcon={<Logout />}
                sx={{ 
                  color: "#611964",
                  "&:hover": {
                    backgroundColor: "#f0ebf4"
                  }
                }}
              >
              </Button>
            </Tooltip>
          </Box>
        </Box>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
         
         
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      Total Revenue
                    </Typography>
                    <AttachMoney sx={{ color: '#611964' }} />
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(getTotalRevenue())}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      After reduce the refunds
                    </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
  <StyledCard>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Total Refunded Amount
        </Typography>
        <CurrencyExchange sx={{ color: '#611964' }} />
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
        {formatCurrency(totalRefundedAmount)}
      </Typography>
    </CardContent>
  </StyledCard>
</Grid>

            
            {/*  Platform Fee Card */}
            <Grid item xs={12} sm={6} md={3}>
              <PlatformFeeCard 
                platformFees={platformFeeSummary.total_platform_fee} 
                loading={filterLoading} 
              />
            </Grid>
            
           <Grid item xs={12} sm={6} md={3}>
  <StyledCard>
    <CardContent sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'flex-start',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        width: '100%',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Top Seller (by Orders)
        </Typography>
        <PersonSearch sx={{ color: '#611964' }} />
      </Box>
      <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5, color: 'black' }} noWrap>
        {getTopSellerByOrders()?.seller_name || 'N/A'}
      </Typography>
      <Typography variant="h6" component="div" sx={{ mb: 1 }}>
        {getTopSellerByOrders()?.total_orders || 0} Orders
      </Typography>
    </CardContent>
  </StyledCard>
</Grid>
          </Grid>






 {/* and row Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
         
            
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      Total Orders placed
                    </Typography>
                    <ShoppingBag sx={{ color: '#611964' }} />
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {getTotalOrders()}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            
       
 
           <Grid item xs={12} sm={6} md={3}>
  <StyledCard>
    <CardContent sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'flex-start',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        width: '100%',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Top order Items
        </Typography>
            <ShoppingBag sx={{ color: '#611964' }} />
      </Box>
       <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {getTotalOrderItems()}
                  </Typography>
    </CardContent>
  </StyledCard>
</Grid>
          </Grid>


          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#611964' }}>
                  Monthly Sales Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={orderStats?.monthlySales || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#611964" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#611964' }}>
                  Order Status Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name} (${value})`}
                    >
                      {getStatusData().map((entry, index) => {
                        let color;
                        switch(entry.name.toLowerCase()) {
                          case 'shipped': color = '#ff9800'; break;
                          case 'processing': color = '#2196f3'; break;
                          case 'received': color = '#f44336'; break;
                          default: color = COLORS[index % COLORS.length];
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      formatter={(value, entry, index) => {
                        const statusData = getStatusData();
                        const totalOrders = statusData.reduce((sum, item) => sum + item.value, 0);
                        const percent = totalOrders > 0 ? ((statusData[index].value / totalOrders) * 100).toFixed(1) : 0;
                        return `${value}: ${percent}%`;
                      }}
                    />
                    <RechartsTooltip 
                      formatter={(value, name, props) => {
                        const totalOrders = getStatusData().reduce((sum, item) => sum + item.value, 0);
                        const percent = totalOrders > 0 ? ((value / totalOrders) * 100).toFixed(1) : 0;
                        return [`${value} orders (${percent}%)`, name];
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>




          {/* Tabs Navigation */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  py: 2
                },
                '& .Mui-selected': {
                  color: '#611964'
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#611964'
                }
              }}
            >
              <Tab label="Seller Summary" icon={<Payments />} iconPosition="start" />
              <Tab label="Order Details" icon={<ReceiptLong />} iconPosition="start" />
              <Tab label="Top Sellers" icon={<TrendingUp />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          {tabValue === 0 && (
            <>
              {/* Monthly Seller Filter Component */}
              <MonthlySellerFilter 
                onFilterData={handleFilterData} 
                isLoading={filterLoading} 
                setIsLoading={setFilterLoading} 
              />
              
              <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#611964' }}>
                    Seller-wise Sales Summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ position: 'relative' }}>
                      <SearchIconWrapper>
                        <Search />
                      </SearchIconWrapper>
                      <StyledInputBase
                        size="small"
                        placeholder="Search sellers..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        variant="outlined"
                        sx={{ width: 250 }}
                      />
                    </Box>
                    <Button 
                      variant="outlined" 
                      startIcon={<FileDownload />}
                      onClick={exportSellerSummaryPDF}
                      sx={{ 
                        borderColor: '#611964',
                        color: '#611964',
                        '&:hover': {
                          borderColor: '#7B1FA2',
                          backgroundColor: 'rgba(97, 25, 100, 0.04)'
                        }
                      }}
                    >
                      Export PDF
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: 'rgba(97, 25, 100, 0.08)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Seller Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total Orders</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total Revenue</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total Platform Fees</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total Seller Earnings</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredSellers.length > 0 ? (
                        filteredSellers.map((seller, index) => (
                          <TableRow key={index} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{seller.seller_name || ""}</TableCell>
                            <TableCell>{seller.seller_email || ""}</TableCell>
                            <TableCell align="right">{seller.total_orders || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                              {formatCurrency(seller.total_revenue || 0)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#9c27b0' }}>
                              {formatCurrency(seller.total_platform_fee || 0)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#0277bd' }}>
                              {formatCurrency(seller.total_seller_earnings || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No matching sellers found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
          {tabValue === 1 && (
  <>
    <MonthlyOrderFilter 
      onFilterData={handleOrderPeriodFilter} 
      isLoading={filterLoading}
    />
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#611964' }}>
                  All Order Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ position: 'relative' }}>
                    <SearchIconWrapper>
                      <Search />
                    </SearchIconWrapper>
                    <StyledInputBase
                      size="small"
                      placeholder="Search orders..."
                      value={orderSearchTerm}
                      onChange={handleOrderSearchChange}
                      variant="outlined"
                      sx={{ width: 250 }}
                    />
                  </Box>
                  
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                      sx={{ 
                        borderColor: statusFilter !== 'all' ? '#611964' : 'rgba(0, 0, 0, 0.23)',
                        color: statusFilter !== 'all' ? '#611964' : 'inherit',
                        bgcolor: statusFilter !== 'all' ? 'rgba(97, 25, 100, 0.04)' : 'transparent'
                      }}
                    >
                      {statusFilter === 'all' ? 'Filter Status' : `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
                    </Button>
                    <Menu
                      anchorEl={filterAnchorEl}
                      open={Boolean(filterAnchorEl)}
                      onClose={() => setFilterAnchorEl(null)}
                    >
                      <MenuItem onClick={() => handleStatusFilterChange('all')}>All Statuses</MenuItem>
                      <MenuItem onClick={() => handleStatusFilterChange('completed')}>Completed</MenuItem>
                      <MenuItem onClick={() => handleStatusFilterChange('pending')}>Pending</MenuItem>
                      <MenuItem onClick={() => handleStatusFilterChange('processing')}>Processing</MenuItem>
                      <MenuItem onClick={() => handleStatusFilterChange('cancelled')}>Cancelled</MenuItem>
                    </Menu>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    startIcon={<FileDownload />}
                    onClick={exportOrderDetailsPDF}
                    sx={{ 
                      borderColor: '#611964',
                      color: '#611964',
                      '&:hover': {
                        borderColor: '#7B1FA2',
                        backgroundColor: 'rgba(97, 25, 100, 0.04)'
                      }
                    }}
                  >
                    Export PDF
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'rgba(97, 25, 100, 0.08)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Buyer Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Seller Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.flatMap(o => o.items?.map(item => {
                      // Skip this item if status filter is applied and doesn't match
                      if (statusFilter !== "all" && item.status?.toLowerCase() !== statusFilter) {
                        return null;
                      }
                      
                      return (
                        <TableRow key={`${o.id}-${item.order_id}`} hover>
                          <TableCell>#{item.order_id}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{o.buyer_name || ""}</TableCell>
                          <TableCell>{item.product_name || ""}</TableCell>
                          <TableCell>{item.seller_name || ""}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(item.price || 0)}
                          </TableCell>
                          <TableCell align="right">{item.quantity || 0}</TableCell>
                          <TableCell>
                            <StatusChip
                              status={item.status?.toLowerCase() || ""}
                              label={item.status || ""}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }).filter(Boolean)) || []}
                    {filteredOrders.length === 0 || filteredOrders.every(o => o.items?.every(item => statusFilter !== "all" && item.status?.toLowerCase() !== statusFilter)) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No matching orders found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            </>
          )}

          {tabValue === 2 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#611964', mb: 1 }}>
                  Top Sellers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  top 5 sellers / who sells more
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={getTopSellersByOrdersData()}
    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    layout="vertical"
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" />
    <YAxis dataKey="name" type="category" width={100} />
    <RechartsTooltip formatter={(value) => `${value} orders`} />
    <Bar 
      dataKey="orders" 
      name="Orders" 
      fill="#8884d8" 
      radius={[0, 4, 4, 0]}
      background={{ fill: '#eee' }}
    >
      {getTopSellersByOrdersData().map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>

            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminSalesDashboard;