// routes/adminNotificationRoutes.js
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
    next();
  });
};



// Get counts of pending items for admin dashboard
router.get("/pending-counts", verifyToken, (req, res) => {
  const pendingDonationsQuery = "SELECT COUNT(*) AS pendingDonations FROM donations";
  const pendingProductsQuery = "SELECT COUNT(*) AS pendingProducts FROM products";
  
  db.query(pendingDonationsQuery, (donationErr, donationResults) => {
    if (donationErr) {
      console.error("Error counting pending donations:", donationErr);
      return res.status(500).json({ error: "Database error" });
    }
    
    db.query(pendingProductsQuery, (productErr, productResults) => {
      if (productErr) {
        console.error("Error counting pending products:", productErr);
        return res.status(500).json({ error: "Database error" });
      }
      
      const pendingDonations = donationResults[0].pendingDonations;
      const pendingProducts = productResults[0].pendingProducts;
      
      return res.status(200).json({
        pendingDonations,
        pendingProducts,
        totalPending: pendingDonations + pendingProducts
      });
    });
  });
});

module.exports = router;