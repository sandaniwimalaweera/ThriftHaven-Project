// frontend/components/ReviewSection.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Rating,
  Divider,
  Avatar,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import PersonIcon from '@mui/icons-material/Person';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';

const ReviewSection = ({ sellerId }) => {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Use the public endpoint to get seller reviews including replies
      const response = await axios.get(
        `http://localhost:5000/api/reviews/public/${sellerId}`
      );
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      alert("Error fetching reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) fetchReviews();
  }, [sellerId]);

  // Calculate total reviews and average rating
  const totalReviews = reviews.length;
  // Fix: Handle empty reviews array and invalid ratings
  const validReviews = reviews.filter(review => review.rating !== null && review.rating !== undefined);
  const totalRating = validReviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = validReviews.length > 0 ? (totalRating / validReviews.length).toFixed(1) : 0;

  const handleSubmitReview = async () => {
    if (!rating) {
      alert("Please select a rating");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to leave a review");
      router.push("/auth/login");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = { seller_id: sellerId, rating, comment };
      await axios.post("http://localhost:5000/api/reviews", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Review submitted successfully!");
      setComment("");
      setRating(0);
      fetchReviews(); // Refresh reviews after submission
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error.message);
      alert(`Error submitting review: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const token = localStorage.getItem("token");
  
  // Function to generate avatar colors based on name
  const getAvatarColor = (name) => {
    if (!name) return '#611964'; // Default color for undefined names
    const colors = ['#F44336', '#3F51B5', '#009688', '#FF9800', '#9C27B0', '#673AB7'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
     
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#611964" }}>
          Customer Reviews
        </Typography>


      {/* Review Submission Form or Login Prompt */}
      <Paper elevation={0} sx={{ mt: 4, mb: 4, p: 3, bgcolor: "#fff", borderRadius: 2, border: "1px solid #f0f0f0" }}>
        {!token ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" sx={{ mb: 2 }}>Please log in to leave a review.</Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/auth/login")}
              sx={{ 
                bgcolor: "#611964", 
                '&:hover': { bgcolor: "#4b1250" },
                borderRadius: 1.5,
                px: 3
              }}
            >
              Log In
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#611964" }}>
              Write a Review
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>Your Rating:</Typography>
              <Rating
                name="review-rating"
                value={rating}
                onChange={(e, newValue) => {
                  // Ensure we always have a valid numeric rating value
                  setRating(newValue || 0);
                }}
                precision={1}
                size="large"
              />
            </Box>
            <TextField
              label="Your Review"
              multiline
              fullWidth
              minRows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#611964',
                  },
                },
              }}
              placeholder="Share your experience with this seller..."
            />
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={submitting || !rating || rating === 0 || !comment.trim()}
              sx={{ 
                bgcolor: "#611964", 
                '&:hover': { bgcolor: "#4b1250" },
                borderRadius: 1.5,
                px: 4
              }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {reviews.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "white", borderRadius: 2 }}>
              <FormatQuoteIcon sx={{ fontSize: 60, color: "#e0e0e0" }} />
              <Typography variant="body1" color="text.secondary">No reviews yet for this seller.</Typography>
            </Paper>
          ) : (
            reviews.map((review) => (
              <Paper 
                key={review.id} 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 2, 
                  bgcolor: "#fff", 
                  borderRadius: 2,
                  border: "1px solid #f0f0f0",
                  position: "relative",
                  overflow: "visible"
                }}
              >
                {/* Rating badge */}
                <Box sx={{ 
                  position: "absolute", 
                  top: -10, 
                  right: 16,
                  bgcolor: (review.rating >= 4) ? "#4CAF50" : 
                           (review.rating >= 3) ? "#FF9800" : 
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
                
                {/* Reviewer info */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getAvatarColor(review.reviewerName),
                      width: 40,
                      height: 40
                    }}
                  >
                    {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : '?'}
                  </Avatar>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {review.reviewerName || 'Anonymous'}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                      <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5 }} />
                      <Typography variant="caption">
                        {formatDate(review.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Review content */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: "#f9f9f9", 
                  borderRadius: 1.5,
                  position: "relative",
                  mb: 2
                }}>
                  <FormatQuoteIcon sx={{ 
                    position: "absolute", 
                    top: -8, 
                    left: 8, 
                    color: "#9e9e9e",
                    opacity: 0.2,
                    fontSize: 20
                  }} />
                  <Typography variant="body1" sx={{ ml: 1 }}>{review.comment || 'No comment provided.'}</Typography>
                </Box>
                
                {/* Seller reply (if exists) */}
                {review.reply && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: "#EDE7F6", 
                    borderRadius: 1.5,
                    borderLeft: "3px solid #611964",
                    ml: 3
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <PersonIcon sx={{ color: "#611964", mr: 1, fontSize: 18 }} />
                      <Typography variant="subtitle2" color="#611964" fontWeight="bold">
                        Seller Response
                      </Typography>
                      {review.reply_date && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          · {formatDate(review.reply_date)}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2">{review.reply}</Typography>
                  </Box>
                )}
              </Paper>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReviewSection;