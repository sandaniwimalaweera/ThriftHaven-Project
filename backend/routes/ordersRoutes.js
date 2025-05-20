// backend/routes/ordersRoutes.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Create order after successful payment
router.post("/create", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const { 
    items, 
    paymentIntentId, 
    totalAmount, 
    address, 
    phone 
  } = req.body;

  if (!items || !items.length || !paymentIntentId || !address || !phone) {
    return res.status(400).json({ 
      error: "Missing required order information." 
    });
  }

  // Begin database transaction
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to create order", 
        details: err.message 
      });
    }

    // Check if all products have sufficient quantity
    const quantityChecks = items.map(item => {
      return new Promise((resolve, reject) => {
        const checkQuery = `
          SELECT quantity FROM approvedproducts 
          WHERE product_id = ?
        `;
        
        db.query(checkQuery, [item.product_id], (err, results) => {
          if (err) {
            return reject(err);
          }
          
          if (results.length === 0) {
            return reject(new Error(`Product with ID ${item.product_id} not found`));
          }
          
          if (results[0].quantity < item.quantity) {
            return reject(new Error(`Insufficient quantity for product ${item.product_name}. Available: ${results[0].quantity}, Requested: ${item.quantity}`));
          }
          
          resolve(true);
        });
      });
    });

    Promise.all(quantityChecks.map(p => p.catch(e => e)))
      .then(results => {
        // Check if any quantity checks failed
        const errors = results.filter(result => result instanceof Error);
        
        if (errors.length > 0) {
          return db.rollback(() => {
            console.error("Quantity check errors:", errors);
            res.status(400).json({
              error: "Insufficient product quantity",
              details: errors[0].message
            });
          });
        }

        // Get the actual amount (totalAmount comes in cents from frontend)
        // Convert back to decimal for storage
        const decimalAmount = parseFloat(totalAmount / 100).toFixed(2);

        // 1. Create payment record first
        const paymentQuery = `
          INSERT INTO payment_details 
            (payment_intent_id, buyer_id, amount, status, currency) 
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          paymentQuery, 
          [paymentIntentId, buyerId, decimalAmount, 'succeeded', 'lkr'],
          (paymentErr, paymentResult) => {
            if (paymentErr) {
              return db.rollback(() => {
                console.error("Payment record error:", paymentErr);
                res.status(500).json({
                  error: "Error recording payment details",
                  details: paymentErr.message
                });
              });
            }

            const paymentId = paymentResult.insertId;

            // 2. Insert all order items with the payment_id
            const orderInserts = items.map(item => {
              return new Promise((resolve, reject) => {
                const orderQuery = `
                  INSERT INTO orders 
                    (buyer_id, seller_id, product_id, product_name, price, quantity, address, phone, status, created_at, payment_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;
                
                db.query(
                  orderQuery, 
                  [
                    buyerId, 
                    item.seller_id, 
                    item.product_id, 
                    item.product_name, 
                    parseFloat(item.price).toFixed(2), // Ensure price is stored with 2 decimal places
                    item.quantity, 
                    address, 
                    phone, 
                    'paid', 
                    paymentId
                  ], 
                  (orderErr, orderResult) => {
                    if (orderErr) {
                      return reject(orderErr);
                    }
                    
                    // After inserting the order, update product quantity
                   const updateQuantityQuery = `
  UPDATE approvedproducts 
  SET quantity = GREATEST(quantity - ?, 0)
  WHERE product_id = ?
`;

db.query(
  updateQuantityQuery,
  [item.quantity, item.product_id],
  (updateErr) => {
    if (updateErr) {
      return reject(updateErr);
    }

    // Notify seller about the new order
    const insertNotificationQuery = `
      INSERT INTO notifications (
        user_id, type, title, message, is_read, reference_id, reference_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const sellerId = item.seller_id;
    const message = `New order received for ${item.product_name} (Qty: ${item.quantity})`;

    db.query(
      insertNotificationQuery,
      [
        sellerId,
        'new_order',
        'New Order Received',
        message,
        0,
        item.product_id,
        'order'
      ],
      (notifErr) => {
        if (notifErr) {
          console.error("Failed to notify seller:", notifErr);
        }
        resolve(orderResult.insertId); // continue flow
      }
    );  
  }
);

                  }
                );
              });
            });

            // Execute all order insertions and quantity updates
            Promise.all(orderInserts.map(p => p.catch(e => e)))
              .then(results => {
                // Check if any insertions failed
                const errors = results.filter(result => result instanceof Error);
                
                if (errors.length > 0) {
                  return db.rollback(() => {
                    console.error("Error creating orders:", errors);
                    res.status(500).json({
                      error: "Error creating orders",
                      details: errors[0].message
                    });
                  });
                }

                // 3. Clear cart items
                const clearCartQuery = "DELETE FROM addtocart WHERE buyer_id = ? AND product_id IN (?)";
                const productIds = items.map(item => item.product_id);

                db.query(clearCartQuery, [buyerId, productIds], (clearErr) => {
                  if (clearErr) {
                    return db.rollback(() => {
                      console.error("Cart clearing error:", clearErr);
                      res.status(500).json({
                        error: "Order placed but failed to clear cart items",
                        details: clearErr.message
                      });
                    });
                  }

                  // Commit transaction if everything succeeded
                  db.commit(commitErr => {
                    if (commitErr) {
                      return db.rollback(() => {
                        console.error("Commit error:", commitErr);
                        res.status(500).json({
                          error: "Transaction failed",
                          details: commitErr.message
                        });
                      });
                    }

                    // Return order data and success message
                    res.status(200).json({
                      success: true,
                      message: "Order placed successfully!",
                      paymentId: paymentId,
                      paymentIntentId: paymentIntentId
                    });
                  });
                });
              })
              .catch(error => {
                db.rollback(() => {
                  console.error("Error in Promise.all:", error);
                  res.status(500).json({
                    error: "Transaction failed",
                    details: error.message
                  });
                });
              });
          }
        );
      })
      .catch(error => {
        db.rollback(() => {
          console.error("Error in quantity checks:", error);
          res.status(500).json({
            error: "Failed to check product quantities",
            details: error.message
          });
        });
      });
  });
});

// Get user's orders
router.get("/my-orders", verifyToken, (req, res) => {
  const userId = req.userId;

  const query = `
    SELECT o.order_id, o.product_name, o.price, o.quantity, o.status, o.created_at, 
           o.address, o.phone, p.payment_id, p.payment_intent_id, p.status as payment_status,
           p.amount
    FROM orders o
    JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE o.buyer_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({
        error: "Failed to fetch orders",
        details: err.message
      });
    }

    // Group orders by payment_id to show related items together
    const groupedOrders = {};
    results.forEach(order => {
      if (!groupedOrders[order.payment_id]) {
        groupedOrders[order.payment_id] = {
          payment_id: order.payment_id,
          payment_intent_id: order.payment_intent_id,
          payment_status: order.payment_status,
          total_amount: parseFloat(order.amount), // Convert to float to handle properly
          created_at: order.created_at,
          address: order.address,
          phone: order.phone,
          items: []
        };
      }
      
      groupedOrders[order.payment_id].items.push({
        order_id: order.order_id,
        product_name: order.product_name,
        price: parseFloat(order.price), // Convert to float to handle properly
        quantity: order.quantity,
        status: order.status
      });
    });
    
    res.status(200).json(Object.values(groupedOrders));
  });
});

// Get total orders count for a buyer
router.get("/total-count", verifyToken, (req, res) => {
  const userId = req.userId;

  const query = `
    SELECT COUNT(*) as totalOrders
    FROM orders
    WHERE buyer_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching order count:", err);
      return res.status(500).json({
        error: "Failed to fetch order count",
        details: err.message
      });
    }

    res.status(200).json({
      totalOrders: results[0].totalOrders
    });
  });
});

// Request a refund for an order
router.post("/refund-request", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const { paymentId, reason, description } = req.body;
  
  // Validate required fields
  if (!paymentId || !reason) {
    return res.status(400).json({ 
      error: "Missing required refund information" 
    });
  }
  
  // First check if this payment belongs to the buyer
  const checkPaymentQuery = `
    SELECT payment_id, status, amount
    FROM payment_details
    WHERE payment_id = ? AND buyer_id = ?
  `;
  
  db.query(checkPaymentQuery, [paymentId, buyerId], (err, paymentResults) => {
    if (err) {
      console.error("Error checking payment:", err);
      return res.status(500).json({
        error: "Failed to process refund request",
        details: err.message
      });
    }
    
    // If payment not found or doesn't belong to buyer
    if (paymentResults.length === 0) {
      return res.status(404).json({
        error: "Payment not found or you don't have permission to request a refund"
      });
    }
    
    // Check if payment is in a refundable state
    const paymentStatus = paymentResults[0].status;
    if (paymentStatus !== 'succeeded' && paymentStatus !== 'paid') {
      return res.status(400).json({
        error: `Cannot request refund for payment with status: ${paymentStatus}`
      });
    }
    
    // Check if refund_requests table exists
    db.query("SHOW TABLES LIKE 'refund_requests'", (tableErr, tableResults) => {
      if (tableErr) {
        console.error("Error checking for refund_requests table:", tableErr);
        return res.status(500).json({
          error: "Failed to check database structure",
          details: tableErr.message
        });
      }
      
      // If table doesn't exist, create it
      if (tableResults.length === 0) {
        const createTableQuery = `
          CREATE TABLE refund_requests (
            refund_id INT AUTO_INCREMENT PRIMARY KEY,
            payment_id INT NOT NULL,
            buyer_id INT NOT NULL, 
            reason VARCHAR(50) NOT NULL,
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            amount DECIMAL(10,2) NOT NULL,
            requested_at DATETIME NOT NULL,
            processed_at DATETIME,
            admin_notes TEXT,
            FOREIGN KEY (payment_id) REFERENCES payment_details(payment_id),
            FOREIGN KEY (buyer_id) REFERENCES users(id)
          )
        `;
        
        db.query(createTableQuery, (createErr) => {
          if (createErr) {
            console.error("Error creating refund_requests table:", createErr);
            return res.status(500).json({
              error: "Failed to create refund processing system",
              details: createErr.message
            });
          }
          
          // Continue with inserting the refund request
          insertRefundRequest();
        });
      } else {
        // Table exists, continue with inserting the refund request
        insertRefundRequest();
      }
    });
    
    // Function to insert refund request record
    function insertRefundRequest() {
      const createRefundRequestQuery = `
        INSERT INTO refund_requests (
          payment_id,
          buyer_id,
          reason,
          description,
          status,
          amount,
          requested_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      db.query(
        createRefundRequestQuery,
        [
          paymentId,
          buyerId,
          reason,
          description || "",
          "pending",
          paymentResults[0].amount
        ],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Error creating refund request:", insertErr);
            return res.status(500).json({
              error: "Failed to create refund request",
              details: insertErr.message
            });
          }
          
          // Update payment status to refund_requested
          const updatePaymentQuery = `
            UPDATE payment_details
            SET status = 'refund_requested'
            WHERE payment_id = ?
          `;
          
          db.query(updatePaymentQuery, [paymentId], (updateErr) => {
            if (updateErr) {
              console.error("Error updating payment status:", updateErr);
              return res.status(500).json({
                error: "Refund request created but failed to update payment status",
                details: updateErr.message
              });
            }
            
            res.status(200).json({
              success: true,
              message: "Refund request submitted successfully",
              refundRequestId: result.insertId
            });
          });
        }
      );
    }
  });
});

// Get all refund requests for the buyer
router.get("/refund-requests", verifyToken, (req, res) => {
  const buyerId = req.userId;
  
  // Check if the refund_requests table exists
  db.query("SHOW TABLES LIKE 'refund_requests'", (tableErr, tableResults) => {
    if (tableErr) {
      console.error("Error checking for refund_requests table:", tableErr);
      return res.status(500).json({
        error: "Failed to check database structure"
      });
    }
    
    // If table doesn't exist yet, return empty array
    if (tableResults.length === 0) {
      return res.status(200).json([]);
    }
    
    // If table exists, query for refund requests
    const query = `
      SELECT r.*, p.payment_intent_id
      FROM refund_requests r
      JOIN payment_details p ON r.payment_id = p.payment_id
      WHERE r.buyer_id = ?
      ORDER BY r.requested_at DESC
    `;
    
    db.query(query, [buyerId], (err, results) => {
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
});

// Get all orders for a specific payment
router.get("/payment/:paymentId", verifyToken, (req, res) => {
  const userId = req.userId;
  const paymentId = req.params.paymentId;

  // Get payment details
  const paymentQuery = `
    SELECT * FROM payment_details WHERE payment_id = ? AND buyer_id = ?
  `;

  db.query(paymentQuery, [paymentId, userId], (paymentErr, paymentResults) => {
    if (paymentErr) {
      console.error("Error fetching payment:", paymentErr);
      return res.status(500).json({
        error: "Failed to fetch payment details",
        details: paymentErr.message
      });
    }

    if (paymentResults.length === 0) {
      return res.status(404).json({
        error: "Payment not found or you don't have permission to view it"
      });
    }

    // Get all orders associated with this payment
    const ordersQuery = `
      SELECT * FROM orders WHERE payment_id = ? AND buyer_id = ?
    `;

    db.query(ordersQuery, [paymentId, userId], (ordersErr, ordersResults) => {
      if (ordersErr) {
        console.error("Error fetching orders:", ordersErr);
        return res.status(500).json({
          error: "Failed to fetch order details",
          details: ordersErr.message
        });
      }

      // Return combined data
      res.status(200).json({
        payment: paymentResults[0],
        orders: ordersResults
      });
    });
  });
});

// Get a single order by ID
router.get("/:orderId", verifyToken, (req, res) => {
  const userId = req.userId;
  const orderId = req.params.orderId;

  const query = `
    SELECT o.*, p.payment_intent_id, p.status as payment_status, p.amount
    FROM orders o
    LEFT JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE o.order_id = ? AND o.buyer_id = ?
  `;

  db.query(query, [orderId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching order:", err);
      return res.status(500).json({
        error: "Failed to fetch order details",
        details: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Order not found or you don't have permission to view it"
      });
    }

    res.status(200).json(results[0]);
  });
});

// Get all refund requests for the buyer
router.get("/refund-requests", verifyToken, (req, res) => {
  const buyerId = req.userId;
  
  // Check if the refund_requests table exists
  db.query("SHOW TABLES LIKE 'refund_requests'", (tableErr, tableResults) => {
    if (tableErr) {
      console.error("Error checking for refund_requests table:", tableErr);
      return res.status(500).json({
        error: "Failed to check database structure"
      });
    }
    
    // If table doesn't exist yet, return empty array
    if (tableResults.length === 0) {
      return res.status(200).json([]);
    }
    
    // If table exists, query for refund requests
    const query = `
      SELECT r.*, p.payment_intent_id, 
             o.product_name, o.order_id
      FROM refund_requests r
      JOIN payment_details p ON r.payment_id = p.payment_id
      JOIN orders o ON p.payment_id = o.payment_id
      WHERE r.buyer_id = ?
      GROUP BY r.refund_id
      ORDER BY r.requested_at DESC
    `;
    
    db.query(query, [buyerId], (err, results) => {
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
});

// Get total sales count for a seller
router.get("/seller/total-sales", verifyToken, (req, res) => {
  const sellerId = req.userId;

  const query = `
    SELECT COUNT(*) as totalSales
    FROM orders
    WHERE seller_id = ?
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching total sales count:", err);
      return res.status(500).json({
        error: "Failed to fetch total sales count",
        details: err.message
      });
    }

    res.status(200).json({
      totalSales: results[0].totalSales
    });
  });
});

// Get total revenue for a seller
router.get("/seller/total-revenue", verifyToken, (req, res) => {
  const sellerId = req.userId;

  const query = `
    SELECT SUM(price * quantity) as totalRevenue
    FROM orders
    WHERE seller_id = ?
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching total revenue:", err);
      return res.status(500).json({
        error: "Failed to fetch total revenue",
        details: err.message
      });
    }

    const totalRevenue = results[0].totalRevenue || 0;
    
    res.status(200).json({
      totalRevenue: parseFloat(totalRevenue).toFixed(2)
    });
  });
});

// Get all orders for a seller (sales/orders he received)
router.get("/seller/my-orders", verifyToken, (req, res) => {
  const sellerId = req.userId;

  const query = `
    SELECT 
      o.order_id, o.product_name, o.price, o.quantity, 
      o.status, o.created_at, o.address, o.phone, 
      p.payment_intent_id, p.status as payment_status, p.amount
    FROM orders o
    JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE o.seller_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching seller orders:", err);
      return res.status(500).json({
        error: "Failed to fetch seller orders",
        details: err.message
      });
    }
    res.status(200).json(results);
  });
});

// Get all refund requested items for a seller
router.get("/seller/refund-requests", verifyToken, (req, res) => {
  const sellerId = req.userId;

  const query = `
    SELECT 
      r.refund_id, r.reason, r.description, r.status AS refund_status, 
      r.requested_at, r.amount,
      o.order_id, o.product_name, o.price, o.quantity,
      p.payment_intent_id, p.status AS payment_status
    FROM refund_requests r
    JOIN payment_details p ON r.payment_id = p.payment_id
    JOIN orders o ON o.payment_id = p.payment_id
    WHERE o.seller_id = ?
    ORDER BY r.requested_at DESC
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching seller refund requests:", err);
      return res.status(500).json({
        error: "Failed to fetch seller refund requests",
        details: err.message
      });
    }
    res.status(200).json(results);
  });
});

// Get a single order by ID for seller
router.get("/seller/:orderId", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const orderId = req.params.orderId;

  const query = `
    SELECT o.*, p.payment_intent_id, p.status as payment_status, p.amount
    FROM orders o
    LEFT JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE o.order_id = ? AND o.seller_id = ?
  `;

  db.query(query, [orderId, sellerId], (err, results) => {
    if (err) {
      console.error("Error fetching order:", err);
      return res.status(500).json({
        error: "Failed to fetch order details",
        details: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Order not found or you don't have permission to view it"
      });
    }

    res.status(200).json(results[0]);
  });
});

// Update order status (for sellers)
router.put("/:orderId/status", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const orderId = req.params.orderId;
  const { status } = req.body;
  
  // Validate status value
  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status value. Must be one of: pending, processing, shipped, completed, cancelled"
    });
  }
  
  // First check if this order belongs to the seller
  const checkOrderQuery = `
    SELECT order_id, status
    FROM orders
    WHERE order_id = ? AND seller_id = ?
  `;
  
  db.query(checkOrderQuery, [orderId, sellerId], (err, orderResults) => {
    if (err) {
      console.error("Error checking order:", err);
      return res.status(500).json({
        error: "Failed to process status update",
        details: err.message
      });
    }
    
    // If order not found or doesn't belong to seller
    if (orderResults.length === 0) {
      return res.status(404).json({
        error: "Order not found or you don't have permission to update it"
      });
    }
    
    // Update the order status
    const updateQuery = `
      UPDATE orders
      SET status = ?
      WHERE order_id = ? AND seller_id = ?
    `;
    
    db.query(updateQuery, [status, orderId, sellerId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating order status:", updateErr);
        return res.status(500).json({
          error: "Failed to update order status",
          details: updateErr.message
        });
      }
      
      if (updateResult.affectedRows === 0) {
        return res.status(400).json({
          error: "Update failed - order may not belong to you or no changes were made"
        });
      }
      
      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        orderId: orderId,
        newStatus: status
      });
    });
  });
});

// Confirm order received (for buyers)
router.post("/confirm-received", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ 
      error: "Missing payment ID" 
    });
  }
  
  // Begin database transaction to ensure all updates are atomic
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to process order confirmation", 
        details: err.message 
      });
    }
    
    // First check if this payment belongs to the buyer and get all shipped orders
    const checkOrdersQuery = `
      SELECT o.order_id, o.status
      FROM orders o
      WHERE o.payment_id = ? AND o.buyer_id = ? AND o.status = 'shipped'
    `;
    
    db.query(checkOrdersQuery, [paymentId, buyerId], (err, orderResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error checking orders:", err);
          res.status(500).json({
            error: "Failed to process order confirmation",
            details: err.message
          });
        });
      }
      
      // If no shipped orders found
      if (orderResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({
            error: "No shipped items found for this order or you don't have permission"
          });
        });
      }
      
      // Collect all order IDs that need to be updated
      const orderIds = orderResults.map(order => order.order_id);
      
      // Update all shipped orders to 'received' status
      const updateQuery = `
        UPDATE orders
        SET status = 'received'
        WHERE order_id IN (?) AND buyer_id = ? AND status = 'shipped'
      `;
      
      db.query(updateQuery, [orderIds, buyerId], (updateErr, updateResult) => {
        if (updateErr) {
          return db.rollback(() => {
            console.error("Error updating order status:", updateErr);
            res.status(500).json({
              error: "Failed to update order status",
              details: updateErr.message
            });
          });
        }
        
        // Commit the transaction
        db.commit(commitErr => {
          if (commitErr) {
            return db.rollback(() => {
              console.error("Commit error:", commitErr);
              res.status(500).json({
                error: "Transaction failed",
                details: commitErr.message
              });
            });
          }
          
          // Return success response
          res.status(200).json({
            success: true,
            message: "Orders have been marked as received",
            updatedCount: updateResult.affectedRows,
            orderIds: orderIds
          });
        });
      });
    });
  });
});

// ADMIN ROUTE: Get all orders
router.get("/admin/all-orders", (req, res) => {
  const query = `
  SELECT o.order_id, o.buyer_id, o.seller_id, o.product_id, o.product_name, 
           o.price, o.quantity, o.address, o.phone, o.status, o.created_at,
           p.payment_id, p.payment_intent_id, p.amount, p.status as payment_status,
           u1.name as buyer_name, u1.email as buyer_email,
           u2.name as seller_name, u2.email as seller_email
    FROM orders o
    JOIN payment_details p ON o.payment_id = p.payment_id
    JOIN users u1 ON o.buyer_id = u1.id
    JOIN users u2 ON o.seller_id = u2.id
    ORDER BY o.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching all orders:", err);
      return res.status(500).json({ 
        error: "Failed to fetch all orders", 
        details: err.message 
      });
    }

    // Group orders by payment_id to show related items together
    const groupedOrders = {};
    results.forEach(order => {
      if (!groupedOrders[order.payment_id]) {
        groupedOrders[order.payment_id] = {
          payment_id: order.payment_id,
          payment_intent_id: order.payment_intent_id,
          payment_status: order.payment_status,
          total_amount: parseFloat(order.amount),
          created_at: order.created_at,
          address: order.address,
          phone: order.phone,
          buyer_name: order.buyer_name,
          buyer_email: order.buyer_email,
          items: []
        };
      }
      
      groupedOrders[order.payment_id].items.push({
        order_id: order.order_id,
        product_id: order.product_id,
        product_name: order.product_name,
        price: parseFloat(order.price),
        quantity: order.quantity,
        status: order.status,
        seller_name: order.seller_name,
        seller_email: order.seller_email
      });
    });
    
    res.status(200).json(Object.values(groupedOrders));
  });
});

// ADMIN ROUTE: Get order statistics
router.get("/admin/statistics", (req, res) => {
  // Get total number of orders, total revenue, and sales by status
  const statsQuery = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(price * quantity) as total_revenue,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
    FROM orders
  `;

  // Get monthly sales data for charts
  const monthlySalesQuery = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as order_count,
      SUM(price * quantity) as revenue
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month
  `;

  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch statistics", 
        details: err.message 
      });
    }

    db.query(statsQuery, (err, statsResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error fetching order statistics:", err);
          res.status(500).json({
            error: "Failed to fetch order statistics",
            details: err.message
          });
        });
      }

      db.query(monthlySalesQuery, (err, monthlySalesResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error fetching monthly sales:", err);
            res.status(500).json({
              error: "Failed to fetch monthly sales data",
              details: err.message
            });
          });
        }

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

          res.status(200).json({
            stats: statsResults[0],
            monthlySales: monthlySalesResults
          });
        });
      });
    });
  });
});

// Approve a refund request (admin only)
router.post("/refund/approve/:refundId", (req, res) => {
  const refundId = req.params.refundId;
  
  // First, get the refund request details
  const getRefundQuery = `
    SELECT r.*, p.payment_intent_id 
    FROM refund_requests r
    JOIN payment_details p ON r.payment_id = p.payment_id
    WHERE r.refund_id = ?
  `;
  
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to process refund approval", 
        details: err.message 
      });
    }
    
    db.query(getRefundQuery, [refundId], (err, refundResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error fetching refund request:", err);
          res.status(500).json({
            error: "Failed to fetch refund request",
            details: err.message
          });
        });
      }
      
      if (refundResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({
            error: "Refund request not found"
          });
        });
      }
      
      const refundRequest = refundResults[0];
      
      // Here you would typically interact with Stripe API to process the actual refund
      // For example: 
      // const refund = await stripe.refunds.create({
      //   payment_intent: refundRequest.payment_intent_id,
      // });
      
      // For now, we'll just update the status in our database
      
      // Update refund request status
      const updateRefundQuery = `
        UPDATE refund_requests
        SET status = 'approved', processed_at = NOW(), admin_notes = ?
        WHERE refund_id = ?
      `;
      
      db.query(
        updateRefundQuery, 
        ["Refund approved by admin", refundId], 
        (updateErr) => {
          if (updateErr) {
            return db.rollback(() => {
              console.error("Error updating refund status:", updateErr);
              res.status(500).json({
                error: "Failed to update refund status",
                details: updateErr.message
              });
            });
          }
          
          // Update payment details status
          const updatePaymentQuery = `
            UPDATE payment_details
            SET status = 'refunded'
            WHERE payment_id = ?
          `;
          
          db.query(updatePaymentQuery, [refundRequest.payment_id], (paymentErr) => {
            if (paymentErr) {
              return db.rollback(() => {
                console.error("Error updating payment status:", paymentErr);
                res.status(500).json({
                  error: "Failed to update payment status",
                  details: paymentErr.message
                });
              });
            }
            
            // Update all associated orders status
            const updateOrdersQuery = `
              UPDATE orders
              SET status = 'refunded'
              WHERE payment_id = ?
            `;
            
            db.query(updateOrdersQuery, [refundRequest.payment_id], (ordersErr) => {
              if (ordersErr) {
                return db.rollback(() => {
                  console.error("Error updating orders status:", ordersErr);
                  res.status(500).json({
                    error: "Failed to update orders status",
                    details: ordersErr.message
                  });
                });
              }
              
              // Get all refunded orders to restore product quantities
              const getOrdersQuery = `
                SELECT product_id, quantity
                FROM orders
                WHERE payment_id = ?
              `;
              
              db.query(getOrdersQuery, [refundRequest.payment_id], (getOrdersErr, orders) => {
                if (getOrdersErr) {
                  return db.rollback(() => {
                    console.error("Error getting orders for quantity restore:", getOrdersErr);
                    res.status(500).json({
                      error: "Failed to get orders for quantity restore",
                      details: getOrdersErr.message
                    });
                  });
                }
                
                // Create an array of promises to restore product quantities
                const restorePromises = orders.map(order => {
                  return new Promise((resolve, reject) => {
                    const restoreQuery = `
                      UPDATE approvedproducts
                      SET quantity = quantity + ?
                      WHERE product_id = ?
                    `;
                    
                    db.query(restoreQuery, [order.quantity, order.product_id], (restoreErr) => {
                      if (restoreErr) {
                        return reject(restoreErr);
                      }
                      resolve();
                    });
                  });
                });
                
                // Execute all restore quantity operations
                Promise.all(restorePromises.map(p => p.catch(e => e)))
                  .then(results => {
                    // Check if any restore operations failed
                    const errors = results.filter(result => result instanceof Error);
                    
                    if (errors.length > 0) {
                      return db.rollback(() => {
                        console.error("Error restoring product quantities:", errors);
                        res.status(500).json({
                          error: "Error restoring product quantities",
                          details: errors[0].message
                        });
                      });
                    }
                    
                    // Commit transaction
                    db.commit(commitErr => {
                      if (commitErr) {
                        return db.rollback(() => {
                          console.error("Commit error:", commitErr);
                          res.status(500).json({
                            error: "Transaction failed",
                            details: commitErr.message
                          });
                        });
                      }
                      
                      res.status(200).json({
                        success: true,
                        message: "Refund approved successfully and product quantities restored",
                        refundId: refundId
                      });
                    });
                  })
                  .catch(error => {
                    db.rollback(() => {
                      console.error("Error in Promise.all for restore quantities:", error);
                      res.status(500).json({
                        error: "Transaction failed",
                        details: error.message
                      });
                    });
                  });
              });
            });
          });
        }
      );
    });
  });
});

// Reject a refund request (admin only)
router.post("/refund/reject/:refundId", (req, res) => {
  const refundId = req.params.refundId;
  const { reason } = req.body; // Optional reason for rejection
  
  // First, get the refund request details
  const getRefundQuery = `
    SELECT * FROM refund_requests WHERE refund_id = ?
  `;
  
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to process refund rejection", 
        details: err.message 
      });
    }
    
    db.query(getRefundQuery, [refundId], (err, refundResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error fetching refund request:", err);
          res.status(500).json({
            error: "Failed to fetch refund request",
            details: err.message
          });
        });
      }
      
      if (refundResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({
            error: "Refund request not found"
          });
        });
      }
      
      const refundRequest = refundResults[0];
      
      // Update refund request status
      const updateRefundQuery = `
        UPDATE refund_requests
        SET status = 'rejected', processed_at = NOW(), admin_notes = ?
        WHERE refund_id = ?
      `;
      
      db.query(
        updateRefundQuery, 
        [reason || "Refund rejected by admin", refundId], 
        (updateErr) => {
          if (updateErr) {
            return db.rollback(() => {
              console.error("Error updating refund status:", updateErr);
              res.status(500).json({
                error: "Failed to update refund status",
                details: updateErr.message
              });
            });
          }
          
          // Update payment details status back to 'succeeded'
          const updatePaymentQuery = `
            UPDATE payment_details
            SET status = 'succeeded'
            WHERE payment_id = ?
          `;
          
          db.query(updatePaymentQuery, [refundRequest.payment_id], (paymentErr) => {
            if (paymentErr) {
              return db.rollback(() => {
                console.error("Error updating payment status:", paymentErr);
                res.status(500).json({
                  error: "Failed to update payment status",
                  details: paymentErr.message
                });
              });
            }
            
            // Commit transaction
            db.commit(commitErr => {
              if (commitErr) {
                return db.rollback(() => {
                  console.error("Commit error:", commitErr);
                  res.status(500).json({
                    error: "Transaction failed",
                    details: commitErr.message
                  });
                });
              }
              
              res.status(200).json({
                success: true,
                message: "Refund rejected successfully",
                refundId: refundId
              });
            });
          });
        }
      );
    });
  });
});

// ADMIN ROUTE: Seller-wise order & revenue summary
router.get("/admin/seller-summary", (req, res) => {
  const query = `
    SELECT 
      o.seller_id,
      u.name as seller_name,
      u.email as seller_email,
      COUNT(o.order_id) AS total_orders,
      SUM(o.price * o.quantity) AS total_revenue
    FROM orders o
    JOIN users u ON o.seller_id = u.id
    GROUP BY o.seller_id
    ORDER BY total_revenue DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching seller summary:", err);
      return res.status(500).json({
        error: "Failed to fetch seller summary",
        details: err.message,
      });
    }
    res.status(200).json(results);
  });
});

// ADMIN ROUTE: Get all refund requests
router.get("/admin/refund-requests", (req, res) => {
  const query = `
    SELECT 
      r.refund_id, r.payment_id, r.buyer_id, r.reason, r.description, r.status, 
      r.amount, r.requested_at, r.processed_at, r.admin_notes,
      u.name AS buyer_name, u.email AS buyer_email,
      p.payment_intent_id, p.status AS payment_status
    FROM refund_requests r
    JOIN users u ON r.buyer_id = u.id
    JOIN payment_details p ON r.payment_id = p.payment_id
    ORDER BY r.requested_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching refund requests:", err);
      return res.status(500).json({
        error: "Failed to fetch refund requests",
        details: err.message,
      });
    }

    res.status(200).json(results);
  });
});

// Get all orders for a specific payment (with product details)
router.get("/payment/:paymentId", verifyToken, (req, res) => {
  const userId = req.userId;
  const paymentId = req.params.paymentId;

  // Get payment details
  const paymentQuery = `
    SELECT * FROM payment_details WHERE payment_id = ? AND buyer_id = ?
  `;

  db.query(paymentQuery, [paymentId, userId], (paymentErr, paymentResults) => {
    if (paymentErr) {
      console.error("Error fetching payment:", paymentErr);
      return res.status(500).json({
        error: "Failed to fetch payment details",
        details: paymentErr.message
      });
    }

    if (paymentResults.length === 0) {
      return res.status(404).json({
        error: "Payment not found or you don't have permission to view it"
      });
    }

    // Get orders with product details
    const ordersQuery = `
      SELECT 
        o.*, 
        ap.description AS product_description,
        ap.image AS product_image,
        ap.size AS product_size,
        ap.category AS product_category,
        ap.type AS product_type
      FROM orders o
      LEFT JOIN approvedproducts ap ON o.product_id = ap.product_id
      WHERE o.payment_id = ? AND o.buyer_id = ?
    `;

    db.query(ordersQuery, [paymentId, userId], (ordersErr, ordersResults) => {
      if (ordersErr) {
        console.error("Error fetching orders:", ordersErr);
        return res.status(500).json({
          error: "Failed to fetch orders",
          details: ordersErr.message
        });
      }

      // Return combined data
      res.status(200).json({
        payment: paymentResults[0],
        orders: ordersResults
      });
    });
  });
});

// ADMIN ROUTE: Get refund order details
router.get("/admin/refund-order-details/:paymentId", (req, res) => {
  const { paymentId } = req.params;

  const query = `
    SELECT 
      o.*, 
      ap.product_name, ap.description AS product_description,
      ap.image AS product_image,
      ap.size AS product_size,
      ap.category AS product_category,
      ap.type AS product_type
    FROM orders o
    LEFT JOIN approvedproducts ap ON o.product_id = ap.product_id
    WHERE o.payment_id = ?
  `;

  db.query(query, [paymentId], (err, results) => {
    if (err) {
      console.error("Error fetching refund order details:", err);
      return res.status(500).json({ error: "Failed to fetch refund order details" });
    }
    res.status(200).json({ orders: results });
  });
});




// Add this endpoint to your orderRoutes.js file

router.put("/seller/accept-refund/:refundId", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const { refundId } = req.params;
  
  console.log(`Processing refund ID: ${refundId} for seller ID: ${sellerId}`);
  
  // First, check if the refund exists and is approved
  db.query(
    "SELECT * FROM refund_requests WHERE refund_id = ? AND status = 'approved'",
    [refundId],
    (err, refundResults) => {
      if (err) {
        console.error("Error checking refund:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      
      if (!refundResults || refundResults.length === 0) {
        return res.status(404).json({ error: "Refund not found or not approved" });
      }
      
      const refundInfo = refundResults[0];
      
      // Now check if this seller is authorized to accept this refund
      db.query(
        "SELECT * FROM orders WHERE payment_id = ? AND seller_id = ?",
        [refundInfo.payment_id, sellerId],
        (err, orderResults) => {
          if (err) {
            console.error("Error checking seller authorization:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          
          if (!orderResults || orderResults.length === 0) {
            return res.status(403).json({ error: "Not authorized to accept this refund" });
          }
          
          // Now update the refund status
          const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          db.query(
            "UPDATE refund_requests SET status = 'completed', seller_accepted_at = ?, updated_at = ? WHERE refund_id = ?",
            [currentTime, currentTime, refundId],
            (err, updateResult) => {
              if (err) {
                console.error("Error updating refund:", err);
                return res.status(500).json({ error: "Failed to update refund", details: err.message });
              }
              
              // Also update the payment status
              db.query(
                "UPDATE payment_details SET status = 'refunded' WHERE payment_id = ?",
                [refundInfo.payment_id],
                (err) => {
                  if (err) {
                    console.error("Error updating payment:", err);
                    // Don't fail the entire process if this update fails
                  }
                  
                  // Try to create a notification for the buyer
                  try {
                    const buyerId = refundInfo.buyer_id;
                    const refundAmount = refundInfo.amount;
                    
                    // Check if notifications table exists before trying to insert
                    db.query("SHOW TABLES LIKE 'notifications'", (err, tables) => {
                      if (!err && tables.length > 0) {
                        // Table exists, try to insert notification
                        const message = `Your refund of ${refundAmount} has been processed by the seller.`;
                        
                        db.query(
                          "INSERT INTO notifications (user_id, type, title, message, is_read, reference_id, reference_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                          [buyerId, 'refund_completed', 'Refund Completed', message, 0, refundId, 'refund', currentTime],
                          (err) => {
                            if (err) {
                              console.error("Error creating notification:", err);
                              // Don't fail if notification creation fails
                            }
                          }
                        );
                      }
                    });
                  } catch (notifError) {
                    console.error("Error in notification creation:", notifError);
                    // Don't fail if notification creation fails
                  }
                  
                  // Return success response
                  res.status(200).json({
                    success: true,
                    message: "Refund has been accepted and processed successfully"
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
// Add this endpoint to your orderRoutes.js file

// Get detailed refund request information for buyer
router.get("/refund/:refundId", verifyToken, (req, res) => {
  const buyerId = req.userId;
  const refundId = req.params.refundId;
  
  // SQL query to get complete refund information
  const query = `
    SELECT 
      r.*,
      p.payment_intent_id, p.status as payment_status,
      o.product_name, o.price, o.quantity, o.seller_id, o.order_id,
      u.name as seller_name
    FROM refund_requests r
    JOIN payment_details p ON r.payment_id = p.payment_id
    JOIN orders o ON o.order_id = r.order_id
    JOIN users u ON o.seller_id = u.id
    WHERE r.refund_id = ? AND r.buyer_id = ?
    LIMIT 1
  `;
  
  db.query(query, [refundId, buyerId], (err, results) => {
    if (err) {
      console.error("Error fetching refund details:", err);
      return res.status(500).json({
        error: "Failed to fetch refund details",
        details: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        error: "Refund request not found or you don't have permission to view it"
      });
    }
    
    // If buyer accesses a refund notification, mark it as read
    markRelatedNotificationsAsRead(buyerId, refundId);
    
    // Return the refund data
    res.status(200).json({
      refund: results[0]
    });
  });
});

// Helper function to mark related notifications as read
function markRelatedNotificationsAsRead(userId, refundId) {
  // Check if notifications table exists
  db.query("SHOW TABLES LIKE 'notifications'", (tableErr, tableResults) => {
    if (tableErr || tableResults.length === 0) {
      // Table doesn't exist or there was an error, just ignore
      return;
    }
    
    // Update notifications to mark them as read
    const updateQuery = `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? 
        AND reference_id = ? 
        AND reference_type = 'refund'
        AND type = 'refund_completed'
        AND is_read = 0
    `;
    
    db.query(updateQuery, [userId, refundId], (updateErr) => {
      if (updateErr) {
        console.error("Error marking notifications as read:", updateErr);
      }
    });
  });
}

// ADMIN ROUTE: Filter orders by month/year
router.get("/admin/orders-by-period", (req, res) => {
  const { year, month } = req.query;

  const conditions = [];
  const params = [];

  if (year) {
    conditions.push("YEAR(o.created_at) = ?");
    params.push(year);
  }

  if (month && month !== 'all') {
    conditions.push("MONTH(o.created_at) = ?");
    params.push(month);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT o.order_id, o.buyer_id, o.seller_id, o.product_id, o.product_name, 
           o.price, o.quantity, o.address, o.phone, o.status, o.created_at,
           p.payment_id, p.payment_intent_id, p.amount, p.status as payment_status,
           u1.name as buyer_name, u1.email as buyer_email,
           u2.name as seller_name, u2.email as seller_email
    FROM orders o
    JOIN payment_details p ON o.payment_id = p.payment_id
    JOIN users u1 ON o.buyer_id = u1.id
    JOIN users u2 ON o.seller_id = u2.id
    ${whereClause}
    ORDER BY o.created_at DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching filtered orders:", err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    // Group as you already do
    const groupedOrders = {};
    results.forEach(order => {
      if (!groupedOrders[order.payment_id]) {
        groupedOrders[order.payment_id] = {
          payment_id: order.payment_id,
          payment_intent_id: order.payment_intent_id,
          payment_status: order.payment_status,
          total_amount: parseFloat(order.amount),
          created_at: order.created_at,
          address: order.address,
          phone: order.phone,
          buyer_name: order.buyer_name,
          buyer_email: order.buyer_email,
          items: []
        };
      }

      groupedOrders[order.payment_id].items.push({
        order_id: order.order_id,
        product_id: order.product_id,
        product_name: order.product_name,
        price: parseFloat(order.price),
        quantity: order.quantity,
        status: order.status,
        seller_name: order.seller_name,
        seller_email: order.seller_email
      });
    });

    res.status(200).json(Object.values(groupedOrders));
  });
});





// ADMIN ROUTE: Get total refunded amount
router.get("/admin/total-refunded", (req, res) => {
  const query = `
    SELECT SUM(amount) as total_refunded
    FROM refund_requests
    WHERE status IN ('approved', 'completed')
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching total refunded amount:", err);
      return res.status(500).json({ error: "Failed to fetch total refunded amount" });
    }

    const totalRefunded = results[0]?.total_refunded || 0;
    res.status(200).json({ total_refunded: parseFloat(totalRefunded) });
  });
});



//Get total approved refunded amount to admin-sales-details
router.get("/admin/total-approved-refunded", (req, res) => {
  const query = `
    SELECT SUM(amount) AS total_approved_refunded
    FROM refund_requests
    WHERE status = 'approved'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching total approved refunded amount:", err);
      return res.status(500).json({ error: "Failed to fetch approved refund amount" });
    }

    res.status(200).json({
      total_approved_refunded: parseFloat(results[0].total_approved_refunded || 0)
    });
  });
});

// Get total completed refunded amount
router.get("/admin/total-completed-refunded", (req, res) => {
  const query = `
    SELECT SUM(amount) AS total_completed_refunded
    FROM refund_requests
    WHERE status = 'completed'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching total completed refund amount:", err);
      return res.status(500).json({ error: "Failed to fetch completed refund amount" });
    }

    res.status(200).json({
      total_completed_refunded: parseFloat(results[0].total_completed_refunded || 0)
    });
  });
});



// Get total count of completed refunds
router.get("/admin/total-completed-refund-count", (req, res) => {
  const query = `
    SELECT COUNT(*) AS total_completed_count
    FROM refund_requests
    WHERE status = 'completed'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching completed refund count:", err);
      return res.status(500).json({ error: "Failed to fetch completed refund count" });
    }

    res.status(200).json({
      total_completed_count: results[0].total_completed_count || 0
    });
  });
});

module.exports = router;