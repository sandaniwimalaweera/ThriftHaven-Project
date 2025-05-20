// frontend/components/DonationCard.js
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Modal, 
  IconButton,
  Chip,
  Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";

const DonationCard = ({ donation }) => {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'good': return '#4caf50';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Card
        onClick={handleOpen}
        elevation={1}
        sx={{
          cursor: "pointer",
          borderRadius: '8px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Image Section */}
        <Box sx={{ position: 'relative', height: 180 }}>
          {donation.image && !imageError ? (
            <CardMedia
              component="img"
              image={`http://localhost:5000/${donation.image}`}
              alt={donation.product_name}
              onError={() => setImageError(true)}
              sx={{ height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                No image
              </Typography>
            </Box>
          )}
          
          {/* Status chip */}
          <Chip
            label={donation.status || 'N/A'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: getStatusColor(donation.status),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <CardContent sx={{ p: 2, flex: 1 }}>
          {/* Product name */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1,
              fontSize: '1.125rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {donation.product_name}
          </Typography>
          
          {/* Category, Type, Size */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
            {donation.category && (
              <Chip 
                label={donation.category}
                size="small"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
            {donation.type && (
              <Chip 
                label={donation.type}
                size="small"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
            {donation.size && (
              <Chip 
                label={donation.size}
                size="small"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>

          {/* Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(donation.donation_date)}
            </Typography>
          </Box>

          {/* Donor */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
            <Typography variant="body2" color="text.secondary">
              {donation.userName || donation.name || 'Anonymous'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Compact Modal - Horizontal Layout */}
      <Modal
        open={open}
        onClose={handleClose}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '90%',
            maxWidth: '900px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: 24,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden'
          }}
        >
          {/* Left Side - Image */}
          <Box 
            sx={{ 
              width: { xs: '100%', md: '45%' },
              height: { xs: 250, md: 450 },
              position: 'relative'
            }}
          >
            {donation.image && !imageError ? (
              <img
                src={`http://localhost:5000/${donation.image}`}
                alt={donation.product_name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No image available
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right Side - Content */}
          <Box 
            sx={{ 
              flex: 1,
              p: { xs: 2, md: 3 },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={handleClose}
              sx={{ 
                position: 'absolute', 
                right: 8, 
                top: 8,
                zIndex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Title and Status */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              {donation.product_name}
            </Typography>
            
            <Chip
              label={donation.status || 'N/A'}
              sx={{
                backgroundColor: getStatusColor(donation.status),
                color: 'white',
                fontWeight: 'bold',
                mb: 2,
                width: 'fit-content'
              }}
            />
            
            {/* Description */}
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 2, 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {donation.description || 'No description available'}
            </Typography>
            
            {/* Details Grid */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Category
                </Typography>
                <Typography variant="body1">{donation.category || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Type
                </Typography>
                <Typography variant="body1">{donation.type || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Size
                </Typography>
                <Typography variant="body1">{donation.size || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quantity
                </Typography>
                <Typography variant="body1">{donation.quantity || 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            {/* Donor and Date */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1, color: '#666' }} />
                <Typography variant="body1">
                  {donation.userName || donation.name || 'Anonymous Donor'}
                </Typography>
              </Box>
              
              {donation.donation_date && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: '#666' }} />
                  <Typography variant="body1" color="text.secondary">
                    {new Date(donation.donation_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DonationCard;