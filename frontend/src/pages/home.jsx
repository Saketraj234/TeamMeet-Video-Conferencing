import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Video, Plus, Keyboard, History, LogOut, Sun, Moon, Calendar, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { UserButton, useUser } from '@clerk/clerk-react'

function HomeComponent() {
    const navigate = useNavigate()
    const { user } = useUser()
    const [meetingCode, setMeetingCode] = useState("")
    // ... rest of state remains same
    const { addToUserHistory } = useContext(AuthContext)
    const { isDark, toggleTheme } = useTheme()

    // Replace userData?.name with user?.fullName
    const userName = user?.fullName || user?.firstName || "User"

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 18) return "Good Afternoon"
        return "Good Evening"
    }

    const handleJoinMeeting = async () => {
        if (meetingCode.trim()) {
            if (typeof addToUserHistory === 'function') {
                await addToUserHistory(meetingCode)
            }
            navigate(`/${meetingCode}`)
        }
    }

    const handleCreateMeeting = () => {
        setShowCreateModal(true)
    }

    const confirmCreate = async () => {
        const code = Math.random().toString(36).substring(2, 12)
        // Check if addToUserHistory exists and is a function
        if (typeof addToUserHistory === 'function') {
            await addToUserHistory(code)
        }
        setShowCreateModal(false)
        navigate(`/${code}`, { state: { fromCreate: true } })
    }

    const handleScheduleMeeting = async (e) => {
        e.preventDefault()
        const code = Math.random().toString(36).substring(2, 12)
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`)
        // Add to history with schedule
        if (typeof addToUserHistory === 'function') {
            await addToUserHistory(code, scheduledAt)
        }
        setShowScheduleModal(false)
        alert(`Meeting scheduled for ${scheduledAt.toLocaleString()}. Meeting code: ${code}`)
    }

    const handleLogout = () => {
        // Use Clerk sign out if needed, or just let UserButton handle it
        localStorage.removeItem("token")
        navigate("/auth")
    }

    return (
        <div className='min-h-screen bg-white dark:bg-[#111] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300'>
            {/* Header */}
            <nav className='flex items-center justify-between px-6 py-4 md:px-12 border-b border-gray-100 dark:border-white/5'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-1.5 rounded-lg'>
                        <Video className='text-white w-5 h-5' />
                    </div>
                    <h1 className='text-xl font-bold tracking-tight'>TeamMeet</h1>
                </div>
                
                <div className='flex items-center gap-4'>
                    <button 
                        onClick={toggleTheme}
                        className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors'
                        title={isDark ? "Light Mode" : "Dark Mode"}
                    >
                        {isDark ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
                    </button>
                    <button 
                        onClick={() => navigate("/history")}
                        className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors'
                        title="Meeting History"
                    >
                        <History className='w-5 h-5' />
                    </button>
                    
                    <div className='flex items-center gap-3 ml-2'>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            <main className='max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24 flex flex-col md:flex-row items-center gap-16'>
                <div className='flex-1 space-y-10'>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className='mb-4 flex items-center gap-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full w-fit text-sm font-bold animate-pulse'>
                            <span>👋</span> {getGreeting()}, {userName}
                        </div>
                        <h2 className='text-4xl md:text-5xl font-bold leading-tight mb-6'>
                            Premium video meetings. <br />
                            Now free for everyone.
                        </h2>
                        <p className='text-lg text-gray-500 dark:text-gray-400 max-w-lg'>
                            We re-engineered the service we built for secure business meetings, TeamMeet, to make it free and available for all.
                        </p>
                    </motion.div>

                    <div className='flex flex-col sm:flex-row items-center gap-4'>
                        <button 
                            onClick={handleCreateMeeting}
                            className='w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl'
                        >
                            <Plus className='w-5 h-5' />
                            New Meeting
                        </button>

                        <button 
                            onClick={() => setShowScheduleModal(true)}
                            className='w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-white/5 text-blue-600 border border-blue-600 px-6 py-3.5 rounded-lg font-bold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all'
                        >
                            <Calendar className='w-5 h-5' />
                            Schedule
                        </button>

                        <div className='w-full sm:w-auto flex items-center gap-2 bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-3 py-1 focus-within:border-blue-600 transition-colors'>
                            <Keyboard className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                            <input 
                                type="text" 
                                placeholder="Enter a code or link"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className='bg-transparent border-none outline-none py-2 w-full sm:w-48 text-sm font-medium dark:text-white'
                            />
                        </div>

                        <button 
                            disabled={!meetingCode.trim()}
                            onClick={handleJoinMeeting}
                            className='w-full sm:w-auto text-blue-600 font-bold px-4 py-2 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors'
                        >
                            Join
                        </button>
                    </div>

                    <div className='pt-8 border-t border-gray-100 dark:border-white/5'>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            <span className='text-blue-600 hover:underline cursor-pointer'>Learn more</span> about TeamMeet
                        </p>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='flex-1'
                >
                    <div className='relative'>
                        <div className='bg-gray-100 dark:bg-white/5 rounded-[2.5rem] p-8 aspect-square flex items-center justify-center overflow-hidden shadow-inner border border-gray-200 dark:border-white/10'>
                            <div className='relative z-10 text-center space-y-6'>
                                <div className='w-24 h-24 bg-white dark:bg-[#222] rounded-full flex items-center justify-center mx-auto shadow-md border border-gray-100 dark:border-white/5'>
                                    <Video className='w-12 h-12 text-blue-600' />
                                </div>
                                <div>
                                    <h3 className='text-xl font-bold'>Your meeting is safe</h3>
                                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[200px]'>No one can join a meeting unless invited or admitted by the host.</p>
                                </div>
                            </div>
                            {/* Floating decorative avatars */}
                            <div className='absolute top-12 left-12 w-12 h-12 rounded-full border-2 border-white dark:border-white/10 shadow-lg overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=1" alt="" />
                            </div>
                            <div className='absolute bottom-20 right-12 w-16 h-16 rounded-full border-2 border-white dark:border-white/10 shadow-lg overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=2" alt="" />
                            </div>
                            <div className='absolute top-24 right-20 w-10 h-10 rounded-full border-2 border-white dark:border-white/10 shadow-lg overflow-hidden'>
                                <img src="https://i.pravatar.cc/150?u=3" alt="" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Create Meeting Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-white/5 text-center'
                        >
                            <div className='w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                                <Plus className='w-10 h-10 text-blue-600' />
                            </div>
                            <h3 className='text-2xl font-bold mb-4'>Create New Meeting?</h3>
                            <p className='text-gray-500 dark:text-gray-400 mb-8'>Do you want to start a new instant video meeting? You'll be the host of this session.</p>
                            <div className='flex gap-4'>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className='flex-1 py-4 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all'
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmCreate}
                                    className='flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20'
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
                    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl p-8 shadow-2xl border border-gray-100 dark:border-white/5'
                        >
                            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
                                <Calendar className='text-blue-600' />
                                Schedule Meeting
                            </h3>
                            <form onSubmit={handleScheduleMeeting} className='space-y-6'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className='w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-all dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className='w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-all dark:text-white'
                                    />
                                </div>
                                <div className='flex gap-3 pt-4'>
                                    <button 
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className='flex-1 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all'
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className='flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20'
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(HomeComponent)