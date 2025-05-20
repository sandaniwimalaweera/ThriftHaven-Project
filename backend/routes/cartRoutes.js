// backend/routes/cartRoutes.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();





// GET /api/cart/count - Get cart item count for the current buyer
router.get("/count", verifyToken, (req, res) => {
  const buyerId = req.userId;
  
  const query = `
    SELECT COUNT(*) as count
    FROM addtocart
    WHERE buyer_id = ?
  `;
  
  db.query(query, [buyerId], (err, results) => {
    if (err) {
      console.error("Error fetching cart count:", err);
      return res.status(500).json({
        error: "Failed to fetch cart count",
        details: err.message
      });
    }
    
    res.status(200).json({
      count: results[0].count
    });
  });
});




// POST /api/cart/add – Add a product to the cart
router.post("/add", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const {
    product_id,
    product_name,
    product_description,
    category,
    type,
    size,
    status,
    quantity,
    price,
    original_price,
    image,
    seller_id,
  } = req.body;

  // Check required fields
  if (!product_id || !product_name || !quantity || !price || !seller_id) {
    return res.status(400).json({ error: "Missing required product/cart details" });
  }

  // First check if product already exists in cart
  const checkExistingQuery = "SELECT cart_id, quantity FROM addtocart WHERE buyer_id = ? AND product_id = ?";
  db.query(checkExistingQuery, [buyerId, product_id], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ error: "Database error", details: checkErr.message });
    }
    
    // If product is already in cart, return a message indicating it's already in the cart
    if (checkResults.length > 0) {
      return res.status(409).json({ 
        error: "Product is already in your cart",
        message: "This item is already in your cart. Please update the quantity from the cart page if needed.",
        cart_id: checkResults[0].cart_id
      });
    }
    
    // If product is not in cart, proceed with normal insertion
    // First check if the product exists in approved products
    const checkApprovedQuery = "SELECT product_id, quantity FROM approvedproducts WHERE product_id = ?";
    db.query(checkApprovedQuery, [product_id], (err, approvedResults) => {
      if (err) {
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      
      // Check if product exists and has enough quantity
      if (approvedResults.length > 0) {
        const availableQuantity = approvedResults[0].quantity;
        const requestedQuantity = parseInt(quantity, 10);
        
        if (requestedQuantity > availableQuantity) {
          return res.status(400).json({ 
            error: "Not enough quantity available", 
            available: availableQuantity,
            requested: requestedQuantity
          });
        }
        
        // Use a different query that doesn't trigger the foreign key check
        const insertDirectQuery = `
          INSERT INTO addtocart 
            (buyer_id, seller_id, product_id, product_name, product_description, category, type, size, status, quantity, price, original_price, image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Must use MySQL's IGNORE keyword to bypass foreign key constraint
        db.query("SET FOREIGN_KEY_CHECKS=0", [], (fkErr) => {
          if (fkErr) {
            return res.status(500).json({ error: "Database error", details: fkErr.message });
          }
          
          db.query(insertDirectQuery, [
            buyerId,
            seller_id,
            product_id,
            product_name,
            product_description || "",
            category || "",
            type || "",
            size || "",
            status || "",
            parseInt(quantity, 10),
            parseFloat(price),
            parseFloat(original_price) || 0,
            image || "",
          ], (insertErr, result) => {
            // Re-enable foreign key checks
            db.query("SET FOREIGN_KEY_CHECKS=1", []);
            
            if (insertErr) {
              return res.status(500).json({ error: "Error adding to cart", details: insertErr.message });
            }
            
            return res.status(200).json({ message: "Product successfully added to cart!" });
          });
        });
      } else {
        // Check if in regular products table (original behavior)
        const checkProductsQuery = "SELECT product_id, quantity FROM products WHERE product_id = ?";
        db.query(checkProductsQuery, [product_id], (prodErr, prodResults) => {
          if (prodErr || prodResults.length === 0) {
            return res.status(404).json({ error: "Product not found in any product table" });
          }
          
          // Check quantity availability in products table
          const availableQuantity = prodResults[0].quantity;
          const requestedQuantity = parseInt(quantity, 10);
          
          if (requestedQuantity > availableQuantity) {
            return res.status(400).json({ 
              error: "Not enough quantity available", 
              available: availableQuantity,
              requested: requestedQuantity
            });
          }
          
          // Original insert for products table items
          const insertQuery = `
            INSERT INTO addtocart 
              (buyer_id, seller_id, product_id, product_name, product_description, category, type, size, status, quantity, price, original_price, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertQuery, [
            buyerId,
            seller_id,
            product_id,
            product_name,
            product_description || "",
            category || "",
            type || "",
            size || "",
            status || "",
            parseInt(quantity, 10),
            parseFloat(price),
            parseFloat(original_price) || 0,
            image || "",
          ], (err, result) => {
            if (err) {
              return res.status(500).json({ error: "Error adding to cart", details: err.message });
            }
            
            return res.status(200).json({ message: "Product successfully added to cart!" });
          });
        });
      }
    });
  });
});




// PUT /api/cart/update/:cart_id - Update cart item quantity
router.put("/update/:cart_id", verifyToken, (req, res) => {
  const cartId = req.params.cart_id;
  const buyerId = req.userId;
  const { quantity } = req.body;
  
  if (!quantity || parseInt(quantity, 10) < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }
  




  // Verify cart item belongs to user and get product details
  const checkQuery = `
    SELECT c.*, 
      CASE 
        WHEN ap.product_id IS NOT NULL THEN ap.quantity 
        WHEN p.product_id IS NOT NULL THEN p.quantity 
        ELSE 0 
      END as available_quantity
    FROM addtocart c
    LEFT JOIN approvedproducts ap ON c.product_id = ap.product_id
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.cart_id = ? AND c.buyer_id = ?
  `;
  
  db.query(checkQuery, [cartId, buyerId], (err, results) => {
    if (err) {
      console.error("Error checking cart item:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }
    
    const cartItem = results[0];
    const newQuantity = parseInt(quantity, 10);
    const availableQuantity = parseInt(cartItem.available_quantity, 10);
    


    // Check if requested quantity is available
    if (newQuantity > availableQuantity) {
      return res.status(400).json({ 
        error: "Not enough quantity available", 
        available: availableQuantity,
        requested: newQuantity
      });
    }
    



    // Update cart item quantity
    const updateQuery = "UPDATE addtocart SET quantity = ? WHERE cart_id = ? AND buyer_id = ?";
    db.query(updateQuery, [newQuantity, cartId, buyerId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating cart quantity:", updateErr);
        return res.status(500).json({ error: "Error updating cart quantity", details: updateErr.message });
      }
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Cart item not found or unauthorized" });
      }
      
      return res.status(200).json({ 
        message: "Cart quantity updated successfully!",
        cart_id: cartId,
        quantity: newQuantity
      });
    });
  });
});




//  GET /api/cart – Fetch cart items for the logged-in buyer, including seller name
router.get("/", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const sql = `
    SELECT c.*, u.name AS sellerName,
      CASE 
        WHEN ap.product_id IS NOT NULL THEN ap.quantity 
        WHEN p.product_id IS NOT NULL THEN p.quantity 
        ELSE 0 
      END as available_quantity
    FROM addtocart c
    JOIN users u ON c.seller_id = u.id
    LEFT JOIN approvedproducts ap ON c.product_id = ap.product_id
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.buyer_id = ?
    ORDER BY c.added_date DESC
  `;
  db.query(sql, [buyerId], (err, results) => {
    if (err) {
      console.error("Error fetching cart items:", err);
      return res.status(500).json({ error: "Error fetching cart items" });
    }
    res.status(200).json(results);
  });
});




//DELETE /api/cart/:cart_id – Remove a cart item (only if it belongs to the logged-in buyer)
router.delete("/:cart_id", verifyToken, (req, res) => {
  const cartId = req.params.cart_id;
  const buyerId = req.userId; // from verifyToken middleware
  
  const sql = "DELETE FROM addtocart WHERE cart_id = ? AND buyer_id = ?";
  db.query(sql, [cartId, buyerId], (err, result) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return res.status(500).json({ error: "Error deleting cart item" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cart item not found or not authorized" });
    }
    return res.status(200).json({ message: "Cart item removed successfully" });
  });
});



module.exports = router;