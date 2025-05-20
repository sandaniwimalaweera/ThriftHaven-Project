// pages/seller-dashboard/reviews.js
import { useEffect, useState } from "react";
import { 
  Container, Typography, Card, CardContent, Rating, 
  Box, CircularProgress, Button, Modal, TextField, Paper,
  Avatar, Chip, Divider, IconButton, Tooltip
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import SellerSidebar from "../../components/seller-page-sidebar";
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openReplyModal, setOpenReplyModal] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [userName, setUserName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }

    if (!token) {
      router.push("/auth/login");
      return;
    }

    fetchReviews();
  }, [router]);

  const fetchReviews = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get("http://localhost:5000/api/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReplyModal = (reviewId) => {
    const review = reviews.find(r => r.id === reviewId);
    setCurrentReviewId(reviewId);
    setCurrentReview(review);
    setReplyText(review.reply || "");
    setEditMode(!!review.reply);
    setOpenReplyModal(true);
  };

  const handleCloseReplyModal = () => {
    setOpenReplyModal(false);
    setReplyText("");
    setCurrentReviewId(null);
    setCurrentReview(null);
    setEditMode(false);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      alert("Please type a reply before submitting.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `http://localhost:5000/api/reviews/${currentReviewId}/reply`,
        { reply: replyText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Reply " + (editMode ? "updated" : "added") + " successfully!");
      handleCloseReplyModal();
      fetchReviews();
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Failed to submit reply.");
    }
  };

  // Get average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Count reviews by rating
  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const getAvatarColor = (name) => {
    const colors = ['#F44336', '#3F51B5', '#009688', '#FF9800', '#9C27B0', '#673AB7'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Box sx={{ 
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
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <SellerSidebar userName={userName} />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          marginLeft: "320px", 
          width: "calc(100% - 320px)",
          minHeight: "100vh",
          bgcolor: "#f7f7f9",
          flexGrow: 1,
          p: 3
        }}
      >
        <Container sx={{ maxWidth: "1200px" }}>
          {/* Header Section */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" color="#611964">
              Customer Reviews
            </Typography>
          </Box>

          {/* Reviews List */}
          <Typography variant="h6" fontWeight="" mb={2} ml={1}>
            All Reviews -  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </Typography>
          
          {reviews.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
              <Box sx={{ mb: 2, opacity: 0.7 }}>
                <FormatQuoteIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reviews yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When customers leave reviews, they will appear here.
              </Typography>
            </Paper>
          ) : (
            reviews.map((review) => (
              <Card 
                key={review.id} 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  overflow: "visible",
                  position: "relative",
                  border: review.rating >= 4 ? "1px solid #E8F5E9" : 
                          review.rating >= 3 ? "1px solid #FFF3E0" : 
                          "1px solid #FFEBEE",
                  maxWidth: "900px",
                  mx: "auto"
                }}
              >
                <Box sx={{ 
                  position: "absolute", 
                  top: -10, 
                  right: 16,
                  bgcolor: review.rating >= 4 ? "#4CAF50" : 
                           review.rating >= 3 ? "#FF9800" : 
                           "#F44336",
                  color: "white",
                  borderRadius: "16px",
                  px: 1.5,
                  py: 0.25,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.8rem"
                }}>
                  {review.rating}
                  <StarIcon sx={{ fontSize: 14 }} />
                </Box>
                
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center" }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getAvatarColor(review.reviewerName),
                        width: 40,
                        height: 40
                      }}
                    >
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {review.reviewerName}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                        <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        <Typography variant="caption">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: "#f8f9fa", 
                    borderRadius: 1.5,
                    position: "relative",
                    mb: 1.5
                  }}>
                    <FormatQuoteIcon sx={{ 
                      position: "absolute", 
                      top: -8, 
                      left: 8, 
                      color: "#611964",
                      opacity: 0.2,
                      fontSize: 20
                    }} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {review.comment}
                    </Typography>
                  </Box>

                  {review.reply ? (
                    <Box sx={{ 
                      mt: 2, 
                      p: 1.5, 
                      bgcolor: "#EDE7F6", 
                      borderRadius: 1.5,
                      borderLeft: "3px solid #611964",
                      position: "relative"
                    }}>
                      <Box sx={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <PersonIcon sx={{ color: "#611964", mr: 0.5, fontSize: 16 }} />
                          <Typography variant="caption" color="#611964" fontWeight="bold">
                            Your Response
                          </Typography>
                        </Box>
                        <Tooltip title="Edit Reply">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenReplyModal(review.id)}
                            sx={{ color: "#611964", p: 0.5 }}
                          >
                            <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{review.reply}</Typography>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<ReplyIcon sx={{ fontSize: 16 }} />}
                      size="small"
                      onClick={() => handleOpenReplyModal(review.id)}
                      sx={{ 
                        mt: 1, 
                        bgcolor: "#611964", 
                        '&:hover': { bgcolor: "#4b1250" },
                        borderRadius: 1.5,
                        boxShadow: "0 2px 6px rgba(97, 25, 100, 0.3)",
                        fontSize: "0.75rem"
                      }}
                    >
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {/* Reply Modal */}
          <Modal
            open={openReplyModal}
            onClose={handleCloseReplyModal}
            sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                width: "90%",
                maxWidth: 600,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                maxHeight: "90vh",
                overflow: "auto"
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="#611964">
                  {editMode ? "Edit Your Reply" : "Reply to Review"}
                </Typography>
                <IconButton onClick={handleCloseReplyModal}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {currentReview && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mr={1}>
                      {currentReview.reviewerName}
                    </Typography>
                    <Rating value={currentReview.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2">{currentReview.comment}</Typography>
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={5}
                variant="outlined"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your professional response..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#611964',
                    },
                  },
                }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Your response will be visible to all customers who view this review.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button 
                  onClick={handleCloseReplyModal} 
                  variant="outlined"
                  sx={{ 
                    borderColor: "#611964", 
                    color: "#611964",
                    '&:hover': {
                      borderColor: "#4b1250",
                      bgcolor: "rgba(97, 25, 100, 0.04)"
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReply} 
                  variant="contained" 
                  sx={{ 
                    bgcolor: "#611964",
                    '&:hover': { bgcolor: "#4b1250" },
                    px: 3
                  }}
                >
                  {editMode ? "Update Reply" : "Submit Reply"}
                </Button>
              </Box>
            </Paper>
          </Modal>
        </Container>
      </Box>
    </Box>
  );
};

export default SellerReviews;