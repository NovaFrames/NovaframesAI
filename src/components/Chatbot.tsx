import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    IconButton,
    Avatar,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Zoom,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Drawer,
} from '@mui/material';
import {
    Send,
    Brightness4,
    Brightness7,
    SmartToy,
    Person,
    Image as ImageIcon,
    TextFields,
    Delete,
    AutoAwesome,
    Logout,
    Add,
    Chat,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { GoogleGenAI } from '@google/genai';
import { OpenRouter } from '@openrouter/sdk';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    userId: string;
    createdAt: any;
    updatedAt: any;
    messages: Message[];
}

const Chatbot = () => {
    const [darkMode, setDarkMode] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENROUTER_API_KEY || '');
    const [googleApiKey] = useState(import.meta.env.VITE_GOOGLE_API_KEY || '');
    const [showApiKeyInput, setShowApiKeyInput] = useState(!import.meta.env.VITE_OPENROUTER_API_KEY);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const user = auth.currentUser;

    // Load chat sessions from Firebase
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chatSessions'),
            where('userId', '==', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions: ChatSession[] = [];
            snapshot.forEach((doc) => {
                sessions.push({ id: doc.id, ...doc.data() } as ChatSession);
            });
            setChatSessions(sessions);
        });

        return () => unsubscribe();
    }, [user]);

    // Load messages from current session
    useEffect(() => {
        if (currentSessionId) {
            const session = chatSessions.find((s) => s.id === currentSessionId);
            if (session) {
                setMessages(session.messages || []);
            }
        }
    }, [currentSessionId, chatSessions]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'text' | 'image' | null) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleApiKeySubmit = () => {
        if (apiKey.trim()) {
            setShowApiKeyInput(false);
            handleNewChat();
        }
    };

    const handleNewChat = async () => {
        if (!user) return;

        try {
            const newSession = {
                title: 'New Chat',
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: [],
            };

            const docRef = await addDoc(collection(db, 'chatSessions'), newSession);
            setCurrentSessionId(docRef.id);
            setMessages([]);
            setDrawerOpen(false);
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };

    const handleDeleteChat = async (sessionId: string) => {
        try {
            await deleteDoc(doc(db, 'chatSessions', sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const saveChatToFirebase = async (newMessages: Message[]) => {
        if (!currentSessionId || !user) return;

        try {
            // Generate title from first user message if it's still "New Chat"
            const session = chatSessions.find((s) => s.id === currentSessionId);
            const title =
                session?.title === 'New Chat' && newMessages.length > 0
                    ? newMessages[0].content.substring(0, 50) + (newMessages[0].content.length > 50 ? '...' : '')
                    : session?.title || 'New Chat';

            await updateDoc(doc(db, 'chatSessions', currentSessionId), {
                messages: newMessages,
                title: title,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Create new session if none exists
        if (!currentSessionId) {
            await handleNewChat();
            // Wait a bit for the session to be created
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            console.log('🚀 Sending request in mode:', mode);

            if (mode === 'image') {
                // Use Google GenAI for image generation
                console.log('🎨 Using Google GenAI for image generation');
                console.log('🔑 Using Google API key:', googleApiKey ? `${googleApiKey.substring(0, 10)}...` : 'NOT SET');

                if (!googleApiKey || googleApiKey === '<YOUR_GOOGLE_API_KEY>') {
                    throw new Error('Please set a valid Google API key in your .env file (VITE_GOOGLE_API_KEY)');
                }

                const ai = new GoogleGenAI({
                    apiKey: googleApiKey,
                });

                console.log('📤 Generating image with prompt:', inputValue);

                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: inputValue,
                    config: {
                        numberOfImages: 4,
                    },
                });

                console.log('📦 Image generation response:', response);

                const images: string[] = [];
                let idx = 1;

                if (response.generatedImages) {
                    for (const generatedImage of response.generatedImages) {
                        if (generatedImage.image?.imageBytes) {
                            const imgBytes = generatedImage.image.imageBytes;
                            // Convert base64 to data URL for display in browser
                            const dataUrl = `data:image/png;base64,${imgBytes}`;
                            images.push(dataUrl);
                            console.log(`Generated image ${idx}: ${dataUrl.substring(0, 50)}...`);
                            idx++;
                        }
                    }
                }

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `Generated ${images.length} images based on your prompt!`,
                    images: images,
                    timestamp: new Date(),
                };

                const finalMessages = [...updatedMessages, assistantMessage];
                setMessages(finalMessages);
                await saveChatToFirebase(finalMessages);

            } else {
                // Use OpenRouter for text generation
                console.log('💬 Using OpenRouter for text generation');
                console.log('🔑 Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

                if (!apiKey || apiKey === '<OPENROUTER_API_KEY>') {
                    throw new Error('Please set a valid OpenRouter API key in your .env file or enter it manually');
                }

                const openrouter = new OpenRouter({
                    apiKey: apiKey,
                });

                const requestParams: any = {
                    model: 'sourceful/riverflow-v2-fast-preview',
                    messages: [
                        {
                            role: 'user',
                            content: inputValue,
                        },
                    ],
                };

                console.log('📤 Request params:', JSON.stringify(requestParams, null, 2));

                const result = await openrouter.chat.send(requestParams);

                console.log('📦 Full API Response:', result);
                console.log('💬 Response Message:', result.choices[0].message);

                const responseMessage = result.choices[0].message;
                let textContent = '';

                const content = responseMessage.content;
                if (content) {
                    if (typeof content === 'string') {
                        textContent = content;
                    } else if (Array.isArray(content)) {
                        content.forEach((item: any) => {
                            if (item.type === 'text' && item.text) {
                                textContent += item.text;
                            }
                        });
                    }
                }

                console.log('📝 Final text content:', textContent);

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: textContent || 'Response received',
                    timestamp: new Date(),
                };

                const finalMessages = [...updatedMessages, assistantMessage];
                setMessages(finalMessages);
                await saveChatToFirebase(finalMessages);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                timestamp: new Date(),
            };
            const finalMessages = [...updatedMessages, errorMessage];
            setMessages(finalMessages);
            await saveChatToFirebase(finalMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const gradientLight = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const gradientDark = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

    if (showApiKeyInput) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: darkMode ? gradientDark : gradientLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Paper
                    elevation={24}
                    sx={{
                        maxWidth: 500,
                        width: '100%',
                        background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        p: 4,
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        <AutoAwesome sx={{ fontSize: 60, color: darkMode ? '#ffd700' : '#667eea' }} />
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                background: darkMode
                                    ? 'linear-gradient(45deg, #ffd700 30%, #ffed4e 90%)'
                                    : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textAlign: 'center',
                            }}
                        >
                            NovaFrames AI
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                                textAlign: 'center',
                            }}
                        >
                            Enter your OpenRouter API key to get started
                        </Typography>
                        <TextField
                            fullWidth
                            type="password"
                            label="OpenRouter API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: darkMode ? 'white' : 'inherit',
                                    '& fieldset': {
                                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'inherit',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                                },
                            }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleApiKeySubmit}
                            disabled={!apiKey.trim()}
                            sx={{
                                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                color: 'white',
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                },
                            }}
                        >
                            Start Chatting
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: darkMode ? '#343541' : '#f7f7f8',
                display: 'flex',
            }}
        >
            {/* Sidebar */}
            <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: 260,
                        background: darkMode ? '#202123' : '#fff',
                        borderRight: `1px solid ${darkMode ? '#444654' : '#e5e5e5'}`,
                    },
                }}
            >
                <SidebarContent
                    darkMode={darkMode}
                    chatSessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onNewChat={handleNewChat}
                    onSelectChat={setCurrentSessionId}
                    onDeleteChat={handleDeleteChat}
                    onClose={() => setDrawerOpen(false)}
                />
            </Drawer>

            {/* Desktop Sidebar */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: 260,
                    background: darkMode ? '#202123' : '#fff',
                    borderRight: `1px solid ${darkMode ? '#444654' : '#e5e5e5'}`,
                    overflowY: 'auto',
                }}
            >
                <SidebarContent
                    darkMode={darkMode}
                    chatSessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onNewChat={handleNewChat}
                    onSelectChat={setCurrentSessionId}
                    onDeleteChat={handleDeleteChat}
                />
            </Box>

            {/* Main Chat Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        background: darkMode ? '#343541' : '#fff',
                        borderBottom: `1px solid ${darkMode ? '#444654' : '#e5e5e5'}`,
                    }}
                >
                    <Toolbar>
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            sx={{ display: { xs: 'block', md: 'none' }, mr: 2, color: darkMode ? 'white' : 'inherit' }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            sx={{
                                flexGrow: 1,
                                fontWeight: 600,
                                color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.87)',
                            }}
                        >
                            NovaFrames AI
                        </Typography>
                        <IconButton onClick={toggleDarkMode} sx={{ color: darkMode ? 'white' : 'inherit', mr: 1 }}>
                            {darkMode ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                        <IconButton onClick={handleMenuOpen} sx={{ color: darkMode ? 'white' : 'inherit' }}>
                            <Avatar
                                src={user?.photoURL || ''}
                                alt={user?.displayName || ''}
                                sx={{ width: 32, height: 32 }}
                            />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            <MenuItem disabled>
                                <Typography variant="body2">{user?.email}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <Logout fontSize="small" sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                {/* Messages Area */}
                <Box
                    ref={chatContainerRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                        },
                    }}
                >
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                p: 4,
                            }}
                        >
                            <AutoAwesome sx={{ fontSize: 80, color: darkMode ? '#ffd700' : '#667eea', mb: 2 }} />
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.87)',
                                    mb: 1,
                                }}
                            >
                                How can I help you today?
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                }}
                            >
                                Start a conversation or generate an image
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={0}>
                            {messages.map((message, index) => (
                                <Zoom in={true} key={message.id} style={{ transitionDelay: `${index * 50}ms` }}>
                                    <Box
                                        sx={{
                                            background:
                                                message.role === 'user'
                                                    ? darkMode
                                                        ? '#343541'
                                                        : '#f7f7f8'
                                                    : darkMode
                                                        ? '#444654'
                                                        : '#fff',
                                            borderBottom: `1px solid ${darkMode ? '#4d4d4f' : '#e5e5e5'}`,
                                            py: 6,
                                        }}
                                    >
                                        <Container maxWidth="md">
                                            <Box sx={{ display: 'flex', gap: 3 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        background:
                                                            message.role === 'user'
                                                                ? 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
                                                                : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                                    }}
                                                >
                                                    {message.role === 'user' ? <Person /> : <SmartToy />}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.87)',
                                                            whiteSpace: 'pre-wrap',
                                                            lineHeight: 1.7,
                                                        }}
                                                    >
                                                        {message.content}
                                                    </Typography>
                                                    {message.images && message.images.length > 0 && (
                                                        <Stack spacing={2} sx={{ mt: 2 }}>
                                                            {message.images.map((imageUrl, idx) => (
                                                                <Box
                                                                    key={idx}
                                                                    component="img"
                                                                    src={imageUrl}
                                                                    alt={`Generated ${idx + 1}`}
                                                                    sx={{
                                                                        width: '100%',
                                                                        maxWidth: 500,
                                                                        borderRadius: 2,
                                                                        boxShadow: 3,
                                                                    }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Container>
                                    </Box>
                                </Zoom>
                            ))}
                            {isLoading && (
                                <Box
                                    sx={{
                                        background: darkMode ? '#444654' : '#fff',
                                        borderBottom: `1px solid ${darkMode ? '#4d4d4f' : '#e5e5e5'}`,
                                        py: 6,
                                    }}
                                >
                                    <Container maxWidth="md">
                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Avatar
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                                }}
                                            >
                                                <SmartToy />
                                            </Avatar>
                                            <CircularProgress size={24} sx={{ mt: 1 }} />
                                        </Box>
                                    </Container>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Stack>
                    )}
                </Box>

                {/* Input Area */}
                <Box
                    sx={{
                        borderTop: `1px solid ${darkMode ? '#444654' : '#e5e5e5'}`,
                        background: darkMode ? '#343541' : '#f7f7f8',
                        p: 3,
                    }}
                >
                    <Container maxWidth="md">
                        <Stack spacing={2}>
                            {/* Mode Toggle */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <ToggleButtonGroup
                                    value={mode}
                                    exclusive
                                    onChange={handleModeChange}
                                    size="small"
                                    sx={{
                                        '& .MuiToggleButton-root': {
                                            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'inherit',
                                            '&.Mui-selected': {
                                                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                                color: 'white',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="text">
                                        <TextFields sx={{ mr: 1, fontSize: 18 }} />
                                        Text
                                    </ToggleButton>
                                    <ToggleButton value="image">
                                        <ImageIcon sx={{ mr: 1, fontSize: 18 }} />
                                        Image
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Input Field */}
                            <Paper
                                elevation={2}
                                sx={{
                                    background: darkMode ? '#40414f' : '#fff',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    p: 1,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    maxRows={4}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder={mode === 'text' ? 'Send a message...' : 'Describe the image you want to generate...'}
                                    variant="standard"
                                    disabled={isLoading}
                                    InputProps={{
                                        disableUnderline: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            color: darkMode ? 'white' : 'inherit',
                                            p: 1,
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'inherit',
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    sx={{
                                        background: inputValue.trim() && !isLoading ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' : 'transparent',
                                        color: inputValue.trim() && !isLoading ? 'white' : darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                        '&:hover': {
                                            background: inputValue.trim() && !isLoading ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' : 'transparent',
                                        },
                                        '&:disabled': {
                                            color: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                        },
                                    }}
                                >
                                    <Send />
                                </IconButton>
                            </Paper>
                        </Stack>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
};

// Sidebar Component
interface SidebarContentProps {
    darkMode: boolean;
    chatSessions: ChatSession[];
    currentSessionId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onClose?: () => void;
}

const SidebarContent = ({
    darkMode,
    chatSessions,
    currentSessionId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onClose,
}: SidebarContentProps) => {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                        onNewChat();
                        onClose?.();
                    }}
                    sx={{
                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'inherit',
                        color: darkMode ? 'white' : 'inherit',
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        '&:hover': {
                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'inherit',
                            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
                        },
                    }}
                >
                    New chat
                </Button>
            </Box>

            <Divider sx={{ borderColor: darkMode ? '#444654' : '#e5e5e5' }} />

            <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                {chatSessions.map((session) => (
                    <ListItem
                        key={session.id}
                        disablePadding
                        secondaryAction={
                            <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(session.id);
                                }}
                                sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                    '&:hover': {
                                        color: '#f44336',
                                    },
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        }
                    >
                        <ListItemButton
                            selected={currentSessionId === session.id}
                            onClick={() => {
                                onSelectChat(session.id);
                                onClose?.();
                            }}
                            sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                },
                                '&:hover': {
                                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                },
                            }}
                        >
                            <Chat sx={{ mr: 2, fontSize: 18, color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit' }} />
                            <ListItemText
                                primary={session.title}
                                primaryTypographyProps={{
                                    noWrap: true,
                                    sx: {
                                        color: darkMode ? 'white' : 'rgba(0, 0, 0, 0.87)',
                                        fontSize: '0.875rem',
                                    },
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default Chatbot;
