import { useState, useEffect } from "react";
import { Lock } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  
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
        `http://localhost:5000/api/users/verify-reset-token?token=${resetToken}`
      );
      setIsTokenValid(true);
      setMessage("");
    } catch (error) {
      console.error("Invalid or expired token", error);
      setIsTokenValid(false);
      setMessage("This password reset link is invalid or has expired. Please request a new one.");
    } finally {
      setIsTokenChecking(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Validate passwords
if (formData.password !== formData.confirmPassword) {
  setMessage("Passwords don't match");
  setIsLoading(false);
  return;
}

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

if (!passwordRegex.test(formData.password)) {
  setMessage("Password must be at least 8 characters long and include letters, numbers, and special characters");
  setIsLoading(false);
  return;
}

    try {
      // Send request to reset password endpoint with token
      const response = await axios.post(
        "http://localhost:5000/api/users/reset-password",
        {
          token,
          newPassword: formData.password,
        }
      );
      
      setMessage(response.data.message);
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset failed", error);
      setMessage(
        error.response?.data?.error || 
        "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="flex h-screen justify-center items-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p>Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left Section - Reset Password Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Set New Password</h2>

        {isTokenValid ? (
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <p className="text-gray-600 mb-6 text-center">
              Please enter your new password.
            </p>

            <div className="relative mb-4">
              <Lock className="absolute left-3 top-2 text-gray-500" />
              <input
                type="password"
                name="password"
                placeholder="New Password"
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={handleChange}
                value={formData.password}
              />
            </div>

            <div className="relative mb-6">
              <Lock className="absolute left-3 top-2 text-gray-500" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={handleChange}
                value={formData.confirmPassword}
              />
            </div>

            {/* Display message */}
            {message && (
              <p 
                className={`text-center mb-4 ${
                  message.includes("success") ? "text-green-600" : "text-red-500"
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="w-full max-w-md text-center">
            <p className="text-red-500 mb-4">{message}</p>
            <Link href="/auth/ForgotPassword">
              <button className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition">
                Request New Reset Link
              </button>
            </Link>
          </div>
        )}

        <Link href="/auth/login" className="text-primary font-semibold mt-6">
          Back to Login
        </Link>
      </div>

      {/* Right Section - Welcome Message */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-center items-center text-white p-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Password Recovery</h2>
        <p className="text-md mt-2">Almost there! Set your new password to secure your account</p>
        <div className="mt-10">
          <img src="/img1.svg" alt="Illustration" className="w-72 md:w-96 lg:w-[500px]" />
        </div>
      </div>
    </div>
  );
}