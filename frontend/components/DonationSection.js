// frontend/components/DonationSection.js
import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, Box, CircularProgress, Button } from "@mui/material";
import axios from "axios";
import DonationCard from "./DonationCard-All";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const DonationSection = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchApprovedDonations = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/donations/approved");
      // Display only the first 6 approved donations (if desired)
      setDonations(response.data.slice(0, 6));
    } catch (error) {
      console.error("Error fetching approved donations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedDonations();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="#611964" sx={{ mb: 3 }}>
      Donations
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : donations.length > 0 ? (
        <Grid container spacing={2}>
          {donations.map((donation) => (
            <Grid item xs={12} sm={6} md={3} key={donation.donation_id}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <DonationCard donation={donation} />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
          No approved donations found.
        </Typography>
      )}
      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button variant="text" onClick={() => router.push("/auth/all-donations")} sx={{ color: "#611964", fontWeight: "bold" }}>
          see all donations &gt;&gt;
        </Button>
      </Box>
    </Container>
  );
};

export default DonationSection;
