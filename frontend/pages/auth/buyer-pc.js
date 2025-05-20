import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  IconButton,
  LinearProgress,
  Tooltip,
  Divider,
  Zoom,
  Fade,
} from "@mui/material";
import {
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  CheckCircleOutline,
  ErrorOutline,
  Info,
} from "@mui/icons-material";
import BuyerSidebar from "../../components/buyer-page-sidebar";

const ChangePassword = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [userName, setUserName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  // 🔐 Authentication Check (Token + Expiry)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login?redirect=/auth/buyer-pc");
      return;
    }

    try {
      const [, payloadBase64] = token.split(".");
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const now = Date.now() / 1000;

      if (decodedPayload.exp < now) {
        localStorage.removeItem("token");
        router.push("/auth/login?redirect=/auth/buyer-pc");
      }
    } catch (err) {
      localStorage.removeItem("token");
      router.push("/auth/login?redirect=/auth/buyer-pc");
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedName = localStorage.getItem("userName");
      if (storedName) {
        setUserName(storedName);
      } else {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await axios.get("http://localhost:5000/api/users/details", {
              headers: { Authorization: token },
            });
            if (response.data?.name) {
              setUserName(response.data.name);
              localStorage.setItem("userName", response.data.name);
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
          }
        }
      }
      setTimeout(() => setPageLoading(false), 800);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "newPassword") {
      calculatePasswordStrength(e.target.value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    else if (password.length >= 6) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "#f44336";
    if (passwordStrength < 70) return "#ff9800";
    return "#4caf50";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ text: "All fields are required", type: "error" });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5000/api/users/change-password",
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: token },
        }
      );

      setMessage({ text: "Password changed successfully!", type: "success" });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength(0);

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || "Failed to change password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "current") setShowCurrentPassword(!showCurrentPassword);
    if (field === "new") setShowNewPassword(!showNewPassword);
    if (field === "confirm") setShowConfirmPassword(!showConfirmPassword);
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <BuyerSidebar userName={userName} />
        <Container sx={{
          display: "flex", justifyContent: "center", alignItems: "center", ml: "330px", width: "calc(100% - 330px)",
        }}>
          <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <Lock sx={{ fontSize: 60, color: "#611964", mb: 2, opacity: 0.8 }} />
            <Typography variant="h6" color="#611964" sx={{ mb: 3 }}>
              Loading security settings...
            </Typography>
            <LinearProgress sx={{
              height: 6, borderRadius: 3, "& .MuiLinearProgress-bar": {
                bgcolor: "#611964"
              }
            }} />
          </Box>
        </Container>
      </Box>
    );
  }


  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8f9fa" }}>
      <BuyerSidebar userName={userName} />
      
      <Container component="main" sx={{ 
        mt: 4, 
        mb: 4, 
        position: "relative",
        ml: "330px", // Match sidebar width
        width: "calc(100% - 330px)",
      }}>
        <Fade in={true} timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              borderRadius: 2,
              maxWidth: 500,
              mx: "auto",
              mt: 6,
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "5px",
                bgcolor: "#611964",
              }
            }}
          >
            <Box 
              sx={{ 
                bgcolor: "#f3e8f5", 
                p: 2, 
                borderRadius: "50%", 
                display: "flex", 
                mb: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Security sx={{ fontSize: 40, color: "#611964" }} />
            </Box>
            
            <Typography component="h1" variant="h5" sx={{ mb: 1, color: "#611964", fontWeight: "bold" }}>
              Change Password
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              {userName ? `Secure ${userName}'s account` : "Secure your account"}
            </Typography>
            
            <Divider sx={{ width: "100%", mb: 3 }} />
            
            {message.text && (
              <Alert 
                severity={message.type} 
                sx={{ 
                  width: "100%", 
                  mb: 3,
                  "& .MuiAlert-icon": {
                    alignItems: "center"
                  }
                }}
                icon={message.type === "success" ? <CheckCircleOutline /> : <ErrorOutline />}
                onClose={() => setMessage({ text: "", type: "" })}
              >
                {message.text}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              <Box sx={{ position: "relative", mb: 3 }}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="currentPassword"
                  label="Current Password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#611964",
                    },
                  }}
                />
                <Tooltip title={showCurrentPassword ? "Hide password" : "Show password"} arrow>
                  <IconButton
                    onClick={() => togglePasswordVisibility("current")}
                    sx={{ position: "absolute", right: 10, top: 12 }}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ position: "relative", mb: 1 }}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#611964",
                    },
                  }}
                />
                <Tooltip title={showNewPassword ? "Hide password" : "Show password"} arrow>
                  <IconButton
                    onClick={() => togglePasswordVisibility("new")}
                    sx={{ position: "absolute", right: 10, top: 12 }}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Password strength indicator */}
              {formData.newPassword && (
                <Box sx={{ mb: 3, mt: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      Password Strength:
                    </Typography>
                    <Typography 
                      variant="caption" 
                      fontWeight="bold"
                      sx={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthLabel()}
                    </Typography>
                    <Tooltip 
                      title="Strong passwords include uppercase letters, lowercase letters, numbers, and special characters" 
                      arrow
                      TransitionComponent={Zoom}
                    >
                      <Info fontSize="small" sx={{ ml: 1, color: "text.disabled", cursor: "pointer" }} />
                    </Tooltip>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={passwordStrength} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getPasswordStrengthColor()
                      }
                    }} 
                  />
                </Box>
              )}
              
              <Box sx={{ position: "relative", mb: 4 }}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ""}
                  helperText={
                    formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== "" 
                      ? "Passwords don't match" 
                      : ""
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#611964",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#611964",
                    },
                  }}
                />
                <Tooltip title={showConfirmPassword ? "Hide password" : "Show password"} arrow>
                  <IconButton
                    onClick={() => togglePasswordVisibility("confirm")}
                    sx={{ position: "absolute", right: 10, top: 12 }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Divider sx={{ width: "100%", mb: 3 }} />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: "#611964",
                  color: "white",
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 8px rgba(97, 25, 100, 0.2)",
                  "&:hover": {
                    bgcolor: "#4a1350",
                    boxShadow: "0 6px 12px rgba(97, 25, 100, 0.3)",
                    transform: "translateY(-2px)"
                  },
                  "&:active": {
                    transform: "translateY(0)"
                  }
                }}
              >
                {loading ? "Processing..." : "Update Password"}
              </Button>
              
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ display: "block", textAlign: "center", mt: 2 }}
              >
                For security reasons, you'll be asked to login again after changing your password.
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ChangePassword;