// index.js
require("dotenv").config();  // Load env variables at the very start

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");


//import Routes
const sellerRoutes = require("./routes/sellerRoutes"); 
const donationRoutes = require("./routes/donationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const ordersRoutes = require("./routes/ordersRoutes"); 
const paymentRoutes = require("./routes/paymentRoutes");
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); 
const adminNotificationRoutes = require("./routes/adminNotificationRoutes");


// Add these routes to your index.js file

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Setup NodeMailer transporter
// You'll need to replace these with your actual email service credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});










const db = require("./db");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",  // Allow frontend to communicate with the backend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public/uploads", express.static("public/uploads")); // Serve images

// Routes registration
app.use("/api/sellers", sellerRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", ordersRoutes); // Fixed: Added the missing forward slash
app.use("/api/payment", paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);

const PORT = process.env.PORT || 5000;

// User Registration Route
app.post("/api/users/register", async (req, res) => {
  const { name, email, contact, password, userType } = req.body;
  if (!name || !email || !contact || !password || !userType) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (result.length > 0) return res.status(400).json({ error: "Email already registered" });
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = "INSERT INTO users (name, email, contact, password, userType) VALUES (?, ?, ?, ?, ?)";
      db.query(insertQuery, [name, email, contact, hashedPassword, userType], (err) => {
        if (err) return res.status(500).json({ error: "Database insertion error" });
        res.status(201).json({ message: "User registered successfully!" });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// User Login Route

// Authentication Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  });
};

// Get User Details
app.get("/api/users/details", verifyToken, (req, res) => {
  const query = "SELECT name, email, contact, userType FROM users WHERE id = ?";
  db.query(query, [req.userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length === 0) return res.status(400).json({ error: "User not found" });
    res.status(200).json(result[0]);
  });
});

// Profile Route (for specific user)
app.get("/api/users/profile/:id", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT id, name, email, contact, userType FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "User not found" });
    res.status(200).json(results[0]);
  });
});


// User Login Route
app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length === 0) return res.status(400).json({ error: "User not found" });
    const user = result[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user.id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Add user's name and ID to the response
    res.status(200).json({
      message: "Login successful",
      token,
      userType: user.userType,
      userName: user.name,  // Include the name
      userId: user.id       // Include the ID
    });
  });
});



// Change Password Route
app.put("/api/users/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  // Validate inputs
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  try {
    // Get user from database
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = results[0];

      // Compare provided password with stored hash
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Password update error:", updateErr);
            return res.status(500).json({ error: "Failed to update password" });
          }
          
          return res.status(200).json({ message: "Password changed successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Server error" });
  }
});




// Forgot Password Route - Request Password Reset
app.post("/api/users/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if user exists
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      
      if (results.length === 0) {
        // For security reasons, don't reveal if the email exists or not
        return res.status(200).json({ message: "If your email is registered with us, you will receive a password reset link shortly." });
      }
      
      const user = results[0];
      
      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour
      
      // Store token and expiry in database
      const updateTokenQuery = "UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?";
      db.query(updateTokenQuery, [resetToken, tokenExpiry, user.id], async (updateErr) => {
        if (updateErr) {
          console.error("Token update error:", updateErr);
          return res.status(500).json({ error: "Server error" });
        }
        
        // Create reset URL (adjust the URL to match your frontend)
        const resetUrl = `http://localhost:3000/auth/ResetPassword?token=${resetToken}`;
        
        // Send email with reset link
        const mailOptions = {
          from: `"ThriftHaven" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h1>You requested a password reset</h1>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetUrl}" target="_blank">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          `
        };
        
        try {
          await transporter.sendMail(mailOptions);
          res.status(200).json({ message: "Password reset link sent to your email" });
        } catch (emailErr) {
          console.error("Email sending error:", emailErr);
          res.status(500).json({ error: "Failed to send password reset email" });
        }
      });
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify Reset Token Route
app.get("/api/users/verify-reset-token", (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  
  // Check if token exists and is not expired
  const query = "SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()";
  db.query(query, [token], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    
    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    
    res.status(200).json({ message: "Token is valid" });
  });
});

// Reset Password Route - Set New Password
app.post("/api/users/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  
  try {
    // Find user with the valid token
    const query = "SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()";
    db.query(query, [token], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      const user = results[0];
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      const updateQuery = "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?";
      db.query(updateQuery, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error("Password update error:", updateErr);
          return res.status(500).json({ error: "Failed to update password" });
        }
        
        res.status(200).json({ message: "Password has been successfully reset" });
      });
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});