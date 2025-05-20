// routes/users.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/users/:id - fetch user details by id
router.get("/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT id, name, email, contact FROM users WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(results[0]);
  });
});



module.exports = router;
