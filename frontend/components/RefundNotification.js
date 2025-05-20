// components/RefundNotification.js
import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Paper,
  Snackbar,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import { 
  MoneyOff,
  Close,
  OpenInNew
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';

const RefundNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const router = useRouter();

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Show snackbar if we have a new refund notification
  useEffect(() => {
    // Check if we have a refund notification that's unread
    const refundNotifications = notifications.filter(
      notification => notification.type === 'refund_completed' && !notification.is_read
    );
    
    if (refundNotifications.length > 0) {
      setLatestNotification(refundNotifications[0]);
      setOpenSnackbar(true);
    }
  }, [notifications]);
  
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No authentication token found");
        setLoading(false);
        return;
      }
      
      const response = await axios.get("http://localhost:5000/api/notifications", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      // Update only if we have notifications
      if (response.data && response.data.length > 0) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // If the API fails with 404, the endpoint might not be ready yet
      if (error.response && error.response.status === 404) {
        console.log("Notifications API not available yet");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.notification_id === notificationId 
            ? { ...notification, is_read: 1 } 
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setOpenSnackbar(false);
    
    // Mark the notification as read
    if (latestNotification) {
      markAsRead(latestNotification.notification_id);
    }
  };
  
  const viewRefundDetails = () => {
    if (latestNotification && latestNotification.reference_id) {
      // Mark as read first
      markAsRead(latestNotification.notification_id);
      
      // Close snackbar
      setOpenSnackbar(false);
      
      // Navigate to refund details page
      router.push(`/buyer/refund-status/${latestNotification.reference_id}`);
    }
  };
  
  return (
    <>
      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={15000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity="success"
          sx={{ 
            width: '100%', 
            '& .MuiAlert-icon': { 
              color: '#2E7D32'
            }
          }}
          action={
            <>
              <Button 
                color="inherit" 
                size="small" 
                onClick={viewRefundDetails}
                startIcon={<OpenInNew />}
              >
                View
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleSnackbarClose}
              >
                <Close fontSize="small" />
              </IconButton>
            </>
          }
          icon={<MoneyOff />}
        >
          <Typography variant="subtitle2">
            {latestNotification?.title || "Refund Completed"}
          </Typography>
          <Typography variant="body2">
            {latestNotification?.message || "Your refund has been processed successfully."}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default RefundNotification;