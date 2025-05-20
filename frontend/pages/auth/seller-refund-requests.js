// pages/auth/sellerRefundRequests.js
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/router";
import BuyerSidebar from "../../components/buyer-page-sidebar"; // Assuming seller uses similar sidebar

export default function SellerRefundRequests() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch refund requests for the seller.
  useEffect(() => {
    const fetchRefundRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }
        // Call the endpoint that returns refund orders for this seller.
        const response = await axios.get("http://localhost:5000/api/orders/refunds-seller", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRefundRequests(response.data);
      } catch (error) {
        console.error("Error fetching refund requests:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRefundRequests();
  }, [router]);

  // Fetch user details for sidebar
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/users/details", {
          headers: { Authorization: token },
        });
        setUserName(response.data.name);
      } catch (error) {
        console.error("Error fetching user details:", error.response?.data || error.message);
      }
    };
    fetchUserDetails();
  }, [router]);

  // Function to update refund status from seller side
  // For instance, seller may want to mark a refund as "Refund Approved" or "Refund Rejected" if that's part of the workflow.
  const updateRefundStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/orders/update-refund",
        { order_id: orderId, new_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      // Refresh refund requests after updating.
      const refreshResponse = await axios.get("http://localhost:5000/api/orders/refunds-seller", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefundRequests(refreshResponse.data);
    } catch (error) {
      console.error("Error updating refund status:", error.response?.data || error.message);
      alert("Error updating refund status");
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "#611964", fontWeight: "bold" }}>
        My Refund Requests
      </Typography>
      <TableContainer component={Paper}>
        {loading ? (
          <CircularProgress />
        ) : refundRequests.length === 0 ? (
          <Typography sx={{ p: 2 }}>No refund requests found.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Refund Reason</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {refundRequests.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell>#{order.order_id}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.refund_reason}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => updateRefundStatus(order.order_id, "refund approved")}
                      sx={{
                        bgcolor: "#6a1b9a",
                        "&:hover": { bgcolor: "#4a148c" },
                        color: "#fff",
                        mr: 1,
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => updateRefundStatus(order.order_id, "refund rejected")}
                      sx={{
                        bgcolor: "#6a1b9a",
                        "&:hover": { bgcolor: "#4a148c" },
                        color: "#fff",
                      }}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Container>
  );
}
