import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
    Video, Plus, Keyboard, History, LogOut, Sun, Moon, Calendar, User, 
    Sparkles, Shield, Users, X, Square as WhiteboardIcon 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import withAuth from '../utils/withAuth'

function HomeComponent() {
    const navigate = useNavigate()
    const [meetingCode, setMeetingCode] = useState("")
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showLearnMore, setShowLearnMore] = useState(false)
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
                            className='flex-1 sm:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/25 active:scale-95'
                        >
                            <Plus className='w-5 h-5' />
                            New Meeting
                        </button>

                        <div className='flex-1 flex flex-col sm:flex-row gap-3'>
                            <div className='flex-1 flex items-center gap-3 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus-within:border-blue-600/50 dark:focus-within:border-blue-500/50 rounded-2xl px-4 py-1 transition-all shadow-sm'>
                                <Keyboard className='w-5 h-5 text-gray-400 shrink-0' />
                                <input 
                                    type="text" 
                                    placeholder="Enter meeting code"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    className='bg-transparent border-none outline-none py-3 w-full text-sm font-bold dark:text-white placeholder-gray-400'
                                />
                            </div>

                            <button 
                                disabled={!meetingCode.trim()}
                                onClick={handleJoinMeeting}
                                className='px-8 py-4 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 font-black rounded-2xl border-2 border-blue-600/20 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all disabled:opacity-30 disabled:grayscale active:scale-95'
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
            <footer className='border-t border-gray-100 dark:border-white/5 py-12 bg-gray-50 dark:bg-black/20 mt-12'>
                <div className='max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8'>
                    <div className='flex items-center gap-2'>
                        <div className='bg-blue-600 p-1.5 rounded-lg'>
                            <Video className='text-white w-4 h-4' />
                        </div>
                        <span className='font-bold text-lg'>TeamMeet</span>
                    </div>
                    
                    <div className='flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400'>
                        <span className='hover:text-blue-600 cursor-pointer transition-colors'>Privacy Policy</span>
                        <span className='hover:text-blue-600 cursor-pointer transition-colors'>Terms of Service</span>
                        <span className='hover:text-blue-600 cursor-pointer transition-colors'>Support</span>
                        <span className='hover:text-blue-600 cursor-pointer transition-colors'>Contact Us</span>
                    </div>

                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        © 2026 TeamMeet Inc. All rights reserved.
                    </p>
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
        </div>
    )
}

export default withAuth(HomeComponent)
