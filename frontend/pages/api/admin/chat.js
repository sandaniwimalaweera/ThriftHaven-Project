// pages/api/chat.js
import db from "../../backend/db";
import verifyToken from "../../backend/middleware/verifyToken";

export default function handler(req, res) {
  if (req.method === "GET") {
    // Fetch conversation between the current user and a partner.
    const currentUserId = req.userId;
    const partnerUserId = req.query.userId;
    if (!partnerUserId) {
      return res.status(400).json({ error: "Partner user ID is required" });
    }
    const query = `
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;
    db.query(
      query,
      [currentUserId, partnerUserId, partnerUserId, currentUserId],
      (err, results) => {
        if (err) {
          console.error("Error fetching chat messages:", err);
          return res.status(500).json({ error: "Error fetching chat messages", details: err.message });
        }
        res.status(200).json(results);
      }
    );
  } else if (req.method === "POST") {
    // Send a new message from the current user to a given partner.
    const senderId = req.userId;
    const { receiver_id, message_text } = req.body;
    if (!receiver_id || !message_text) {
      return res.status(400).json({ error: "Receiver ID and message text are required" });
    }
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `;
    db.query(query, [senderId, receiver_id, message_text], (err, result) => {
      if (err) {
        console.error("Error sending chat message:", err);
        return res.status(500).json({ error: "Error sending chat message", details: err.message });
      }
      res.status(200).json({
        message_id: result.insertId,
        sender_id: senderId,
        receiver_id,
        message_text,
        created_at: new Date()
      });
    });
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
