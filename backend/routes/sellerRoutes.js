const express = require("express");
const db = require("../db");
const router = express.Router();

// Fetch all sellers or search by name
router.get("/", (req, res) => {
    const { name } = req.query;
    const query = name 
        ? "SELECT id, name, email, contact FROM users WHERE userType = 'Seller' AND name LIKE ?" 
        : "SELECT id, name, email, contact FROM users WHERE userType = 'Seller'";

    db.query(query, name ? [`%${name}%`] : [], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(result);
    });
});

// Update seller details
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, contact } = req.body;

    if (!name || !email || !contact) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const query = "UPDATE users SET name = ?, email = ?, contact = ? WHERE id = ? AND userType = 'Seller'";
    db.query(query, [name, email, contact, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Seller not found" });
        res.status(200).json({ message: "Seller updated successfully" });
    });
});

// Delete seller
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    
    const query = "DELETE FROM users WHERE id = ? AND userType = 'Seller'";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Seller not found" });
        res.status(200).json({ message: "Seller deleted successfully" });
    });
});


//seller count
// Get total number of sellers
router.get("/count", (req, res) => {
    const query = "SELECT COUNT(*) AS totalSellers FROM users WHERE userType = 'Seller'";

    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json({ totalSellers: result[0].totalSellers });
    });
});






module.exports = router;
