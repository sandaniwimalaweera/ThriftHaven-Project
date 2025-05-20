// // pages/auth/adminSellerList.js
// import { useState, useEffect } from "react";
// import { Container, Typography, List, ListItem, ListItemText, CircularProgress } from "@mui/material";
// import axios from "axios";
// import { useRouter } from "next/router";

// export default function AdminSellerList() {
//   const router = useRouter();
//   const [sellerList, setSellerList] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchSellerList = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const response = await axios.get("/api/admin/sellerList", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log("Fetched seller list:", response.data);
//         setSellerList(response.data);
//       } catch (error) {
//         console.error("Error fetching seller list:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSellerList();
//   }, []);

//   const handleSellerClick = (sellerId) => {
//     // Navigate to the conversation page for the selected seller.
//     router.push(`/auth/adminmessages?sellerId=${sellerId}`);
//   };

//   return (
//     <Container sx={{ mt: 4 }}>
//       <Typography variant="h4" sx={{ mb: 3, color: "#611964" }}>
//         Sellers Who Messaged Admin
//       </Typography>
//       {loading ? (
//         <CircularProgress />
//       ) : sellerList.length === 0 ? (
//         <Typography>No sellers found.</Typography>
//       ) : (
//         <List>
//           {sellerList.map((seller) => (
//             <ListItem button key={seller.sellerId} onClick={() => handleSellerClick(seller.sellerId)}>
//               <ListItemText primary={`Seller ID: ${seller.sellerId}`} />
//             </ListItem>
//           ))}
//         </List>
//       )}
//     </Container>
//   );
// }
