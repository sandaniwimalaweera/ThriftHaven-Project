// frontend/components/PaymentForm.js
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button, Typography, Box, CircularProgress } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";

const PaymentForm = ({ amount, cartItems, address, phone, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Card element styling options
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: "Arial, sans-serif",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(""); // Reset error message

    // Validate address and phone
    if (!address.trim()) {
      setError("Please enter a shipping address");
      setProcessing(false);
      if (onPaymentError) onPaymentError("Please enter a shipping address");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter a phone number");
      setProcessing(false);
      if (onPaymentError) onPaymentError("Please enter a phone number");
      return;
    }

    if (!stripe || !elements) {
      setError("Stripe is not initialized yet");
      setProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Step 1: Create PaymentIntent on your backend
      // Important: For Stripe, we still need to send the amount in cents
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-payment-intent",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { clientSecret, paymentIntentId } = data;

      // Step 2: Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: localStorage.getItem("userName") || "Customer",
            phone: phone,
            address: {
              line1: address,
            },
          },
        },
      });

      if (result.error) {
        // Payment confirmation failed
        setError(result.error.message);
        console.error("Payment confirmation error:", result.error.message);
        if (onPaymentError) onPaymentError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        // Payment confirmed successfully
        console.log("Payment succeeded:", result.paymentIntent.id);
        
        // Step 3: Create the order with payment information
        try {
          // Make sure all necessary data is included
          const orderPayload = {
            items: cartItems,
            paymentIntentId: result.paymentIntent.id,
            totalAmount: amount, // Send the original amount (in cents for Stripe)
            address,
            phone,
          };
          
          console.log("Sending order creation request with data:", orderPayload);
          
          const orderResponse = await axios.post(
            "http://localhost:5000/api/orders/create",
            orderPayload,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          console.log("Order created:", orderResponse.data);
          
          // If order creation was successful, call the success callback with payment data
          if (onPaymentSuccess) {
            // We need to pass the payment ID instead of trying to use an order ID
            onPaymentSuccess({
              paymentId: orderResponse.data.paymentId,
              paymentIntentId: orderResponse.data.paymentIntentId
            });
          }
        } catch (orderErr) {
          // Order creation failed
          console.error("Order creation error:", orderErr.response?.data || orderErr);
          
          let errorMessage = "Failed to create order";
          if (orderErr.response) {
            errorMessage = `Order creation failed: ${orderErr.response.data?.error || orderErr.response.statusText}`;
          } else if (orderErr.request) {
            errorMessage = "Server did not respond. Please check your connection.";
          } else {
            errorMessage = `Order creation failed: ${orderErr.message}`;
          }
          
          setError(errorMessage);
          if (onPaymentError) {
            onPaymentError(errorMessage);
          }
        }
      }
    } catch (err) {
      // PaymentIntent creation failed
      console.error("Payment creation error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "An unexpected error occurred. Please try again.");
      if (onPaymentError) {
        onPaymentError(err.response?.data?.error || "An unexpected error occurred. Please try again.");
      }
    }
    
    setProcessing(false);
  };

  // Display amount in proper LKR format
  // amount is in cents for Stripe, so divide by 100 for display
  const displayAmount = (amount / 100).toFixed(2);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Payment Information
      </Typography>
      
      <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1, mb: 3 }}>
        <CardElement options={cardElementOptions} />
      </Box>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ 
          mt: 3, 
          py: 1.5,
          bgcolor: "#611964",
          '&:hover': {
            bgcolor: "#4a1350",
          }
        }}
        disabled={!stripe || processing}
      >
        {processing ? (
          <>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> 
            Processing...
          </>
        ) : (
          `Pay LKR ${displayAmount}`
        )}
      </Button>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Your payment information is secured with Stripe
      </Typography>
    </Box>
  );
};

export default PaymentForm;