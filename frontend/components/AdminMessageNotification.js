// import React, { useState, useEffect } from 'react';
// import { IconButton, Badge } from '@mui/material';
// import NotificationsIcon from '@mui/icons-material/Notifications';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// const AdminMessageNotification = () => {
//   const [unreadCount, setUnreadCount] = useState(0);
//   const navigate = useNavigate();
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     // Get unread message count
//     const fetchUnreadCount = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/messages/admin/unread-count', {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });
//         setUnreadCount(response.data.unread_count);
//       } catch (error) {
//         console.error('Error fetching unread count:', error);
//       }
//     };

//     if (token) {
//       fetchUnreadCount();
      
//       // Poll for updates every 30 seconds
//       const interval = setInterval(fetchUnreadCount, 30000);
//       return () => clearInterval(interval);
//     }
//   }, [token]);

//   const handleClick = () => {
//     navigate('/admin/messages');
//   };

//   return (
//     <IconButton color="inherit" onClick={handleClick}>
//       <Badge badgeContent={unreadCount} color="error">
//         <NotificationsIcon />
//       </Badge>
//     </IconButton>
//   );
// };

// export default AdminMessageNotification;