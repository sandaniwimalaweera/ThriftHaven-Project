import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  IconButton, 
  CircularProgress,
  Avatar,
  Chip,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Popover,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import CloseIcon from '@mui/icons-material/Close';
import SellerSidebar from "../../components/seller-sidebar"; 
import BuyerSidebar from "../../components/buyer-sidebar"; 
import SimpleEmojiPicker from "../../components/SimpleEmojiPicker";
import FileAttachmentPreview from "../../components/FileAttachmentPreview";
import { format } from 'date-fns';

const UserMessaging = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Emoji picker state
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState(null);
  const openEmojiPicker = Boolean(emojiPickerAnchorEl);
  
  // File attachment states
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Upload status
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Alert/notification states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Client-side state
  const isClient = useRef(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userName, setUserName] = useState('');


  
  // Show notification helper
  const showNotification = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Initialize client-side state
  useEffect(() => {
    isClient.current = true;
    // Now it's safe to access localStorage
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUserType = localStorage.getItem('userType');
    const storedUserName = localStorage.getItem('userName');
    
    if (storedToken) setToken(storedToken);
    if (storedUserId) setUserId(storedUserId);
    if (storedUserType) setUserType(storedUserType);
    if (storedUserName) setUserName(storedUserName);
    
    // If we've loaded client-side data, we can reduce initial loading state
    if (storedToken) {
      setLoading(false);
    }
  }, []);

  // Check for unread messages
  useEffect(() => {
    if (!token || !isClient.current) return;
    
    const checkUnreadMessages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/messages/user/unread-count', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();
    
    // Set up polling for new messages every 10 seconds
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [token, refreshCount]);

  // Get conversation with admin
  useEffect(() => {
    if (!token || !isClient.current) return;
    
    const getConversation = async () => {
  setLoading(true);
  try {
    const response = await axios.get('http://localhost:5000/api/messages/user/conversation', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setConversation(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      try {
        const createRes = await axios.post('http://localhost:5000/api/messages/user/conversation', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversation(createRes.data);
      } catch (createErr) {
        console.error('Error creating conversation:', createErr);
      }
    } else {
      console.error('Error getting conversation:', error);
    }
  } finally {
    setLoading(false);
  }
};


    getConversation();
  }, [token]);

  // Get messages for conversation
  useEffect(() => {
    if (!conversation?.conversation_id || !token || !isClient.current) return;
    
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/conversation/${conversation.conversation_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMessages(response.data);
        setUnreadCount(0); // Reset unread count when messages are viewed
        setLoadingMessages(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();

    // Focus on message input
    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current.focus();
      }, 100);
    }
  }, [conversation, token, refreshCount]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle emoji picker open and close
  const handleEmojiPickerOpen = (event) => {
    setEmojiPickerAnchorEl(event.currentTarget);
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
  };

  // Handle emoji selection
  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    // Close picker after selection
    handleEmojiPickerClose();
  };
  
  // Handle file attachment
  const handleFileAttachmentClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    
    // Check file size limits (10MB per file)
    const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showNotification(`These files exceed the 10MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 'error');
      // Filter out oversized files
      const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024);
      setAttachedFiles(prev => [...prev, ...validFiles]);
    } else {
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedFiles.length === 0) || !isClient.current) return;
    
    // If no conversation exists yet, we need to show a message to the user
    if (!conversation) {
      showNotification("You need to wait for an admin to initiate a conversation. Your message will appear then.", "info");
      // Add local message for UI feedback
      setMessages([
        ...messages,
        {
          local_id: Date.now(), // temporary ID
          sender_type: 'user',
          sender_name: userName,
          message_text: newMessage,
          created_at: new Date().toISOString(),
          pending: true, // Mark as pending
          files: []
        }
      ]);
      setNewMessage('');
      setAttachedFiles([]);
      return;
    }
    
    // Add a local optimistic message for better UX
    const optimisticMessage = {
      local_id: Date.now(),
      sender_type: 'user',
      sender_name: userName,
      message_text: newMessage,
      created_at: new Date().toISOString(),
      pending: true,
      optimistic_files: attachedFiles.map((file, index) => ({
        local_id: `local-${index}`,
        originalname: file.name,
        // Create a temporary object URL for displaying the image
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        mimetype: file.type
      }))
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('conversationId', conversation.conversation_id);
      formData.append('messageText', newMessage || ''); // Ensure empty string if no message
      
      // Append all files
      if (attachedFiles.length > 0) {
        attachedFiles.forEach(file => {
          formData.append('files', file);
        });
      }
      
      // Send message with files
      const response = await axios.post(
        'http://localhost:5000/api/messages/send', 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      // Remove the optimistic message and add the real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.local_id !== optimisticMessage.local_id);
        return [...filtered, response.data];
      });
      
      // Clear form
      setNewMessage('');
      setAttachedFiles([]);
     
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the optimistic message to show error state
      setMessages(prev => 
        prev.map(msg => 
          msg.local_id === optimisticMessage.local_id 
            ? { ...msg, error: true, errorMessage: 'Failed to send. Click to retry.' } 
            : msg
        )
      );
      
      showNotification('Failed to send message. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Retry sending a failed message
  const handleRetryMessage = (failedMessage) => {
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg.local_id !== failedMessage.local_id));
    
    // Set the message text and try again
    setNewMessage(failedMessage.message_text);
    
    // We can't restore the exact files, so just inform the user
    if (failedMessage.optimistic_files && failedMessage.optimistic_files.length > 0) {
      showNotification('Please re-attach your files before retrying', 'info');
    }
  };

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatMessageTime = (timestamp) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return format(messageDate, 'h:mm a');
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  // Group messages by date for better UI organization
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // If we're on the server side or don't have a token yet, show loading state
  if (!isClient.current) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Render sidebar conditionally based on user type */}
      {userType === 'Seller' && <SellerSidebar userName={userName} />}
{userType === 'Buyer' && <BuyerSidebar userName={userName} />}

      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
        height: '100vh', 
      }}>
        <Box sx={{ 
          flexGrow: 1, 
          height: 'calc(100vh - 64px)', 
          bgcolor: '#f9f9f9',
          overflow: 'hidden',
          p: { xs: 1, md: 3 },
        }}>
          <Typography variant="h4" fontWeight="600" color="#611964" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatBubbleOutlineIcon sx={{ mr: 1 }} />
              Chats
              {unreadCount > 0 && (
                <Chip 
                  label={`${unreadCount} unread`} 
                  size="small" 
                  color="error"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
          </Typography>
          
          <Paper 
            elevation={2} 
            sx={{ 
              flexGrow: 1, 
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: 'calc(100% - 50px)', // Adjust for the header
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Chat Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              bgcolor: '#decce8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: '#611964',
                    width: 40,
                    height: 40
                  }}
                >
                  A
                </Avatar>
                
                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Admin
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ThriftHaven 
                  </Typography>
                </Box>
              </Box>
              
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} sx={{ color: '#611964' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Messages Area */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                overflow: 'auto',
                bgcolor: '#f8fafc', // Light blue-gray background
                backgroundImage: 'radial-gradient(#e0e8f1 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {loading || loadingMessages ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <CircularProgress size={30} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
                  <Typography variant="h6">No messages yet</Typography>
                  <Typography variant="body2">Send a message to start a conversation with our support team!</Typography>
                </Box>
              ) : (
                Object.keys(messageGroups).map(date => (
                  <Box key={date}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      my: 3
                    }}>
                      <Divider sx={{ flex: 1 }} />
                      <Chip
                        label={format(new Date(date), 'MMMM d, yyyy')}
                        size="small"
                        sx={{ 
                          mx: 2, 
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Divider sx={{ flex: 1 }} />
                    </Box>
                    {messageGroups[date].map((message, idx) => (
                      <Box
                        key={message.message_id || message.local_id || idx}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender_type === 'user' ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        {message.sender_type !== 'user' && (
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1,
                              bgcolor: '#611964',
                              alignSelf: 'flex-end',
                              mb: 0.5
                            }}
                          >
                            A
                          </Avatar>
                        )}
                        
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: message.sender_type === 'user' 
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            bgcolor: message.error 
                              ? '#d32f2f' 
                              : message.sender_type === 'user' 
                                ? '#611964' 
                                : 'white',
                            color: message.sender_type === 'user' ? 'white' : 'black',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            position: 'relative',
                            opacity: message.pending ? 0.7 : 1,
                            cursor: message.error ? 'pointer' : 'default',
                            '&:hover': message.error ? { 
                              opacity: 0.9,
                              transition: 'opacity 0.2s'
                            } : {}
                          }}
                          onClick={() => message.error && handleRetryMessage(message)}
                        >
                          {message.pending && !message.error && (
                            <LinearProgress 
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                borderTopLeftRadius: 'inherit',
                                borderTopRightRadius: 'inherit'
                              }} 
                            />
                          )}
                          
                          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                            {message.error ? message.errorMessage || 'Error sending message. Click to retry.' : message.message_text}
                          </Typography>
                          
                          {/* Display attached files if any */}
        {message.files && message.files.length > 0 && (
  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
    {message.files.map((file, index) => {
      const fileWithUrl = {
        ...file,
        filename: `http://localhost:5000/api/messages/file/${file.filename}`
      };
      return (
        <FileAttachmentPreview
          key={file.file_id || index}
          file={fileWithUrl}
          darkMode={message.sender_type === 'user'}
          containerWidth="90px"
          maxImageHeight={60}
        />
      );
    })}
  </Box>
)}

                          
                          {/* Display optimistic files for pending messages */}
                          {message.optimistic_files && message.optimistic_files.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
                              {message.optimistic_files.map((file, index) => {
                                // Convert optimistic file format to match the format expected by FileAttachmentPreview
                                const fileForPreview = {
                                  originalname: file.originalname,
                                  mimetype: file.mimetype,
                                  // For optimistic files, we use the local preview URL instead of a backend URL
                                  filename: file.preview || '',
                                  isOptimistic: true
                                };
                                return (
                                  <Box 
                                    key={index}
                                    sx={{
                                      opacity: 0.7,
                                      m: 0.5,
                                      width: '90px',
                                      height: '80px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px dashed rgba(255,255,255,0.5)',
                                      borderRadius: 1,
                                      p: 1
                                    }}
                                  >
                                    {file.mimetype.startsWith('image/') && file.preview ? (
                                      <Box 
                                        component="img"
                                        src={file.preview}
                                        alt={file.originalname}
                                        sx={{
                                          width: '100%',
                                          height: '60px',
                                          objectFit: 'cover',
                                          borderRadius: 0.5,
                                          mb: 0.5
                                        }}
                                      />
                                    ) : file.mimetype === 'application/pdf' ? (
                                      <Box sx={{ fontSize: 20, color: 'white', mb: 1 }}>PDF</Box>
                                    ) : (
                                      <AttachFileIcon sx={{ fontSize: 20, color: 'white', mb: 1 }} />
                                    )}
                                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem', textAlign: 'center' }}>
                                      {file.originalname.length > 15 ? file.originalname.substring(0, 15) + '...' : file.originalname}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                          
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 1,
                            color: message.sender_type === 'user' 
                              ? 'rgba(255, 255, 255, 0.7)' 
                              : 'text.secondary',
                            textAlign: 'right'
                          }}>
                            {formatMessageTime(message.created_at)}
                          </Typography>
                        </Box>
                        
                        {message.sender_type === 'user' && (
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              ml: 1,
                              bgcolor: userType === 'Seller' ? '#7a588c' : '#712978',
                              alignSelf: 'flex-end',
                              mb: 0.5
                            }}
                          >
                            {getInitials(userName)}
                          </Avatar>
                        )}
                      </Box>
                    ))}
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                bgcolor: 'rgba(0, 0, 0, 0.02)'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Attached Files ({attachedFiles.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attachedFiles.map((file, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        p: 1, 
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 1,
                        position: 'relative',
                        width: '80px'
                      }}
                    >
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          right: -8, 
                          top: -8,
                          bgcolor: 'background.paper',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'white'
                          },
                          width: 20,
                          height: 20
                        }}
                        onClick={() => handleRemoveFile(index)}
                      >
                        <CloseIcon fontSize="small" sx={{ fontSize: 14 }} />
                      </IconButton>
                      
                      {file.type.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          sx={{
                            width: '100%',
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 0.5,
                            mb: 0.5
                          }}
                        />
                      ) : (
                        <Box sx={{
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          borderRadius: 0.5,
                          mb: 0.5
                        }}>
                          <AttachFileIcon />
                        </Box>
                      )}
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.6rem',
                          textAlign: 'center'
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Upload progress indicator */}
            {uploading && (
              <Box sx={{ width: '100%', px: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#611964'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
            
            {/* Message Input Area */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid rgba(0, 0, 0, 0.08)', 
              display: 'flex',
              bgcolor: '#FBFBFB',
              alignItems: 'center'
            }}>
              {/* Hidden file input */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip,application/x-zip-compressed"
              />
              
              <Tooltip title="Attach File">
                <IconButton 
                  sx={{ color: '#611964' }}
                  onClick={handleFileAttachmentClick}
                  disabled={uploading}
                >
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Insert Emoji">
                <IconButton 
                  sx={{ color: '#611964' }}
                  onClick={handleEmojiPickerOpen}
                  disabled={uploading}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
              </Tooltip>
              
              {/* Emoji Picker Popover */}
              <Popover
                open={openEmojiPicker}
                anchorEl={emojiPickerAnchorEl}
                onClose={handleEmojiPickerClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
              >
                <SimpleEmojiPicker onEmojiClick={handleEmojiClick} />
              </Popover>
              
              <TextField
                fullWidth
                placeholder="Type your message here..."
                variant="outlined"
                size="small"
                multiline
                maxRows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                inputRef={messageInputRef}
                InputProps={{
                  sx: {
                    borderRadius: 5,
                    bgcolor: 'white'
                  }
                }}
                disabled={uploading}
              />
              
              <Button
                variant="contained"
                sx={{ 
                  bgcolor: '#611964', 
                  '&:hover': { bgcolor: '#4a1149' },
                  ml: 1
                }}
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && attachedFiles.length === 0) || uploading}
              >
                {uploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Notification snackbar */}
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserMessaging;