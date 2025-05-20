// backend/routes/reviewRoutes.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// POST /api/reviews - Add a review (for customers)
router.post("/", verifyToken, (req, res) => {
  const userId = req.userId;
  const { seller_id, rating, comment } = req.body;

  // Validate rating is a number between 1 and 5
  if (!seller_id || rating == null || isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Seller ID and valid rating (1-5) are required" });
  }

  // No need to check for existing reviews as buyers can review sellers multiple times
  
  const insertQuery = `
    INSERT INTO reviews (seller_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertQuery, [seller_id, userId, rating, comment || ""], (err, result) => {
    if (err) {
      console.error("Error inserting review:", err);
      return res.status(500).json({ error: "Error inserting review", details: err.message });
    }
    return res.status(201).json({ message: "Review added successfully!" });
  });
});

// GET /api/reviews - Get reviews for logged-in seller
router.get("/", verifyToken, (req, res) => {
  const sql = `
    SELECT 
      r.review_id AS id, 
      r.seller_id, 
      r.user_id, 
      r.rating, 
      r.comment, 
      r.created_at, 
      r.reply, 
      r.reply_date, 
      u.name AS reviewerName 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id
    WHERE r.seller_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "Error fetching reviews", details: err.message });
    }
    res.status(200).json(results);
  });
});

// GET /api/reviews/public/:sellerId - Get public reviews for a specific seller
router.get("/public/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  
  if (!sellerId) {
    return res.status(400).json({ error: "Seller ID is required" });
  }
  
  const sql = `
    SELECT 
      r.review_id AS id, 
      r.seller_id, 
      r.rating, 
      r.comment, 
      r.created_at, 
      r.reply, 
      r.reply_date, 
      u.name AS reviewerName 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id
    WHERE r.seller_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching public reviews:", err);
      return res.status(500).json({ error: "Error fetching reviews", details: err.message });
    }
    
    // Ensure rating is a number
    const formattedResults = results.map(review => ({
      ...review,
      rating: Number(review.rating)
    }));
    
    res.status(200).json(formattedResults);
  });
});

// PUT /api/reviews/:reviewId/reply - Add or update a reply to a review
router.put("/:reviewId/reply", verifyToken, (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const sellerId = req.userId;

  if (!reply) {
    return res.status(400).json({ error: "Reply text is required" });
  }

  // First check if the review belongs to this seller
  const checkOwnershipQuery = `
    SELECT seller_id FROM reviews WHERE review_id = ?
  `;
  
  db.query(checkOwnershipQuery, [reviewId], (err, results) => {
    if (err) {
      console.error("Error checking review ownership:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    if (results[0].seller_id != sellerId) {
      return res.status(403).json({ error: "You can only reply to your own reviews" });
    }
    
    // Now update the reply
    const updateQuery = `
      UPDATE reviews 
      SET reply = ?, reply_date = CURRENT_TIMESTAMP 
      WHERE review_id = ?
    `;
    
    db.query(updateQuery, [reply, reviewId], (err, result) => {
      if (err) {
        console.error("Error updating reply:", err);
        return res.status(500).json({ error: "Error updating reply", details: err.message });
      }
      return res.status(200).json({ message: "Reply added successfully" });
    });
  });
});

// DELETE /api/reviews/:reviewId/reply - Remove a reply from a review
router.delete("/:reviewId/reply", verifyToken, (req, res) => {
  const { reviewId } = req.params;
  const sellerId = req.userId;

  // First check if the review belongs to this seller
  const checkOwnershipQuery = `
    SELECT seller_id FROM reviews WHERE review_id = ?
  `;
  
  db.query(checkOwnershipQuery, [reviewId], (err, results) => {
    if (err) {
      console.error("Error checking review ownership:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    if (results[0].seller_id != sellerId) {
      return res.status(403).json({ error: "You can only manage replies to your own reviews" });
    }
    
    // Now remove the reply
    const updateQuery = `
      UPDATE reviews 
      SET reply = NULL, reply_date = NULL 
      WHERE review_id = ?
    `;
    
    db.query(updateQuery, [reviewId], (err, result) => {
      if (err) {
        console.error("Error removing reply:", err);
        return res.status(500).json({ error: "Error removing reply", details: err.message });
      }
      return res.status(200).json({ message: "Reply removed successfully" });
    });
  });
});


// ✅ ADMIN ROUTE: Get all reviews for all sellers
router.get("/admin/all", (req, res) => {
  const sql = `
    SELECT 
      r.review_id AS id,
      r.seller_id,
      r.user_id,
      r.rating,
      r.comment,
      r.created_at,
      r.reply,
      r.reply_date,
      seller.name AS seller_name,
      buyer.name AS buyer_name,
      buyer.email AS buyer_email
    FROM reviews r
    JOIN users seller ON r.seller_id = seller.id
    JOIN users buyer ON r.user_id = buyer.id
    ORDER BY r.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "Error fetching reviews", details: err.message });
    }
    res.status(200).json(results);
  });
});



// ✅ ADMIN ROUTE: Delete a review
router.delete("/admin/:reviewId", (req, res) => {
  const { reviewId } = req.params;

  if (!reviewId) {
    return res.status(400).json({ error: "Review ID is required" });
  }

  const deleteQuery = `DELETE FROM reviews WHERE review_id = ?`;

  db.query(deleteQuery, [reviewId], (err, result) => {
    if (err) {
      console.error("Error deleting review:", err);
      return res.status(500).json({ error: "Failed to delete review", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  });
});


module.exports = router;