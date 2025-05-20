import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Grid, Typography, Paper, Badge, Avatar, TextField, Button, IconButton, 
  CircularProgress, InputAdornment, Chip, Tooltip, Divider, useTheme, 
  useMediaQuery, Popover, Snackbar, Alert, LinearProgress 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Sidebar from "../../components/admin-sidebar";
import { format } from 'date-fns';
import SimpleEmojiPicker from '../../components/SimpleEmojiPicker';
import FileAttachmentPreview from '../../components/FileAttachmentPreview';
import { useRouter } from 'next/router';

const AdminMessagingPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery("(max-width:768px)");

 
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/admin-login");
    }
  }, []);

  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [token, setToken] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Alert/notification states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Emoji picker state
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState(null);
  const openEmojiPicker = Boolean(emojiPickerAnchorEl);

  // File attachment states
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const isClient = useRef(false);
  const messageInputRef = useRef(null);

  // Show notification helper
  const showNotification = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };



  // Check if we're on the client side
  useEffect(() => {
    isClient.current = true;
    // Now it's safe to access localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);




  // Get all users with conversation status
  useEffect(() => {
    // Only fetch if we have a token and we're on the client side
    if (token && isClient.current) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const response = await axios.get('http://localhost:5000/api/messages/admin/users', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUsers(response.data);
          setFilteredUsers(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching users:', error);
          setLoading(false);
        }
      };

      fetchUsers();
      



      // Set up polling for new messages every 10 seconds
      const interval = setInterval(() => {
        setRefreshCount(prev => prev + 1);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [token, refreshCount]);




  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);



  // Get or create conversation when a user is selected
  useEffect(() => {
    if (selectedUser && token && isClient.current) {
      const getOrCreateConversation = async () => {
        try {
          setLoadingMessages(true);
          const response = await axios.post('http://localhost:5000/api/messages/admin/conversation', 
            { userId: selectedUser.id },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          setConversation(response.data);
          setLoadingMessages(false);
          
          // Focus on message input
          if (messageInputRef.current) {
            setTimeout(() => {
              messageInputRef.current.focus();
            }, 100);
          }
        } catch (error) {
          console.error('Error getting/creating conversation:', error);
          setLoadingMessages(false);
        }
      };
      
      getOrCreateConversation();
    }
  }, [selectedUser, token]);



  // Get messages for selected conversation
  useEffect(() => {
    if (conversation?.conversation_id && token && isClient.current) {
      const fetchMessages = async () => {
        try {
          setLoadingMessages(true);
          const response = await axios.get(`http://localhost:5000/api/messages/conversation/${conversation.conversation_id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setMessages(response.data);
          setLoadingMessages(false);
        } catch (error) {
          console.error('Error fetching messages:', error);
          setLoadingMessages(false);
        }
      };
      
      fetchMessages();
    }
  }, [conversation, token, refreshCount]);



  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // On mobile, we might want to hide the user list after selecting a user
    if (isMobile) {
      // Logic to hide user list could go here
    }
  };



  // Handle emoji picker open and close
  const handleEmojiPickerOpen = (event) => {
    setEmojiPickerAnchorEl(event.currentTarget);
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    // Optional: close picker after selection
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
    if ((!newMessage.trim() && attachedFiles.length === 0) || !conversation?.conversation_id || !token) return;
    


    // Add a local optimistic message for better UX
    const optimisticMessage = {
      local_id: Date.now(),
      sender_type: 'admin',
      sender_name: 'Admin',
      message_text: newMessage,
      created_at: new Date().toISOString(),
      pending: true,
      optimistic_files: attachedFiles.map((file, index) => ({
        local_id: `local-${index}`,
        originalname: file.name,
        // Create a temporary object URL for displaying the image
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        mimetype: file.type,
        isOptimistic: true
      }))
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('conversationId', conversation.conversation_id);
      formData.append('messageText', newMessage || ''); 
      
      // Append files if any
      attachedFiles.forEach(file => {
        formData.append('files', file);
      });
      
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
      
      
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.local_id !== optimisticMessage.local_id);
        return [...filtered, response.data];
      });
      
      setNewMessage('');
      setAttachedFiles([]);
      // Refresh messages and user list to update unread counts
      setRefreshCount(prev => prev + 1);
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
  if (!isClient.current || !token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Box sx={{ position: "fixed", height: "100vh", zIndex: 1200 }}>
        <Sidebar />
      </Box>
      
      {/* Main Content Container */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        flexGrow: 1,
        ml: isSmallScreen ? 0 : "330px", // Adjust based on sidebar width
        height: '100vh', 
        transition: 'margin-left 0.3s ease'
      }}>
        <Box sx={{ 
          flexGrow: 1, 
          height: 'calc(100vh - 64px)', 
          bgcolor: '#f9f9f9',
          overflow: 'hidden',
          p: { xs: 1, md: 3 },
          paddingTop: isSmallScreen ? 3 : 3
        }}>
          <Typography variant="h4" fontWeight="600" color="#611964" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatBubbleOutlineIcon sx={{ mr: 1 }} />
              Chats
            </Box>
          </Typography>
          
          <Paper 
            elevation={2} 
            sx={{ 
              flexGrow: 1, 
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: 'calc(100% - 50px)' // Adjust for the header
            }}
          >
            <Grid container sx={{ height: '100%' }}>
              {/* User List */}
              <Grid 
                item 
                xs={12} 
                md={4} 
                sx={{ 
                  borderRight: '1px solid rgba(0, 0, 0, 0.08)', 
                  height: '100%',
                  display: { xs: selectedUser ? 'none' : 'block', md: 'block' }
                }}
              >
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  bgcolor: '#FBFBFB' 
                }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Refresh">
                            <IconButton 
                              edge="end" 
                              onClick={handleRefresh}
                              size="small"
                              sx={{ color: '#611964' }}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.12)',
                        },
                      }
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 2
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
                    </Typography>
                    
                    <Box>
                      <Chip 
                        icon={<StoreIcon fontSize="small" />} 
                        label="Sellers" 
                        size="small"
                        sx={{ color: '#611964', borderColor: '#611964' }}
                        variant="outlined"
                        
                      />
                      <Chip 
                        icon={<PersonIcon fontSize="small" />} 
                        label="Buyers" 
                        size="small"
                        sx={{ color: '#712978', borderColor: '#712978' }}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ height: 'calc(100% - 120px)', overflow: 'auto' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <Box
                        key={user.id}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                          cursor: 'pointer',
                          bgcolor: selectedUser?.id === user.id ? 'rgba(97, 25, 100, 0.08)' : 'white',
                          '&:hover': { 
                            bgcolor: selectedUser?.id === user.id 
                              ? 'rgba(97, 25, 100, 0.12)' 
                              : 'rgba(0, 0, 0, 0.04)' 
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => handleUserSelect(user)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge
                            color="error"
                            badgeContent={user.unread_count}
                            invisible={!user.unread_count}
                            overlap="circular"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: 10,
                                height: 18,
                                minWidth: 18
                              }
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: user.userType === 'Seller' 
                                  ? '#decce8' 
                                  : '#712978',
                                width: 45,
                                height: 45,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                              }}
                            >
                              {getInitials(user.name)}
                            </Avatar>
                          </Badge>
                          
                          <Box sx={{ ml: 2, width: 'calc(100% - 60px)' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight={user.unread_count ? 600 : 400}
                                sx={{ 
                                  maxWidth: '70%', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {user.name}
                              </Typography>
                              
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                              >
                                {user.last_message_time ? formatMessageTime(user.last_message_time) : ''}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between'
                            }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  maxWidth: '70%', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {user.userType === 'Seller' ? (
                                  <StoreIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                ) : (
                                  <PersonIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                )}
                                {user.email}
                              </Typography>
                              
                              {user.unread_count ? (
                                <MarkChatUnreadIcon 
                                  fontSize="small" 
                                  color="error" 
                                  sx={{ fontSize: '1rem' }} 
                                />
                              ) : user.last_message_time ? (
                                <MarkChatReadIcon 
                                  fontSize="small" 
                                  color="action" 
                                  sx={{ fontSize: '1rem', opacity: 0.5 }} 
                                />
                              ) : null}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      p: 4,
                      color: 'text.secondary',
                      height: '100%'
                    }}>
                      <SearchIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
                      <Typography>No users found</Typography>
                      <Typography variant="body2">Try a different search term</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              
              {/* Messages */}
              <Grid 
                item 
                xs={12} 
                md={8} 
                sx={{ 
                  height: '100%', 
                  display: { 
                    xs: !selectedUser ? 'none' : 'flex', 
                    md: 'flex'
                  }, 
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {selectedUser ? (
                  <>
                    <Box sx={{ 
                      p: 2, 
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      bgcolor: '#decce8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Back button on mobile */}
                        {isMobile && (
                          <IconButton 
                            edge="start" 
                            sx={{ mr: 1 }}
                            onClick={() => setSelectedUser(null)}
                          >
                            <ArrowBackIcon />
                          </IconButton>
                        )}
                      
                        <Avatar 
                          sx={{ 
                            bgcolor: selectedUser.userType === 'Seller' 
                              ? '#7a588c' 
                              : '#712978',
                            width: 40,
                            height: 40
                          }}
                        >
                          {getInitials(selectedUser.name)}
                        </Avatar>
                        
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {selectedUser.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={selectedUser.userType}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                bgcolor: selectedUser.userType === 'Seller' 
                                  ? 'rgba(219, 198, 33, 0.1)' 
                                  : 'rgba(48, 219, 33, 0.1)',
                                color: selectedUser.userType === 'Seller' 
                                  ? '#611964'
                                  : '#611964',
                                mr: 1
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {selectedUser.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh} sx={{ color: '#611964' }}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
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
                      {loadingMessages ? (
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
                          <Typography variant="body2">Send a message to start the conversation!</Typography>
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
                            {messageGroups[date].map((message) => (
                              <Box
                                key={message.message_id || message.local_id}
                                sx={{
                                  display: 'flex',
                                  justifyContent: message.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                                  mb: 2
                                }}
                              >
                                {message.sender_type !== 'admin' && (
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      mr: 1,
                                      bgcolor: selectedUser.userType === 'Seller' 
                                        ? '#7a588c' 
                                        : '#712978',
                                      alignSelf: 'flex-end',
                                      mb: 0.5
                                    }}
                                  >
                                    {getInitials(selectedUser.name)}
                                  </Avatar>
                                )}
                                
                                <Box
                                  sx={{
                                    maxWidth: '70%',
                                    p: 2,
                                    borderRadius: message.sender_type === 'admin' 
                                      ? '16px 16px 4px 16px'
                                      : '16px 16px 16px 4px',
                                    bgcolor: message.error 
                                      ? '#d32f2f' 
                                      : message.sender_type === 'admin' 
                                        ? '#611964' 
                                        : 'white',
                                    color: message.sender_type === 'admin' ? 'white' : 'black',
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
{message.files?.length > 0 && (
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
          darkMode={message.sender_type === 'admin'}
          containerWidth="120px"
          maxImageHeight={80}
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
                                    color: message.sender_type === 'admin' 
                                      ? 'rgba(255, 255, 255, 0.7)' 
                                      : 'text.secondary',
                                    textAlign: 'right'
                                  }}>
                                    {formatMessageTime(message.created_at)}
                                  </Typography>
                                </Box>
                                
                                {message.sender_type === 'admin' && (
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      ml: 1,
                                      bgcolor: '#611964',
                                      alignSelf: 'flex-end',
                                      mb: 0.5
                                    }}
                                  >
                                    A
                                  </Avatar>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </Box>
                    
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
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    p: 3
                  }}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 80, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>No Conversation Selected</Typography>
                    <Typography variant="body1" align="center" color="text.secondary">
                      Select a user from the list to start messaging
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
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

export default AdminMessagingPage;