import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Tooltip, IconButton, TextField, useMediaQuery,
  Divider, Card, CardContent, InputAdornment, Avatar, Grid,
  CircularProgress, Badge, Tabs, Tab, Menu, MenuItem, ListItemIcon,
  ListItemText, Alert, Button
} from "@mui/material";
import {
  Refresh, Delete, Search, Star, StarBorder, Logout,
  PersonOutline, Comment, Reply, FilterList, ThumbUp,
  ThumbDown, MoreVert, Visibility
} from "@mui/icons-material";
import Sidebar from "../../components/admin-sidebar";

const RatingChip = ({ rating }) => {
  const color = rating >= 4 ? "success" : rating >= 2 ? "warning" : "error";
  const stars = Array(5).fill(0).map((_, i) =>
    i < rating ?
      <Star key={i} fontSize="small" sx={{ fontSize: '14px', color: color === 'success' ? '#4caf50' : color === 'warning' ? '#ff9800' : '#f44336' }} /> :
      <StarBorder key={i} fontSize="small" sx={{ fontSize: '14px', color: 'text.disabled' }} />
  );

  return (
    <Box display="flex" alignItems="center">
      {stars}
      <Typography
        variant="caption"
        sx={{
          ml: 0.5,
          color: color === 'success' ? 'success.main' : color === 'warning' ? 'warning.main' : 'error.main',
          fontWeight: 600
        }}
      >
        ({rating})
      </Typography>
    </Box>
  );
};

const AdminSellerReviews = () => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width:768px)");

  const [reviews, setReviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [highRatings, setHighRatings] = useState(0);
  const [lowRatings, setLowRatings] = useState(0);

  //Admin login protection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    } else {
      fetchReviews();
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterReviewsByRating(newValue);
  };

  const filterReviewsByRating = (tabIndex) => {
    if (tabIndex === 0) {
      setFiltered(reviews.filter(r => search ?
        (r.seller_name.toLowerCase().includes(search.toLowerCase()) ||
          r.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
          r.comment?.toLowerCase().includes(search.toLowerCase())) : true
      ));
    } else {
      const ratingMap = {
        1: [5],
        2: [4],
        3: [3],
        4: [1, 2],
      };
      setFiltered(reviews.filter(r =>
        ratingMap[tabIndex].includes(r.rating) &&
        (search ?
          (r.seller_name.toLowerCase().includes(search.toLowerCase()) ||
            r.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
            r.comment?.toLowerCase().includes(search.toLowerCase())) : true
        )
      ));
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/reviews/admin/all");
      const reviewData = res.data;
      setReviews(reviewData);
      setFiltered(reviewData);

      setTotalReviews(reviewData.length);
      const totalRating = reviewData.reduce((sum, r) => sum + r.rating, 0);
      setAverageRating(reviewData.length > 0 ? (totalRating / reviewData.length).toFixed(1) : 0);
      setHighRatings(reviewData.filter(r => r.rating >= 4).length);
      setLowRatings(reviewData.filter(r => r.rating <= 2).length);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching seller reviews:", err);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
    filterReviewsByRating(tabValue);
  };

  const handleMenuOpen = (event, review) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(review);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteReview = async () => {
    if (selectedReview) {
      try {
        await axios.delete(`http://localhost:5000/api/reviews/admin/${selectedReview.id}`);
        handleMenuClose();
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
        fetchReviews();
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/admin-login");
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
                  width: 330, 
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
        {deleteSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            onClose={() => setDeleteSuccess(false)}
          >
            Review deleted successfully!
          </Alert>
        )}
        
        <Card elevation={0} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={600} color="#611964">
                Seller Reviews
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search seller, buyer or comment..."
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
                    onClick={fetchReviews} 
                    sx={{ 
                      color: 'error',
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
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
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
                    <Comment />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Total Reviews</Typography>
                    <Typography variant="h4" fontWeight={600}>{totalReviews}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  All seller reviews
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
              <Tab label="All Reviews" />
            </Tabs>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={5}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Seller</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Buyer</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Comment</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Reply</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((review) => (
                    <TableRow 
                      key={review.id} 
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
                              backgroundColor: '#b084bf',
                              color: 'white',
                              fontSize: '0.875rem',
                              mr: 1.5
                            }}
                          >
                            {review.seller_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{review.seller_name}</Typography>
                        </Box>
                      </TableCell>
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
                            {review.buyer_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{review.buyer_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{review.buyer_email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><RatingChip rating={review.rating} /></TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            color: review.comment ? 'text.primary' : 'text.secondary',
                            fontStyle: review.comment ? 'normal' : 'italic'
                          }}
                        >
                          {review.comment || "No comment provided"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {review.reply ? (
                            <>
                              <Reply fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 180, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {review.reply}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              No reply yet
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(review.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, review)}
                          size="small"
                          sx={{ color: 'text.secondary' }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Box textAlign="center" p={3}>
                          <img 
                            src="/empty-state.svg" 
                            alt="No reviews" 
                            style={{ width: 150, height: 150, marginBottom: 16, opacity: 0.6 }}
                          />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No reviews found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search ? "Try adjusting your search term" : "There are no reviews to display"}
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
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 2,
            sx: { 
              borderRadius: 2,
              minWidth: 180,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            },
          }}
        >
          
          <MenuItem onClick={handleDeleteReview} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Delete Review" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default AdminSellerReviews;