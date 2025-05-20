// routes/notificationRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

// Token verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  });
};



// Get notifications for the current user
router.get("/", verifyToken, (req, res) => {
  const userId = req.userId;
  
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
    LIMIT 50
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching notifications:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    return res.status(200).json(results);
  });
});



// Mark notification as read
router.post("/mark-read", verifyToken, (req, res) => {
  const { notificationId } = req.body;
  const userId = req.userId;
  
  if (!notificationId) {
    return res.status(400).json({ error: "Notification ID is required" });
  }
  
  const updateQuery = `
    UPDATE notifications 
    SET is_read = 1 
    WHERE notification_id = ? AND user_id = ?
  `;
  
  db.query(updateQuery, [notificationId, userId], (err, result) => {
    if (err) {
      console.error("Error marking notification as read:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found or not owned by user" });
    }
    
    return res.status(200).json({ message: "Notification marked as read" });
  });
});



// Get count of unread notifications
router.get("/unread-count", verifyToken, (req, res) => {
  const userId = req.userId;
  
  const query = `
    SELECT COUNT(*) AS unreadCount 
    FROM notifications 
    WHERE user_id = ? AND is_read = 0
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error counting unread notifications:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    return res.status(200).json({ 
      unreadCount: results[0].unreadCount 
    });
  });
});

module.exports = router;