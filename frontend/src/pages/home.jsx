import React, { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
    Video, Plus, Keyboard, History, LogOut, Sun, Moon, Calendar, User, 
    Sparkles, Shield, Users, X, Square as WhiteboardIcon, Mail, Github, Linkedin, 
    Bot, Send 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import withAuth from '../utils/withAuth'

function HomeComponent() {
    const navigate = useNavigate()
    const [meetingCode, setMeetingCode] = useState("")
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showLearnMore, setShowLearnMore] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showAiMentorModal, setShowAiMentorModal] = useState(false)
    const [aiMessages, setAiMessages] = useState([
        { id: 1, role: "assistant", content: "👋 Hello! I'm TeamMeet AI Mentor, your personal assistant for all things TeamMeet! I can help you with:\n\n• 📹 Starting and joining meetings\n• 🔧 Troubleshooting audio/video issues\n• 📅 Scheduling future meetings\n• 💡 Learning about TeamMeet features\n\nHow can I assist you today?" }
    ])
    const [aiInput, setAiInput] = useState("")
    const [isAiTyping, setIsAiTyping] = useState(false)
    const chatContainerRef = useRef(null)
    const [scheduleDate, setScheduleDate] = useState("")
    const [scheduleTime, setScheduleTime] = useState("")
    const { addToUserHistory, userData } = useContext(AuthContext)
    const { isDark, toggleTheme } = useTheme()

    const [greeting, setGreeting] = useState("")

    React.useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours()
            if (hour < 12) setGreeting("Good Morning")
            else if (hour < 18) setGreeting("Good Afternoon")
            else setGreeting("Good Evening")
        }
        updateGreeting()
        const interval = setInterval(updateGreeting, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    const handleJoinMeeting = async () => {
        if (meetingCode.trim()) {
            await addToUserHistory(meetingCode)
            navigate(`/${meetingCode}`)
        }
    }

    const handleCreateMeeting = () => {
        setShowCreateModal(true)
    }

    const confirmCreate = async () => {
        const code = Math.random().toString(36).substring(2, 12)
        await addToUserHistory(code)
        setShowCreateModal(false)
        navigate(`/${code}`, { state: { fromCreate: true } })
    }

    const handleScheduleMeeting = async (e) => {
        e.preventDefault()
        const code = Math.random().toString(36).substring(2, 12)
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`)
        await addToUserHistory(code, scheduledAt)
        setShowScheduleModal(false)
        alert(`Meeting scheduled for ${scheduledAt.toLocaleString()}. Meeting code: ${code}`)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/auth")
    }

    const handleSendAiMessage = async (e) => {
        e.preventDefault()
        if (!aiInput.trim()) return
        
        // Add user message
        const userMessage = { id: Date.now(), role: "user", content: aiInput }
        setAiMessages(prev => [...prev, userMessage])
        setAiInput("")
        setIsAiTyping(true)

        try {
            // --- CALL BACKEND API ---
            const response = await fetch(`${process.env.NODE_ENV === "production" ? "https://teem-meet-backend.onrender.com" : "http://localhost:8000"}/api/v1/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: aiMessages })
            })
            const data = await response.json()
            
            if (data.success) {
                const aiMessage = { id: Date.now() + 1, role: "assistant", content: data.content }
                setAiMessages(prev => [...prev, aiMessage])
            } else {
                throw new Error(data.message || "Backend error")
            }
        } catch (error) {
            console.error("AI Error:", error)
            const errorMessage = { id: Date.now() + 1, role: "assistant", content: "Sorry, I'm having trouble responding right now. Please check if backend server is running and try again!" }
            setAiMessages(prev => [...prev, errorMessage])
        } finally {
            setIsAiTyping(false)
        }
    }

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [aiMessages, isAiTyping])

    return (
        <div className='min-h-screen bg-white dark:bg-[#111] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300'>
            {/* Header */}
            <nav className='flex items-center justify-between px-4 py-4 md:px-12 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#111] z-40'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-1.5 rounded-lg shrink-0'>
                        <Video className='text-white w-5 h-5' />
                    </div>
                    <h1 className='text-lg md:text-xl font-bold tracking-tight truncate'>TeamMeet</h1>
                </div>
                
                <div className='flex items-center gap-1 md:gap-4'>
                    <button 
                        onClick={() => setShowAiMentorModal(true)}
                        className='p-2 text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors'
                        title="TeamMeet AI Mentor"
                    >
                        <Bot className='w-4 h-4 md:w-5 md:h-5' />
                    </button>
                    <button 
                        onClick={toggleTheme}
                        className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors'
                        title={isDark ? "Light Mode" : "Dark Mode"}
                    >
                        {isDark ? <Sun className='w-4 h-4 md:w-5 md:h-5' /> : <Moon className='w-4 h-4 md:w-5 md:h-5' />}
                    </button>
                    <button 
                        onClick={() => navigate("/history")}
                        className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors'
                        title="Meeting History"
                    >
                        <History className='w-4 h-4 md:w-5 md:h-5' />
                    </button>
                    <button 
                        onClick={() => navigate("/profile")}
                        className='p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center'
                        title="Profile Settings"
                    >
                        {userData?.profileImg ? (
                            <img src={userData.profileImg} alt="Profile" className='w-6 h-6 md:w-7 md:h-7 rounded-full object-cover' />
                        ) : (
                            <div className='w-6 h-6 md:w-7 md:h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold'>
                                <User className='w-3 h-3 md:w-4 md:h-4' />
                            </div>
                        )}
                    </button>
                    <div className='h-6 md:h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-1 md:mx-4' />
                    <button 
                        onClick={handleLogout}
                        className='flex items-center gap-1 md:gap-3 px-2 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors'
                    >
                        <LogOut className='w-3.5 h-3.5 md:w-4 md:h-4' />
                        <span className='hidden sm:inline'>Logout</span>
                    </button>
                </div>
            </nav>

            <main className='max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-24 flex flex-col lg:flex-row items-center gap-12 md:gap-16'>
                <div className='flex-1 space-y-8 md:space-y-10 text-center lg:text-left'>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className='mb-6 flex items-center gap-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-full w-fit mx-auto lg:mx-0 text-sm font-bold border border-blue-500/20'>
                            <Sparkles className='w-4 h-4 animate-spin-slow' />
                            <span>{greeting}, {userData?.name || "User"}</span>
                        </div>
                        <h2 className='text-4xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight'>
                            Premium video <br className='hidden md:block' />
                            meetings for <span className='text-blue-600'>everyone.</span>
                        </h2>
                        <p className='text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed'>
                            TeamMeet provides secure, high-quality video conferencing. Connect with your team from anywhere, on any device.
                        </p>
                    </motion.div>

                    <div className='flex flex-col sm:flex-row items-stretch lg:items-center gap-4'>
                        <button 
                            onClick={handleCreateMeeting}
                            className='flex-1 sm:flex-none flex items-center justify-center gap-2.5 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95'
                        >
                            <Plus className='w-4 h-4' />
                            New Meeting
                        </button>

                        <div className='flex-1 flex flex-col sm:flex-row gap-3'>
                            <div className='flex-1 flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus-within:border-blue-600/50 dark:focus-within:border-blue-500/50 rounded-xl px-4 py-2 transition-all shadow-sm'>
                                <Keyboard className='w-4 h-4 text-gray-400 shrink-0' />
                                <input 
                                    type="text" 
                                    placeholder="Enter meeting code"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    className='bg-transparent border-none outline-none py-2 w-full text-sm font-bold dark:text-white placeholder-gray-400'
                                />
                            </div>

                            <button 
                                disabled={!meetingCode.trim()}
                                onClick={handleJoinMeeting}
                                className='px-6 py-3.5 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 font-bold rounded-xl border-2 border-blue-600/20 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all disabled:opacity-30 disabled:grayscale active:scale-95'
                            >
                                Join
                            </button>
                        </div>
                    </div>

                    <div className='pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-center lg:justify-start gap-4'>
                        <div className='flex -space-x-2'>
                            {[1, 2, 3].map(i => (
                                <div key={i} className='w-8 h-8 rounded-full border-2 border-white dark:border-[#111] bg-gray-200 overflow-hidden'>
                                    <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="" />
                                </div>
                            ))}
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 font-medium'>
                            <span onClick={() => setShowLearnMore(true)} className='text-blue-600 hover:underline cursor-pointer font-bold'>Learn more</span> about TeamMeet
                        </p>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='flex-1 w-full max-w-lg lg:max-w-none'
                >
                    <div className='relative group'>
                        <div className='bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/[0.02] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 aspect-square flex items-center justify-center overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 relative'>
                            {/* Decorative Blobs */}
                            <div className='absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl' />
                            <div className='absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl' />
                            
                            <div className='relative z-10 text-center space-y-6'>
                                <div className='w-20 h-20 md:w-28 md:h-28 bg-white dark:bg-[#1a1a1a] rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border border-gray-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-500'>
                                    <Video className='w-10 h-10 md:w-14 md:h-14 text-blue-600' />
                                </div>
                                <div className='space-y-2'>
                                    <h3 className='text-xl md:text-2xl font-black'>Your meeting is safe</h3>
                                    <p className='text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-[200px] md:max-w-[250px] mx-auto leading-relaxed'>No one can join a meeting unless invited or admitted by the host.</p>
                                </div>
                            </div>
                            
                            {/* Floating User Avatars */}
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className='absolute top-12 left-12 w-12 h-12 md:w-16 md:h-16 rounded-2xl border-4 border-white dark:border-[#1a1a1a] shadow-2xl overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=1" alt="" />
                            </motion.div>
                            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} className='absolute bottom-20 right-12 w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 border-white dark:border-[#1a1a1a] shadow-2xl overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=2" alt="" />
                            </motion.div>
                            <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} className='absolute top-24 right-16 w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-white dark:border-[#1a1a1a] shadow-2xl overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=3" alt="" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </main>

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
                        </div>
                    </div>

                    <div className='flex flex-col items-center md:items-end gap-2'>
                        <p className='text-gray-400 text-sm font-bold'>© 2026 TeamMeet Inc.</p>
                        <p className='text-gray-600 text-[10px] uppercase tracking-tighter'>Made with ❤️ for the community</p>
                    </div>
                </div>
            </footer>

            {/* Create Meeting Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-sm md:max-w-md rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-white/5 text-center'
                        >
                            <div className='w-16 h-16 md:w-20 md:h-20 bg-blue-600/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6'>
                                <Plus className='w-8 h-8 md:w-10 md:h-10 text-blue-600' />
                            </div>
                            <h3 className='text-xl md:text-2xl font-bold mb-2 md:mb-4'>Create New Meeting?</h3>
                            <p className='text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6 md:mb-8'>Do you want to start a new instant video meeting? You'll be the host of this session.</p>
                            <div className='flex flex-col sm:flex-row gap-3 md:gap-4'>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className='flex-1 py-3 md:py-4 border border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all order-2 sm:order-1'
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmCreate}
                                    className='flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 order-1 sm:order-2'
                                >
                                    Yes, Create
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Schedule Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-sm md:max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-white/5'
                        >
                            <h3 className='text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-3'>
                                <Calendar className='text-blue-600 w-5 h-5 md:w-6 md:h-6' />
                                Schedule Meeting
                            </h3>
                            <form onSubmit={handleScheduleMeeting} className='space-y-4 md:space-y-6'>
                                <div>
                                    <label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2'>Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className='w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:border-blue-600 transition-all dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2'>Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className='w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:border-blue-600 transition-all dark:text-white'
                                    />
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3 pt-2 md:pt-4'>
                                    <button 
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className='flex-1 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all order-2 sm:order-1'
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className='flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 order-1 sm:order-2'
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Learn More Modal */}
            <AnimatePresence>
                {showLearnMore && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3'>
                                    <Sparkles className='text-blue-600 w-8 h-8' />
                                    About TeamMeet
                                </h3>
                                <button onClick={() => setShowLearnMore(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-8'>
                                <section className='space-y-4'>
                                    <h4 className='text-xl font-bold text-blue-600'>Our Mission</h4>
                                    <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>
                                        TeamMeet was built with a simple goal: to provide high-quality, secure, and accessible video conferencing for everyone. Whether you're hosting a professional business meeting or catching up with friends, we ensure a seamless experience.
                                    </p>
                                </section>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5'>
                                        <Shield className='w-8 h-8 text-green-500 mb-4' />
                                        <h5 className='font-bold mb-2'>Secure by Design</h5>
                                        <p className='text-sm text-gray-500'>End-to-end encryption and robust host controls keep your meetings private and safe.</p>
                                    </div>
                                    <div className='p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5'>
                                        <Users className='w-8 h-8 text-blue-500 mb-4' />
                                        <h5 className='font-bold mb-2'>100+ Participants</h5>
                                        <p className='text-sm text-gray-500'>Host large-scale meetings without compromising on video or audio quality.</p>
                                    </div>
                                    <div className='p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5'>
                                        <WhiteboardIcon className='w-8 h-8 text-purple-500 mb-4' />
                                        <h5 className='font-bold mb-2'>Interactive Tools</h5>
                                        <p className='text-sm text-gray-500'>Built-in collaborative whiteboard, chat, and screen sharing to enhance productivity.</p>
                                    </div>
                                    <div className='p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5'>
                                        <Calendar className='w-8 h-8 text-orange-500 mb-4' />
                                        <h5 className='font-bold mb-2'>Smart Scheduling</h5>
                                        <p className='text-sm text-gray-500'>Easily schedule future meetings and manage your history with our intuitive dashboard.</p>
                                    </div>
                                </div>

                                <section className='pt-6 border-t border-gray-100 dark:border-white/5'>
                                    <button 
                                        onClick={() => setShowLearnMore(false)}
                                        className='w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg'
                                    >
                                        Got it, thanks!
                                    </button>
                                </section>
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
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3'>
                                    <Mail className='text-blue-600 w-8 h-8' />
                                    We're here to help
                                </h3>
                                <button onClick={() => setShowContactModal(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>

                            <div className='space-y-8 text-gray-600 dark:text-gray-400'>
                                <p className='text-xl font-bold text-gray-900 dark:text-white'>
                                    We're here to help with any questions, feedback, or support requests.
                                </p>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/30'>
                                        <h4 className='font-bold text-gray-900 dark:text-white mb-2'>Email</h4>
                                        <p className='text-blue-600 text-lg font-semibold'>contact@teammeet.com</p>
                                    </div>

                                    <div className='bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-200 dark:border-purple-800/30'>
                                        <h4 className='font-bold text-gray-900 dark:text-white mb-2'>Support Hours</h4>
                                        <p className='text-base'>Monday – Saturday</p>
                                        <p className='text-base font-semibold'>9:00 AM – 8:00 PM (IST)</p>
                                    </div>
                                </div>

                                <div className='bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10'>
                                    <h4 className='font-bold text-gray-900 dark:text-white mb-2'>Response Time</h4>
                                    <p className='text-base'>We typically respond within 24 hours.</p>
                                </div>

                                <p className='text-base leading-relaxed'>
                                    Thank you for choosing TeamMeet. We look forward to assisting you.
                                </p>
                            </div>

                            <div className='pt-8 border-t border-gray-100 dark:border-white/5'>
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

            {/* Privacy Policy Modal */}
            <AnimatePresence>
                {showPrivacyModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3'>
                                    <Shield className='text-blue-600 w-8 h-8' />
                                    Your Privacy, Our Priority
                                </h3>
                                <button onClick={() => setShowPrivacyModal(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-600 dark:text-gray-400'>
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

                            <div className='pt-8 border-t border-gray-100 dark:border-white/5'>
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
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3'>
                                    <Users className='text-blue-600 w-8 h-8' />
                                    Simple Rules for a Better Meeting Experience
                                </h3>
                                <button onClick={() => setShowTermsModal(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-600 dark:text-gray-400'>
                                <p className='text-base leading-relaxed'>
                                    By using TeamMeet, you agree to use the platform responsibly and respectfully.
                                </p>
                                
                                <div>
                                    <h4 className='font-bold text-gray-900 dark:text-white mb-3'>Users may not:</h4>
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

                            <div className='pt-8 border-t border-gray-100 dark:border-white/5'>
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
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar'
                        >
                            <div className='flex justify-between items-center mb-8'>
                                <h3 className='text-3xl font-black flex items-center gap-3'>
                                    <Mail className='text-blue-600 w-8 h-8' />
                                    Need Assistance?
                                </h3>
                                <button onClick={() => setShowSupportModal(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>
                            
                            <div className='space-y-6 text-gray-600 dark:text-gray-400'>
                                <p className='text-base leading-relaxed'>
                                    Our support team is dedicated to helping you get the most out of TeamMeet.
                                </p>
                                <p className='text-base leading-relaxed'>
                                    Whether you're experiencing technical issues, having trouble joining a meeting, or need help with your account, we're here to assist.
                                </p>

                                <div className='bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/30'>
                                    <h4 className='font-bold text-gray-900 dark:text-white mb-4'>Popular Topics</h4>
                                    <ul className='space-y-2 ml-5 list-disc'>
                                        <li>Joining a Meeting</li>
                                        <li>Audio & Microphone Issues</li>
                                        <li>Camera Troubleshooting</li>
                                        <li>Connection Problems</li>
                                        <li>Meeting Access & Permissions</li>
                                    </ul>
                                </div>

                                <div className='pt-4'>
                                    <p className='text-base leading-relaxed'>
                                        For additional support, please contact our team.
                                    </p>
                                    <p className='text-blue-600 font-bold text-lg mt-2'>support@teammeet.com</p>
                                </div>
                            </div>

                            <div className='pt-8 border-t border-gray-100 dark:border-white/5'>
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

            {/* AI Mentor Modal */}
            <AnimatePresence>
                {showAiMentorModal && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-md md:max-w-lg h-[80vh] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden'
                        >
                            {/* Modal Header */}
                            <div className='flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-white/10'>
                                <h3 className='text-xl md:text-2xl font-black flex items-center gap-3'>
                                    <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl'>
                                        <Bot className='text-white w-6 h-6' />
                                    </div>
                                    AI Mentor
                                </h3>
                                <button onClick={() => setShowAiMentorModal(false)} className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all'>
                                    <X className='w-6 h-6 text-gray-400' />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div 
                                ref={chatContainerRef}
                                className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar'
                            >
                                {aiMessages.map((msg) => (
                                    <div 
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shrink-0'>
                                                <Bot className='text-white w-4 h-4' />
                                            </div>
                                        )}
                                        <div 
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base whitespace-pre-line ${
                                                msg.role === "user" 
                                                    ? "bg-blue-600 text-white rounded-tr-sm" 
                                                    : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className='w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0'>
                                                <User className='text-gray-600 dark:text-gray-300 w-4 h-4' />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isAiTyping && (
                                    <div className='flex gap-3'>
                                        <div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shrink-0'>
                                            <Bot className='text-white w-4 h-4' />
                                        </div>
                                        <div className='bg-gray-100 dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3'>
                                            <div className='flex gap-1'>
                                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: "0ms" }}></div>
                                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: "150ms" }}></div>
                                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: "300ms" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className='p-4 md:p-6 border-t border-gray-100 dark:border-white/10'>
                                <form onSubmit={handleSendAiMessage} className='flex gap-3'>
                                    <input 
                                        type="text"
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        placeholder="Ask TeamMeet AI Mentor..."
                                        className='flex-1 bg-gray-100 dark:bg-white/5 border-none outline-none rounded-xl px-4 py-3 text-sm md:text-base dark:text-white placeholder-gray-500'
                                        disabled={isAiTyping}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!aiInput.trim() || isAiTyping}
                                        className='bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        <Send className='w-5 h-5' />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(HomeComponent)
