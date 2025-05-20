// components/RefundRequestModal.js
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";

const RefundRequestModal = ({ open, onClose, onSubmit, orderId }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onSubmit(orderId, reason);
    setReason("");
    onClose();
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          bgcolor: "#611964",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "1.25rem",
        }}
      >
        Request Refund for Order {orderId}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            Please enter the reason for your refund request.
          </Typography>
        </Box>
        <TextField
          autoFocus
          margin="dense"
          label="Refund Reason"
          type="text"
          fullWidth
          multiline
          minRows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} sx={{ color: "#611964", fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            bgcolor: "#611964",
            "&:hover": { bgcolor: "#4a148c" },
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundRequestModal;
