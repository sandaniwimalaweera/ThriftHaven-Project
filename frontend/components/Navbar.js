// components/Navbar.js
import { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext"; 


const Navbar = () => {
  const { user } = useContext(UserContext);  // Get the user from context
  const router = useRouter();

  return (
    <AppBar position="fixed" style={{ backgroundColor: "#611964" }}>
      <Toolbar>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          THRIFT HAVEN {user && `- Welcome, ${user.name}`}
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          <Button color="inherit" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => router.push("/auth/products")}>
            Shop
          </Button>
          {user ? (
            // If user is logged in, display their name (and optionally link to their profile)
            <Button color="inherit" onClick={() => router.push("/profile")}>
              {user.name}
            </Button>
          ) : (
            // Otherwise, show the Login button
            <Button color="inherit" onClick={() => router.push("/auth/login")}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
