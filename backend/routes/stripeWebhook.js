// const express = require("express");
// const router = express.Router();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// // Use raw body middleware for webhook verification
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.error("Webhook signature verification failed.", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // Handle the checkout.session.completed event
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;
//       console.log("Checkout session completed:", session.id);

//       // Use session.metadata to identify related order data
//       // For example:
//       const buyerId = session.metadata.buyerId;
//       const selectedCartIds = JSON.parse(session.metadata.selectedCartIds);
//       // Update your orders table to mark as paid,
//       // trigger order fulfillment, send confirmation emails, etc.
//     }

//     res.json({ received: true });
//   }
// );

// module.exports = router;
