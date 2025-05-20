import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
  styled
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Image as ImageIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';



const FileContainer = styled(Box)(({ theme, darkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  width: '100%',
  maxWidth: '100%',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2],
    backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  }
}));



const FileAttachmentPreview = ({
  file,
  darkMode = false,
  containerWidth = '120px',
  maxImageHeight = 80,
  showPreviewButton = true
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const isImage = file.mimetype?.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const isFullUrl = file.filename?.startsWith("http");
const fileUrl = file.isOptimistic
  ? file.preview || ''
  : isFullUrl 
    ? file.filename 
    : `${baseUrl}/api/messages/file/${file.filename}`;



//size limit
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon sx={{ fontSize: 30 }} />;
    if (isPdf) return <PictureAsPdfIcon sx={{ fontSize: 30, color: '#f44336' }} />;
    return <InsertDriveFileIcon sx={{ fontSize: 30 }} />;
  };




  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (file.isOptimistic) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.originalname || file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(false);
  };



  
  return (
    <>
      <FileContainer darkMode={darkMode} sx={{ width: containerWidth }}>
        {/* File Preview Thumbnail */}
        {isImage && fileUrl ? (
          <Box
            component="img"
            src={fileUrl}
            alt={file.originalname}
            sx={{
              width: '100%',
              height: maxImageHeight,
              objectFit: 'cover',
              borderRadius: 1,
              mb: 1
            }}
          />
        ) : (
          <Box sx={{
            width: '100%',
            height: maxImageHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderRadius: 1,
            mb: 1
          }}>
            {getFileIcon()}
          </Box>
        )}

        {/* File Info */}
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Tooltip title={file.originalname || 'File'} placement="top">
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.65rem',
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
              }}
            >
              {file.originalname || 'File'}
            </Typography>
          </Tooltip>
          {file.size && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: darkMode ? 'rgba(255,255,255,0.6)' : 'text.disabled'
              }}
            >
              {formatFileSize(file.size)}
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5, gap: 0.5 }}>
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={handleDownload}
              sx={{ p: 0.5 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {(isImage || isPdf) && showPreviewButton && (
            <Tooltip title="Preview">
              <IconButton
                size="small"
                onClick={handlePreview}
                sx={{ p: 0.5 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </FileContainer>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth={isPdf ? 'md' : 'lg'}
        fullWidth
      >
        <DialogContent sx={{ p: 2 }}>
          <IconButton
            sx={{ position: 'absolute', top: 10, right: 10 }}
            onClick={() => setPreviewOpen(false)}
          >
            <CloseIcon />
          </IconButton>

          {previewLoading && <CircularProgress sx={{ m: 4 }} />}

          {isImage && (
            <Box
              component="img"
              src={fileUrl}
              alt={file.originalname}
              onLoad={() => setPreviewLoading(false)}
              onError={() => setPreviewError(true)}
              sx={{ maxWidth: '100%', maxHeight: '80vh', display: previewLoading ? 'none' : 'block' }}
            />
          )}

          {isPdf && (
            <Box
              component="iframe"
              src={`${fileUrl}#toolbar=0`}
              title="PDF Preview"
              onLoad={() => setPreviewLoading(false)}
              onError={() => setPreviewError(true)}
              sx={{ width: '100%', height: '80vh', border: 'none', display: previewLoading ? 'none' : 'block' }}
            />
          )}

          {previewError && (
            <Typography color="error" sx={{ mt: 2 }}>
              Failed to load preview.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
            Download
          </Button>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileAttachmentPreview;
