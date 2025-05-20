// frontend/pages/_app.js
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/globals.css";

// Load the publishable key from .env.local
console.log("Publishable Key:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function MyApp({ Component, pageProps }) {
  // Add state for unread messages
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [token, setToken] = useState('');
  const [userType, setUserType] = useState('');
  const isClient = useRef(false);
  
  // First, check if we're on the client side
  useEffect(() => {
    isClient.current = true;
    const storedToken = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    
    if (storedToken) setToken(storedToken);
    if (storedUserType) setUserType(storedUserType);
  }, []);
  
  // Check for unread messages if user is logged in
  useEffect(() => {
    // Only run this effect on the client side and when we have a token
    if (!isClient.current || !token) return;
    
    const fetchUnreadMessages = async () => {
      try {
        // Different endpoints for admin vs users
        const endpoint = userType === 'Admin' 
          ? 'http://localhost:5000/api/messages/admin/unread-count'
          : 'http://localhost:5000/api/messages/user/unread-count';
          
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUnreadMessages(response.data.unread_count);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };
    
    // Initial fetch
    fetchUnreadMessages();
    
    // Set up polling for updates every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [token, userType]);
  
  // Pass unread message count as a prop to all components
  return (
    <Elements stripe={stripePromise}>
      <Component {...pageProps} unreadMessages={unreadMessages} />
    </Elements>
  );
}

export default MyApp;