const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();




// POST /api/checkout – Place an order for selected cart items
router.post("/", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const { address, phone, selectedCartIds } = req.body;

  if (!address || !phone) {
    return res.status(400).json({ error: "Address and phone are required." });
  }



  // Build the query to fetch cart items based on buyerId and optionally selectedCartIds.
  let fetchCartQuery = "SELECT * FROM addtocart WHERE buyer_id = ?";
  const queryParams = [buyerId];
  if (selectedCartIds && selectedCartIds.length > 0) {
    fetchCartQuery += " AND cart_id IN (?)";
    queryParams.push(selectedCartIds);
  }






  //Fetch cart items
  db.query(fetchCartQuery, queryParams, (err, cartItems) => {
    if (err) {
      return res.status(500).json({
        error: "Error fetching cart items",
        details: err.message,
      });
    }
    if (cartItems.length === 0) {
      return res.status(400).json({ error: "No cart items found for checkout." });
    }





    // Prepare orders data for bulk insert (one order per cart item)
    //insert item to cart
    const ordersData = cartItems.map((item) => [
      buyerId,
      item.seller_id,
      item.product_id,
      item.product_name,
      item.price,
      item.quantity,
      address,
      phone,
      "pending",
      new Date(), 
    ]);

    const insertOrdersQuery = `
      INSERT INTO orders 
        (buyer_id, seller_id, product_id, product_name, price, quantity, address, phone, status, created_at)
      VALUES ?
    `;
    db.query(insertOrdersQuery, [ordersData], (orderErr) => {
      if (orderErr) {
        return res.status(500).json({
          error: "Error placing order",
          details: orderErr.message,
        });
      }

      // Delete only the processed cart items from addtocart table
      //After successful order insert, it deletes the checked-out items from the addtocart table 
      let clearCartQuery = "DELETE FROM addtocart WHERE buyer_id = ?";
      const clearParams = [buyerId];
      if (selectedCartIds && selectedCartIds.length > 0) {
        clearCartQuery += " AND cart_id IN (?)";
        clearParams.push(selectedCartIds);
      }
      db.query(clearCartQuery, clearParams, (clearErr) => {
        if (clearErr) {
          return res.status(500).json({
            error: "Order placed but failed to clear selected cart items",
            details: clearErr.message,
          });
        }
        return res.status(200).json({ message: "Order placed successfully!" });
      });
    });
  });
});

module.exports = router;
