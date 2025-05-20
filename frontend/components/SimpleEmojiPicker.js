import React from 'react';
import { Box, Grid, Typography } from '@mui/material';

// A collection of common emojis
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '😘', '😗', '😚', '😙', '😋',
  '😛', '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
  '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
  '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕',
  '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
  '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
  '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
  '👋', '👌', '✌️', '🤟', '🤘', '👍', '👎', '👏', '🙌', '🤝',
  '💪', '❤️', '💔', '💯', '✨', '🔥', '🎉', '🎊', '👑', '💎',
  '🎁', '🎈', '🎂', '🍕', '🍔', '🍟', '🍩', '🍦', '🍷', '🍸'
];

const categories = [
  { name: 'Smileys', emoji: '😀' },
  { name: 'Gestures', emoji: '👍' },
  { name: 'Objects', emoji: '🎁' },
  { name: 'Food', emoji: '🍕' }
];

// Simple emoji picker component
const SimpleEmojiPicker = ({ onEmojiClick }) => {
  return (
    <Box sx={{ 
      width: 320, 
      maxHeight: 300, 
      overflow: 'auto',
      bgcolor: 'background.paper',
      boxShadow: 3,
      borderRadius: 1,
      p: 2 
    }}>
      <Typography variant="subtitle2" gutterBottom>
        Select an emoji
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 1 }}>
        {categories.map((category) => (
          <Box 
            key={category.name}
            sx={{ 
              p: 1, 
              mx: 0.5, 
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '1.2rem'
            }}
          >
            <Box>{category.emoji}</Box>
            <Typography variant="caption">{category.name}</Typography>
          </Box>
        ))}
      </Box>
      
      <Grid container spacing={0.5}>
        {emojis.map((emoji, index) => (
          <Grid item key={index}>
            <Box 
              sx={{ 
                fontSize: '1.5rem', 
                p: 0.5, 
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.2s'
              }}
              onClick={() => onEmojiClick(emoji)}
            >
              {emoji}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimpleEmojiPicker;