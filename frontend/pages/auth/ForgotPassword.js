import { useState } from "react";
import { Email } from "@mui/icons-material";
import Link from "next/link";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset message and set loading
    setMessage("");
    setIsLoading(true);

    // Basic validation
    if (!email) {
      setMessage("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      // Send request to the forgot password endpoint
      const response = await axios.post(
        "http://localhost:5000/api/users/forgot-password",
        { email }
      );
      
      setMessage(response.data.message);
      // Clear the email field on success
      setEmail("");
    } catch (error) {
      console.error("Password reset request failed", error);
      setMessage(
        error.response?.data?.error || 
        "Failed to send reset link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section - Forgot Password Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Reset Password</h2>

        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div className="relative mb-6">
            <Email className="absolute left-3 top-2 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Display message */}
          {message && (
            <p 
              className={`text-center mb-4 ${
                message.includes("sent") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition disabled:opacity-70"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center mt-4">
            <Link href="/auth/login" className="text-gray-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>

      {/* Right Section - Welcome Message */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-center items-center text-white p-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Password Recovery</h2>
        <p className="text-md mt-2">We'll help you get back into your account</p>
        <div className="mt-10">
          <img src="/img1.svg" alt="Illustration" className="w-72 md:w-96 lg:w-[500px]" />
        </div>
      </div>
    </div>
  );
}