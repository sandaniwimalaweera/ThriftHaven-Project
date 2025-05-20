import { useState, useEffect } from "react";
import { Person, Email, Lock, Phone, Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import axios from 'axios';
import { useRouter } from 'next/router';
import { colors } from "@mui/material";

export default function Register() {
  const [userType, setUserType] = useState("Seller");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [showTerms, setShowTerms] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Show terms popup when user changes type
  useEffect(() => {
    setTermsAccepted(false);
    setShowTerms(true);
  }, [userType]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter, one number, and one special character
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};



  const validatePhone = (phone) => {
    // Basic phone validation for Sri Lankan numbers
    const phoneRegex = /^(?:\+94|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const validateField = (name, value) => {
    let errorMessage = "";
    
    switch(name) {
      case "name":
        errorMessage = value.length < 2 ? "Name must be at least 2 characters" : "";
        break;
      case "email":
        errorMessage = !validateEmail(value) ? "Please enter a valid email address" : "";
        break;
      case "contact":
        errorMessage = !validatePhone(value) ? "Please enter a valid phone number (Sri Lankan format)" : "";
        break;
      case "password":
        errorMessage = !validatePassword(value) ? "Password must be at least 8 characters with letters and numbers" : "";
        break;
      case "confirmPassword":
        errorMessage = value !== formData.password ? "Passwords do not match" : "";
        break;
      default:
        break;
    }
    
    return errorMessage;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate the field and update errors
    const errorMessage = validateField(name, value);
    setErrors({ ...errors, [name]: errorMessage });
    
    // Special case for confirmPassword - validate when password changes
    if (name === "password") {
      const confirmError = formData.confirmPassword 
        ? formData.confirmPassword !== value ? "Passwords do not match" : ""
        : "";
      setErrors({ ...errors, [name]: errorMessage, confirmPassword: confirmError });
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    // Validate all fields
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      contact: validateField("contact", formData.contact),
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword)
    };
    
    setErrors(newErrors);
    
    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show terms if not already accepted
    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    // Validate all fields before submission
    if (!validateForm()) {
      setModalMessage("Please fix the validation errors before submitting.");
      setModalType("error");
      setIsModalOpen(true);
      return;
    }

    // Ensure all required fields are filled
    if (!formData.name || !formData.email || !formData.contact || !formData.password || !formData.confirmPassword) {
      setModalMessage("Please fill out all fields.");
      setModalType("error");
      setIsModalOpen(true);
      return;
    }

    try {
      // Try to check if email exists (only if your API supports this)
      try {
        const emailCheckResponse = await axios.post('http://localhost:5000/api/users/check-email', {
          email: formData.email
        });
        
        if (emailCheckResponse.data.exists) {
          setModalMessage("This email is already registered. Please use a different email or try logging in.");
          setModalType("error");
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.log("Email check endpoint not available, continuing with registration");
        // If the email check endpoint doesn't exist, just continue with registration
      }
      
      // Continue with registration
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name: formData.name,
        email: formData.email,
        contact: formData.contact,
        password: formData.password,
        userType,
        termsAccepted: true
      });
      
      console.log("Registration successful:", response.data);
      
      // Show modal on success
      setModalMessage("Registration successful! Redirecting...");
      setModalType("success");
      setIsModalOpen(true);
      setTimeout(() => {
        router.push('/auth/login'); // Redirect to login page after 2 seconds
      }, 2000);
    } catch (error) {
      console.error('Registration failed', error.response);
      
      // Show modal on failure
      setModalMessage("Registration failed: " + (error.response?.data?.error || 'Unknown error'));
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Accept terms and continue registration
  const acceptTerms = () => {
    setTermsAccepted(true);
    setShowTerms(false);
  };

  // Generate terms content based on user type
  const getTermsContent = () => {
    if (userType === "Seller") {
      return (
        <>
          <h3 className="text-xl font-bold mb-4 text-primary">Seller Rules and Regulations</h3>
          <div className="text-left max-h-80 overflow-y-auto mb-4 pr-2">
            <ul className="list-disc pl-5 mb-3">
              <li>All product listings must include a clear and honest description, correct pricing, and real images of the actual product being sold.</li>
              <li>Shipping fees must be included in the product price. Separate shipping charges are not allowed.</li>
              <li>Sellers must ship products within 3 business days of receiving an order.</li>
              <li>All products should be securely and appropriately packaged to ensure they arrive safely.</li>
              <li>Sellers must accept returns for items that are damaged or misrepresented within 14 days of delivery.</li>
              <li>Sellers are required to respond to customer inquiries within 48 hours.</li>
              <li style={{fontWeight: 'bold' }}>A 20% platform fee will be charged monthly on the total value of items sold through the platform.</li>
              <li style={{fontWeight: 'bold' }}>You can donate items for charity homes from this platform.</li>
            </ul>
          </div>
        </>
      );
    } else {
      return (
        <>
          <h3 className="text-xl font-bold mb-4 text-primary">Buyer Rules and Regulations</h3>
          <div className="text-left max-h-80 overflow-y-auto mb-4 pr-2">
            <ul className="list-disc pl-5 mb-3">
              <li>All payments must be made through the platform's secure payment system.</li>
              <li>Communication with sellers should take place through admin messaging to ensure safety and transparency.</li>
              <li>Buyers are responsible for reviewing product details before making a purchase.</li>
              <li>Buyers must keep their account credentials secure and confidential at all times.</li>
               <li>Please make sure to review sellers after your purchases.</li>
                 <li style={{fontWeight: 'bold' }}>You can donate items for charity homes from this platform.</li>
            </ul>
          </div>
        </>
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Section - Login Prompt */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white p-10 text-center mt-0">
        <h2 className="text-3xl md:text-4xl font-bold">Welcome back!</h2>
        <p className="text-md mt-2">To keep connected with us, please login with your personal info.</p>
        <Link href="/auth/login">
          <button className="mt-6 px-6 py-2 border border-white rounded-full hover:bg-white hover:text-primary transition">
            SIGN IN
          </button>
        </Link>
        <div className="mt-5">
          <img src="/img3.svg" alt="Illustration" className="w-140 md:w-60" />
        </div>
      </div>

      {/* Right Section - Registration Form */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Create Account</h2>

        {/* User Type Toggle (Seller / Buyer) */}
        <div className="flex bg-gray-300 rounded-full p-1 mb-6 w-full max-w-md">
          <button
            className={`w-1/2 py-2 rounded-full transition ${userType === "Seller" ? "bg-primary text-white" : "text-gray-700"}`}
            onClick={() => handleUserTypeChange("Seller")}
          >
            Seller
          </button>
          <button
            className={`w-1/2 py-2 rounded-full transition ${userType === "Buyer" ? "bg-primary text-white" : "text-gray-700"}`}
            onClick={() => handleUserTypeChange("Buyer")}
          >
            Buyer
          </button>
        </div>

        {/* Display message about terms */}
        {!termsAccepted && (
          <div className="w-full max-w-md mb-4 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-purple-800 text-sm">
              By registering as a {userType}, you'll need to agree to our platform rules and regulations.
            </p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative mb-4">
            <Person className="absolute left-3 top-2 text-gray-500" />
            <input
              type="text"
              name="name"
              placeholder="Name"
              className={`pl-10 w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary`}
              onChange={handleChange}
              value={formData.name}
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="relative mb-4">
            <Email className="absolute left-3 top-2 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={`pl-10 w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary`}
              onChange={handleChange}
              value={formData.email}
              required
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="relative mb-4">
            <Phone className="absolute left-3 top-2 text-gray-500" />
            <input
              type="text"
              name="contact"
              placeholder="Contact Number (e.g., 0771234567 or +94771234567)"
              className={`pl-10 w-full p-3 border ${errors.contact ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary`}
              onChange={handleChange}
              value={formData.contact}
              required
            />
            {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
          </div>

          <div className="relative mb-4">
            <Lock className="absolute left-3 top-2 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password (min 8 chars, incl. letters & numbers)"
              className={`pl-10 pr-10 w-full p-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary`}
              onChange={handleChange}
              value={formData.password}
              required
            />
            <button 
              type="button" 
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-2 text-gray-500"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </button>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="relative mb-6">
            <Lock className="absolute left-3 top-2 text-gray-500" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className={`pl-10 pr-10 w-full p-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary`}
              onChange={handleChange}
              value={formData.confirmPassword}
              required
            />
            <button 
              type="button" 
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-2 text-gray-500"
            >
              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
            </button>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-full hover:bg-primary-dark transition"
          >
            {termsAccepted ? "SIGN UP" : `VIEW ${userType.toUpperCase()} RULES & SIGN UP`}
          </button>
        </form>

        <p className="mt-4 text-gray-600">
          Have an account? <Link href="/auth/login" className="text-primary font-semibold">Sign In</Link>
        </p>

        <Link href="/" className="text-primary font-semibold mt-6">Home</Link>
      </div>

      {/* Terms and Regulations Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-2xl shadow-xl">
            {getTermsContent()}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={acceptTerms}
                className="px-6 py-2 bg-primary text-white hover:bg-primary-dark transition"
              >
                OK, I Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className={`bg-white p-6 rounded-lg text-center ${modalType === "success" ? "text-primary-500" : "text-red-500"}`}>
            <h3 className="text-xl font-semibold mb-4">{modalMessage}</h3>
            <button
              onClick={closeModal}
              className="bg-primary text-white px-6 py-2 rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}