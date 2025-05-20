// pages/admin-login.js

import { useState, useEffect } from "react";
import { Email, Lock } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Validate form on input change
  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setError("");
    
    // Email validation
    if (!formData.email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }
    
    return isValid;
  };

  const handleChange = (e) => {
    // Update the form data
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear specific error when user changes a field
    if (e.target.name === "email") {
      setEmailError("");
    } else if (e.target.name === "password") {
      setPasswordError("");
    }
    
    // Clear general error
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/admin/login", formData);
      const { token } = response.data;
      localStorage.setItem("token", token);
      router.push("/auth/admin-dashboard");
    } catch (err) {
      console.error("Admin login failed:", err);
      
      // Show a generic error message regardless of backend response
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

    // Function to validate form on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validate email field on blur
    if (name === "email" && value !== "") {
      if (!validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      }
    }
    
    // Validate password field on blur
    if (name === "password" && value !== "") {
      if (value.length < 6) {
        setPasswordError("Password must be at least 6 characters");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Left Section - Sign In Form */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white p-6 md:p-10">
        <div className="bg-white/10 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-sm md:max-w-md lg:max-w-lg text-center text-white border border-white/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Admin Login</h2>
          {error && (
            <div className="mb-4 p-2 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative mb-4">
              <Email className="absolute left-3 top-3 text-white/80" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                className={`pl-10 w-full p-3 bg-white/10 border ${emailError ? 'border-red-500' : 'border-white/30'} text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50`}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {emailError && (
                <div className="mt-1 p-1 bg-red-500/20 border border-red-500 rounded text-left">
                  <p className="text-red-300 text-xs">{emailError}</p>
                </div>
              )}
            </div>
            <div className="relative mb-6">
              <Lock className="absolute left-3 top-3 text-white/80" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                className={`pl-10 w-full p-3 bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/30'} text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50`}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {passwordError && (
                <div className="mt-1 p-1 bg-red-500/20 border border-red-500 rounded text-left">
                  <p className="text-red-300 text-xs">{passwordError}</p>
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white/10 border border-white text-white py-3 rounded-full hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>
          {/* Forgot Password */}
          <div className="mt-4 text-sm">
  <Link href="/auth/AdminForgotPassword" className="text-white hover:underline">
    Forgot your password?
  </Link>
</div>
        </div>
       
      </div>
      {/* Right Section - Welcome Message */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Welcome Admin!</h2>
        <p className="text-md mt-2 text-primary">Login and command your domain—every keystroke shapes the future</p>
        <div className="mt-6 md:mt-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <img src="/img1.svg" alt="Illustration" className="w-full" />
        </div>
      </div>
    </div>
  );
}