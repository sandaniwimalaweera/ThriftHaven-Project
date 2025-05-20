// routes/adminRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db"); // Your database connection module


// Add these routes to your adminRoutes.js file
const crypto = require('crypto');
const nodemailer = require('nodemailer');




// Setup NodeMailer transporter
//email service credentials in .env file
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


const router = express.Router();

//backend/routes/adminRoutes.js — Login token structure
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const query = "SELECT * FROM admin WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: "Admin not found" });
    }

    const adminUser = results[0];
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }




    // In adminRoutes.js login endpoint:
const token = jwt.sign(
  { userId: adminUser.id, userType: "Admin" }, // Keep this format consistent
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

    res.status(200).json({
      message: "Admin login successful",
      token,
    });
  });
});




router.put("/change-password", (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  const tokenPart = token.split(" ")[1];
  if (!tokenPart) {
    return res.status(403).json({ error: "Invalid token format" });
  }

 jwt.verify(tokenPart, process.env.JWT_SECRET, async (err, decoded) => {
  if (err || decoded.userType !== "Admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminId = decoded.userId;
  const { currentPassword, newPassword } = req.body;
  
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const query = "SELECT * FROM admin WHERE id = ?";
    db.query(query, [adminId], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ error: "Admin not found" });
      }

      const admin = results[0];
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = "UPDATE admin SET password = ? WHERE id = ?";
      db.query(updateQuery, [hashedPassword, adminId], (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to update password" });
        }
        res.status(200).json({ message: "Password updated successfully" });
      });
    });
  });
});







// Get all sellers for admin
router.get("/admin/sellers", (req, res) => {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE role = 'seller'
    ORDER BY name
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sellers:", err);
      return res.status(500).json({ 
        error: "Failed to fetch sellers", 
        details: err.message 
      });
    }
    
    res.status(200).json(results);
  });
});




// Get all refund requests for admin
router.get("/admin/all-refund-requests", (req, res) => {
  const query = `
    SELECT r.*, p.payment_intent_id,
           u.name as buyer_name, u.email as buyer_email
    FROM refund_requests r
    JOIN payment_details p ON r.payment_id = p.payment_id
    JOIN users u ON r.buyer_id = u.id
    ORDER BY r.requested_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching refund requests:", err);
      return res.status(500).json({ 
        error: "Failed to fetch refund requests", 
        details: err.message 
      });
    }
    
    res.status(200).json(results);
  });
});





// Get detailed seller statistics for admin view
router.get("/admin/seller-statistics/:sellerId", (req, res) => {
  const sellerId = req.params.sellerId;
  
  // Begin transaction for multiple queries
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch seller statistics", 
        details: err.message 
      });
    }
    



    // Get total sales count and revenue
    const salesQuery = `
      SELECT 
        COUNT(*) as totalSales,
        SUM(price * quantity) as totalRevenue,
        AVG(price * quantity) as averageOrderValue
      FROM orders
      WHERE seller_id = ?
    `;
    
    db.query(salesQuery, [sellerId], (err, salesResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error fetching sales statistics:", err);
          res.status(500).json({
            error: "Failed to fetch sales statistics",
            details: err.message
          });
        });
      }
      





      // Get order status counts
      const statusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        WHERE seller_id = ?
        GROUP BY status
      `;
      
      db.query(statusQuery, [sellerId], (err, statusResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error fetching status counts:", err);
            res.status(500).json({
              error: "Failed to fetch status counts",
              details: err.message
            });
          });
        }
        


        // Get monthly sales data
        const monthlyQuery = `
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as order_count,
            SUM(price * quantity) as revenue
          FROM orders
          WHERE seller_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month
        `;
        
        db.query(monthlyQuery, [sellerId], (err, monthlyResults) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error fetching monthly sales:", err);
              res.status(500).json({
                error: "Failed to fetch monthly sales",
                details: err.message
              });
            });
          }



          
          // Get recent orders
          const recentOrdersQuery = `
            SELECT o.*, u.name as buyer_name
            FROM orders o
            JOIN users u ON o.buyer_id = u.id
            WHERE o.seller_id = ?
            ORDER BY o.created_at DESC
            LIMIT 10
          `;
          
          db.query(recentOrdersQuery, [sellerId], (err, recentOrdersResults) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error fetching recent orders:", err);
                res.status(500).json({
                  error: "Failed to fetch recent orders",
                  details: err.message
                });
              });
            }
            
            // Process status counts into an object
            const statusCount = {};
            statusResults.forEach(item => {
              statusCount[item.status] = item.count;
            });
            
            // Commit transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error("Commit error:", err);
                  res.status(500).json({
                    error: "Transaction failed",
                    details: err.message
                  });
                });
              }
              
              // Return combined data
              res.status(200).json({
                totalSales: salesResults[0].totalSales,
                totalRevenue: salesResults[0].totalRevenue || 0,
                averageOrderValue: salesResults[0].averageOrderValue || 0,
                statusCount: statusCount,
                monthlySales: monthlyResults,
                recentOrders: recentOrdersResults
              });
            });
          });
        });
      });
    });
  });
});



router.get("/profile", (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: "No token provided" });

  const tokenPart = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  
  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
    if (err || decoded.userType !== "Admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const adminId = decoded.userId; // Using userId from token
    const query = "SELECT id, name, email FROM admin WHERE id = ?";
    db.query(query, [adminId], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (result.length === 0) return res.status(404).json({ error: "Admin not found" });
      res.status(200).json(result[0]);
    });
  });
});




// Admin Forgot Password Route - Request Password Reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if admin exists
    const query = "SELECT * FROM admin WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      
      if (results.length === 0) {
        // For security reasons, don't reveal if the email exists or not
        return res.status(200).json({ message: "If your email is registered as an admin, you will receive a password reset link shortly." });
      }
      
      const admin = results[0];
      



      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour
      



      // Store token and expiry in database
      const updateTokenQuery = "UPDATE admin SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?";
      db.query(updateTokenQuery, [resetToken, tokenExpiry, admin.id], async (updateErr) => {
        if (updateErr) {
          console.error("Token update error:", updateErr);
          return res.status(500).json({ error: "Server error" });
        }
        
        // Create reset URL (adjust the URL to match your frontend)
        const resetUrl = `http://localhost:3000/admin-reset-password?token=${resetToken}`;
        
        // Send email with reset link
        const mailOptions = {
          from: `"Your App Name - Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Admin Password Reset Request',
          html: `
            <h1>Admin Password Reset</h1>
            <p>You requested a password reset for your admin account.</p>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetUrl}" target="_blank">Reset Admin Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please contact the system administrator immediately.</p>
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



// Admin Verify Reset Token Route
router.get("/verify-reset-token", (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  
  // Check if token exists and is not expired
  const query = "SELECT * FROM admin WHERE resetToken = ? AND resetTokenExpiry > NOW()";
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





// Admin Reset Password Route - Set New Password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  
  try {
    // Find admin with the valid token
    const query = "SELECT * FROM admin WHERE resetToken = ? AND resetTokenExpiry > NOW()";
    db.query(query, [token], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      const admin = results[0];
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      const updateQuery = "UPDATE admin SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?";
      db.query(updateQuery, [hashedPassword, admin.id], (updateErr) => {
        if (updateErr) {
          console.error("Password update error:", updateErr);
          return res.status(500).json({ error: "Failed to update password" });
        }
        
        res.status(200).json({ message: "Admin password has been successfully reset" });
      });
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});






module.exports = router;
