// pages/admin-forgot-password.js

import { useState } from "react";
import { Email } from "@mui/icons-material";
import Link from "next/link";
import axios from "axios";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    setEmailError("");
    setMessage("");
  };

  const handleBlur = (e) => {
    if (e.target.value && !validateEmail(e.target.value)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setMessage("");
    setIsSubmitting(true);
    setEmailError("");

    // Basic validation
    if (!email) {
      setEmailError("Email is required");
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send request to the admin forgot password endpoint
      const response = await axios.post(
        "http://localhost:5000/api/admin/forgot-password",
        { email }
      );
      
      setMessage({
        text: response.data.message,
        type: "success"
      });
      
      // Clear the email field on success
      setEmail("");
    } catch (error) {
      console.error("Admin password reset request failed", error);
      setMessage({
        text: error.response?.data?.error || "Failed to send reset link. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Left Section - Form */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white p-6 md:p-10">
        <div className="bg-white/10 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-sm md:max-w-md lg:max-w-lg text-center text-white border border-white/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Admin Password Recovery</h2>
          
          {message && (
            <div className={`mb-4 p-2 ${message.type === "success" ? "bg-green-500/20 border border-green-500" : "bg-red-500/20 border border-red-500"} rounded-lg`}>
              <p className={message.type === "success" ? "text-green-300" : "text-red-300"}>{message.text}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="w-full">
            <p className="text-white/80 mb-6 text-sm">
              Enter your admin email address and we'll send you a link to reset your password.
            </p>
            
            <div className="relative mb-6">
              <Email className="absolute left-3 top-3 text-white/80" />
              <input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={email}
                className={`pl-10 w-full p-3 bg-white/10 border ${emailError ? 'border-red-500' : 'border-white/30'} text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {emailError && (
                <div className="mt-1 p-1 bg-red-500/20 border border-red-500 rounded text-left">
                  <p className="text-red-300 text-xs">{emailError}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white/10 border border-white text-white py-3 rounded-full hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "SENDING..." : "SEND RESET LINK"}
            </button>
            
            <div className="mt-4 text-sm">
              <Link href="/auth/admin-login" className="text-white hover:underline">
                Back to Admin Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Welcome Message */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Password Recovery</h2>
        <p className="text-md mt-2 text-primary">We'll help you regain access to your admin account</p>
        <div className="mt-6 md:mt-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <img src="/img1.svg" alt="Illustration" className="w-full" />
        </div>
      </div>
    </div>
  );
}