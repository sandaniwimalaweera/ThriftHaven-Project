// middleware/verifyToken.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });
  
  // Expect token to start with "Bearer "
  const tokenPart = token.split(" ")[1];
  if (!tokenPart) return res.status(403).json({ error: "No token provided" });
  
  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  });
};

module.exports = verifyToken;
