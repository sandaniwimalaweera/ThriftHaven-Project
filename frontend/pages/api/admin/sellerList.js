// // pages/api/admin/sellerList.js
// import db from "../../../backend/db";
// import verifyAdminToken from "../../../backend/middleware/verifyAdminToken";

// export default function handler(req, res) {
//   if (req.method === "GET") {
//     // First, verify that this request comes from an authenticated admin.
//     verifyAdminToken(req, res, () => {
//       const adminId = req.adminId; // Set by verifyAdminToken

//       // This query gets distinct seller IDs from messages that include this admin.
//       // The first subquery returns sellers who sent messages to the admin.
//       // The second subquery returns sellers who received messages from the admin.
//       const query = `
//         (SELECT DISTINCT sender_id AS sellerId FROM messages WHERE receiver_id = ? AND sender_id != ?)
//         UNION
//         (SELECT DISTINCT receiver_id AS sellerId FROM messages WHERE sender_id = ? AND receiver_id != ?)
//       `;
//       db.query(query, [adminId, adminId, adminId, adminId], (err, results) => {
//         if (err) {
//           console.error("Error fetching seller list:", err);
//           return res.status(500).json({ error: "Error fetching seller list", details: err.message });
//         }
//         res.status(200).json(results);
//       });
//     });
//   } else {
//     res.setHeader("Allow", ["GET"]);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
