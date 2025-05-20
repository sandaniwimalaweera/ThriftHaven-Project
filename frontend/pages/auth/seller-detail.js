import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
    Box, Container, Typography, TextField, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, IconButton, Button, Dialog, 
    DialogActions, DialogContent, DialogTitle, Card, CardContent, 
    CircularProgress, Chip, InputAdornment, Divider, Alert, useMediaQuery
} from "@mui/material";
import { 
    Edit, Delete, Search, Refresh, ArrowUpward, ArrowDownward, Close, Menu
} from "@mui/icons-material";
import axios from "axios";
import Sidebar from "../../components/admin-sidebar.js";

const SellerDetail = () => {
    const router = useRouter();
    const [sellers, setSellers] = useState([]);
    const [search, setSearch] = useState("");
    const [editSeller, setEditSeller] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [totalSellers, setTotalSellers] = useState(0);
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("asc");
    const [open, setOpen] = useState(false);
    const isSmallScreen = useMediaQuery("(max-width:768px)");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/auth/admin-login");
            return;
        }
        fetchSellers();
        fetchTotalSellers();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchSellers();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

    const fetchTotalSellers = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/sellers/count");
            setTotalSellers(response.data.totalSellers);
        } catch (error) {
            console.error("Error fetching total Sellers:", error);
        }
    };

    const fetchSellers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`http://localhost:5000/api/sellers?name=${search}`);
            setSellers(response.data);
        } catch (err) {
            setError("Error fetching Sellers. Please try again later.");
            console.error("Error fetching Sellers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this seller?")) {
            setLoading(true);
            setError("");
            try {
                await axios.delete(`http://localhost:5000/api/sellers/${id}`);
                setSellers(sellers.filter(seller => seller.id !== id));
                fetchTotalSellers();
            } catch (err) {
                setError("Error deleting seller. Please try again later.");
                console.error("Error deleting seller:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditClick = (seller) => {
        setEditSeller(seller);
        setIsEditDialogOpen(true);
    };

    const handleEditChange = (e) => {
        setEditSeller({ ...editSeller, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        if (!editSeller || !editSeller.name || !editSeller.email || !editSeller.contact) {
            setError("All fields are required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await axios.put(`http://localhost:5000/api/sellers/${editSeller.id}`, editSeller);
            setSellers(sellers.map((seller) => (seller.id === editSeller.id ? editSeller : seller)));
            setIsEditDialogOpen(false);
        } catch (err) {
            setError("Error updating seller. Please try again later.");
            console.error("Error updating seller:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        const isAsc = sortField === field && sortDirection === "asc";
        setSortDirection(isAsc ? "desc" : "asc");
        setSortField(field);
        const sortedSellers = [...sellers].sort((a, b) => {
            if (a[field] < b[field]) return sortDirection === "asc" ? -1 : 1;
            if (a[field] > b[field]) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
        setSellers(sortedSellers);
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
    };

    return (
        <Box sx={{ display: "flex", bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Sidebar for mobile */}
      {isSmallScreen ? (
        <>
          <IconButton 
            onClick={() => setOpen(true)} 
            sx={{ 
              position: "absolute", 
              top: 16, 
              left: 16, 
              color: "#611964",
              backgroundColor: "white",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "#f0f0f0"
              }
            }}
          >
            <Menu />
          </IconButton>
          <Drawer 
            open={open} 
            onClose={() => setOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                backgroundColor: "#611964",
                color: "white"
              }
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <Close />
              </IconButton>
            </Box>
            <Sidebar />
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            backgroundColor: "#611964",
            color: "white",
            height: "100vh",
            position: "sticky",
            top: 0,
            boxShadow: "4px 0px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Added spacing between sidebar and main content */}
      {!isSmallScreen && (
        <Box 
          sx={{ 
            width: 80, 
            flexShrink: 0,
            backgroundColor: "#f8f9fa",
          }}
        />
      )}



            <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
                <Card elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Box sx={{ 
                        p: 3, 
                        bgcolor: "white", 
                        color: "#611964",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                           
                            <Typography variant="h4" fontWeight="bold">
                                Seller Details
                            </Typography>
                        </Box>
                       
                    </Box>
                    <Divider />
                    <CardContent>
                        {/* Search Bar */}
                        <Box sx={{ mb: 4 }}>
                            <TextField
                                label="Search sellers"
                                variant="outlined"
                                fullWidth
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                    endAdornment: search && (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setSearch("")} size="small">
                                                ✕
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ 
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </Box>
                        <Chip 
                            label={`Total Sellers: ${totalSellers}`} 
                            color="secondary" 
                            sx={{ 
                                bgcolor: "white", 
                                color: "#611964", 
                                fontWeight: "bold",
                                fontSize: "18px"
                            }} 
                        />

                        {/* Action Buttons */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                         <button>
                         </button>
                            <Button 
                             
                                startIcon={<Refresh />}
                                onClick={fetchSellers}
                                sx={{ 
                                    color: "#611964", 
                                    borderColor: "#611964",
                                    "&:hover": { 
                                        bgcolor: "#f0e6f5", 
                                        borderColor: "#611964" 
                                    },
                                    borderRadius: 2
                                }}
                            >
                               
                            </Button>
                        </Box>

                        {/* Error message */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Buyer Details Table */}
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#f0e6f5" }}>
                                        <TableCell 
                                            sx={{ 
                                                color: "#611964", 
                                                fontWeight: "bold",
                                                cursor: "pointer" 
                                            }}
                                            onClick={() => handleSort("id")}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                ID {getSortIcon("id")}
                                            </Box>
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                color: "#611964", 
                                                fontWeight: "bold",
                                                cursor: "pointer" 
                                            }}
                                            onClick={() => handleSort("name")}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                Name {getSortIcon("name")}
                                            </Box>
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                color: "#611964", 
                                                fontWeight: "bold",
                                                cursor: "pointer" 
                                            }}
                                            onClick={() => handleSort("email")}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                Email {getSortIcon("email")}
                                            </Box>
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                color: "#611964", 
                                                fontWeight: "bold",
                                                cursor: "pointer" 
                                            }}
                                            onClick={() => handleSort("contact")}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                Contact {getSortIcon("contact")}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: "#611964", fontWeight: "bold" }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <CircularProgress size={40} sx={{ color: "#611964" }} />
                                                <Typography sx={{ mt: 2, color: "#611964" }}>
                                                    Loading sellers...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : sellers.length > 0 ? (
                                        sellers.map((seller) => (
                                            <TableRow 
                                                key={seller.id}
                                                sx={{ 
                                                    "&:hover": { 
                                                        backgroundColor: "#f9f5fb" 
                                                    }
                                                }}
                                            >
                                                <TableCell>{seller.id}</TableCell>
                                                <TableCell sx={{ fontWeight: "500" }}>{seller.name}</TableCell>
                                                <TableCell>{seller.email}</TableCell>
                                                <TableCell>{seller.contact}</TableCell>
                                                <TableCell>
                                                    <IconButton 
                                                        onClick={() => handleEditClick(seller)} 
                                                        sx={{ 
                                                            color: "#2196f3",
                                                            "&:hover": { 
                                                                bgcolor: "#e3f2fd" 
                                                            }
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton 
                                                        onClick={() => handleDelete(seller.id)} 
                                                        sx={{ 
                                                            color: "#f44336",
                                                            "&:hover": { 
                                                                bgcolor: "#ffebee" 
                                                            }
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body1" color="textSecondary">
                                                    No sellers found
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                    {search ? "Try a different search term" : "Add a seller to get started"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Container>

            {/* Edit Buyer Dialog */}
            <Dialog 
                open={isEditDialogOpen} 
                onClose={() => setIsEditDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ bgcolor: "#f0e6f5", color: "#611964" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Edit sx={{ mr: 1 }} />
                        Edit Seller Information
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 1, px: 3, minWidth: 400 }}>
                    <TextField
                        label="Name"
                        name="name"
                        value={editSeller?.name || ""}
                        onChange={handleEditChange}
                        fullWidth
                        sx={{ mb: 3 }}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                    <TextField
                        label="Email"
                        name="email"
                        value={editSeller?.email || ""}
                        onChange={handleEditChange}
                        fullWidth
                        sx={{ mb: 3 }}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                    <TextField
                        label="Contact"
                        name="contact"
                        value={editSeller?.contact || ""}
                        onChange={handleEditChange}
                        fullWidth
                        sx={{ mb: 2 }}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <Button 
                        onClick={() => setIsEditDialogOpen(false)} 
                        sx={{ 
                            color: "#611964", 
                            "&:hover": { bgcolor: "#f0e6f5" }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpdate} 
                        variant="contained"
                        disabled={loading}
                        sx={{ 
                            bgcolor: "#611964", 
                            "&:hover": { bgcolor: "#4a1452" },
                            borderRadius: 1
                        }}
                    >
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SellerDetail;