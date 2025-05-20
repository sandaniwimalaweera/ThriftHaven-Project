import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Badge,
  IconButton,
  Menu,
  Box,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatIcon from '@mui/icons-material/Chat';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newNotifications, setNewNotifications] = useState(0);
  const open = Boolean(anchorEl);

  const fetchNotifications = useCallback(async (showAlert = false) => {
    try {
      const token = localStorage.getItem('token');
      const [notifRes, messageRes] = await Promise.all([
        axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/messages/user/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const previousCount = notifications.length;
      const newNotificationsList = notifRes.data;
      const unreadMessages = messageRes.data.unread_count || 0;

      const combined = [
        ...(unreadMessages > 0
          ? [{
              notification_id: 'chat-msg',
              title: 'New Messages',
              message: `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`,
              type: 'chat_message',
              is_read: false,
              created_at: new Date().toISOString()
            }]
          : []),
        ...newNotificationsList
      ];

      setNotifications(combined);
      setUnreadCount(unreadMessages + newNotificationsList.filter(n => n.is_read === 0).length);

      if (showAlert && combined.length > previousCount) {
        const newCount = combined.length - previousCount;
        setNewNotifications(newCount);
        setShowNewAlert(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowNewAlert(false);
    setNewNotifications(0);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertClose = () => {
    setShowNewAlert(false);
  };

  const markAsRead = async (notificationId) => {
    if (notificationId === 'chat-msg') {
      window.location.href = "/auth/UserMessaging";
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/notifications/mark-read',
        { notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove the read notification from state
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unread = notifications.filter(n => n.is_read === 0 && n.notification_id !== 'chat-msg');

      const promises = unread.map(n =>
        axios.post('http://localhost:5000/api/notifications/mark-read',
          { notificationId: n.notification_id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(promises);

      // Keep chat message if any
      const chatMessage = notifications.find(n => n.notification_id === 'chat-msg');
      setNotifications(chatMessage ? [chatMessage] : []);
      setUnreadCount(chatMessage ? 1 : 0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation_approved':
        return <VolunteerActivismIcon />;
      case 'donation_collected':
        return <LocalShippingIcon />;
      case 'product_approved':
        return <CheckCircleIcon />;
      case 'product_rejected':
        return <CancelIcon />;
      case 'chat_message':
        return <ChatIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        color="inherit"
        aria-label="notifications"
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
        {showNewAlert && newNotifications > 0 && (
          <Box sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 8,
            height: 8,
            backgroundColor: '#4caf50',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite'
          }} />
        )}
      </IconButton>

      <Snackbar
        open={showNewAlert}
        autoHideDuration={4000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity="info"
          sx={{
            width: '100%',
            bgcolor: '#e8f5e9',
            color: '#2e7d32',
            '& .MuiAlert-icon': { color: '#2e7d32' }
          }}
        >
          {newNotifications} new {newNotifications === 1 ? 'notification' : 'notifications'}
        </Alert>
      </Snackbar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 500,
            overflow: 'auto',
            mt: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Typography variant="h6" fontWeight="600" color="#611964">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <IconButton size="small" onClick={markAllAsRead} sx={{ color: '#611964' }}>
              <DoneAllIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} sx={{ color: '#611964' }} />
          </Box>
        ) : notifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {notifications.map(notification => (
              <React.Fragment key={notification.notification_id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    p: 2,
                    bgcolor: notification.is_read === 0 ? 'rgba(97, 25, 100, 0.04)' : 'transparent',
                    ':hover': { bgcolor: 'rgba(97, 25, 100, 0.08)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => markAsRead(notification.notification_id)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#611964' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        fontWeight={notification.is_read === 0 ? 600 : 500}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5, fontWeight: notification.is_read === 0 ? 500 : 400 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDate(notification.created_at)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        )}
      </Menu>

      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `}</style>
    </>
  );
};

export default NotificationsList;
