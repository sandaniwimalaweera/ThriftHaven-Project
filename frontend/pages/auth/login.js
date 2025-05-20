import { useState } from "react";
import { Email, Lock } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";


export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Logging in with:", formData);

    // Basic field validation before submission
    if (!formData.email || !formData.password) {
      setMessage("Please fill out all fields.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/login", formData);
      
      console.log("Full login response:", response.data);

      // Extract user data from the response - handle different response formats
      const token = response.data.token || (response.data.user && response.data.user.token);
      const userType = response.data.userType || (response.data.user && response.data.user.userType);
      
      if (!token) {
        console.error("No token in response:", response.data);
        setMessage("Login failed: Invalid response from server (no token)");
        return;
      }
      
      // Store user information in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userType", userType);
      
      // Store the user's name - check different possible name fields
      const userDisplayName = 
        response.data.name || 
        response.data.userName ||
        response.data.username ||
        (response.data.user && response.data.user.name) ||
        (response.data.user && response.data.user.userName) ||
        (response.data.user && response.data.user.username) ||
        "User"; // Fallback
      
      localStorage.setItem("userName", userDisplayName);
      
      // Store user ID if available
      if (response.data.id || response.data.userId || (response.data.user && (response.data.user.id || response.data.user.userId))) {
        const userId = response.data.id || response.data.userId || (response.data.user && (response.data.user.id || response.data.user.userId));
        localStorage.setItem("userId", userId);
      }
      
      console.log("Login successful, stored data:", { 
        token, 
        userType, 
        userName: userDisplayName,
        tokenPreview: token ? `${token.substring(0, 15)}...` : 'none' 
      });

      // Set message for successful login
      setMessage("Login successfully!");

      // Clear existing data and reload page (to ensure fresh state)
      setTimeout(() => {
        router.push("/").then(() => {
          // Reload after navigation to ensure everything is refreshed
          window.location.reload();
        });
      }, 1000); // Short delay to show the success message

    } catch (error) {
      console.error("Login failed", error.response?.data || error.message);
      setMessage("Login failed: " + (error.response?.data?.error || error.message || "Unknown error"));
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section - Sign In Form */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative mb-4">
            <Email className="absolute left-3 top-2 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={handleChange}
            />
          </div>

          <div className="relative mb-6">
            <Lock className="absolute left-3 top-2 text-gray-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={handleChange}
            />
          </div>

          {/* Display message */}
          {message && (
            <p 
              className={`text-center mb-4 ${
                message.includes("successful") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition"
          >
            SIGN IN
          </button>

          {/* Forgot Password - Centered */}
          <div className="text-center mt-4">
            <Link href="/auth/ForgotPassword" className="text-gray-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </form>

        <Link href="/" className="text-primary font-semibold mt-6">Home</Link>
      </div>

      {/* Right Section - Welcome Message */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white p-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Hello!</h2>
        <p className="text-md mt-2">Enter your details and start your journey with us</p>
        <Link href="/auth/register">
          <button className="mt-6 px-6 py-2 border border-white rounded-full hover:bg-white hover:text-primary transition">
            SIGN UP
          </button>
        </Link>
        <div className="mt-10">
          <img src="/img1.svg" alt="Illustration" className="w-72 md:w-96 lg:w-[500px]" />
        </div>
      </div>
    </div>
  );
}