import { useState } from 'react';
import {
    Box,
    Container,
    Card,
    Typography,
    Button,
    Stack,
    Avatar,
    Fade,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Google, AutoAwesome } from '@mui/icons-material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            await signInWithPopup(auth, googleProvider);
            // User will be redirected automatically by the auth state listener
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Failed to sign in. Please try again.');
            setLoading(false);
        }
    };

    const gradientDark = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: gradientDark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'float 20s ease-in-out infinite',
                },
                '@keyframes float': {
                    '0%, 100%': {
                        transform: 'translate(0, 0) rotate(0deg)',
                    },
                    '50%': {
                        transform: 'translate(-20px, -20px) rotate(180deg)',
                    },
                },
            }}
        >
            <Container maxWidth="sm">
                <Fade in={true} timeout={1000}>
                    <Card
                        elevation={24}
                        sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: 4,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            p: 6,
                            textAlign: 'center',
                        }}
                    >
                        <Stack spacing={4} alignItems="center">
                            {/* Logo/Icon */}
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                                }}
                            >
                                <AutoAwesome sx={{ fontSize: 48 }} />
                            </Avatar>

                            {/* Title */}
                            <Stack spacing={1}>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 700,
                                        background: 'linear-gradient(45deg, #ffd700 30%, #ffed4e 90%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    NovaFrames AI
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        fontWeight: 400,
                                    }}
                                >
                                    Your AI-Powered Creative Assistant
                                </Typography>
                            </Stack>

                            {/* Description */}
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    maxWidth: 400,
                                    lineHeight: 1.8,
                                }}
                            >
                                Generate stunning images and engage in intelligent conversations with our advanced AI. Sign in to get started.
                            </Typography>

                            {/* Error Message */}
                            {error && (
                                <Alert severity="error" sx={{ width: '100%' }}>
                                    {error}
                                </Alert>
                            )}

                            {/* Sign In Button */}
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Google />}
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                sx={{
                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                    color: 'white',
                                    py: 1.8,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 30px rgba(102, 126, 234, 0.6)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(102, 126, 234, 0.5)',
                                    },
                                }}
                            >
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </Button>

                            {/* Features */}
                            <Stack
                                direction="row"
                                spacing={3}
                                sx={{
                                    pt: 2,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <Box>✨ Text Generation</Box>
                                <Box>🎨 Image Creation</Box>
                                <Box>💾 Chat History</Box>
                            </Stack>
                        </Stack>
                    </Card>
                </Fade>
            </Container>
        </Box>
    );
};

export default Login;
