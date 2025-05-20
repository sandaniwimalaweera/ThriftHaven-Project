// pages/auth/cart.js
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Button,
  IconButton,
  Modal,
  Checkbox,
  useMediaQuery,
  Drawer,
  ButtonGroup,
  CircularProgress,
  AppBar,
  Toolbar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useRouter } from "next/router";
import BuyerSidebar from "../../components/buyer-page-sidebar";

function CartPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [updatingItem, setUpdatingItem] = useState(null);

  // Fetch user details
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

  // Fetch cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched cart items:", response.data);
        setCartItems(response.data);
      } catch (error) {
        console.error("Error fetching cart items:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [router]);

  // Toggle selection of items
  const handleSelectItem = (cartId) => {
    setSelectedItemIds((prev) =>
      prev.includes(cartId)
        ? prev.filter((id) => id !== cartId)
        : [...prev, cartId]
    );
  };

  // Update item quantity
  const updateItemQuantity = async (item, newQuantity) => {
    if (updatingItem === item.cart_id) return; // Prevent multiple simultaneous updates for the same item
    
    try {
      setUpdatingItem(item.cart_id);
      const token = localStorage.getItem("token");
      
      // Call API to update cart item quantity
      const response = await axios.put(
        `http://localhost:5000/api/cart/update/${item.cart_id}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setCartItems(cartItems.map(cartItem => 
        cartItem.cart_id === item.cart_id 
          ? { ...cartItem, quantity: newQuantity } 
          : cartItem
      ));
      
      console.log("Updated cart item:", response.data);
    } catch (error) {
      console.error("Error updating cart item:", error.response?.data || error.message);
      
      // Handle the case where not enough quantity is available
      if (error.response?.data?.error === "Not enough quantity available") {
        alert(`Only ${error.response.data.available} items available. You requested ${error.response.data.requested}.`);
      } else {
        alert("Error updating item quantity");
      }
    } finally {
      setUpdatingItem(null);
    }
  };
  
  // Increase item quantity
  const handleIncreaseQuantity = (item, e) => {
    e.stopPropagation();
    // Need to check if we're at the maximum available quantity
    if (item.quantity < item.available_quantity) {
      updateItemQuantity(item, item.quantity + 1);
    } else {
      alert(`Cannot add more. Maximum available quantity (${item.available_quantity}) reached.`);
    }
  };
  
  // Decrease item quantity
  const handleDecreaseQuantity = (item, e) => {
    e.stopPropagation();
    if (item.quantity > 1) {
      updateItemQuantity(item, item.quantity - 1);
    }
  };

  // Calculate total products & amount for selected items
  const totalProducts = cartItems
    .filter((item) => selectedItemIds.includes(item.cart_id))
    .reduce((acc, item) => acc + parseInt(item.quantity, 10), 0);

  const totalAmount = cartItems
    .filter((item) => selectedItemIds.includes(item.cart_id))
    .reduce(
      (acc, item) => acc + parseFloat(item.price) * parseInt(item.quantity, 10),
      0
    );

  // Remove item from cart
  const handleRemove = async (cartId) => {
    const confirmed = window.confirm("Are you sure you want to remove this item from your cart?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:5000/api/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message);
      setCartItems(cartItems.filter((item) => item.cart_id !== cartId));
      setSelectedItemIds((prev) => prev.filter((id) => id !== cartId));
    } catch (error) {
      console.error("Error removing cart item:", error.response?.data || error.message);
      alert("Error removing cart item");
    }
  };

  // When clicking on a card
  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // When clicking checkout, save selected items to localStorage and navigate to checkout page
  const handleCheckout = () => {
    if (selectedItemIds.length === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
    const selectedItems = cartItems.filter((item) => selectedItemIds.includes(item.cart_id));
    console.log("Selected items for checkout:", selectedItems);
    localStorage.setItem("selectedCartItems", JSON.stringify(selectedItems));
    router.push("/auth/checkout");
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar for desktop (not modifying the original sidebar) */}
      {!isSmallScreen && (
        <Box sx={{ 
          width: 330, 
          flexShrink: 0,
          position: "fixed",
          zIndex: 1,
          height: "100vh",
          overflowY: "auto"
        }}>
          <BuyerSidebar userName={userName} />
        </Box>
      )}

      {/* Mobile drawer */}
      {isSmallScreen && (
        <>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ 
              position: "fixed", 
              top: 10, 
              left: 10, 
              color: "#611964",
              bgcolor: "white",
              boxShadow: 2,
              zIndex: 1200,
              "&:hover": { bgcolor: "#f5f5f5" }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <BuyerSidebar userName={userName} />
          </Drawer>
        </>
      )}

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          ml: isSmallScreen ? 0 : '330px', // Add margin only on desktop
          width: isSmallScreen ? '100%' : 'calc(100% - 330px)',
          minHeight: '100vh'
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
          {/* Page heading */}
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              color: "#611964", 
              fontWeight: "bold",
              pl: isSmallScreen ? 7 : 0 // Add padding for the menu button on mobile
            }}
          >
            My Cart
          </Typography>

          {/* Cart content */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress sx={{ color: "#611964" }} />
            </Box>
          ) : cartItems.length > 0 ? (
            <Grid container spacing={3}>
              {/* Cart items */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  {cartItems.map((item) => (
                    <Grid item xs={12} key={item.cart_id}>
                      <Card
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          p: { xs: 1, md: 2 },
                          minHeight: 120,
                          position: "relative",
                          cursor: "pointer",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 3
                          }
                        }}
                        onClick={() => handleCardClick(item)}
                      >
                        <Box sx={{ p: 1 }}>
                          <Checkbox
                            checked={selectedItemIds.includes(item.cart_id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectItem(item.cart_id);
                            }}
                          />
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: "bold" }}>
                            {item.product_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {item.category} | {item.type}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Price: Rs.{item.price} x {item.quantity} = Rs.{(parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Seller: {item.sellerName}
                          </Typography>

                          {/* Quantity controls */}
                          <Box sx={{ mt: 1, display: "flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              Quantity:
                            </Typography>
                            <ButtonGroup size="small" sx={{ backgroundColor: "white" }}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleDecreaseQuantity(item, e)}
                                disabled={item.quantity <= 1 || updatingItem === item.cart_id}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{ 
                                padding: "4px 8px", 
                                minWidth: "30px", 
                                textAlign: "center", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                borderLeft: "1px solid rgba(0,0,0,0.12)",
                                borderRight: "1px solid rgba(0,0,0,0.12)" 
                              }}>
                                {updatingItem === item.cart_id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  item.quantity
                                )}
                              </Box>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleIncreaseQuantity(item, e)}
                                disabled={updatingItem === item.cart_id}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </ButtonGroup>
                          </Box>
                        </CardContent>
                        {item.image && (
                          <CardMedia
                            component="img"
                            image={`http://localhost:5000/${item.image}`}
                            alt={item.product_name}
                            sx={{
                              width: { xs: "100%", md: 150 },
                              height: 100,
                              objectFit: "contain",
                              borderRadius: 1,
                            }}
                          />
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(item.cart_id);
                          }}
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            bgcolor: "rgba(255,0,0,0.8)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(255,0,0,0.9)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Cart summary */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  position: { md: 'sticky' }, 
                  top: { md: '20px' }
                }}>
                  <Card sx={{ p: 2, background: "#ffffff", borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                        Cart Summary
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Total Selected Products: {totalProducts}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        Total Amount: Rs.{totalAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: "green" }}>
                        Shipping cost already added for product's cost.
                      </Typography>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ 
                          bgcolor: "#611964", 
                          "&:hover": { bgcolor: "#4a124b" },
                          mt: 1,
                          py: 1.5,
                          fontWeight: "bold" 
                        }}
                        onClick={handleCheckout}
                        disabled={selectedItemIds.length === 0}
                      >
                        Checkout
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8, 
              px: 2, 
              bgcolor: '#f9f9f9', 
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Your cart is empty</Typography>
              <Button 
                variant="contained" 
                onClick={() => router.push('/')}
                sx={{ 
                  bgcolor: "#611964", 
                  "&:hover": { bgcolor: "#4a124b" } 
                }}
              >
                Continue Shopping
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Item detail modal */}
      {selectedItem && (
        <Modal
          open={Boolean(selectedItem)}
          onClose={handleCloseModal}
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Box
            sx={{
              width: { xs: "90%", sm: 800 },
              bgcolor: "background.paper",
              p: 3,
              borderRadius: 2,
              boxShadow: 24,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            {selectedItem.image && (
              <Box
                component="img"
                src={`http://localhost:5000/${selectedItem.image}`}
                alt={selectedItem.product_name}
                sx={{
                  width: { xs: "100%", sm: "50%" },
                  height: "auto",
                  maxHeight: 400,
                  objectFit: "contain",
                  borderRadius: 1,
                }}
              />
            )}
            <Box sx={{ width: { xs: "100%", sm: "50%" }, position: "relative" }}>
              <IconButton 
                onClick={handleCloseModal} 
                sx={{ 
                  position: "absolute", 
                  top: 8, 
                  right: 8,
                  bgcolor: "rgba(0,0,0,0.1)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.2)" }
                }}
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#611964" }}>
                {selectedItem.product_name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Category:</strong> {selectedItem.category}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Type:</strong> {selectedItem.type}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Status:</strong> {selectedItem.status}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Unit Price:</strong> Rs.{selectedItem.price}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Quantity:</strong> {selectedItem.quantity}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total Price:</strong> Rs.{(parseFloat(selectedItem.price) * parseInt(selectedItem.quantity, 10)).toFixed(2)}
              </Typography>
              {selectedItem.original_price && (
                <Typography variant="body1" sx={{ mb: 1, textDecoration: "line-through", color: "red" }}>
                  <strong>Original Price:</strong> Rs.{selectedItem.original_price}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Seller:</strong> {selectedItem.sellerName}
              </Typography>
              
              {/* Quantity controls in modal */}
              <Box sx={{ mt: 3, display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  <strong>Quantity:</strong>
                </Typography>
                <ButtonGroup sx={{ backgroundColor: "white" }}>
                  <IconButton 
                    onClick={(e) => handleDecreaseQuantity(selectedItem, e)}
                    disabled={selectedItem.quantity <= 1 || updatingItem === selectedItem.cart_id}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Box sx={{ 
                    padding: "8px 16px", 
                    minWidth: "40px", 
                    textAlign: "center", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    borderLeft: "1px solid rgba(0,0,0,0.12)",
                    borderRight: "1px solid rgba(0,0,0,0.12)" 
                  }}>
                    {updatingItem === selectedItem.cart_id ? (
                      <CircularProgress size={20} />
                    ) : (
                      selectedItem.quantity
                    )}
                  </Box>
                  <IconButton 
                    onClick={(e) => handleIncreaseQuantity(selectedItem, e)}
                    disabled={updatingItem === selectedItem.cart_id}
                  >
                    <AddIcon />
                  </IconButton>
                </ButtonGroup>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}

export default CartPage;