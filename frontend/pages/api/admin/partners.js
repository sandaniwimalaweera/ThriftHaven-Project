// pages/api/partners.js
import db from "../../backend/db";
import verifyToken from "../../backend/middleware/verifyToken";

export default function handler(req, res) {
  if (req.method === "GET") {
    verifyToken(req, res, () => {
      const currentUserId = req.userId;
      const currentUserType = req.userType; // e.g., "buyer" or "seller"
      let partnerType;
      if (currentUserType === "buyer") {
        partnerType = "seller";
      } else if (currentUserType === "seller") {
        partnerType = "buyer";
      } else {
        return res.status(400).json({ error: "Unknown user type" });
      }
      // Query: get users (from the users table) of the partner type excluding the current user.
      const query = `SELECT id, name, email FROM users WHERE userType = ? AND id != ?`;
      db.query(query, [partnerType, currentUserId], (err, results) => {
        if (err) {
          console.error("Error fetching partners:", err);
          return res.status(500).json({ error: "Error fetching partners", details: err.message });
        }
        res.status(200).json(results);
      });
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
