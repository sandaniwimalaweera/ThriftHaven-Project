// components/OrderStatusUpdate.js
import { useState } from "react";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Alert, 
  Snackbar,
  CircularProgress,
  Typography,
  Chip
} from "@mui/material";
import { LocalShipping, CheckCircle, Pending, Cancel } from "@mui/icons-material";
import axios from "axios";

const OrderStatusUpdate = ({ order, onStatusUpdate }) => {
  const [status, setStatus] = useState(order?.status || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const getStatusIcon = (statusValue) => {
    switch(statusValue?.toLowerCase()) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'processing':
        return <Pending fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return <Pending fontSize="small" />;
    }
  };

  const getStatusChipColor = (statusValue) => {
    switch(statusValue?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!status || status === order.status) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/orders/update-status/${order.order_id}`,
        { status },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      setSuccess(true);
      
      // Call the callback function to update parent component state
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error("Error updating order status:", err);
      
      setError(
        err.response?.data?.error || 
        "Failed to update order status. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ mb: 3, mt: 2 }}>
      <Typography variant="subtitle1" fontWeight="medium" color="#611964" gutterBottom>
        Current Status: 
        <Chip 
          icon={getStatusIcon(order?.status)}
          label={order?.status} 
          color={getStatusChipColor(order?.status)}
          size="small"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-end", mt: 2, gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="update-status-label">Update Status</InputLabel>
          <Select
            labelId="update-status-label"
            value={status}
            onChange={handleStatusChange}
            label="Update Status"
          >
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          onClick={handleUpdateStatus}
          disabled={loading || status === order?.status || !status}
          sx={{ 
            bgcolor: "#611964", 
            '&:hover': { bgcolor: "#4a1154" },
            height: "40px"
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Update Status"}
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Order status updated successfully!
        </Alert>
      )}

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderStatusUpdate;