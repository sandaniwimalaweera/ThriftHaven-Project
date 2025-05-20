// testPaymentIntent.js

// Load environment variables from your .env file
require("dotenv").config();
const Stripe = require("stripe");

// Log the key to confirm it is loaded (remove once debugging is complete)
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

// Initialize Stripe using the secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function testPaymentIntent() {
  try {
    // Create a PaymentIntent with a hard-coded amount (5000 = 50.00 in the smallest currency unit)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,
      currency: "inr",  // Try changing to "usd" if you suspect a currency issue
    });
    console.log("PaymentIntent created successfully:", paymentIntent.id);
  } catch (error) {
    console.error("Test failed. Error creating PaymentIntent:", error.message);
    console.error("Full error:", error);
  }
}

testPaymentIntent();
