// pages/admin-reset-password.js

import { useState, useEffect } from "react";
import { Lock } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";

export default function AdminResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    // Only run this when the token is available from the URL
    if (token) {
      checkToken(token);
    }
  }, [token]);

  const checkToken = async (resetToken) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/verify-reset-token?token=${resetToken}`
      );
      setIsTokenValid(true);
      setMessage("");
    } catch (error) {
      console.error("Invalid or expired admin token", error);
      setIsTokenValid(false);
      setMessage({
        text: "This password reset link is invalid or has expired. Please request a new one.",
        type: "error"
      });
    } finally {
      setIsTokenChecking(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear specific error when user changes a field
    if (e.target.name === "password") {
      setPasswordError("");
    } else if (e.target.name === "confirmPassword") {
      setConfirmPasswordError("");
    }
    
    // Clear general message
    setMessage("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validate password field on blur
    if (name === "password" && value !== "") {
      if (value.length < 6) {
        setPasswordError("Password must be at least 6 characters");
      }
    }
    
    // Validate confirm password field on blur
    if (name === "confirmPassword" && value !== "") {
      if (value !== formData.password) {
        setConfirmPasswordError("Passwords don't match");
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setPasswordError("");
    setConfirmPasswordError("");
    
    // Password validation
    if (!formData.password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");

    try {
      // Send request to reset admin password endpoint with token
      const response = await axios.post(
        "http://localhost:5000/api/admin/reset-password",
        {
          token,
          newPassword: formData.password,
        }
      );
      
      setMessage({
        text: response.data.message,
        type: "success"
      });
      
      // Redirect to admin login page after successful password reset
      setTimeout(() => {
        router.push("/admin-login");
      }, 3000);
    } catch (error) {
      console.error("Admin password reset failed", error);
      setMessage({
        text: error.response?.data?.error || "Failed to reset password. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="flex h-screen justify-center items-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-primary">Verifying your admin reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Left Section - Form */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white p-6 md:p-10">
        <div className="bg-white/10 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-sm md:max-w-md lg:max-w-lg text-center text-white border border-white/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Set New Admin Password</h2>
          
          {message && (
            <div className={`mb-4 p-2 ${message.type === "success" ? "bg-green-500/20 border border-green-500" : "bg-red-500/20 border border-red-500"} rounded-lg`}>
              <p className={message.type === "success" ? "text-green-300" : "text-red-300"}>{message.text}</p>
            </div>
          )}

          {isTokenValid ? (
            <form onSubmit={handleSubmit} className="w-full">
              <p className="text-white/80 mb-6 text-sm">
                Please create a new secure password for your admin account.
              </p>
              
              <div className="relative mb-4">
                <Lock className="absolute left-3 top-3 text-white/80" />
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                  className={`pl-10 w-full p-3 bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/30'} text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {passwordError && (
                  <div className="mt-1 p-1 bg-red-500/20 border border-red-500 rounded text-left">
                    <p className="text-red-300 text-xs">{passwordError}</p>
                  </div>
                )}
              </div>

              <div className="relative mb-6">
                <Lock className="absolute left-3 top-3 text-white/80" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={formData.confirmPassword}
                  className={`pl-10 w-full p-3 bg-white/10 border ${confirmPasswordError ? 'border-red-500' : 'border-white/30'} text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {confirmPasswordError && (
                  <div className="mt-1 p-1 bg-red-500/20 border border-red-500 rounded text-left">
                    <p className="text-red-300 text-xs">{confirmPasswordError}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white/10 border border-white text-white py-3 rounded-full hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "RESETTING..." : "RESET PASSWORD"}
              </button>
            </form>
          ) : (
            <div className="w-full text-center">
              <Link href="/admin-forgot-password">
                <button className="w-full bg-white/10 border border-white text-white py-3 rounded-full hover:bg-white/20 transition mt-4">
                  REQUEST NEW RESET LINK
                </button>
              </Link>
            </div>
          )}
          
          <div className="mt-4 text-sm">
            <Link href="/admin-login" className="text-white hover:underline">
              Back to Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section - Welcome Message */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Admin Password Recovery</h2>
        <p className="text-md mt-2 text-primary">Almost there! Set your new secure password to regain access</p>
        <div className="mt-6 md:mt-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <img src="/img1.svg" alt="Illustration" className="w-full" />
        </div>
      </div>
    </div>
  );
}