// // backend/middleware/verifyAdminToken.js
// const jwt = require("jsonwebtoken");

// const verifyAdminToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) return res.status(403).json({ error: "No token provided" });
  
//   const token = authHeader.split(" ")[1];
//   if (!token) return res.status(403).json({ error: "Token format is invalid" });
  
//   jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(401).json({ error: "Unauthorized" });
//     req.adminId = decoded.adminId; // Admin's ID
//     next();
//   });
// };

// module.exports = verifyAdminToken;
