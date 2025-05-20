// components/PlatformFeeCard.js
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress
} from '@mui/material';
import { CurrencyExchange } from '@mui/icons-material';

const PlatformFeeCard = ({ platformFees, loading }) => {
  // Format currency with Rs. prefix and 2 decimal places
  const formatCurrency = (amount) => `Rs. ${parseFloat(amount || 0).toFixed(2)}`;

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s, box-shadow 0.3s',
      backgroundColor: 'rgba(97, 25, 100, 0.06)',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 8,
      },
    }}>
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-start',
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          width: '100%',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Platform Fees
          </Typography>
          <CurrencyExchange sx={{ color: '#611964' }} />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 1 }}>
            <CircularProgress size={30} sx={{ color: '#611964' }} />
          </Box>
        ) : (
          <>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {formatCurrency(platformFees)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform commission (20%)
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformFeeCard;