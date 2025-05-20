// routes/donationRoutes.js
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();



// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });




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




// POST /donate – Insert a donation record
router.post("/donate", verifyToken, upload.single("image"), (req, res) => {
  const checkUserQuery = "SELECT id FROM users WHERE id = ?";
  db.query(checkUserQuery, [req.userId], (checkErr, userResult) => {
    if (checkErr) {
      console.error("Error checking user existence:", checkErr);
      return res.status(500).json({ error: "Database error checking user." });
    }
    if (userResult.length === 0) {
      return res.status(400).json({ error: "User does not exist." });
    }
    const {
      product_name,
      description,
      category,
      type,
      size,
      status,
      quantity,
    } = req.body;
    const imagePath = req.file ? req.file.path : null;
    const donationData = {
      user_id: req.userId,
      product_name,
      description,
      category,
      type,
      size,
      status,
      quantity: parseInt(quantity, 10),
      image: imagePath,
    };
    const insertQuery = `
      INSERT INTO donations 
      (user_id, product_name, description, category, type, size, status, quantity, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      donationData.user_id,
      donationData.product_name,
      donationData.description,
      donationData.category,
      donationData.type,
      donationData.size,
      donationData.status,
      donationData.quantity,
      donationData.image,
    ];
    db.query(insertQuery, values, (insertErr, result) => {
      if (insertErr) {
        console.error("Error inserting donation:", insertErr);
        return res.status(500).json({ message: "Error processing donation", error: insertErr });
      }
      return res.status(200).json({ message: "Donation successfully submitted!" });
    });
  });
});





// APPROVE DONATION – Moves a donation record to approveddonations and deletes it from donations
router.post("/approve", verifyToken, (req, res) => {
  const { donationId } = req.body;
  console.log("Approve endpoint called with donationId:", donationId);
  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }
  const getDonationQuery = "SELECT * FROM donations WHERE donation_id = ?";
  db.query(getDonationQuery, [donationId], (err, donationResults) => {
    if (err) {
      console.error("Error retrieving donation:", err);
      return res.status(500).json({ error: "Database error retrieving donation" });
    }
    if (donationResults.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }
    const donation = donationResults[0];
    console.log("Donation retrieved:", donation);

    const insertQuery = `
      INSERT INTO approveddonations 
      (donation_id, user_id, product_name, description, category, type, size, status, quantity, image, donation_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const donationDate = donation.donation_date || new Date();
    const values = [
      donation.donation_id,
      donation.user_id,
      donation.product_name,
      donation.description,
      donation.category,
      donation.type,
      donation.size,
      donation.status,
      donation.quantity,
      donation.image,
      donationDate,
    ];
    db.query(insertQuery, values, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting into approveddonations:", insertErr);
        return res.status(500).json({ error: "Error approving donation", details: insertErr });
      }
      
      // Add notification for the donor
      const notificationQuery = `
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `;
      const notificationValues = [
        donation.user_id,
        'donation_approved',
        'Donation Approved',
        `Your donation "${donation.product_name}" has been approved by the admin.`
      ];
      
      db.query(notificationQuery, notificationValues, (notifErr, notifResult) => {
        if (notifErr) {
          console.error("Error creating notification:", notifErr);
          // Continue with deletion even if notification fails
        }
        
        const deleteQuery = "DELETE FROM donations WHERE donation_id = ?";
        db.query(deleteQuery, [donationId], (deleteErr, deleteResult) => {
          if (deleteErr) {
            console.error("Error deleting donation:", deleteErr);
            return res.status(500).json({ error: "Error finalizing approval", details: deleteErr });
          }
          return res.status(200).json({ 
            message: "Donation approved successfully!",
            notification_created: !notifErr
          });
        });
      });
    });
  });
});




// REJECT DONATION – Deletes a donation record from donations
router.post("/reject", verifyToken, (req, res) => {
  const { donationId } = req.body;
  console.log("Reject endpoint called with donationId:", donationId);
  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }
  
  // First, get the donation details before deleting
  const getDonationQuery = "SELECT * FROM donations WHERE donation_id = ?";
  db.query(getDonationQuery, [donationId], (err, donationResults) => {
    if (err) {
      console.error("Error retrieving donation:", err);
      return res.status(500).json({ error: "Database error retrieving donation" });
    }
    
    if (donationResults.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }
    
    const donation = donationResults[0];
    
    // Add notification for the donor
    const notificationQuery = `
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, ?, ?, ?)
    `;
    const notificationValues = [
      donation.user_id,
      'donation_rejected',
      'Donation Rejected',
      `Your donation "${donation.product_name}" has been rejected by the admin.`
    ];
    
    db.query(notificationQuery, notificationValues, (notifErr, notifResult) => {
      if (notifErr) {
        console.error("Error creating notification:", notifErr);
        // Continue with deletion even if notification fails
      }
      
      // Now delete the donation
      const deleteQuery = "DELETE FROM donations WHERE donation_id = ?";
      db.query(deleteQuery, [donationId], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error("Error rejecting donation:", deleteErr);
          return res.status(500).json({ error: "Error rejecting donation", details: deleteErr });
        }
        
        return res.status(200).json({ 
          message: "Donation rejected successfully!",
          notification_created: !notifErr
        });
      });
    });
  });
});


// GET /api/donations – Returns all donation records with the user's name aliased as userName.
router.get("/", (req, res) => {
  const sql = `
    SELECT d.*, u.name AS userName
    FROM donations d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.donation_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching donations:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.status(200).json(results);
  });
});




// GET /api/donations/approved – Returns all approved donation records with enhanced filtering
router.get("/approved", (req, res) => {
  const { category, type, q, status, size, userName } = req.query;
  
  console.log("Received query parameters:", req.query); // Debug log
  
  let sql = `
    SELECT ad.*, u.name AS userName, u.userType
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  // Category filter
  if (category) {
    sql += " AND ad.category = ?";
    params.push(category);
  }
  
  // Type filter  
  if (type) {
    sql += " AND ad.type = ?";
    params.push(type);
  }
  
  // Product name search
  if (q) {
    sql += " AND (ad.product_name LIKE ? OR ad.description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  
  // Status filter
  if (status) {
    sql += " AND ad.status = ?";
    params.push(status);
  }
  
  // Size filter
  if (size) {
    sql += " AND ad.size LIKE ?";
    params.push(`%${size}%`);
  }
  
  // User name filter
  if (userName) {
    sql += " AND u.name LIKE ?";
    params.push(`%${userName}%`);
  }
  
  sql += " ORDER BY ad.donation_date DESC";
  
  console.log("SQL Query:", sql); // Debug log
  console.log("Parameters:", params); // Debug log
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching approved donations:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log("Results count:", results.length); // Debug log
    return res.status(200).json(results);
  });
});





// GET /api/donations/seller/mydonations
router.get("/seller/mydonations", verifyToken, (req, res) => {
  const sellerId = req.userId; 
  const sql = `
    SELECT ad.*, u.name 
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE u.userType = 'Seller' AND ad.user_id = ?
    ORDER BY ad.donation_date DESC
  `;
  db.query(sql, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching seller approved donations:", err);
      return res.status(500).json({ error: "Error fetching seller approved donations" });
    }
    return res.status(200).json(results);
  });
});





// GET /api/donations/buyer/mydonations
router.get("/buyer/mydonations", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const { name } = req.query;
  let sql = `
    SELECT ad.*, u.name 
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE u.userType = 'Buyer' AND ad.user_id = ?
  `;
  const params = [buyerId];
  if (name) {
    sql += " AND ad.product_name LIKE ?";
    params.push(`%${name}%`);
  }
  sql += " ORDER BY ad.donation_date DESC";
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching buyer approved donations:", err);
      return res.status(500).json({ error: "Error fetching buyer approved donations" });
    }
    return res.status(200).json(results);
  });
});





// GET /api/donations/top-donor
router.get("/top-donor", (req, res) => {
  const sql = `
    SELECT u.id, u.name, COUNT(ad.donation_id) as donation_count
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    GROUP BY u.id, u.name
    ORDER BY donation_count DESC
    LIMIT 1
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching top donor:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(200).json({ name: "No donors yet", donation_count: 0 });
    }
    
    return res.status(200).json(results[0]);
  });
});





// PUT /api/donations/edit - Edit an existing donation
router.put("/edit", verifyToken, (req, res) => {
  const { donationId, product_name, description, category, type, size, quantity } = req.body;
  
  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }

  const checkDonationQuery = `
    SELECT * FROM approveddonations 
    WHERE donation_id = ? AND user_id = ?
  `;
  
  db.query(checkDonationQuery, [donationId, req.userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking donation ownership:", checkErr);
      return res.status(500).json({ error: "Database error checking donation" });
    }
    
    if (checkResults.length === 0) {
      return res.status(403).json({ 
        error: "You don't have permission to edit this donation or it doesn't exist" 
      });
    }
    
    const existingDonation = checkResults[0];
    
    const updateData = {
      product_name: product_name || existingDonation.product_name,
      description: description || existingDonation.description,
      category: category || existingDonation.category,
      type: type || existingDonation.type,
      size: size || existingDonation.size,
      quantity: quantity ? parseInt(quantity, 10) : existingDonation.quantity,
      status: existingDonation.status,
      image: existingDonation.image,
      donation_date: existingDonation.donation_date
    };
    
    const updateQuery = `
      UPDATE approveddonations 
      SET 
        product_name = ?,
        description = ?,
        category = ?,
        type = ?,
        size = ?,
        quantity = ?,
        status = ?,
        image = ?,
        donation_date = ?
      WHERE donation_id = ? AND user_id = ?
    `;
    
    const updateValues = [
      updateData.product_name,
      updateData.description,
      updateData.category,
      updateData.type,
      updateData.size,
      updateData.quantity,
      updateData.status,
      updateData.image,
      updateData.donation_date,
      donationId,
      req.userId
    ];
    
    db.query(updateQuery, updateValues, (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating donation:", updateErr);
        return res.status(500).json({ error: "Error updating donation", details: updateErr });
      }
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Donation not found or not updated" });
      }
      
      const getUpdatedQuery = `
        SELECT ad.*, u.name 
        FROM approveddonations ad
        JOIN users u ON ad.user_id = u.id
        WHERE ad.donation_id = ?
      `;
      
      db.query(getUpdatedQuery, [donationId], (getErr, donation) => {
        if (getErr) {
          console.error("Error fetching updated donation:", getErr);
          return res.status(200).json({ 
            message: "Donation updated successfully, but couldn't fetch the updated data",
            success: true
          });
        }
        
        return res.status(200).json({ 
          message: "Donation updated successfully",
          donation: donation[0],
          success: true
        });
      });
    });
  });
});





// DELETE /api/donations/delete - Delete an existing donation
router.delete("/delete", verifyToken, (req, res) => {
  const { donationId } = req.body;
  
  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }
  
  const checkDonationQuery = `
    SELECT * FROM approveddonations 
    WHERE donation_id = ? AND user_id = ?
  `;
  
  db.query(checkDonationQuery, [donationId, req.userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking donation ownership:", checkErr);
      return res.status(500).json({ error: "Database error checking donation" });
    }
    
    if (checkResults.length === 0) {
      return res.status(403).json({ 
        error: "You don't have permission to delete this donation or it doesn't exist" 
      });
    }
    
    const deleteQuery = "DELETE FROM approveddonations WHERE donation_id = ? AND user_id = ?";
    
    db.query(deleteQuery, [donationId, req.userId], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error("Error deleting donation:", deleteErr);
        return res.status(500).json({ error: "Error deleting donation", details: deleteErr });
      }
      
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Donation not found or not deleted" });
      }
      
      return res.status(200).json({ 
        message: "Donation deleted successfully",
        success: true
      });
    });
  });
});



// GET /api/donations/seller/search - Enhanced search for sellers
router.get("/seller/search", verifyToken, (req, res) => {
  const { productName, userName } = req.query;
  const sellerId = req.userId;
  
  console.log("Seller search parameters:", { productName, userName }); // Debug log
  
  let sql = `
    SELECT ad.*, u.name AS userName, u.email
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE u.userType = 'Seller' AND ad.user_id = ?
  `;
  
  const params = [sellerId];
  
  // If searching by product name
  if (productName) {
    sql += " AND ad.product_name LIKE ?";
    params.push(`%${productName}%`);
  }

  // as all donations will be from the same seller
  
  sql += " ORDER BY ad.donation_date DESC";
  
  console.log("SQL Query:", sql); // Debug log
  console.log("Parameters:", params); // Debug log
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching seller donations:", err);
      return res.status(500).json({ error: "Error fetching seller donations" });
    }
    console.log("Results count:", results.length); // Debug log
    return res.status(200).json(results);
  });
});



// to search donations that this seller has access to view
// (not just their own donations)
router.get("/seller/all-search", verifyToken, (req, res) => {
  const { productName, userName } = req.query;
  
  console.log("Seller all search parameters:", { productName, userName }); // Debug log
  
  let sql = `
    SELECT ad.*, u.name AS userName, u.email
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Search by product name
  if (productName) {
    sql += " AND ad.product_name LIKE ?";
    params.push(`%${productName}%`);
  }
  
  // Search by user (donor) name
  if (userName) {
    sql += " AND u.name LIKE ?";
    params.push(`%${userName}%`);
  }
  
  sql += " ORDER BY ad.donation_date DESC";
  
  console.log("SQL Query:", sql); // Debug log
  console.log("Parameters:", params); // Debug log
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching all donations:", err);
      return res.status(500).json({ error: "Error fetching all donations" });
    }
    console.log("Results count:", results.length); // Debug log
    return res.status(200).json(results);
  });
});





// GET /api/donations/seller/all - Get all approved donations for sellers
router.get("/seller/all", verifyToken, (req, res) => {
  // Check if user is actually a seller
  if (req.userType !== 'Seller') {
    return res.status(403).json({ error: 'Access denied. Sellers only.' });
  }

  const sql = `
    SELECT ad.*, u.name AS userName, u.contact, u.email, u.userType
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    ORDER BY ad.donation_date DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all approved donations:", err);
      return res.status(500).json({ error: "Database error fetching donations" });
    }
    return res.status(200).json(results);
  });
});

router.get("/seller/pending-count", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const query = "SELECT COUNT(*) AS pendingDonations FROM donations WHERE user_id = ?";
  
  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching pending donation count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    console.log("Pending donations result:", results[0]); // Log to see the actual structure
    
    // Handle potential different property naming
    const count = results[0].pendingDonations || results[0]['COUNT(*)'] || 0;
    
    return res.status(200).json({ 
      pendingDonations: count
    });
  });
});



// MARK DONATION AS COLLECTED
router.post("/collect", verifyToken, (req, res) => {
  const { donationId } = req.body;
  console.log("Collect endpoint called with donationId:", donationId);
  
  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }
  
  // First, get donation details before updating
  const getDetailsQuery = `
    SELECT ad.*, u.id as user_id, u.name, u.email, u.userType
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE ad.donation_id = ?
  `;
  
  db.query(getDetailsQuery, [donationId], (detailsErr, donations) => {
    if (detailsErr) {
      console.error("Error getting donation details:", detailsErr);
      return res.status(500).json({ error: "Error getting donation details", details: detailsErr.message });
    }
    
    if (donations.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }
    
    const donation = donations[0];
    
    // Now update the donation as collected
    const updateQuery = `
      UPDATE approveddonations 
      SET collection_status = 'collected', collection_date = NOW() 
      WHERE donation_id = ?
    `;
    
    db.query(updateQuery, [donationId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating donation status:", updateErr);
        return res.status(500).json({ error: "Error updating donation status", details: updateErr.message });
      }
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Donation not found or already collected" });
      }
      
      console.log("Successfully marked donation as collected. Creating notification now.");
      
      // Insert notification for the donor
      const insertNotifQuery = `
        INSERT INTO notifications 
        (user_id, type, title, message, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `;
      
      const notifValues = [
        donation.user_id,
        'donation_collected',
        'Donation Collected',
        `Your donation "${donation.product_name}" has been collected by our team. Thank you for your generosity!`
      ];
      
      db.query(insertNotifQuery, notifValues, (notifErr, notifResult) => {
        if (notifErr) {
          console.error("Error creating notification:", notifErr);
          return res.status(200).json({
            message: "Donation marked as collected, but notification creation failed",
            donation_collected: true,
            notification_error: notifErr.message
          });
        }
        
        console.log(`Notification created with ID: ${notifResult.insertId} for user ${donation.user_id}`);
        
        return res.status(200).json({
          message: "Donation collected successfully! Donor has been notified.",
          donation_collected: true,
          notification: {
            id: notifResult.insertId,
            user_id: donation.user_id,
            user_type: donation.userType
          }
        });
      });
    });
  });
});


router.post("/collect", verifyToken, (req, res) => {
  const { donationId } = req.body;
  console.log("Collect endpoint called with donationId:", donationId);

  if (!donationId) {
    return res.status(400).json({ error: "Donation ID is required" });
  }

  const getDetailsQuery = `
    SELECT ad.*, u.id as user_id, u.name, u.email, u.userType
    FROM approveddonations ad
    JOIN users u ON ad.user_id = u.id
    WHERE ad.donation_id = ?
  `;

  db.query(getDetailsQuery, [donationId], (detailsErr, donations) => {
    if (detailsErr) {
      console.error("Error getting donation details:", detailsErr);
      return res.status(500).json({ error: "Error getting donation details", details: detailsErr.message });
    }

    if (donations.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }

    const donation = donations[0];

    const updateQuery = `
      UPDATE approveddonations 
      SET collection_status = 'collected', collection_date = NOW() 
      WHERE donation_id = ?
    `;

    db.query(updateQuery, [donationId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating donation status:", updateErr);
        return res.status(500).json({ error: "Error updating donation status", details: updateErr.message });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Donation not found or already collected" });
      }

      const insertNotifQuery = `
        INSERT INTO notifications 
        (user_id, type, title, message, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `;

      const notifValues = [
        donation.user_id,
        'donation_collected',
        'Donation Collected',
        `Your donation "${donation.product_name}" has been collected by our team. Thank you for your generosity!`
      ];

      db.query(insertNotifQuery, notifValues, (notifErr, notifResult) => {
        const adminInfo = {
          address: "123 Admin Street, Colombo",
          contact: "+94 77 123 4567"
        };

        if (notifErr) {
          console.error("Error creating notification:", notifErr);
          return res.status(200).json({
            message: "Donation marked as collected, but notification creation failed",
            donation_collected: true,
            adminInfo
          });
        }

        return res.status(200).json({
          message: "Donation collected successfully! Donor has been notified.",
          donation_collected: true,
          adminInfo,
          notification: {
            id: notifResult.insertId,
            user_id: donation.user_id,
            user_type: donation.userType
          }
        });
      });
    });
  });
});



module.exports = router;