// backend/routes/paymentRoutes.js
const express = require("express");
const Stripe = require("stripe");
const db = require("../db");
const router = express.Router();

//authentication middleware
const verifyToken = require("../middleware/verifyToken");

// Initialize Stripe using the secret key from .env
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId; // Get authenticated user ID

    // Validate that amount is a positive number
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "A valid positive amount is required" });
    }

    console.log("Received amount:", amount);

    // For Stripe, need to convert to the smallest currency unit (cents)
    
    const stripeAmount = Math.round(amount * 100);


    const PLATFORM_FEE_PERCENTAGE = 20; // 20% platform fee



// Helper function to calculate platform fee
const calculatePlatformFee = (amount) => {
  return parseFloat((amount * (PLATFORM_FEE_PERCENTAGE / 100)).toFixed(2));
};


    // Create PaymentIntent using Stripe API
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount, // Convert to cents for Stripe
      currency: "lkr", 
      metadata: {
        userId: userId
      }
    });

    console.log("PaymentIntent created with ID:", paymentIntent.id);

    // Respond with client secret to the frontend
    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error.message);

    // Respond with error message
    res.status(500).json({
      error: "Payment initiation failed",
      details: error.message,
    });
  }
});

// Handle webhook events from Stripe (for payment status updates)
router.post("/webhook", express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Update payment status in database
    db.query(
      'UPDATE payment_details SET status = ? WHERE payment_intent_id = ?',
      ['succeeded', paymentIntent.id],
      (err) => {
        if (err) {
          console.error('Error updating payment status:', err);
        }
      }
    );
  }
  
  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

// Save payment details 
router.post("/save-payment-details", verifyToken, (req, res) => {
  const { 
    paymentIntentId, 
    paymentMethodId, 
    amount, 
    status, 
    orderId 
  } = req.body;
  
  
  // Insert payment details into database
  // Store the actual decimal amount (not multiplied by 100)
  const query = `
    INSERT INTO payment_details 
      (payment_intent_id, payment_method_id, amount, status, order_id, currency) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    query, 
    [paymentIntentId, paymentMethodId, parseFloat(amount).toFixed(2), status, orderId, 'lkr'],
    (err, result) => {
      if (err) {
        console.error('Error saving payment details:', err);
        return res.status(500).json({ 
          error: 'Failed to save payment details',
          details: err.message
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        paymentId: result.insertId 
      });
    }
  );
});

// Update the seller/payments endpoint to accept filter parameters
router.get("/seller/payments", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const { status } = req.query; // Get status filter from query parameters
  
  console.log(`Fetching payments for seller ID: ${sellerId}, status filter: ${status || 'all'}`);

  // Base query
  let query = `
    SELECT DISTINCT
      p.payment_id, 
      p.payment_intent_id, 
      p.amount, 
      p.status, 
      p.currency, 
      p.payment_method_id,
      p.payment_date
    FROM payment_details p
    JOIN orders o ON p.payment_id = o.payment_id
    WHERE o.seller_id = ?
  `;
  
  // Add status filter if specified
  const queryParams = [sellerId];
  if (status && status !== 'all') {
    query += ` AND p.status = ?`;
    queryParams.push(status);
  }
  
  // Add order by clause
  query += ` ORDER BY p.payment_id DESC`;
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching seller payment details:", err);
      return res.status(500).json({
        error: "Failed to fetch seller payment details",
        details: err.message
      });
    }
    
    console.log(`Found ${results.length} payments for seller ${sellerId}`);
    
    // Ensure all results have a valid date
    const enhancedResults = results.map(payment => {
      // If payment doesn't have a valid date, set current date as fallback
      if (!payment.payment_date || new Date(payment.payment_date).toString() === 'Invalid Date') {
        payment.payment_date = new Date().toISOString();
      }
      return payment;
    });
    
    res.status(200).json(enhancedResults);
  });
});

//ADMIN ROUTE: Get all payment details
router.get("/admin/all-payments", (req, res) => {
  const query = `
    SELECT 
      p.payment_id, p.payment_intent_id, p.buyer_id, p.amount, 
      p.status, p.currency, p.created_at,
      u.name as buyer_name, u.email as buyer_email,
      (
        SELECT COUNT(*) 
        FROM orders o 
        WHERE o.payment_id = p.payment_id
      ) as order_count,
      (
        SELECT SUM(o.price * o.quantity) 
        FROM orders o 
        WHERE o.payment_id = p.payment_id
      ) as total_amount
    FROM payment_details p
    JOIN users u ON p.buyer_id = u.id
    ORDER BY p.payment_id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching payment details:", err);
      return res.status(500).json({
        error: "Failed to fetch payment details",
        details: err.message
      });
    }
    
    res.status(200).json(results);
  });
});

//ADMIN ROUTE: Get payment statistics
router.get("/admin/payment-statistics", (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
      SUM(CASE WHEN status = 'refund_requested' THEN 1 ELSE 0 END) as refund_requested,
      SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_payments,
      AVG(amount) as average_amount
    FROM payment_details
  `;

  // Monthly payment data
  const monthlyQuery = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as payment_count,
      SUM(amount) as total_amount
    FROM payment_details
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month
  `;

  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch payment statistics", 
        details: err.message 
      });
    }

    db.query(query, (err, statsResults) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error fetching payment statistics:", err);
          res.status(500).json({
            error: "Failed to fetch payment statistics",
            details: err.message
          });
        });
      }

      db.query(monthlyQuery, (err, monthlyResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error fetching monthly payment data:", err);
            res.status(500).json({
              error: "Failed to fetch monthly payment data",
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
            monthlyData: monthlyResults
          });
        });
      });
    });
  });
});



// Get seller's monthly income after approved refunds
router.get("/seller/post-refund-income", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const { year } = req.query; // Optional year parameter
  
  console.log(`Fetching post-refund income for seller ID: ${sellerId}, year: ${year || 'current'}`);

  // Default to current year if not specified
  const filterYear = year || new Date().getFullYear();


  
  // SQL query to get monthly income after refunds
  // This approach calculates net income by taking payment status into account
  const query = `
    SELECT 
      DATE_FORMAT(p.payment_date, '%Y-%m') as month,
      DATE_FORMAT(p.payment_date, '%m') as month_num,
      DATE_FORMAT(p.payment_date, '%M') as month_name,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 0
          ELSE p.amount
        END
      ) as net_income,
      SUM(p.amount) as gross_income,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN p.amount
          ELSE 0 
        END
      ) as refunded_amount,
      COUNT(*) as transaction_count,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 1
          ELSE 0
        END
      ) as refund_count
    FROM payment_details p
    JOIN orders o ON p.payment_id = o.payment_id
    WHERE 
      o.seller_id = ? 
      AND YEAR(p.payment_date) = ?
    GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m'), 
      DATE_FORMAT(p.payment_date, '%m'),
      DATE_FORMAT(p.payment_date, '%M')
    ORDER BY month
  `;
  
  db.query(query, [sellerId, filterYear], (err, results) => {
    if (err) {
      console.error("Error fetching monthly income data:", err);
      return res.status(500).json({
        error: "Failed to fetch monthly income data",
        details: err.message
      });
    }
    
    // Fill in missing months with zero values
    const monthlyData = fillMissingMonths(results, filterYear);
    
    console.log(`Found income data for ${results.length} months for seller ${sellerId}`);
    
    res.status(200).json(monthlyData);
  });
});

// Helper function to ensure all months are represented in the data
function fillMissingMonths(results, year) {
  const allMonths = [];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Create a map of existing data
  const dataMap = {};
  results.forEach(item => {
    dataMap[item.month_num] = item;
  });
  
  // Fill in all months
  for (let i = 1; i <= 12; i++) {
    const monthNum = String(i).padStart(2, '0');
    const monthKey = `${year}-${monthNum}`;
    const monthName = monthNames[i-1];
    
    if (dataMap[monthNum]) {
      allMonths.push(dataMap[monthNum]);
    } else {
      allMonths.push({
        month: monthKey,
        month_num: monthNum,
        month_name: monthName,
        net_income: 0,
        gross_income: 0,
        refunded_amount: 0,
        transaction_count: 0,
        refund_count: 0
      });
    }
  }
  
  return allMonths;
}




// Get income report for a specific seller (for admin)
router.get("/admin/seller-income/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  const { year } = req.query; // Optional year parameter
  


  // Default to current year if not specified
  const filterYear = year || new Date().getFullYear();
  
  // First, verify the seller exists
  db.query("SELECT id, name, email FROM users WHERE id = ? AND userType = 'Seller'", 
    [sellerId], 
    (sellerErr, sellerResults) => {
      if (sellerErr) {
        console.error("Error fetching seller:", sellerErr);
        return res.status(500).json({
          error: "Failed to fetch seller information",
          details: sellerErr.message
        });
      }
      
      if (sellerResults.length === 0) {
        return res.status(404).json({
          error: "Seller not found"
        });
      }
      
      const sellerInfo = sellerResults[0];
      
      // SQL query to get monthly income data
      const query = `
        SELECT 
          DATE_FORMAT(p.payment_date, '%Y-%m') as month,
          DATE_FORMAT(p.payment_date, '%m') as month_num,
          DATE_FORMAT(p.payment_date, '%M') as month_name,
          SUM(o.price * o.quantity) as gross_income,
          SUM(
            CASE 
              WHEN p.status = 'refunded' THEN o.price * o.quantity
              ELSE 0 
            END
          ) as refunded_amount,
          SUM(
            CASE 
              WHEN p.status != 'refunded' THEN o.price * o.quantity
              ELSE 0
            END
          ) as net_income,
          COUNT(DISTINCT o.order_id) as order_count,
          COUNT(DISTINCT 
            CASE 
              WHEN p.status = 'refunded' THEN o.order_id 
              ELSE NULL 
            END
          ) as refund_count
        FROM orders o
        JOIN payment_details p ON o.payment_id = p.payment_id
        WHERE 
          o.seller_id = ? 
          AND YEAR(p.payment_date) = ?
        GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m'), 
          DATE_FORMAT(p.payment_date, '%m'),
          DATE_FORMAT(p.payment_date, '%M')
        ORDER BY month
      `;
      
      db.query(query, [sellerId, filterYear], (err, results) => {
        if (err) {
          console.error("Error fetching monthly income data:", err);
          return res.status(500).json({
            error: "Failed to fetch monthly income data",
            details: err.message
          });
        }
        
        // Fill in missing months with zero values
        const monthlyData = fillMissingMonths(results, filterYear);
        
        // Get total annual data
        const totalQuery = `
          SELECT 
            SUM(o.price * o.quantity) as total_gross_income,
            SUM(
              CASE 
                WHEN p.status = 'refunded' THEN o.price * o.quantity
                ELSE 0 
              END
            ) as total_refunded,
            SUM(
              CASE 
                WHEN p.status != 'refunded' THEN o.price * o.quantity
                ELSE 0
              END
            ) as total_net_income,
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT 
              CASE 
                WHEN p.status = 'refunded' THEN o.order_id 
                ELSE NULL 
              END
            ) as total_refunds
          FROM orders o
          JOIN payment_details p ON o.payment_id = p.payment_id
          WHERE 
            o.seller_id = ? 
            AND YEAR(p.payment_date) = ?
        `;
        
        db.query(totalQuery, [sellerId, filterYear], (totalErr, totalResults) => {
          if (totalErr) {
            console.error("Error fetching total income data:", totalErr);
            return res.status(500).json({
              error: "Failed to fetch total income data",
              details: totalErr.message
            });
          }
          
          // Combine the data
          res.status(200).json({
            seller: sellerInfo,
            year: filterYear,
            monthlyData: monthlyData,
            annual: totalResults[0] || {
              total_gross_income: 0,
              total_refunded: 0,
              total_net_income: 0,
              total_orders: 0,
              total_refunds: 0
            }
          });
        });
      });
    }
  );
});





// // Get product categories sold by a seller (for additional reporting)
// router.get("/admin/seller-products/:sellerId", (req, res) => {
//   const { sellerId } = req.params;
//   const { year, month } = req.query; // Optional filters
  
//   let timeFilter = '';
//   let queryParams = [sellerId];
  
//   if (year && month) {
//     timeFilter = 'AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?';
//     queryParams.push(year, month);
//   } else if (year) {
//     timeFilter = 'AND YEAR(o.created_at) = ?';
//     queryParams.push(year);
//   }
  
//   // Query for product category breakdown
//   const query = `
//     SELECT 
//       ap.category,
//       ap.type,
//       COUNT(o.order_id) as order_count,
//       SUM(o.price * o.quantity) as revenue
//     FROM orders o
//     JOIN approvedproducts ap ON o.product_id = ap.product_id
//     WHERE 
//       o.seller_id = ? 
//       ${timeFilter}
//     GROUP BY ap.category, ap.type
//     ORDER BY revenue DESC
//   `;
  
//   db.query(query, queryParams, (err, results) => {
//     if (err) {
//       console.error("Error fetching seller product data:", err);
//       return res.status(500).json({
//         error: "Failed to fetch seller product data",
//         details: err.message
//       });
//     }
    
//     // Group by category and type
//     const categorySummary = {};
    
//     results.forEach(item => {
//       const category = item.category || 'Uncategorized';
      
//       if (!categorySummary[category]) {
//         categorySummary[category] = {
//           total: 0,
//           order_count: 0,
//           types: []
//         };
//       }
      
//       categorySummary[category].total += parseFloat(item.revenue);
//       categorySummary[category].order_count += parseInt(item.order_count);
      
//       categorySummary[category].types.push({
//         type: item.type || 'Unspecified',
//         order_count: item.order_count,
//         revenue: parseFloat(item.revenue)
//       });
//     });
    
//     res.status(200).json({
//       categories: categorySummary,
//       raw_data: results
//     });
//   });
// });


//save-payment-details route
router.post("/save-payment-details", verifyToken, (req, res) => {
  const { 
    paymentIntentId, 
    paymentMethodId, 
    amount, 
    status, 
    orderId 
  } = req.body;
  
  // Calculate platform fee
  const platformFee = calculatePlatformFee(parseFloat(amount));
  const sellerAmount = parseFloat(amount) - platformFee;
  
  // Insert payment details into database
  const query = `
    INSERT INTO payment_details 
      (payment_intent_id, payment_method_id, amount, platform_fee, seller_amount, status, order_id, currency) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    query, 
    [
      paymentIntentId, 
      paymentMethodId, 
      parseFloat(amount).toFixed(2), 
      platformFee.toFixed(2),
      sellerAmount.toFixed(2),
      status, 
      orderId, 
      'lkr'
    ],
    (err, result) => {
      if (err) {
        console.error('Error saving payment details:', err);
        return res.status(500).json({ 
          error: 'Failed to save payment details',
          details: err.message
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        paymentId: result.insertId 
      });
    }
  );
});

// Modifying the seller/post-refund-income endpoint to include platform fees
router.get("/seller/post-refund-income", verifyToken, (req, res) => {
  const sellerId = req.userId;
  const { year } = req.query; // Optional year parameter
  
  console.log(`Fetching post-refund income for seller ID: ${sellerId}, year: ${year || 'current'}`);

  // Default to current year if not specified
  const filterYear = year || new Date().getFullYear();
  
  // SQL query to get monthly income after refunds
  // This approach calculates net income by taking payment status and platform fees into account
  const query = `
    SELECT 
      DATE_FORMAT(p.payment_date, '%Y-%m') as month,
      DATE_FORMAT(p.payment_date, '%m') as month_num,
      DATE_FORMAT(p.payment_date, '%M') as month_name,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 0
          ELSE p.amount
        END
      ) as gross_income,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 0
          ELSE IFNULL(p.platform_fee, p.amount * ${PLATFORM_FEE_PERCENTAGE / 100})
        END
      ) as platform_fees,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 0
          ELSE (p.amount - IFNULL(p.platform_fee, p.amount * ${PLATFORM_FEE_PERCENTAGE / 100}))
        END
      ) as net_income,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN p.amount
          ELSE 0 
        END
      ) as refunded_amount,
      COUNT(*) as transaction_count,
      SUM(
        CASE 
          WHEN p.status = 'refunded' THEN 1
          ELSE 0
        END
      ) as refund_count
    FROM payment_details p
    JOIN orders o ON p.payment_id = o.payment_id
    WHERE 
      o.seller_id = ? 
      AND YEAR(p.payment_date) = ?
    GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m'), 
      DATE_FORMAT(p.payment_date, '%m'),
      DATE_FORMAT(p.payment_date, '%M')
    ORDER BY month
  `;
  
  db.query(query, [sellerId, filterYear], (err, results) => {
    if (err) {
      console.error("Error fetching monthly income data:", err);
      return res.status(500).json({
        error: "Failed to fetch monthly income data",
        details: err.message
      });
    }
    
    // Fill in missing months with zero values
    const monthlyData = fillMissingMonths(results, filterYear);
    
    console.log(`Found income data for ${results.length} months for seller ${sellerId}`);
    
    res.status(200).json(monthlyData);
  });
});

// Modifying the admin/seller-income endpoint to include platform fees
router.get("/admin/seller-income/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  const { year } = req.query; // Optional year parameter
  
  // Default to current year if not specified
  const filterYear = year || new Date().getFullYear();
  
  // First, verify the seller exists
  db.query("SELECT id, name, email FROM users WHERE id = ? AND userType = 'Seller'", 
    [sellerId], 
    (sellerErr, sellerResults) => {
      if (sellerErr) {
        console.error("Error fetching seller:", sellerErr);
        return res.status(500).json({
          error: "Failed to fetch seller information",
          details: sellerErr.message
        });
      }
      
      if (sellerResults.length === 0) {
        return res.status(404).json({
          error: "Seller not found"
        });
      }
      
      const sellerInfo = sellerResults[0];
      
      // SQL query to get monthly income data with platform fees
      const query = `
        SELECT 
          DATE_FORMAT(p.payment_date, '%Y-%m') as month,
          DATE_FORMAT(p.payment_date, '%m') as month_num,
          DATE_FORMAT(p.payment_date, '%M') as month_name,
          SUM(o.price * o.quantity) as gross_income,
          SUM(
            CASE 
              WHEN p.status = 'refunded' THEN o.price * o.quantity
              ELSE 0 
            END
          ) as refunded_amount,
          SUM(
            CASE
              WHEN p.status != 'refunded' THEN IFNULL(p.platform_fee, (o.price * o.quantity) * ${PLATFORM_FEE_PERCENTAGE / 100})
              ELSE 0
            END
          ) as platform_fees,
          SUM(
            CASE 
              WHEN p.status != 'refunded' THEN (o.price * o.quantity) - IFNULL(p.platform_fee, (o.price * o.quantity) * ${PLATFORM_FEE_PERCENTAGE / 100})
              ELSE 0
            END
          ) as net_income,
          COUNT(DISTINCT o.order_id) as order_count,
          COUNT(DISTINCT 
            CASE 
              WHEN p.status = 'refunded' THEN o.order_id 
              ELSE NULL 
            END
          ) as refund_count
        FROM orders o
        JOIN payment_details p ON o.payment_id = p.payment_id
        WHERE 
          o.seller_id = ? 
          AND YEAR(p.payment_date) = ?
        GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m'), 
          DATE_FORMAT(p.payment_date, '%m'),
          DATE_FORMAT(p.payment_date, '%M')
        ORDER BY month
      `;
      
      db.query(query, [sellerId, filterYear], (err, results) => {
        if (err) {
          console.error("Error fetching monthly income data:", err);
          return res.status(500).json({
            error: "Failed to fetch monthly income data",
            details: err.message
          });
        }
        
        // Fill in missing months with zero values
        const monthlyData = fillMissingMonths(results, filterYear);
        
        // Get total annual data including platform fees
        const totalQuery = `
          SELECT 
            SUM(o.price * o.quantity) as total_gross_income,
            SUM(
              CASE 
                WHEN p.status = 'refunded' THEN o.price * o.quantity
                ELSE 0 
              END
            ) as total_refunded,
            SUM(
              CASE
                WHEN p.status != 'refunded' THEN IFNULL(p.platform_fee, (o.price * o.quantity) * ${PLATFORM_FEE_PERCENTAGE / 100})
                ELSE 0
              END
            ) as total_platform_fees,
            SUM(
              CASE 
                WHEN p.status != 'refunded' THEN (o.price * o.quantity) - IFNULL(p.platform_fee, (o.price * o.quantity) * ${PLATFORM_FEE_PERCENTAGE / 100})
                ELSE 0
              END
            ) as total_net_income,
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT 
              CASE 
                WHEN p.status = 'refunded' THEN o.order_id 
                ELSE NULL 
              END
            ) as total_refunds
          FROM orders o
          JOIN payment_details p ON o.payment_id = p.payment_id
          WHERE 
            o.seller_id = ? 
            AND YEAR(p.payment_date) = ?
        `;
        
        db.query(totalQuery, [sellerId, filterYear], (totalErr, totalResults) => {
          if (totalErr) {
            console.error("Error fetching total income data:", totalErr);
            return res.status(500).json({
              error: "Failed to fetch total income data",
              details: totalErr.message
            });
          }
          
          // Combine the data
          res.status(200).json({
            seller: sellerInfo,
            year: filterYear,
            platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
            monthlyData: monthlyData,
            annual: totalResults[0] || {
              total_gross_income: 0,
              total_refunded: 0,
              total_platform_fees: 0,
              total_net_income: 0,
              total_orders: 0,
              total_refunds: 0
            }
          });
        });
      });
    }
  );
});


//GET seller-monthly-summary endpoint for admin dashboard
router.get("/admin/seller-monthly-summary", (req, res) => {
  console.log("Seller monthly summary route hit");
  const { year, month } = req.query;
  
  // Base query to get seller-wise summary data - adjusted for your schema
  let query = `
    SELECT 
      u.id AS seller_id,
      u.name AS seller_name,
      u.email AS seller_email,
      COUNT(DISTINCT o.order_id) AS total_orders,
      SUM(o.price * o.quantity) AS total_revenue,
      SUM(IFNULL(p.platform_fee, o.price * o.quantity * 0.2)) AS total_platform_fee,
      SUM((o.price * o.quantity) - IFNULL(p.platform_fee, o.price * o.quantity * 0.2)) AS total_seller_earnings
    FROM orders o
    JOIN users u ON o.seller_id = u.id
    LEFT JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE 1=1
  `;
  
  // Add payment status filter
  query += ` AND (p.status != 'refunded' OR p.status IS NULL)`;
  
  // Add time filters if provided
  const queryParams = [];
  
  if (year && month && month !== 'all') {
    query += ` AND ((YEAR(p.payment_date) = ? AND MONTH(p.payment_date) = ?) OR (YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?))`;
    queryParams.push(year, month, year, month);
  } else if (year) {
    query += ` AND ((YEAR(p.payment_date) = ?) OR (YEAR(o.created_at) = ?))`;
    queryParams.push(year, year);
  }
  
  // Group by seller and add sort order
  query += `
    GROUP BY seller_id, seller_name, seller_email
    ORDER BY total_revenue DESC
  `;
  
  console.log("Executing seller summary query:", query);
  console.log("Query parameters:", queryParams);
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching seller monthly summary:", err);
      return res.status(500).json({
        error: "Failed to fetch seller monthly summary",
        details: err.message
      });
    }
    
    console.log(`Seller summary results found: ${results.length}`);
    res.status(200).json(results);
  });
});

//GET platform fee summary endpoint for admin dashboard
router.get("/admin/platform-fee-summary", (req, res) => {
  console.log("Platform fee summary route hit");
  const { year, month } = req.query;
  
  // Default to current year if not specified
  const filterYear = year || new Date().getFullYear();
  const filterMonth = month && month !== 'all' ? month : null;
  
  // Construct time filter conditions based on your schema
  let timeFilter = '';
  let queryParams = [];
  
  if (filterMonth) {
    timeFilter = ` AND ((YEAR(p.payment_date) = ? AND MONTH(p.payment_date) = ?) OR (YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?))`;
    queryParams = [filterYear, filterMonth, filterYear, filterMonth];
  } else {
    timeFilter = ` AND ((YEAR(p.payment_date) = ?) OR (YEAR(o.created_at) = ?))`;
    queryParams = [filterYear, filterYear];
  }
  
  // Main query for platform fee summary - adjusted for your schema
  const query = `
    SELECT 
      COALESCE(SUM(IFNULL(p.platform_fee, o.price * o.quantity * 0.2)), 0) AS total_platform_fee,
      COUNT(DISTINCT o.seller_id) AS total_sellers,
      COUNT(DISTINCT o.order_id) AS total_orders
    FROM orders o
    LEFT JOIN payment_details p ON o.payment_id = p.payment_id
    WHERE (p.status != 'refunded' OR p.status IS NULL)${timeFilter}
  `;
  
  console.log("Executing platform fee query:", query);
  console.log("Query parameters:", queryParams);
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching platform fee summary:", err);
      return res.status(500).json({
        error: "Failed to fetch platform fee summary",
        details: err.message
      });
    }
    
    // Ensure we always return an object even if no results
    const summary = results[0] || {
      total_platform_fee: 0,
      total_sellers: 0,
      total_orders: 0
    };
    
    // Make sure all values are valid numbers
    summary.total_platform_fee = parseFloat(summary.total_platform_fee || 0);
    summary.total_sellers = parseInt(summary.total_sellers || 0, 10);
    summary.total_orders = parseInt(summary.total_orders || 0, 10);
    
    console.log("Platform fee summary results:", summary);
    res.status(200).json(summary);
  });
});

//platform income statistics (for admin)
router.get("/admin/platform-income", (req, res) => {
  const { year } = req.query;
  const filterYear = year || new Date().getFullYear();
  
  // Monthly platform income
  const monthlyQuery = `
    SELECT 
      DATE_FORMAT(payment_date, '%Y-%m') as month,
      DATE_FORMAT(payment_date, '%m') as month_num,
      DATE_FORMAT(payment_date, '%M') as month_name,
      SUM(IFNULL(platform_fee, amount * ${PLATFORM_FEE_PERCENTAGE / 100})) as platform_income,
      COUNT(*) as transaction_count
    FROM payment_details
    WHERE 
      status != 'refunded'
      AND YEAR(payment_date) = ?
    GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), 
      DATE_FORMAT(payment_date, '%m'),
      DATE_FORMAT(payment_date, '%M')
    ORDER BY month
  `;
  
  // Annual platform income
  const annualQuery = `
    SELECT 
      SUM(IFNULL(platform_fee, amount * ${PLATFORM_FEE_PERCENTAGE / 100})) as total_platform_income,
      COUNT(*) as total_transactions,
      COUNT(DISTINCT buyer_id) as unique_buyers
    FROM payment_details
    WHERE 
      status != 'refunded'
      AND YEAR(payment_date) = ?
  `;
  
  // Execute both queries
  db.beginTransaction(err => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({
        error: "Failed to fetch platform income data",
        details: err.message
      });
    }
    
    db.query(monthlyQuery, [filterYear], (monthlyErr, monthlyResults) => {
      if (monthlyErr) {
        return db.rollback(() => {
          console.error("Error fetching monthly platform income:", monthlyErr);
          res.status(500).json({
            error: "Failed to fetch monthly platform income",
            details: monthlyErr.message
          });
        });
      }
      
      db.query(annualQuery, [filterYear], (annualErr, annualResults) => {
        if (annualErr) {
          return db.rollback(() => {
            console.error("Error fetching annual platform income:", annualErr);
            res.status(500).json({
              error: "Failed to fetch annual platform income",
              details: annualErr.message
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
          
          // Fill in missing months with zero values
          const fullMonthlyData = [];
          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          
          // Create a map of existing data
          const dataMap = {};
          monthlyResults.forEach(item => {
            dataMap[item.month_num] = item;
          });
          
          // Fill in all months
          for (let i = 1; i <= 12; i++) {
            const monthNum = String(i).padStart(2, '0');
            const monthKey = `${filterYear}-${monthNum}`;
            const monthName = monthNames[i-1];
            
            if (dataMap[monthNum]) {
              fullMonthlyData.push(dataMap[monthNum]);
            } else {
              fullMonthlyData.push({
                month: monthKey,
                month_num: monthNum,
                month_name: monthName,
                platform_income: 0,
                transaction_count: 0
              });
            }
          }
          
          // Respond with the combined results
          res.status(200).json({
            platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
            year: filterYear,
            monthly_data: fullMonthlyData,
            annual_data: annualResults[0] || {
              total_platform_income: 0,
              total_transactions: 0,
              unique_buyers: 0
            }
          });
        });
      });
    });
  });
});

//include platform fees
function fillMissingMonths(results, year) {
  const allMonths = [];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Create a map of existing data
  const dataMap = {};
  results.forEach(item => {
    dataMap[item.month_num] = item;
  });
  
  // Fill in all months
  for (let i = 1; i <= 12; i++) {
    const monthNum = String(i).padStart(2, '0');
    const monthKey = `${year}-${monthNum}`;
    const monthName = monthNames[i-1];
    
    if (dataMap[monthNum]) {
      allMonths.push(dataMap[monthNum]);
    } else {
      allMonths.push({
        month: monthKey,
        month_num: monthNum,
        month_name: monthName,
        gross_income: 0,
        platform_fees: 0,
        net_income: 0,
        refunded_amount: 0,
        transaction_count: 0,
        refund_count: 0
      });
    }
  }
  
  return allMonths;
}




module.exports = router;