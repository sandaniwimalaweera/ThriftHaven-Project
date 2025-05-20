import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DonationIcon from '@mui/icons-material/VolunteerActivism';
import ProductIcon from '@mui/icons-material/ShoppingBag';
import MailIcon from '@mui/icons-material/Mail';
import { useRouter } from 'next/router';



const AdminNotificationsBadge = () => {
  const router = useRouter();
  const [pendingCounts, setPendingCounts] = useState({
    pendingDonations: 0,
    pendingProducts: 0,
    totalPending: 0
  });
  const [unreadMessages, setUnreadMessages] = useState(0); // ✅ NEW
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const open = Boolean(anchorEl);

  const fetchPendingCounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');



      // Fetch admin notification counts
      const countsResponse = await axios.get('http://localhost:5000/api/admin/notifications/pending-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCounts(countsResponse.data);




      // Fetch unread messages count 
      const unreadRes = await axios.get('http://localhost:5000/api/messages/admin/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadMessages(unreadRes.data.unread_count || 0);




      // Fetch donations (limit 5)
      const donationsResponse = await axios.get('http://localhost:5000/api/donations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDonations(donationsResponse.data.slice(0, 5));




      // Fetch products (limit 5)
      const productsResponse = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingProducts(productsResponse.data.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCounts();
    // refresh every 30 sec
    const interval = setInterval(fetchPendingCounts, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAllDonations = () => {
    setAnchorEl(null);
    router.push('/admin-dashboard#donations');
  };

  const handleViewAllProducts = () => {
    setAnchorEl(null);
    router.push('../auth/admin-dashboard#products');
  };

  const handleViewMessages = () => {
    setAnchorEl(null);
    router.push('../auth/AdminMessagingPage');
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
      <Tooltip title={`${pendingCounts.totalPending + unreadMessages} items need your attention`}>
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={pendingCounts.totalPending + unreadMessages} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 600,
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
            Pending Approvals
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} sx={{ color: '#611964' }} />
          </Box>
        ) : (
          <>
            {/* ======= DONATIONS ======= */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#611964">
                  Pending Donations ({pendingCounts.pendingDonations})
                </Typography>
                {pendingCounts.pendingDonations > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', fontWeight: 500, color: '#611964' }}
                    onClick={handleViewAllDonations}
                  >
                    View All
                  </Typography>
                )}
              </Box>

              {pendingDonations.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {pendingDonations.map((donation) => (
                    <ListItem key={donation.donation_id} sx={{ p: 1, bgcolor: 'white', borderRadius: 1, mb: 1 }}>
                      <ListItemAvatar>
                        <Avatar src={donation.image ? `http://localhost:5000/${donation.image}` : null} variant="rounded">
                          {!donation.image && <DonationIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600} noWrap>{donation.product_name}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              from {donation.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(donation.donation_date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">No pending donations</Typography>
              )}
            </Box>

            <Divider />

            {/* ======= PRODUCTS ======= */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#611964">
                  Pending Products ({pendingCounts.pendingProducts})
                </Typography>
                {pendingCounts.pendingProducts > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', fontWeight: 500, color: '#611964' }}
                    onClick={handleViewAllProducts}
                  >
                    View All
                  </Typography>
                )}
              </Box>

              {pendingProducts.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {pendingProducts.map((product) => (
                    <ListItem key={product.product_id} sx={{ p: 1, bgcolor: 'white', borderRadius: 1, mb: 1 }}>
                      <ListItemAvatar>
                        <Avatar src={product.image ? `http://localhost:5000/${product.image}` : null} variant="rounded">
                          {!product.image && <ProductIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600} noWrap>{product.product_name}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              Rs.{product.price}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(product.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">No pending products</Typography>
              )}
            </Box>

            <Divider />

            {/* ======= UNREAD MESSAGES ======= */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" color="#611964">
                  Unread Messages ({unreadMessages})
                </Typography>
                {unreadMessages > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', fontWeight: 500, color: '#611964' }}
                    onClick={handleViewMessages}
                  >
                    View Messages
                  </Typography>
                )}
              </Box>

              {unreadMessages > 0 ? (
                <Box sx={{ px: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    You have unread chat messages from users.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No unread messages
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default AdminNotificationsBadge;
