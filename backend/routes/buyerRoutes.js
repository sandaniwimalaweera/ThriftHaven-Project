const express = require("express");
const db = require("../db");
const router = express.Router();

// Fetch all buyers (with optional search by name)
router.get("/", (req, res) => {
    const { name } = req.query;
    const query = name
        ? "SELECT * FROM users WHERE userType = 'buyer' AND name LIKE ?"
        : "SELECT * FROM users WHERE userType = 'buyer'";
    const params = name ? [`%${name}%`] : [];
    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(result);
    });
});

// Fetch total buyers count
router.get("/count", (req, res) => {
    const query = "SELECT COUNT(*) AS totalBuyers FROM users WHERE userType = 'buyer'";
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json({ totalBuyers: result[0].totalBuyers });
    });
});

// Update a buyer's details
router.put("/:id", (req, res) => {
    const { name, email, contact } = req.body;
    if (!name || !email || !contact) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const query = "UPDATE users SET name = ?, email = ?, contact = ? WHERE id = ? AND userType = 'buyer'";
    db.query(query, [name, email, contact, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json({ message: "Buyer updated successfully" });
    });
});

// Delete a buyer
router.delete("/:id", (req, res) => {
    const query = "DELETE FROM users WHERE id = ? AND userType = 'buyer'";
    db.query(query, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json({ message: "Buyer deleted successfully" });
    });
});

module.exports = router;
