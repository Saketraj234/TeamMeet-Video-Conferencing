import React, { useState, useContext, useEffect, useRef } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Video, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Home, Github, Linkedin, X, Shield, Users, CheckCircle2, MessageCircle, Headphones } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const TURNSTILE_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || "";
const TURNSTILE_REQUIRED = !!TURNSTILE_SITE_KEY;

export default function Authentication() {
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showUsernameValidation, setShowUsernameValidation] = useState(false)
    const [showPasswordValidation, setShowPasswordValidation] = useState(false)

    const [turnstileToken, setTurnstileToken] = useState('')
    const [turnstileVerified, setTurnstileVerified] = useState(false)
    const [turnstileExpired, setTurnstileExpired] = useState(false)
    const turnstileWidgetRef = useRef(null);
    const turnstileWidgetId = useRef(null);

    const getPasswordRequirements = (pwd) => ({
        length: pwd.length >= 8,
        uppercase: pwd.length > 0 && /[A-Z]/.test(pwd),
        lowercase: pwd.length > 0 && /[a-z]/.test(pwd),
        number: pwd.length > 0 && /[0-9]/.test(pwd),
        special: pwd.length > 0 && /[!@#$%^&*]/.test(pwd)
    })

    const getUsernameRequirements = (user) => ({
        length: user.length >= 3 && user.length <= 20,
        validChars: user.length > 0 && /^[a-zA-Z0-9_]*$/.test(user)
    })

    const getEmailRequirements = (em) => ({
        filled: em && em.length > 0,
        valid: em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)
    })

    const passwordRequirements = getPasswordRequirements(password)
    const usernameRequirements = getUsernameRequirements(username)

    // Popup states
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)

    const { handleLogin, handleRegister } = useContext(AuthContext)

    const resetTurnstile = () => {
        setTurnstileToken('')
        setTurnstileVerified(false)
        setTurnstileExpired(false)
        try {
            if (turnstileWidgetId.current && window.turnstile) {
                window.turnstile.reset(turnstileWidgetId.current)
            }
        } catch (e) { /* ignore */ }
    }

    useEffect(() => {
        resetTurnstile()
        setShowUsernameValidation(false)
        setShowPasswordValidation(false)
    }, [isLogin])

    useEffect(() => {
        if (!TURNSTILE_REQUIRED) return;
        if (!turnstileWidgetRef.current) return;
        let cancelled = false;

        const tryRender = () => {
            if (cancelled || !turnstileWidgetRef.current) return;
            if (!window.turnstile) return false;
            try {
                const id = window.turnstile.render(turnstileWidgetRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    theme: 'dark',
                    size: 'normal',
                    callback: (token) => {
                        setTurnstileToken(token)
                        setTurnstileVerified(true)
                        setTurnstileExpired(false)
                    },
                    'error-callback': () => {
                        setTurnstileToken('')
                        setTurnstileVerified(false)
                        setTurnstileExpired(true)
                    },
                    'expired-callback': () => {
                        setTurnstileToken('')
                        setTurnstileVerified(false)
                        setTurnstileExpired(true)
                    },
                    'timeout-callback': () => {
                        setTurnstileToken('')
                        setTurnstileVerified(false)
                        setTurnstileExpired(true)
                    }
                });
                turnstileWidgetId.current = id;
                return true;
            } catch (e) {
                console.error('Turnstile render error:', e);
                return true;
            }
        };

        if (!tryRender()) {
            const interval = setInterval(() => {
                if (tryRender()) clearInterval(interval);
            }, 200);
            const timeout = setTimeout(() => clearInterval(interval), 8000);
            return () => {
                cancelled = true;
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
        return () => { cancelled = true; }
    }, [isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (TURNSTILE_REQUIRED && !turnstileVerified) {
            setError(turnstileExpired
                ? 'Verification expired. Please check the box again.'
                : 'Please verify you are human by checking the box.')
            return
        }

        setLoading(true)

        if (!isLogin) {
            const currentUsernameReq = getUsernameRequirements(username)
            const currentPasswordReq = getPasswordRequirements(password)
            const currentEmailReq = getEmailRequirements(email)

            if (!name || name.trim().length < 2) {
                setError('Please enter your full name (at least 2 characters)')
                setLoading(false)
                return
            }
            if (!currentUsernameReq.length) {
                setError('Username must be 3–20 characters long')
                setLoading(false)
                return
            }
            if (!currentUsernameReq.validChars) {
                setError('Username can only contain letters, numbers, and underscores')
                setLoading(false)
                return
            }
            if (!currentEmailReq.filled) {
                setError('Please enter your email address')
                setLoading(false)
                return
            }
            if (!currentEmailReq.valid) {
                setError('Please enter a valid email address (e.g. user@example.com)')
                setLoading(false)
                return
            }
            if (!currentPasswordReq.length) {
                setError('Password must be at least 8 characters long')
                setLoading(false)
                return
            }
            if (!currentPasswordReq.uppercase) {
                setError('Password must contain at least one uppercase letter')
                setLoading(false)
                return
            }
            if (!currentPasswordReq.lowercase) {
                setError('Password must contain at least one lowercase letter')
                setLoading(false)
                return
            }
            if (!currentPasswordReq.number) {
                setError('Password must contain at least one number')
                setLoading(false)
                return
            }
            if (!currentPasswordReq.special) {
                setError('Password must contain at least one special character (!@#$%^&*)')
                setLoading(false)
                return
            }
        }

        try {
            if (isLogin) {
                await handleLogin(username, password, turnstileToken)
            } else {
                try {
                    await handleRegister(name, username, password, email, turnstileToken)
                } catch (regErr) {
                    console.error('Registration error:', regErr)
                    const status = regErr.response?.status
                    const msg = regErr.response?.data?.message
                    if (status === 409) {
                        setError(msg || 'This username is already registered. Please try a different username or login instead.')
                    } else if (status === 400 && typeof msg === 'string') {
                        setError(msg)
                    } else if (typeof msg === 'string') {
                        setError(msg)
                    } else if (!navigator.onLine) {
                        setError('Network error. Please check your internet connection and try again.')
                    } else if (!regErr.response) {
                        setError('Cannot reach the server. Please ensure the backend is running and refresh the page.')
                    } else {
                        setError('Registration failed. Please try again with different details.')
                    }
                    setLoading(false)
                    resetTurnstile()
                    return
                }
                try {
                    await handleLogin(username, password, turnstileToken)
                } catch (loginErr) {
                    navigate('/auth')
                }
            }
        } catch (err) {
            console.error('Auth error:', err)
            const status = err.response?.status
            const msg = err.response?.data?.message
            if (status === 404) {
                setError(typeof msg === 'string' ? msg : 'Account not found. Please check your username/email or create a new account.')
            } else if (status === 401) {
                setError(typeof msg === 'string' ? msg : 'Invalid password. Please try again.')
            } else if (status === 400 && typeof msg === 'string') {
                setError(msg)
            } else if (typeof msg === 'string') {
                setError(msg)
            } else if (!navigator.onLine) {
                setError('Network error. Please check your internet connection and try again.')
            } else if (!err.response) {
                setError('Cannot reach TeamMeet server. Please ensure backend is running on port 8000, enable CORS, or refresh the page.')
            } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                setError('Cannot reach TeamMeet server. Please check your connection or try again later.')
            } else {
                setError('Something went wrong. Please try again in a moment.')
            }
        } finally {
            setLoading(false)
            resetTurnstile()
        }
    }

    return (
        <div className='min-h-screen-safe w-full bg-[#111] flex flex-col font-sans transition-colors duration-300 overflow-x-hidden safe-x'>
            {/* Navigation */}
            <nav className='flex items-center justify-between px-4 xs:px-6 py-4 xs:py-5 md:px-12 md:py-6 max-w-7xl mx-auto w-full safe-top'>
                <div className='flex items-center gap-1.5 xs:gap-2 cursor-pointer shrink-0' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-1.5 xs:p-2 rounded-lg shadow-lg shadow-blue-600/20'>
                        <Video className='text-white w-5 h-5 xs:w-6 xs:h-6' />
                    </div>
                    <h1 className='text-xl xs:text-2xl font-bold tracking-tight text-white truncate'>TeamMeet</h1>
                </div>
                <div className='flex items-center gap-2 xs:gap-3'>
                    <button 
                        onClick={() => navigate("/")}
                        className='flex items-center gap-1.5 xs:gap-2 bg-white/5 text-white px-3 xs:px-5 py-2 xs:py-2.5 rounded-full text-[10px] xs:text-xs md:text-sm font-semibold hover:bg-white/10 transition-all border border-white/10 active:scale-95 shrink-0'
                    >
                        <Home className='w-3.5 h-3.5 xs:w-4 xs:h-4' />
                        <span className='hidden xs:inline'>Home</span>
                    </button>
                </div>
            </nav>

            <div className='flex-1 flex flex-col justify-center py-4 xs:py-6 px-3 sm:py-12 sm:px-6 lg:px-8 w-full'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <div className='bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20'>
                        <Video className='text-white w-7 h-7' />
                    </div>
                </div>
                <h2 className='mt-6 text-center text-3xl font-extrabold text-white tracking-tight'>
                    {isLogin ? 'Sign in to TeamMeet' : 'Create your account'}
                </h2>
                <p className='mt-2 text-center text-sm text-gray-400'>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className='font-bold text-blue-500 hover:text-blue-400 transition-colors'
                    >
                        {isLogin ? 'Sign up for free' : 'Log in now'}
                    </button>
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-[#1a1a1a]/80 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-white/10'
                >
                    <form className='space-y-4' onSubmit={handleSubmit}>
                        <AnimatePresence mode='wait'>
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label className='block text-sm font-semibold text-gray-300 mb-1.5'>Full Name</label>
                                    <div className='mt-1 relative'>
                                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                            <User className='h-5 w-5 text-gray-400' />
                                        </div>
                                        <input
                                            type='text'
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className='appearance-none block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/5 text-white text-sm'
                                            placeholder='Enter your name'
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <label className='block text-sm font-semibold text-gray-300 mb-1.5'>Email Address</label>
                                <div className='mt-1 relative'>
                                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                        <Mail className='h-5 w-5 text-gray-400' />
                                    </div>
                                    <input
                                        type='email'
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className='appearance-none block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/5 text-white text-sm'
                                        placeholder='you@example.com'
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label className='block text-sm font-semibold text-gray-300 mb-1.5'>{isLogin ? 'Username or Email' : 'Username'}</label>
                            <div className='mt-1 relative'>
                                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                    <User className='h-5 w-5 text-gray-400' />
                                </div>
                                <input
                                    type='text'
                                    required
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value)
                                        setShowUsernameValidation(true)
                                    }}
                                    onFocus={() => setShowUsernameValidation(true)}
                                    onBlur={() => { if (!username.trim()) setShowUsernameValidation(false) }}
                                    className='appearance-none block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/5 text-white text-sm'
                                    placeholder='username123'
                                />
                            </div>
                            
                            <AnimatePresence>
                                {showUsernameValidation && !isLogin && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className='mt-3 bg-blue-900/10 border border-blue-800/30 rounded-2xl p-4'
                                    >
                                        <h4 className='text-sm font-bold text-blue-400 mb-3'>Username Requirements</h4>
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${usernameRequirements.length ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {usernameRequirements.length ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${usernameRequirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                                                    3–20 characters long
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${usernameRequirements.validChars ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {usernameRequirements.validChars ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${usernameRequirements.validChars ? 'text-green-400' : 'text-gray-400'}`}>
                                                    Only letters, numbers, and underscores
                                                </span>
                                            </div>
                                        </div>
                                        <div className='mt-3 pt-3 border-t border-blue-800/30'>
                                            <p className='text-xs text-gray-500 font-medium'>Valid examples:</p>
                                            <p className='text-xs text-blue-400 mt-1'>art_lover, creative_mind, user123</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div>
                            <label className='block text-sm font-semibold text-gray-300 mb-1.5'>Password</label>
                            <div className='mt-1 relative'>
                                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                    <Lock className='h-5 w-5 text-gray-400' />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setShowPasswordValidation(true)
                                    }}
                                    onFocus={() => setShowPasswordValidation(true)}
                                    onBlur={() => { if (!password) setShowPasswordValidation(false) }}
                                    className='appearance-none block w-full pl-12 pr-12 py-3.5 border border-white/10 rounded-2xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/5 text-white text-sm'
                                    placeholder='••••••••'
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors'
                                >
                                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                                </button>
                            </div>
                            
                            <AnimatePresence>
                                {showPasswordValidation && !isLogin && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className='mt-3 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-blue-800/30 rounded-2xl p-4'
                                    >
                                        <h4 className='text-sm font-bold text-blue-400 mb-3'>Password Requirements</h4>
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRequirements.length ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {passwordRequirements.length ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${passwordRequirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                                                    At least 8 characters
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRequirements.uppercase ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {passwordRequirements.uppercase ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${passwordRequirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                                                    One uppercase letter
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRequirements.lowercase ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {passwordRequirements.lowercase ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${passwordRequirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                                                    One lowercase letter
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRequirements.number ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {passwordRequirements.number ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${passwordRequirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                                                    One number
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRequirements.special ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                                    {passwordRequirements.special ? '✓' : '○'}
                                                </div>
                                                <span className={`text-xs ${passwordRequirements.special ? 'text-green-400' : 'text-gray-400'}`}>
                                                    One special character (!@#$%^&*)
                                                </span>
                                            </div>
                                        </div>
                                        <div className='mt-3 pt-3 border-t border-blue-800/30'>
                                            <p className='text-xs text-gray-500 font-medium'>Example strong password:</p>
                                            <p className='text-xs text-blue-400 mt-1'>CreativeArt#2024</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className={`text-sm p-3 rounded-lg ${error.includes('successful') ? 'bg-green-900/10 text-green-600' : 'bg-red-900/10 text-red-600'}`}
                            >
                                {error}
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {TURNSTILE_REQUIRED ? (
                                <motion.div
                                    key="turnstile"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div
                                        ref={turnstileWidgetRef}
                                        className="w-full flex justify-center"
                                    />
                                    {turnstileVerified && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2 text-xs text-green-400 font-semibold"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verified you are human
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <div>
                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group'
                            >
                                {loading ? (
                                    <Loader2 className='w-5 h-5 animate-spin' />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign in' : 'Create account'}
                                        <ArrowRight className='ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform' />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className='mt-6'>
                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-white/10'></div>
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-2 bg-[#1a1a1a] text-gray-500'>Secure Access</span>
                            </div>
                        </div>
                    </div>

                    <div className='mt-6'>
                        <button
                            type='button'
                            onClick={() => setShowSupportModal(true)}
                            className='w-full flex items-center gap-3 p-4 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl transition-all duration-300 group active:scale-[0.98]'
                        >
                            <div className='w-12 h-12 shrink-0 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform'>
                                <Headphones className='w-6 h-6' />
                            </div>
                            <div className='flex-1 text-left'>
                                <p className='text-white font-black text-lg'>Need help?</p>
                                <p className='text-blue-400 font-bold text-sm mt-0.5'>Support Center</p>
                            </div>
                            <ArrowRight className='w-5 h-5 text-blue-400/60 group-hover:text-blue-400 group-hover:translate-x-1 transition-all' />
                        </button>
                    </div>
                </motion.div>
            </div>
            </div>

            {/* Footer */}
            <footer className='py-8 px-6 md:px-12 bg-[#0d0d0d] border-t border-white/5 mt-auto relative overflow-hidden'>
                {/* Decorative background element */}
                <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent' />
                
                <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10'>
                    <div className='flex flex-col items-center md:items-start gap-4'>
                        <div className='flex items-center gap-2.5 group cursor-pointer' onClick={() => navigate("/")}>
                            <div className='bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform'>
                                <Video className='text-white w-5 h-5' />
                            </div>
                            <h1 className='text-xl font-black tracking-tight text-white'>TeamMeet</h1>
                        </div>
                        <p className='text-gray-500 text-xs max-w-[200px] text-center md:text-left leading-relaxed'>
                            Secure, high-quality video conferencing for everyone, everywhere.
                        </p>
                    </div>
                    
                    <div className='flex flex-col items-center gap-6'>
                        <div className='flex gap-4'>
                            {[
                                { icon: <X className='w-5 h-5' />, url: 'https://x.com/saketraj235', label: 'Twitter' },
                                { icon: <Github className='w-5 h-5' />, url: 'https://github.com/Saketraj234', label: 'GitHub' },
                                { icon: <Linkedin className='w-5 h-5' />, url: 'https://www.linkedin.com/in/saket-raj62/', label: 'LinkedIn' }
                            ].map((social, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => window.open(social.url)} 
                                    className='p-3 bg-white/5 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300 border border-white/5 shadow-xl'
                                    title={social.label}
                                >
                                    {social.icon}
                                </button>
                            ))}
                        </div>
                        <div className='flex items-center gap-6 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest'>
                            <span onClick={() => setShowPrivacyModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Privacy</span>
                            <span onClick={() => setShowTermsModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Terms</span>
                            <span onClick={() => setShowSupportModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Support</span>
                            <span onClick={() => setShowContactModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Contact</span>
                        </div>
                    </div>

                    <div className='flex flex-col items-center md:items-end gap-2'>
                        <p className='text-gray-400 text-sm font-bold'>© 2026 TeamMeet Inc.</p>
                    </div>
                </div>
            </footer>

            {/* Privacy Policy Modal */}
            <AnimatePresence>
                {showPrivacyModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3 text-white'>
                                    <Shield className='text-blue-600 w-8 h-8' />
                                    Your Privacy, Our Priority
                                </h3>
                                <button onClick={() => setShowPrivacyModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-400'>
                                <p className='text-base leading-relaxed'>
                                    At TeamMeet, protecting your privacy is at the core of everything we do. We are committed to maintaining the confidentiality, integrity, and security of your information.
                                </p>
                                <p className='text-base leading-relaxed'>
                                    We collect only the data necessary to provide reliable video conferencing services, improve platform performance, and enhance your overall experience. Your personal information is never sold, rented, or shared with third parties for advertising purposes.
                                </p>
                                <p className='text-base leading-relaxed'>
                                    All communications are protected using modern security practices designed to safeguard your data.
                                </p>
                                <p className='text-base leading-relaxed'>
                                    By continuing to use TeamMeet, you agree to the terms outlined in this Privacy Policy.
                                </p>
                            </div>

                            <div className='pt-8 border-t border-white/5'>
                                <button 
                                    onClick={() => setShowPrivacyModal(false)}
                                    className='w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg'
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Terms of Service Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3 text-white'>
                                    <Users className='text-blue-600 w-8 h-8' />
                                    Simple Rules for a Better Meeting Experience
                                </h3>
                                <button onClick={() => setShowTermsModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-400'>
                                <p className='text-base leading-relaxed'>
                                    By using TeamMeet, you agree to use the platform responsibly and respectfully.
                                </p>
                                
                                <div>
                                    <h4 className='font-bold text-white mb-3'>Users may not:</h4>
                                    <ul className='space-y-2 ml-5 list-disc'>
                                        <li>Engage in illegal or harmful activities.</li>
                                        <li>Attempt unauthorized access to accounts or systems.</li>
                                        <li>Disrupt meetings or misuse platform features.</li>
                                        <li>Upload malicious content or software.</li>
                                    </ul>
                                </div>

                                <p className='text-base leading-relaxed'>
                                    TeamMeet reserves the right to restrict or terminate access for users who violate these terms.
                                </p>

                                <p className='text-base leading-relaxed'>
                                    Our goal is to provide a safe, reliable, and professional collaboration environment for everyone.
                                </p>
                            </div>

                            <div className='pt-8 border-t border-white/5'>
                                <button 
                                    onClick={() => setShowTermsModal(false)}
                                    className='w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg'
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Support Modal */}
            <AnimatePresence>
                {showSupportModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3 text-white'>
                                    <Headphones className='text-blue-600 w-8 h-8' />
                                    Support Center
                                </h3>
                                <button onClick={() => setShowSupportModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-400'>
                                <p className='text-base leading-relaxed'>
                                    Our support team is dedicated to helping you get the most out of TeamMeet.
                                </p>
                                <p className='text-base leading-relaxed'>
                                    Whether you're having trouble signing in, creating a new account, or experiencing technical issues, we're here to help.
                                </p>

                                <div className='space-y-3 pt-2'>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            window.open('https://wa.me/919729169872?text=' + encodeURIComponent(isLogin ? 'Hi TeamMeet, I need help with Login/Sign in to my account.' : 'Hi TeamMeet, I need help with creating/Registering a new account.'), '_blank')
                                            setShowSupportModal(false)
                                        }}
                                        className='w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-green-600/10 border border-white/10 hover:border-green-500/30 rounded-2xl transition-all duration-300 group active:scale-[0.98] text-left'
                                    >
                                        <div className='w-12 h-12 shrink-0 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform'>
                                            <MessageCircle className='w-6 h-6' />
                                        </div>
                                        <div className='flex-1'>
                                            <p className='text-white font-bold'>WhatsApp Support (Fast Reply)</p>
                                            <p className='text-gray-400 text-sm mt-0.5'>+91 97291 69872 · Reply within minutes</p>
                                        </div>
                                        <ArrowRight className='w-5 h-5 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all' />
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => {
                                            window.location.href = 'mailto:teammeet756@gmail.com?subject=' + encodeURIComponent(isLogin ? 'Login Help Required - TeamMeet' : 'Registration Help Required - TeamMeet') + '&body=' + encodeURIComponent('Hi TeamMeet Team,%0D%0A%0D%0AI am facing issues with ' + (isLogin ? 'signing in to my account' : 'creating a new account') + '. Please help me resolve this.%0D%0A%0D%0AThanks!')
                                            setShowSupportModal(false)
                                        }}
                                        className='w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-blue-600/10 border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all duration-300 group active:scale-[0.98] text-left'
                                    >
                                        <div className='w-12 h-12 shrink-0 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform'>
                                            <Mail className='w-6 h-6' />
                                        </div>
                                        <div className='flex-1'>
                                            <p className='text-white font-bold'>Email Support Team</p>
                                            <p className='text-gray-400 text-sm mt-0.5'>teammeet756@gmail.com</p>
                                        </div>
                                        <ArrowRight className='w-5 h-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all' />
                                    </button>
                                </div>

                                <div className='bg-blue-900/10 p-6 rounded-2xl border border-blue-800/30'>
                                    <h4 className='font-bold text-white mb-4'>We can help you with:</h4>
                                    <ul className='space-y-2 ml-5 list-disc'>
                                        <li>Sign in / Login issues</li>
                                        <li>Account registration problems</li>
                                        <li>Username or email recovery</li>
                                        <li>Password reset assistance</li>
                                        <li>Meeting access & permissions</li>
                                        <li>Audio, video, or connection issues</li>
                                    </ul>
                                </div>
                            </div>

                            <div className='pt-8 border-t border-white/5'>
                                <button 
                                    onClick={() => setShowSupportModal(false)}
                                    className='w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg'
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Contact Us Modal */}
            <AnimatePresence>
                {showContactModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3 text-white'>
                                    <Mail className='text-blue-600 w-8 h-8' />
                                    We're here to help
                                </h3>
                                <button onClick={() => setShowContactModal(false)} className='p-2 hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>

                            <div className='space-y-8 text-gray-400'>
                                <p className='text-xl font-bold text-white'>
                                    We're here to help with any questions, feedback, or support requests.
                                </p>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='bg-blue-900/10 p-6 rounded-2xl border border-blue-800/30'>
                                        <h4 className='font-bold text-white mb-2'>Email</h4>
                                        <p className='text-blue-600 text-lg font-semibold'>teammeet756@gmail.com</p>
                                    </div>

                                    <div className='bg-purple-900/10 p-6 rounded-2xl border border-purple-800/30'>
                                        <h4 className='font-bold text-white mb-2'>Support Hours</h4>
                                        <p className='text-base'>Monday – Saturday</p>
                                        <p className='text-base font-semibold'>9:00 AM – 8:00 PM (IST)</p>
                                    </div>
                                </div>

                                <div className='bg-white/5 p-6 rounded-2xl border border-white/10'>
                                    <h4 className='font-bold text-white mb-2'>Response Time</h4>
                                    <p className='text-base'>We typically respond within 24 hours.</p>
                                </div>

                                <p className='text-base leading-relaxed'>
                                    Thank you for choosing TeamMeet. We look forward to assisting you.
                                </p>
                            </div>

                            <div className='pt-8 border-t border-white/5'>
                                <button 
                                    onClick={() => setShowContactModal(false)}
                                    className='w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg'
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
