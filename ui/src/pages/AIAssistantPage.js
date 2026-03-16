import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, TextField, Typography, 
  CircularProgress, Stack, alpha, useTheme, IconButton, Paper, Tooltip, Divider, Chip
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { AIApi } from '../services/api';
import { Snackbar, Alert } from '@mui/material';

export default function AIAssistantPage() {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMsg = (msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev });

  const handleAskAI = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await AIApi.askQuestion({ question });
      setAnswer(res.data.answer);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to get answer from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(answer);
      showMsg('Copied to clipboard');
    }
  };

  const handleDownloadTxt = () => {
    if (!answer) return;
    const element = document.createElement("a");
    const file = new Blob([answer], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Legal_AI_Explanation.txt";
    document.body.appendChild(element);
    element.click();
    showMsg('Downloading .txt file');
  };

  const handleDownloadPdf = async () => {
    if (!answer) return;
    try {
      const res = await AIApi.downloadPdf({ analysis: answer, caseNumber: "Legal_QnA" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Legal_AI_Explanation.pdf";
      document.body.appendChild(a);
      a.click();
      showMsg('Downloading .pdf file');
    } catch (e) {
      showMsg('PDF generation failed', 'error');
    }
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer('');
    setError('');
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', mb: 2 }}>
            <Box sx={{ 
                p: 2, 
                borderRadius: 4, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                display: 'flex'
            }}>
                <AutoAwesomeIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', mb: 1, letterSpacing: -1 }}>
          Legal Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
          Consult our advanced AI assistant for instant, simplified insights into Indian Law and statutes.
        </Typography>
      </Box>

      {/* Input Section */}
      <Card sx={{ 
        borderRadius: 4, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)', 
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        mb: 4,
        overflow: 'visible'
      }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="standard"
            placeholder="Ask a question about Indian law..."
            value={question}
            onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError('');
            }}
            disabled={loading}
            InputProps={{
                disableUnderline: true,
                sx: { 
                    fontSize: '1.1rem',
                    color: '#334155',
                    px: 1
                }
            }}
          />
          <Divider sx={{ my: 2, opacity: 0.6 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
                size="small" 
                onClick={handleClear}
                disabled={loading || (!question && !answer)}
                sx={{ color: 'text.secondary', fontWeight: 700 }}
            >
                Clear
            </Button>
            <Button
              variant="contained"
              onClick={handleAskAI}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                borderRadius: '12px', 
                px: 4, 
                py: 1.2, 
                fontWeight: 900,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Consulting AI...' : 'Ask AI Assistant'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>{error}</Typography>
          </Paper>
      )}

      {/* Response Section */}
      {answer && (
        <Box sx={{ 
            animation: 'fadeInUp 0.5s ease-out forwards',
            '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
            }
        }}>
          <Paper sx={{ 
            borderRadius: 4, 
            overflow: 'hidden', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
            border: '1px solid', 
            borderColor: alpha(theme.palette.primary.main, 0.1),
            bgcolor: 'white'
          }}>
            <Box sx={{ 
              p: 2.5, 
              background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.08)}, white)`,
              borderBottom: '1px solid', 
              borderColor: alpha(theme.palette.primary.main, 0.05),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: 1, display: 'flex' }}>
                        <DescriptionIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.dark', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        Legal Explanation
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={`${answer.trim().split(/\s+/).length} words`}>
                        <Chip 
                            label={`${answer.trim().split(/\s+/).length} Words`} 
                            size="small" 
                            variant="outlined"
                            sx={{ mr: 1, fontWeight: 700, borderColor: 'divider', height: 24, fontSize: '0.65rem' }} 
                        />
                    </Tooltip>
                    <Tooltip title="Download .txt">
                        <IconButton size="small" onClick={handleDownloadTxt} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                            <DownloadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download .pdf">
                        <IconButton size="small" onClick={handleDownloadPdf} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                            <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy Answer">
                        <IconButton size="small" onClick={handleCopy} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                            <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
            <Box sx={{ p: { xs: 3, md: 5 } }}>
                {answer.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <Box key={i} sx={{ height: 16 }} />;

                    // Handle bullet points
                    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('• ');
                    const content = isBullet ? trimmed.substring(2) : trimmed;

                    // Handle bolding **text**
                    const parts = content.split(/(\*\*.*?\*\*)/g);
                    const formattedContent = parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });

                    return (
                        <Box key={i} sx={{ 
                            display: 'flex', 
                            mb: 1.5,
                            pl: isBullet ? 2 : 0,
                            position: 'relative'
                        }}>
                            {isBullet && (
                                <Box sx={{ 
                                    width: 6, 
                                    height: 6, 
                                    borderRadius: '50%', 
                                    bgcolor: 'primary.main', 
                                    position: 'absolute',
                                    left: 0,
                                    top: 10
                                }} />
                            )}
                            <Typography variant="body1" sx={{ 
                                fontSize: '1.05rem', 
                                color: '#334155', 
                                lineHeight: 1.8,
                                '& strong': { 
                                    fontWeight: 800, 
                                    color: 'primary.main',
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    px: 0.5,
                                    borderRadius: 0.5
                                }
                            }}>
                                {formattedContent}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                    Note: This is an AI-generated explanation for educational purposes.
                </Typography>
            </Box>
          </Paper>
        </Box>
      )}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
