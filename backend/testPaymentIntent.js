// backend/testPaymentIntent.js
require("dotenv").config();
const Stripe = require("stripe");

console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function testPaymentIntent() {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,  // 5000 equals 50.00 (in smallest unit)
      currency: "inr",  // or "usd"
    });
    console.log("PaymentIntent created successfully:", paymentIntent.id);
  } catch (error) {
    console.error("Test failed. Error creating PaymentIntent:", error.message);
    console.error("Full error:", error);
  }
}

testPaymentIntent();
