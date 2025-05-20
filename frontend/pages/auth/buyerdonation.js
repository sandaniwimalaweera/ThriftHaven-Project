import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import axios from "axios";
import Sidebar from "../../components/admin-sidebar";

const BuyerDonation = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [totalDonations, setTotalDonations] = useState(0);

  // Fetch buyer donation details (with optional filtering by buyer name)
  const fetchDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:5000/api/donations/buyer/search?name=${encodeURIComponent(search)}`,
        {
          headers: {
            // Assumes token is stored in localStorage
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDonations(response.data);
      // Update total count based on response length (or use a separate endpoint if available)
      setTotalDonations(response.data.length);
    } catch (err) {
      setError("Error fetching buyer donations. Please try again later.");
      console.error("Error fetching buyer donations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchDonations();
  }, []);

  // Debounce the search so that API calls are not made on every keystroke
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchDonations();
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Sidebar />
      <Container sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" sx={{ mt: 2, mb: 2, color: "#611964" }}>
          Buyer Donation Details
        </Typography>
        {/* Total Count */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Total Donations: {totalDonations}
        </Typography>
        {/* Search Bar (full width) */}
        <TextField
          label="Search by buyer name"
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />
        {/* Error Message */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {/* Buyer Donation Details Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#611964" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Donation ID</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Product Name</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Size</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Quantity</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Image</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Buyer Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : donations.length > 0 ? (
                donations.map((donation) => (
                  <TableRow key={donation.donation_id}>
                    <TableCell>{donation.donation_id}</TableCell>
                    <TableCell>{donation.product_name}</TableCell>
                    <TableCell>{donation.description}</TableCell>
                    <TableCell>{donation.category}</TableCell>
                    <TableCell>{donation.type}</TableCell>
                    <TableCell>{donation.size}</TableCell>
                    <TableCell>{donation.status}</TableCell>
                    <TableCell>{donation.quantity}</TableCell>
                    <TableCell>
                      {donation.image && (
                        <img
                          src={`http://localhost:5000/${donation.image}`}
                          alt="Donation"
                          style={{ width: "80px", height: "auto", objectFit: "cover" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(donation.donation_date).toLocaleString()}
                    </TableCell>
                    <TableCell>{donation.name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No buyer donations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
};

export default BuyerDonation;
