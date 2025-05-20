// routes/productRoutes.js
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();



// Configure Multer storage for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Ensure this folder exists and is writable
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });




/**
 * POST /api/products/add
 * Protected endpoint to add a new product.
 */
router.post("/add", verifyToken, upload.single("image"), (req, res) => {
  const sellerId = req.userId; // Provided by verifyToken middleware
  const { productName, description, category, type, size, status, quantity, originalPrice, price } = req.body;
  const imagePath = req.file ? req.file.path : null;

  // Basic validation
  if (!productName || !description || !category || !type || !size || !status || !quantity || !originalPrice || !price || !imagePath) {
    return res.status(400).json({ error: "Please fill out all required fields." });
  }

  const sql = `
    INSERT INTO products 
      (user_id, product_name, description, category, type, size, status, quantity, original_price, price, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    sellerId,
    productName,
    description,
    category,
    type,
    size,
    status,
    parseInt(quantity, 10) || 0,
    parseFloat(originalPrice) || 0,
    parseFloat(price) || 0,
    imagePath,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting product:", err);
      return res.status(500).json({ error: "Error inserting product" });
    }
    return res.status(200).json({
      message: "Product added successfully!",
      productId: result.insertId,
    });
  });
});



/**
 * GET /api/products
 * Returns all pending products with optional filtering by product name (q), category, type, and status.
 * Joins with users table to include sellerName.
 */
router.get("/", (req, res) => {
  let sql = `
    SELECT p.*, u.name AS sellerName, u.id AS seller_id
    FROM products p
    JOIN users u ON p.user_id = u.id
  `;
  const params = [];
  const conditions = [];
  if (req.query.q) {
    conditions.push("p.product_name LIKE ?");
    params.push(`%${req.query.q}%`);
  }
  if (req.query.category) {
    conditions.push("p.category = ?");
    params.push(req.query.category);
  }
  if (req.query.type) {
    conditions.push("p.type = ?");
    params.push(req.query.type);
  }
  if (req.query.status) {
    conditions.push("p.status = ?");
    params.push(req.query.status);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY p.created_at DESC";
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});


router.get("/seller/pending-count", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const sql = "SELECT COUNT(*) AS totalProducts FROM products WHERE user_id = ?";
  
  db.query(sql, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching product count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ totalProducts: results[0].totalProducts });
  });
});



/**
 * GET /api/products/seller/approved
 * Returns approved products belonging only to the logged-in seller,
 * joining with the users table to include sellerName.
 */
router.get("/seller/approved", verifyToken, (req, res) => {
  const sellerId = req.userId;
  let sql = `
    SELECT ap.*, u.name AS sellerName
    FROM approvedproducts ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.user_id = ?
  `;
  
  const params = [sellerId];
  const conditions = [];
  
  // Add search filter if provided
  if (req.query.q) {
    conditions.push("ap.product_name LIKE ?");
    params.push(`%${req.query.q}%`);
  }
  
  // Add any filters from the query string
  if (conditions.length > 0) {
    sql += " AND " + conditions.join(" AND ");
  }
  
  sql += " ORDER BY ap.created_at DESC";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching seller approved products:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
}); 




/**
 /**
 * POST /api/products/approve
 * Approves a product by moving it from the products table to the approvedproducts table,
 * then deletes it from the products table. Also deletes related rows in addtocart.
 */
router.post("/approve", verifyToken, (req, res) => {
  console.log("Approve product endpoint called, body:", req.body);
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  const productIdInt = parseInt(productId, 10);
  const getProductQuery = "SELECT * FROM products WHERE product_id = ?";
  db.query(getProductQuery, [productIdInt], (err, productResults) => {
    if (err) {
      console.error("Error retrieving product:", err);
      return res.status(500).json({ error: "Database error retrieving product" });
    }
    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = productResults[0];
    console.log("Product retrieved:", product);
    const createdAt = product.created_at ? product.created_at : new Date();
    
    // Check if product is already approved
    const checkQuery = "SELECT * FROM approvedproducts WHERE product_id = ?";
    db.query(checkQuery, [productIdInt], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking approvedproducts:", checkErr);
        return res.status(500).json({ error: "Database error checking approved product" });
      }
      if (checkResults.length > 0) {
        console.log("Product already approved, proceeding to deletion from products table.");
        const deleteFromCartQuery = "DELETE FROM addtocart WHERE product_id = ?";
        db.query(deleteFromCartQuery, [productIdInt], (cartErr, cartResult) => {
          if (cartErr) {
            console.error("Error deleting from addtocart:", cartErr);
            return res.status(500).json({ error: "Error deleting related cart items", details: cartErr });
          }
          const deleteQuery = "DELETE FROM products WHERE product_id = ?";
          db.query(deleteQuery, [productIdInt], (deleteErr, deleteResult) => {
            if (deleteErr) {
              console.error("Error deleting product:", deleteErr);
              return res.status(500).json({ error: "Error finalizing approval", details: deleteErr });
            }
            return res.status(200).json({ message: "Product already approved. Product removed from pending." });
          });
        });
      } else {
        const insertQuery = `
          INSERT INTO approvedproducts 
          (product_id, user_id, product_name, description, category, type, size, status, quantity, original_price, price, image, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          product.product_id,
          product.user_id,
          product.product_name,
          product.description,
          product.category,
          product.type,
          product.size,
          product.status,
          product.quantity,
          product.original_price,
          product.price,
          product.image,
          createdAt,
        ];
        db.query(insertQuery, values, (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting into approvedproducts:", insertErr);
            return res.status(500).json({ error: "Error approving product", details: insertErr });
          }
          



          
          // Create notification for the seller
          const notificationQuery = `
            INSERT INTO notifications 
            (user_id, type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, NOW())
          `;
          
          const notificationValues = [
            product.user_id,
            'product_approved',
            'Product Approved',
            `Your product "${product.product_name}" has been approved and is now listed for sale.`
          ];
          
          db.query(notificationQuery, notificationValues, (notifErr, notifResult) => {
            if (notifErr) {
              console.error("Error creating product approval notification:", notifErr);
              // Continue with deletion even if notification fails
            }
            
            // Delete from cart and products table
            const deleteFromCartQuery = "DELETE FROM addtocart WHERE product_id = ?";
            db.query(deleteFromCartQuery, [productIdInt], (cartErr, cartResult) => {
              if (cartErr) {
                console.error("Error deleting from addtocart:", cartErr);
                return res.status(500).json({ error: "Error deleting related cart items", details: cartErr });
              }
              const deleteQuery = "DELETE FROM products WHERE product_id = ?";
              db.query(deleteQuery, [productIdInt], (deleteErr, deleteResult) => {
                if (deleteErr) {
                  console.error("Error deleting product:", deleteErr);
                  return res.status(500).json({ error: "Error finalizing approval", details: deleteErr });
                }
                
                return res.status(200).json({ 
                  message: "Product approved successfully!", 
                  notification_created: !notifErr,
                  notification_id: notifResult ? notifResult.insertId : null
                });
              });
            });
          });
        });
      }
    });
  });
});



/**
 * POST /api/products/reject
 * Rejects a product by deleting it from the products table.
 * It first deletes related rows from addtocart to satisfy foreign key constraints.
 */
router.post("/reject", verifyToken, (req, res) => {
  console.log("Reject product endpoint called, body:", req.body);
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  const productIdInt = parseInt(productId, 10);
  
  // First get the product details for the notification
  const getProductQuery = "SELECT * FROM products WHERE product_id = ?";
  db.query(getProductQuery, [productIdInt], (err, productResults) => {
    if (err) {
      console.error("Error retrieving product:", err);
      return res.status(500).json({ error: "Database error retrieving product" });
    }
    
    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const product = productResults[0];
    
    // Delete from cart 
    const deleteFromCartQuery = "DELETE FROM addtocart WHERE product_id = ?";
    db.query(deleteFromCartQuery, [productIdInt], (cartErr, cartResult) => {
      if (cartErr) {
        console.error("Error deleting from addtocart:", cartErr);
        return res.status(500).json({ error: "Error deleting related cart items", details: cartErr });
      }
      
      // Create notification for the seller
      const notificationQuery = `
        INSERT INTO notifications 
        (user_id, type, title, message, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `;
      
      const notificationValues = [
        product.user_id,
        'product_rejected',
        'Product Rejected',
        `Your product "${product.product_name}" was not approved. Please review our product guidelines or contact support for more information.`
      ];
      
      db.query(notificationQuery, notificationValues, (notifErr, notifResult) => {
        if (notifErr) {
          console.error("Error creating product rejection notification:", notifErr);
          // Continue with deletion even if notification fails
        }
        
        // Delete the product
        const deleteQuery = "DELETE FROM products WHERE product_id = ?";
        db.query(deleteQuery, [productIdInt], (deleteErr, result) => {
          if (deleteErr) {
            console.error("Error rejecting product:", deleteErr);
            return res.status(500).json({ error: "Error rejecting product", details: deleteErr });
          }
          
          return res.status(200).json({ 
            message: "Product rejected successfully!", 
            notification_created: !notifErr,
            notification_id: notifResult ? notifResult.insertId : null
          });
        });
      });
    });
  });
});



/**
 * GET /api/products/approved
 * Returns approved products from the approvedproducts table with optional filtering by:
 * - Product name (q)
 * - Category
 * - Type 
 * - Size
 * - Status
 * - Seller name
 * Products with quantity <= 0 are excluded from the results.
 */
router.get("/approved", (req, res) => {
  console.log("Approved products endpoint called with query:", req.query);

  let sql = `
    SELECT ap.*, u.name AS sellerName 
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id
  `;
  const params = [];
  const conditions = [];
  
  // Exclude products with zero or negative quantity
  conditions.push("ap.quantity > 0");
  
  // Search by product name
  if (req.query.q && req.query.q.trim() !== '') {
    conditions.push("(ap.product_name LIKE ? OR ap.description LIKE ?)");
    params.push(`%${req.query.q}%`);
    params.push(`%${req.query.q}%`);
  }
  
  // Search by seller name
  if (req.query.sellerName && req.query.sellerName.trim() !== '') {
    conditions.push("u.name LIKE ?");
    params.push(`%${req.query.sellerName}%`);
  }
  
  // Filter by category
  if (req.query.category && req.query.category.trim() !== '') {
    conditions.push("ap.category = ?");
    params.push(req.query.category);
  }
  
  // Filter by type
  if (req.query.type && req.query.type.trim() !== '') {
    conditions.push("ap.type = ?");
    params.push(req.query.type);
  }
  
  // Filter by size
  if (req.query.size && req.query.size.trim() !== '') {
    conditions.push("ap.size = ?");
    params.push(req.query.size);
  }
  
  // Filter by status
  if (req.query.status && req.query.status.trim() !== '') {
    conditions.push("ap.status = ?");
    params.push(req.query.status);
  }
  
  // Filter by sellerId if provided
  if (req.query.sellerId) {
    conditions.push("ap.user_id = ?");
    params.push(req.query.sellerId);
  }
  
  // Add WHERE clause with all conditions
  sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY ap.created_at DESC";

  console.log("Executing SQL:", sql, "with params:", params);
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching approved products:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    console.log("Approved products fetched:", results.length);
    res.status(200).json(results);
  });
}); 

/**
 * GET /api/products/search
 * Advanced search endpoint with multiple filter combinations including seller name
 */
router.get("/search", (req, res) => {
  const { q, category, type, size, status, minPrice, maxPrice, sellerId, sellerName } = req.query;
  
  let sql = `
    SELECT ap.*, u.name AS sellerName 
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id
  `;
  
  const params = [];
  const conditions = [];
  
  // Exclude products with zero or negative quantity
  conditions.push("ap.quantity > 0");
  
  // Full text search
  if (q && q.trim() !== '') {
    conditions.push("(ap.product_name LIKE ? OR ap.description LIKE ? OR ap.category LIKE ? OR ap.type LIKE ?)");
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  // Search by seller name
  if (sellerName && sellerName.trim() !== '') {
    conditions.push("u.name LIKE ?");
    params.push(`%${sellerName}%`);
  }
  
  // Category filter
  if (category && category.trim() !== '') {
    conditions.push("ap.category = ?");
    params.push(category);
  }
  
  // Type filter
  if (type && type.trim() !== '') {
    conditions.push("ap.type = ?");
    params.push(type);
  }
  
  // Size filter
  if (size && size.trim() !== '') {
    conditions.push("ap.size = ?");
    params.push(size);
  }
  
  // Status filter
  if (status && status.trim() !== '') {
    conditions.push("ap.status = ?");
    params.push(status);
  }
  
  // Price range filter
  if (minPrice && !isNaN(parseFloat(minPrice))) {
    conditions.push("ap.price >= ?");
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice && !isNaN(parseFloat(maxPrice))) {
    conditions.push("ap.price <= ?");
    params.push(parseFloat(maxPrice));
  }
  
  // Seller filter
  if (sellerId) {
    conditions.push("ap.user_id = ?");
    params.push(sellerId);
  }
  
  // Construct the final query
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY ap.created_at DESC";
  
  console.log("Executing search SQL:", sql, "with params:", params);
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error searching products:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.status(200).json(results);
  });
});

/**
 * GET /api/products/sellers
 * Returns a list of all sellers who have products
 */
router.get("/sellers", (req, res) => {
  const sql = `
    SELECT DISTINCT u.id, u.name, u.email, COUNT(ap.product_id) as product_count
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id
    WHERE ap.quantity > 0
    GROUP BY u.id, u.name, u.email
    ORDER BY u.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching sellers:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

/**
 * GET /api/products/filters
 * Returns available filter options based on current products, including sellers
 */
router.get("/filters", (req, res) => {
  const queries = [
    "SELECT DISTINCT category FROM approvedproducts WHERE quantity > 0 ORDER BY category",
    "SELECT DISTINCT type FROM approvedproducts WHERE quantity > 0 ORDER BY type",
    "SELECT DISTINCT size FROM approvedproducts WHERE quantity > 0 ORDER BY size",
    "SELECT DISTINCT status FROM approvedproducts WHERE quantity > 0 ORDER BY status",
    "SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM approvedproducts WHERE quantity > 0",
    `SELECT DISTINCT u.id, u.name as sellerName 
     FROM approvedproducts ap 
     JOIN users u ON ap.user_id = u.id 
     WHERE ap.quantity > 0 
     ORDER BY u.name`
  ];
  
  const results = [];
  let completedQueries = 0;
  
  queries.forEach((query, index) => {
    db.query(query, (err, data) => {
      if (err) {
        console.error(`Error executing query ${index}:`, err);
        results[index] = [];
      } else {
        results[index] = data;
      }
      
      completedQueries++;
      
      if (completedQueries === queries.length) {
        res.status(200).json({
          categories: results[0].map(item => item.category),
          types: results[1].map(item => item.type),
          sizes: results[2].map(item => item.size),
          statuses: results[3].map(item => item.status),
          priceRange: results[4][0] || { minPrice: 0, maxPrice: 0 },
          sellers: results[5] || []
        });
      }
    });
  });
});

/**
 * GET /api/products/sellers/count-by-seller
 * Returns the count of products for each seller
 */
router.get("/sellers/count-by-seller", (req, res) => {
  const sql = `
    SELECT u.id, u.name, COUNT(ap.product_id) as productCount 
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id 
    WHERE ap.quantity > 0 
    GROUP BY u.id, u.name 
    ORDER BY productCount DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching product count by seller:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

/**
 * GET /api/products/seller/:sellerId
 * Returns all products from a specific seller
 */
router.get("/seller/:sellerId", (req, res) => {
  const sellerId = req.params.sellerId;
  const { q, category, type, size, status } = req.query;
  
  let sql = `
    SELECT ap.*, u.name AS sellerName 
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id 
    WHERE ap.user_id = ? AND ap.quantity > 0
  `;
  
  const params = [sellerId];
  
  // Apply filters
  if (q && q.trim() !== '') {
    sql += " AND (ap.product_name LIKE ? OR ap.description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  
  if (category && category.trim() !== '') {
    sql += " AND ap.category = ?";
    params.push(category);
  }
  
  if (type && type.trim() !== '') {
    sql += " AND ap.type = ?";
    params.push(type);
  }
  
  if (size && size.trim() !== '') {
    sql += " AND ap.size = ?";
    params.push(size);
  }
  
  if (status && status.trim() !== '') {
    sql += " AND ap.status = ?";
    params.push(status);
  }
  
  sql += " ORDER BY ap.created_at DESC";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching products by seller:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
/**
 * GET /api/products/search
 * Advanced search endpoint with multiple filter combinations
 */
router.get("/search", (req, res) => {
  const { q, category, type, size, status, minPrice, maxPrice, sellerId } = req.query;
  
  let sql = `
    SELECT ap.*, u.name AS sellerName 
    FROM approvedproducts ap 
    JOIN users u ON ap.user_id = u.id
  `;
  
  const params = [];
  const conditions = [];
  
  // Exclude products with zero or negative quantity
  conditions.push("ap.quantity > 0");
  
  // Full text search
  if (q && q.trim() !== '') {
    conditions.push("(ap.product_name LIKE ? OR ap.description LIKE ? OR ap.category LIKE ? OR ap.type LIKE ?)");
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  // Category filter
  if (category && category.trim() !== '') {
    conditions.push("ap.category = ?");
    params.push(category);
  }
  
  // Type filter
  if (type && type.trim() !== '') {
    conditions.push("ap.type = ?");
    params.push(type);
  }
  
  // Size filter
  if (size && size.trim() !== '') {
    conditions.push("ap.size = ?");
    params.push(size);
  }
  
  // Status filter
  if (status && status.trim() !== '') {
    conditions.push("ap.status = ?");
    params.push(status);
  }
  
  // Price range filter
  if (minPrice && !isNaN(parseFloat(minPrice))) {
    conditions.push("ap.price >= ?");
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice && !isNaN(parseFloat(maxPrice))) {
    conditions.push("ap.price <= ?");
    params.push(parseFloat(maxPrice));
  }
  
  // Seller filter
  if (sellerId) {
    conditions.push("ap.user_id = ?");
    params.push(sellerId);
  }
  
  // Construct the final query
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY ap.created_at DESC";
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error searching products:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.status(200).json(results);
  });
});

/**
 * GET /api/products/filters
 * Returns available filter options based on current products
 */
router.get("/filters", (req, res) => {
  const queries = [
    "SELECT DISTINCT category FROM approvedproducts WHERE quantity > 0 ORDER BY category",
    "SELECT DISTINCT type FROM approvedproducts WHERE quantity > 0 ORDER BY type",
    "SELECT DISTINCT size FROM approvedproducts WHERE quantity > 0 ORDER BY size",
    "SELECT DISTINCT status FROM approvedproducts WHERE quantity > 0 ORDER BY status",
    "SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM approvedproducts WHERE quantity > 0"
  ];
  
  const results = [];
  let completedQueries = 0;
  
  queries.forEach((query, index) => {
    db.query(query, (err, data) => {
      if (err) {
        console.error(`Error executing query ${index}:`, err);
        results[index] = [];
      } else {
        results[index] = data;
      }
      
      completedQueries++;
      
      if (completedQueries === queries.length) {
        res.status(200).json({
          categories: results[0].map(item => item.category),
          types: results[1].map(item => item.type),
          sizes: results[2].map(item => item.size),
          statuses: results[3].map(item => item.status),
          priceRange: results[4][0] || { minPrice: 0, maxPrice: 0 }
        });
      }
    });
  });
});

/**
 * GET /api/products/stats
 * Returns product statistics and analytics
 */
router.get("/stats", (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as totalProducts,
      COUNT(DISTINCT category) as totalCategories,
      COUNT(DISTINCT user_id) as totalSellers,
      AVG(price) as averagePrice,
      MIN(price) as minPrice,
      MAX(price) as maxPrice,
      CASE 
        WHEN COUNT(*) > 0 THEN STRING_AGG(DISTINCT category, ', ')
        ELSE ''
      END as categories
    FROM approvedproducts 
    WHERE quantity > 0
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching product stats:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const stats = results[0] || {
      totalProducts: 0,
      totalCategories: 0,
      totalSellers: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      categories: ''
    };
    
    res.status(200).json(stats);
  });
});


/**
 * DELETE /api/products/delete
 * Deletes a product from the approvedproducts table.
 * It first deletes related rows from addtocart to satisfy foreign key constraints.
 */
router.delete("/delete", verifyToken, (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  const productIdInt = parseInt(productId, 10);
  
  // First check if the product exists in approvedproducts table
  const checkQuery = "SELECT * FROM approvedproducts WHERE product_id = ?";
  db.query(checkQuery, [productIdInt], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking product:", checkErr);
      return res.status(500).json({ error: "Database error", details: checkErr });
    }
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Verify that the product belongs to the logged-in seller
    if (checkResults[0].user_id !== req.userId) {
      return res.status(403).json({ error: "You do not have permission to delete this product" });
    }
    
    // First delete from any carts that might reference this product
    const deleteFromCartQuery = "DELETE FROM addtocart WHERE product_id = ?";
    db.query(deleteFromCartQuery, [productIdInt], (cartErr, cartResult) => {
      if (cartErr) {
        console.error("Error deleting from addtocart:", cartErr);
        return res.status(500).json({ error: "Error deleting related cart items", details: cartErr });
      }
      
      // Now delete the product
      const deleteQuery = "DELETE FROM approvedproducts WHERE product_id = ?";
      db.query(deleteQuery, [productIdInt], (err, result) => {
        if (err) {
          console.error("Error deleting product:", err);
          return res.status(500).json({ error: "Error deleting product", details: err });
        }

        return res.status(200).json({ message: "Product deleted successfully!" });
      });
    });
  });
});

/**
 * PUT /api/products/edit
 * Updates a product in the approvedproducts table.
 */
router.put("/edit", verifyToken, (req, res) => {
  const { 
    productId, 
    product_name, // Updated field names to match the frontend
    description, 
    category, 
    type, 
    size, 
    status, 
    quantity, 
    original_price, // Updated field names to match the frontend
    price, 
    image       // Updated field name to match the frontend
  } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }
  
  const productIdInt = parseInt(productId, 10);
  
  // Check if the product exists and belongs to the logged-in seller
  const checkQuery = "SELECT * FROM approvedproducts WHERE product_id = ?";
  db.query(checkQuery, [productIdInt], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking product:", checkErr);
      return res.status(500).json({ error: "Database error", details: checkErr });
    }
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Verify that the product belongs to the logged-in seller
    if (checkResults[0].user_id !== req.userId) {
      return res.status(403).json({ error: "You do not have permission to edit this product" });
    }
    
    // Handle NaN and empty values - use default values or existing values if not provided
    const safeQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) || 0 : checkResults[0].quantity;
    const safeOriginalPrice = original_price !== undefined && original_price !== null ? parseFloat(original_price) || 0 : checkResults[0].original_price;
    const safePrice = price !== undefined && price !== null ? parseFloat(price) || 0 : checkResults[0].price;
    
    // Update the product
    const sql = `
      UPDATE approvedproducts
      SET product_name = ?, 
          description = ?, 
          category = ?, 
          type = ?, 
          size = ?, 
          status = ?, 
          quantity = ?, 
          original_price = ?, 
          price = ?
      WHERE product_id = ?
    `;
    
    const values = [
      product_name || checkResults[0].product_name, 
      description || checkResults[0].description, 
      category || checkResults[0].category, 
      type || checkResults[0].type, 
      size || checkResults[0].size, 
      status || checkResults[0].status, 
      safeQuantity, 
      safeOriginalPrice, 
      safePrice, 
      productIdInt
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ error: "Error updating product", details: err });
      }

      // Return the updated product
      const updatedProduct = { 
        product_id: productIdInt, 
        product_name: product_name || checkResults[0].product_name, 
        description: description || checkResults[0].description, 
        category: category || checkResults[0].category, 
        type: type || checkResults[0].type, 
        size: size || checkResults[0].size, 
        status: status || checkResults[0].status, 
        quantity: safeQuantity, 
        original_price: safeOriginalPrice, 
        price: safePrice, 
        image: image || checkResults[0].image
      };
      
      return res.status(200).json({ 
        message: "Product updated successfully!", 
        product: updatedProduct 
      });
    });
  });
});


// Replace the existing top-seller endpoint at the end of your productRoutes.js file with this one
// GET /api/products/top-seller - Returns the seller with the most sales
router.get("/top-seller", (req, res) => {
  const sql = `
    SELECT u.id, u.name, COUNT(o.order_id) as sales_count, SUM(o.quantity) as items_sold
    FROM orders o
    JOIN users u ON o.seller_id = u.id
    WHERE u.userType = 'Seller' AND o.status = 'paid'
    GROUP BY u.id, u.name
    ORDER BY sales_count DESC
    LIMIT 1
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching top seller:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(200).json({ name: "No sales yet", sales_count: 0 });
    }
    
    return res.status(200).json(results[0]);
  });
});

/**
 * GET /api/products/seller/pending-count
 * Returns the count of pending products for the logged-in seller.
 */
router.get("/seller/pending-count", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const sql = "SELECT COUNT(*) AS pendingProducts FROM products";
  
  db.query(sql, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching pending product count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ pendingProducts: results[0].pendingProducts });
  });
});


router.get("/approved/count", (req, res) => {
  const sql = "SELECT COUNT(*) AS totalProducts FROM approvedproducts";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching approved product count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ totalProducts: results[0].totalProducts });
  });
});


module.exports = router;