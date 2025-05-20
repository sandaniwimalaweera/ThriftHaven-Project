// components/DonationCard.js
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
  Divider,
  Tooltip,
  Button
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as LocalOfferIcon,
  CalendarToday as CalendarTodayIcon,
  Inventory as InventoryIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "success";
    case "reserved":
      return "warning";
    case "donated":
      return "#611964"; // Using purple instead of primary blue
    case "pending":
      return "info";
    case "collected":
      return "success";
    default:
      return "default";
  }
};

const DonationCard = ({ 
  donation, 
  onEditDonation, 
  onDeleteDonation, 
  onMarkAsCollected, 
  isAdmin = false 
}) => {
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const handleEditClick = (event) => {
    event.stopPropagation();
    onEditDonation(donation);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDeleteDonation(donation.donation_id);
  };

  const handleCollectClick = (event) => {
    event.stopPropagation();
    onMarkAsCollected(donation.donation_id);
  };

  // Format date nicely
  const formattedDate = donation.donation_date 
    ? new Date(donation.donation_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  // Check if donation is collected
  const isCollected = donation.collection_status === 'collected' || donation.status === 'Collected';

  return (
    <>
      <Card
        onClick={handleOpen}
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(97,25,100,0.08)",
          transition: "all 0.3s ease",
          "&:hover": { 
            transform: "translateY(-8px)", 
            boxShadow: "0 12px 24px rgba(97,25,100,0.15)" 
          },
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          background: "linear-gradient(to bottom, #ffffff, #f8f9fa)"
        }}
      >
        {donation.image ? (
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <CardMedia
              component="img"
              image={`http://localhost:5000/${donation.image}`}
              alt={donation.product_name}
              sx={{ 
                height: 200, 
                objectFit: "cover",
                transition: "transform 0.5s ease",
                "&:hover": {
                  transform: "scale(1.08)"
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '25%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              }}
            />
            
            {/* Collected overlay badge */}
            {isCollected && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <CheckCircleIcon />
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "grey.100",
              position: 'relative'
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 60, color: "grey.400" }} />
            
            {/* Collected overlay badge */}
            {isCollected && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <CheckCircleIcon />
              </Box>
            )}
          </Box>
        )}

        <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="h6" 
            noWrap 
            sx={{ 
              fontWeight: 700,
              fontSize: "1.1rem",
              mb: 1,
              color: "#2c3e50"
            }}
          >
            {donation.product_name}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.5 }}>
            {donation.category && (
              <Chip 
                label={donation.category} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {donation.type && (
              <Chip 
                label={donation.type} 
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {donation.size && (
              <Chip 
                label={`Size: ${donation.size}`} 
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              flexGrow: 1, 
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1.5,
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}
          >
            {donation.description}
          </Typography>

          {formattedDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        {/* Action buttons at the bottom */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(to right, rgba(236,240,243,0.8), rgba(249,250,251,0.8))',
            mt: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<InventoryIcon fontSize="small" />}
              label={`Qty: ${donation.quantity}`}
              size="small"
              sx={{
                borderRadius: '16px',
                bgcolor: 'rgba(97, 25, 100, 0.08)',
                color: '#611964',
                borderColor: '#611964',
                '& .MuiChip-label': {
                  px: 1,
                  fontWeight: 500
                },
                '& .MuiChip-icon': {
                  fontSize: '0.9rem',
                  color: '#611964'
                }
              }}
            />
            
            {/* Status Chip */}
            <Chip
              label={isCollected ? "Collected" : (donation.status || "Pending")}
              size="small"
              color={isCollected ? "success" : getStatusColor(donation.status)}
              sx={{
                borderRadius: '16px',
                fontWeight: 500,
                ...(donation.status?.toLowerCase() === "donated" && {
                  bgcolor: 'rgba(97, 25, 100, 0.08)',
                  color: '#611964',
                }),
                ...(isCollected && {
                  bgcolor: 'rgba(76, 175, 80, 0.08)',
                  color: '#4caf50',
                })
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View details">
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
                sx={{ 
                  color: 'info.main',
                  bgcolor: 'rgba(3, 169, 244, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(3, 169, 244, 0.15)',
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
           
            
             
          </Box>
        </Box>
      </Card>

      {/* Modal for Full Donation Details */}
      <Modal
        open={open}
        onClose={handleClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            width: "90%",
            maxWidth: 800,
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            p: 0,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{ 
              position: "absolute", 
              top: 16, 
              right: 16, 
              backgroundColor: "rgba(255,255,255,0.8)",
              zIndex: 2,
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.9)",
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
            {/* Left Column: Donation Image */}
            <Box 
              sx={{ 
                flex: { xs: '1', md: '0.45' }, 
                position: 'relative',
                bgcolor: "grey.100"
              }}
            >
              {donation.image ? (
                <Box
                  component="img"
                  src={`http://localhost:5000/${donation.image}`}
                  alt={donation.product_name}
                  sx={{
                    width: "100%",
                    height: { xs: 300, md: "100%" },
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block"
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: { xs: 300, md: "100%" },
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalOfferIcon sx={{ fontSize: 80, color: "grey.400" }} />
                </Box>
              )}

              {/* Status Chip Overlay in Modal */}
              <Chip
                label={isCollected ? "Collected" : (donation.status || "Pending")}
                color={isCollected ? "success" : getStatusColor(donation.status)}
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  ...(donation.status?.toLowerCase() === "donated" && {
                    bgcolor: 'rgba(97, 25, 100, 0.9)',
                    color: 'white',
                  }),
                  ...(isCollected && {
                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                  })
                }}
              />
            </Box>

            {/* Right Column: Donation Details */}
            <Box 
              sx={{ 
                flex: { xs: '1', md: '0.55' },
                p: 4,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 1.5, 
                  fontWeight: 700,
                  color: "#611964",
                  lineHeight: 1.2
                }}
              >
                {donation.product_name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {donation.category && (
                  <Chip 
                    label={donation.category} 
                    color="primary" 
                    variant="outlined"
                  />
                )}
                {donation.type && (
                  <Chip 
                    label={donation.type} 
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      borderColor: '#611964',
                      color: '#611964'
                    }}
                  />
                )}
                {donation.size && (
                  <Chip 
                    label={`Size: ${donation.size}`} 
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      borderColor: '#611964',
                      color: '#611964'
                    }}
                  />
                )}
              </Box>

              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {donation.description || "No description provided."}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Quantity Available
                </Typography>
                <Chip 
                  label={donation.quantity} 
                  sx={{ 
                    fontWeight: 600,
                    bgcolor: 'rgba(97, 25, 100, 0.08)',
                    color: '#611964'
                  }}
                />
              </Box>

              {formattedDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Donated on: {formattedDate}
                  </Typography>
                </Box>
              )}

              {/* Collection date if collected */}
              {isCollected && donation.collection_date && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CheckCircleIcon fontSize="small" sx={{ color: 'success.main', mr: 1.5 }} />
                  <Typography variant="body2" color="success.main">
                    Collected on: {new Date(donation.collection_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              )}

              {/* Admin actions */}
              <Box sx={{ mt: 'auto', pt: 3 }}>
                {isAdmin && !isCollected && (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectClick(e);
                      handleClose();
                    }}
                    fullWidth
                    sx={{
                      mb: 2,
                      bgcolor: '#4caf50',
                      '&:hover': {
                        bgcolor: '#388e3c',
                      },
                    }}
                  >
                    Mark as Collected
                  </Button>
                )}

                {/* Edit and Delete buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(e);
                      handleClose();
                    }}
                    sx={{ 
                      color: '#611964',
                      bgcolor: 'rgba(97, 25, 100, 0.08)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)', 
                      '&:hover': { 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
                        bgcolor: 'rgba(97, 25, 100, 0.15)',
                      } 
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(e);
                      handleClose();
                    }}
                    color="error"
                    sx={{ 
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)', 
                      '&:hover': { 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.12)' 
                      } 
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DonationCard;