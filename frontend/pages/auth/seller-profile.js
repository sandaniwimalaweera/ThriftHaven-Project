// frontend/pages/auth/seller-profile.js
import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Button,
  Rating,
  Paper,
  Divider,
  Chip,
  Container,
  Fade,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Edit as EditIcon,
  ShoppingBag,
  Star,
  Person,
  Phone,
  Email,
  LocationOn,
  Store
} from "@mui/icons-material";
import SellerSidebar from "../../components/seller-page-sidebar";

// Import the mock data - this would come from your API in a real app
const mockSeller = {
  name: "John Doe",
  email: "johndoe@example.com",
  contact: "+94 77 123 4567",
  rating: 4.5,
  address: "123 Main St, Colombo",
  joinDate: "January 2023",
  totalProducts: 24,
  totalSales: 156,
};

const mockProducts = [
  {
    id: 1,
    product_name: "Vintage Denim Jacket",
    original_price: 3500,
    price: 2800,
    size: "M",
    status: "Active",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0",
  },
  {
    id: 2,
    product_name: "Floral Summer Dress",
    original_price: 2500,
    price: 1800,
    size: "S",
    status: "Active",
    image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",
  },
  {
    id: 3,
    product_name: "Classic White Sneakers",
    original_price: 4000,
    price: 3200,
    size: "42",
    status: "Active",
    image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28",
  },
  {
    id: 4,
    product_name: "Leather Handbag",
    original_price: 5500,
    price: 4300,
    size: "One Size",
    status: "Active",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
  },
  {
    id: 5,
    product_name: "Casual Cotton T-Shirt",
    original_price: 1500,
    price: 950,
    size: "L",
    status: "Active",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  },
  {
    id: 6,
    product_name: "Winter Wool Coat",
    original_price: 7500,
    price: 6000,
    size: "XL",
    status: "Active",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3",
  }
];

const mockReviews = [
  {
    reviewer: "Alice Smith",
    rating: 5,
    date: "2023-06-15",
    comment: "Excellent seller! The item was exactly as described and shipping was fast.",
  },
  {
    reviewer: "Bob Johnson",
    rating: 4,
    date: "2023-05-22",
    comment: "Good communication and the item was in great condition. Would buy from again.",
  },
  {
    reviewer: "Carol Williams",
    rating: 5,
    date: "2023-04-10",
    comment: "Super happy with my purchase. This seller is very professional and responsive.",
  },
  {
    reviewer: "David Brown",
    rating: 3,
    date: "2023-03-05",
    comment: "Product was okay but took a while to ship. Seller was helpful with my questions though.",
  },
];

function SellerProfile() {
  // State for tab selection
  const [tabValue, setTabValue] = useState(0);
  const [userName, setUserName] = useState(mockSeller.name);
  
  // Create references for scrolling
  const productsRef = useRef(null);
  const reviewsRef = useRef(null);
  
  useEffect(() => {
    // In a real app, you would fetch user data here
    // For now, we'll just use the mock data
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleScrollToSection = (section) => {
    if (section === "products" && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: "smooth" });
      setTabValue(0);
    } else if (section === "reviews" && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth" });
      setTabValue(1);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Use the SellerSidebar component */}
      <SellerSidebar userName={userName} />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          marginLeft: "330px", 
          width: "calc(100% - 330px)",
          minHeight: "100vh",
          bgcolor: "#f9f9f9",
          flexGrow: 1,
          p: 4
        }}
      >
        <Fade in={true} timeout={800}>
          <Container maxWidth="xl">
            {/* Profile Information Card */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 2,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "5px",
                  bgcolor: "#611964",
                }
              }}
            >
              <Grid container spacing={4}>
                <Grid item xs={12} md={3} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Avatar 
                    sx={{ 
                      width: 150, 
                      height: 150, 
                      bgcolor: "#f0ebf4", 
                      color: "#611964",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      mb: 2
                    }}
                  >
                    <Store sx={{ fontSize: 80 }} />
                  </Avatar>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                      <Rating 
                        value={mockSeller.rating} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1, fontWeight: "medium" }}>
                        {mockSeller.rating}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Seller since {mockSeller.joinDate}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={9}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold" color="#611964">
                      {mockSeller.name}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<EditIcon />}
                      sx={{ 
                        color: "#611964", 
                        borderColor: "#611964",
                        "&:hover": {
                          borderColor: "#4a1154",
                          bgcolor: "#f0ebf4"
                        }
                      }}
                    >
                      Edit Profile
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Email sx={{ color: "#611964", mr: 1.5 }} />
                        <Typography variant="body1">{mockSeller.email}</Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Phone sx={{ color: "#611964", mr: 1.5 }} />
                        <Typography variant="body1">{mockSeller.contact}</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <LocationOn sx={{ color: "#611964", mr: 1.5 }} />
                        <Typography variant="body1">{mockSeller.address}</Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <ShoppingBag sx={{ color: "#611964", mr: 1.5 }} />
                        <Typography variant="body1">{mockSeller.totalProducts} Products Listed</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: "#f0ebf4", 
                          textAlign: "center",
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold" color="#611964">
                          {mockSeller.totalProducts}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Products
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: "#f0ebf4", 
                          textAlign: "center",
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold" color="#611964">
                          {mockSeller.totalSales}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sales
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: "#f0ebf4", 
                          textAlign: "center",
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold" color="#611964">
                          {mockReviews.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reviews
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: "#f0ebf4", 
                          textAlign: "center",
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold" color="#611964">
                          {mockSeller.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rating
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Tabs for navigation */}
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
                <Tab icon={<ShoppingBag sx={{ mr: 1 }} />} iconPosition="start" label="Products" onClick={() => handleScrollToSection("products")} />
                <Tab icon={<Star sx={{ mr: 1 }} />} iconPosition="start" label="Reviews" onClick={() => handleScrollToSection("reviews")} />
              </Tabs>
            </Box>
            
            {/* Products Section */}
            <Box ref={productsRef} sx={{ mb: 6, scrollMarginTop: "100px" }}>
              <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#611964" }}>
                  Your Products
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<EditIcon />}
                  sx={{ 
                    bgcolor: "#611964",
                    "&:hover": {
                      bgcolor: "#4a1154"
                    }
                  }}
                >
                  Add New Product
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {mockProducts.map((prod) => (
                  <Grid item xs={12} sm={6} md={4} key={prod.id}>
                    <Card 
                      sx={{ 
                        position: "relative", 
                        borderRadius: 2, 
                        overflow: "hidden",
                        transition: "transform 0.3s, box-shadow 0.3s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={prod.image}
                        alt={prod.product_name}
                        sx={{ objectFit: "cover" }}
                      />
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Typography variant="h6" fontWeight="medium" noWrap sx={{ maxWidth: "70%" }}>
                            {prod.product_name}
                          </Typography>
                          <Chip 
                            label={prod.status} 
                            size="small"
                            sx={{ 
                              bgcolor: prod.status === "Active" ? "#e3f2fd" : "#ffebee",
                              color: prod.status === "Active" ? "#1976d2" : "#d32f2f",
                              fontWeight: "medium"
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: "flex", alignItems: "baseline", mt: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: "line-through", 
                              color: "text.secondary",
                              mr: 1
                            }}
                          >
                            LKR {prod.original_price.toLocaleString()}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#611964" }}>
                            LKR {prod.price.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Size: {prod.size}
                        </Typography>
                        
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            sx={{ 
                              color: "#611964",
                              "&:hover": {
                                bgcolor: "#f0ebf4"
                              }
                            }}
                          >
                            Edit
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {mockProducts.length === 0 && (
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: "center", 
                    borderRadius: 2,
                    bgcolor: "#f8f8f8",
                    border: "1px dashed #ccc"
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No products listed yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start adding your products to your store
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: "#611964",
                      "&:hover": {
                        bgcolor: "#4a1154"
                      }
                    }}
                  >
                    Add First Product
                  </Button>
                </Paper>
              )}
            </Box>

            {/* Reviews Section */}
            <Box ref={reviewsRef} sx={{ scrollMarginTop: "100px" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3, color: "#611964" }}>
                Customer Reviews
              </Typography>
              
              {mockReviews.map((review, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid #eee",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6">
                      {review.reviewer}
                    </Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    {new Date(review.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Typography>
                  
                  <Typography variant="body1">
                    {review.comment}
                  </Typography>
                </Paper>
              ))}
              
              {mockReviews.length === 0 && (
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: "center", 
                    borderRadius: 2,
                    bgcolor: "#f8f8f8",
                    border: "1px dashed #ccc"
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No reviews yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reviews will appear here once customers leave feedback on your products
                  </Typography>
                </Paper>
              )}
            </Box>
          </Container>
        </Fade>
      </Box>
    </Box>
  );
}

export default SellerProfile;