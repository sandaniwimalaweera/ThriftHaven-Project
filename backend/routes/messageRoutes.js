const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");



// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory at:', uploadsDir);
}



// Set up multer for file storage (to handle file uploads)
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});



//file types can send
const allowedFileTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'application/zip', 'application/x-zip-compressed'
];


const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};



const upload = multer({
  storage: storageConfig,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
});




const verifyToken = (req, res, next, type) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });
  const tokenPart = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
    if (err || (type === 'admin' && decoded.userType !== 'Admin'))
      return res.status(401).json({ error: "Unauthorized" });
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    if (type === 'admin') req.adminId = decoded.userId;
    next();
  });
};



const verifyAdminToken = (req, res, next) => verifyToken(req, res, next, 'admin');
const verifyUserToken = (req, res, next) => verifyToken(req, res, next, 'user');


// Get admin users with conversation status
router.get("/admin/users", verifyAdminToken, (req, res) => {
  console.log("Admin users route called");
  console.log("Admin ID:", req.adminId);
  
  const query = `
    SELECT u.id, u.name, u.email, u.userType, 
       c.conversation_id,
       (SELECT COUNT(*) FROM messages m 
        WHERE m.conversation_id = c.conversation_id 
        AND m.sender_type = 'user' 
        AND m.is_read = 0) as unread_count,
       (SELECT MAX(created_at) FROM messages 
        WHERE conversation_id = c.conversation_id) as last_message_time
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id AND c.admin_id = ?
ORDER BY CASE WHEN last_message_time IS NULL THEN 1 ELSE 0 END, last_message_time DESC, u.name ASC
  `;
  
  console.log("SQL Query:", query);
  console.log("Admin ID for query:", req.adminId);
  
  db.query(query, [req.adminId], (err, results) => {
    if (err) {
      console.error("Error fetching users with conversation status:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    console.log("Results:", results.length, "users found");
    res.status(200).json(results);
  });
});




// Admin: Get or create conversation with a user
router.post("/admin/conversation", verifyAdminToken, (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  
  // First, check if the conversation already exists
  const checkQuery = "SELECT * FROM conversations WHERE admin_id = ? AND user_id = ?";
  
  db.query(checkQuery, [req.adminId, userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length > 0) {
      // Conversation exists, return it
      return res.status(200).json(results[0]);
    }
    
    // Conversation doesn't exist, create a new one
    const createQuery = "INSERT INTO conversations (admin_id, user_id) VALUES (?, ?)";
    
    db.query(createQuery, [req.adminId, userId], (err, result) => {
      if (err) {
        console.error("Error creating conversation:", err);
        return res.status(500).json({ error: "Failed to create conversation" });
      }
      
      res.status(201).json({
        conversation_id: result.insertId,
        admin_id: req.adminId,
        user_id: userId,
        created_at: new Date()
      });
    });
  });
});




// User: Get conversation with admin
router.get("/user/conversation", verifyUserToken, (req, res) => {
  const query = `
    SELECT c.* 
    FROM conversations c
    WHERE c.user_id = ?
  `;
  
  db.query(query, [req.userId], (err, results) => {
    if (err) {
      console.error("Error fetching conversation:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "No conversation found" });
    }
    
    res.status(200).json(results[0]);
  });
});




// Get messages for a conversation
router.get("/conversation/:conversationId", (req, res) => {
  const { conversationId } = req.params;
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });

  const tokenPart = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });

    const checkAccessQuery = `SELECT * FROM conversations WHERE conversation_id = ? AND ((admin_id = ? AND ? = 'Admin') OR (user_id = ? AND ? != 'Admin'))`;
    db.query(checkAccessQuery, [conversationId, decoded.userId, decoded.userType, decoded.userId, decoded.userType], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(403).json({ error: "Access denied" });

      const query = `
        SELECT m.*, 
               CASE WHEN m.sender_type = 'admin' THEN a.name ELSE u.name END as sender_name,
               (
                 SELECT JSON_ARRAYAGG(
                   JSON_OBJECT('file_id', mf.file_id, 'filename', mf.filename, 'originalname', mf.originalname, 'mimetype', mf.mimetype, 'size', mf.size)
                 )
                 FROM message_files mf WHERE mf.message_id = m.message_id
               ) as files
        FROM messages m
        LEFT JOIN admin a ON m.sender_type = 'admin' AND m.sender_id = a.id
        LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
        WHERE m.conversation_id = ? ORDER BY m.created_at ASC`;

      db.query(query, [conversationId], (err, messages) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const processedMessages = messages.map(msg => {
          if (!Array.isArray(msg.files)) msg.files = [];
          return msg;
        });

        const markReadQuery = `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = ?`;
        const otherParty = decoded.userType === 'Admin' ? 'user' : 'admin';
        db.query(markReadQuery, [conversationId, otherParty], () => {});

        res.status(200).json(processedMessages);
      });
    });
  });
});




// Send a message with optional file attachments
router.post("/send", upload.array('files', 5), (req, res) => {
  console.log("Received message send request");
  console.log("Body:", req.body);
  console.log("Files:", req.files ? `${req.files.length} files received` : "No files received");
  
  const { conversationId, messageText } = req.body;
  const files = req.files || [];
  
  if (!conversationId || (!messageText && files.length === 0)) {
    return res.status(400).json({ error: "Conversation ID and either message text or files are required" });
  }
  
  const token = req.headers["authorization"];
  
  if (!token) return res.status(403).json({ error: "No token provided" });
  
  const tokenPart = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  
  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    


    // Determine sender type
    const senderType = decoded.userType === 'Admin' ? 'admin' : 'user';
    const senderId = decoded.userId;
    


    // Check if user has access to this conversation
    const checkAccessQuery = `
      SELECT * FROM conversations 
      WHERE conversation_id = ? AND (
        (admin_id = ? AND '${senderType}' = 'admin') OR 
        (user_id = ? AND '${senderType}' = 'user')
      )
    `;
    
    db.query(checkAccessQuery, [conversationId, senderId, senderId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length === 0) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      


      // Insert the message
      const insertQuery = `
        INSERT INTO messages (conversation_id, sender_type, sender_id, message_text, is_read)
        VALUES (?, ?, ?, ?, 0)
      `;
      
      db.query(insertQuery, [conversationId, senderType, senderId, messageText || ''], (err, result) => {
        if (err) {
          console.error("Error sending message:", err);
          return res.status(500).json({ error: "Failed to send message" });
        }
        
        const messageId = result.insertId;
        console.log(`Message inserted with ID: ${messageId}`);
        
        // Process attached files if any
        if (files.length > 0) {
          console.log(`Processing ${files.length} attached files`);
          
          // Prepare batch insert for files
          const fileValues = files.map(file => [
            messageId,
            file.filename,
            file.originalname,
            file.mimetype,
            file.size
          ]);
          
          const insertFilesQuery = `
            INSERT INTO message_files (message_id, filename, originalname, mimetype, size)
            VALUES ?
          `;
          
          db.query(insertFilesQuery, [fileValues], (err) => {
            if (err) {
              console.error("Error saving file attachments:", err);
              // Continue anyway as the message is already sent
            } else {
              console.log("File attachments saved successfully");
            }
            
            // Return the message with files
            sendMessageResponse(req, res, messageId, senderType, senderId);
          });
        } else {
          // No files, just return the message
          sendMessageResponse(req, res, messageId, senderType, senderId);
        }
      });
    });
  });
});

// Helper function to send the message response with files
function sendMessageResponse(req, res, messageId, senderType, senderId) {
  const getMessageQuery = `
    SELECT m.*, 
           CASE 
             WHEN m.sender_type = 'admin' THEN a.name
             ELSE u.name
           END as sender_name,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'file_id', mf.file_id,
                 'filename', mf.filename,
                 'originalname', mf.originalname,
                 'mimetype', mf.mimetype,
                 'size', mf.size
               )
             )
             FROM message_files mf
             WHERE mf.message_id = m.message_id
           ) as files
    FROM messages m
    LEFT JOIN admin a ON m.sender_type = 'admin' AND m.sender_id = a.id
    LEFT JOIN users u ON m.sender_type = 'user' AND m.sender_id = u.id
    WHERE m.message_id = ?
  `;
  
  db.query(getMessageQuery, [messageId], (err, messageResult) => {
    if (err) {
      console.error("Error fetching sent message:", err);
      return res.status(201).json({ 
        message_id: messageId,
        sender_type: senderType,
        sender_id: senderId,
        message_text: req.body.messageText || '',
        created_at: new Date()
      });
    }
    
    if (messageResult.length === 0) {
      console.error("Message not found after insertion");
      return res.status(201).json({ 
        message_id: messageId,
        sender_type: senderType,
        sender_id: senderId,
        message_text: req.body.messageText || '',
        created_at: new Date()
      });
    }
    
    if (messageResult[0].files) {
      try {
        messageResult[0].files = JSON.parse(messageResult[0].files);
        // Handle null case from JSON_ARRAYAGG when no files
        if (messageResult[0].files === null) {
          messageResult[0].files = [];
        }
      } catch (e) {
        console.error("Error parsing files JSON:", e);
        messageResult[0].files = [];
      }
    } else {
      messageResult[0].files = [];
    }
    
    res.status(201).json(messageResult[0]);
  });
}



// Get unread message count for user
router.get("/user/unread-count", verifyUserToken, (req, res) => {
  const query = `
    SELECT COUNT(*) as unread_count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.conversation_id
    WHERE c.user_id = ? AND m.sender_type = 'admin' AND m.is_read = 0
  `;
  
  db.query(query, [req.userId], (err, results) => {
    if (err) {
      console.error("Error fetching unread count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.status(200).json({ unread_count: results[0].unread_count });
  });
});



// Get unread message count for admin
router.get("/admin/unread-count", verifyAdminToken, (req, res) => {
  const query = `
    SELECT COUNT(*) as unread_count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.conversation_id
    WHERE c.admin_id = ? AND m.sender_type = 'user' AND m.is_read = 0
  `;
  
  db.query(query, [req.adminId], (err, results) => {
    if (err) {
      console.error("Error fetching unread count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.status(200).json({ unread_count: results[0].unread_count });
  });
});



//download files
router.get('/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const query = "SELECT originalname FROM message_files WHERE filename = ?";
  db.query(query, [filename], (err, results) => {
    if (err || results.length === 0) {
      return res.download(filePath); 
    }

    const originalname = results[0].originalname || filename;
    res.download(filePath, originalname); 
  });
});


router.post("/user/conversation", verifyUserToken, (req, res) => {
  const userId = req.userId;
  const adminId = 1; // Default admin (or fetch dynamically)

  const checkQuery = "SELECT * FROM conversations WHERE user_id = ? AND admin_id = ?";
  db.query(checkQuery, [userId, adminId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) return res.status(200).json(results[0]);

    const createQuery = "INSERT INTO conversations (user_id, admin_id) VALUES (?, ?)";
    db.query(createQuery, [userId, adminId], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create conversation" });

      res.status(201).json({
        conversation_id: result.insertId,
        user_id: userId,
        admin_id: adminId,
        created_at: new Date()
      });
    });
  });
});



module.exports = router;