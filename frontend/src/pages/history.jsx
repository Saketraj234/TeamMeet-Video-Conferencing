import React, { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Calendar, Hash, ArrowLeft, Video, Trash2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import withAuth from '../utils/withAuth'

function History() {
    const { getHistoryOfUser, deleteFromHistory, deleteAllHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const [showDeleteAll, setShowDeleteAll] = useState(false)
    const navigate = useNavigate();

    const fetchHistory = useCallback(async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history);
        } catch (err) {
            console.error(err)
        }
    }, [getHistoryOfUser])

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory])

    const handleDeleteMeeting = async (meetingId) => {
        await deleteFromHistory(meetingId);
        fetchHistory();
    }

    const handleDeleteAll = async () => {
        await deleteAllHistory();
        setShowDeleteAll(false);
        fetchHistory();
    }

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const getTimeRemaining = (timestamp) => {
        const now = Date.now();
        const elapsed = now - timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const remaining = twentyFourHours - elapsed;
        
        if (remaining <= 0) return 'Expiring soon';
        
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        } else {
            return `${minutes}m remaining`;
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-[#111] font-sans text-gray-900 dark:text-gray-100 pb-12 transition-colors duration-300'>
            {/* Header */}
            <nav className='bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-white/5 px-6 py-4 md:px-12'>
                <div className='max-w-5xl mx-auto flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button 
                            onClick={() => navigate("/home")}
                            className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-600 dark:text-gray-400'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <h1 className='text-xl font-bold'>Meeting History</h1>
                    </div>
                    <div className='flex items-center gap-2'>
                        {meetings.length > 0 && (
                            <button 
                                onClick={() => setShowDeleteAll(true)}
                                className='flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                            >
                                <Trash2 className='w-4 h-4' />
                                Delete All
                            </button>
                        )}
                        <div className='flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-3 py-1 rounded-full'>
                            <Video className='w-4 h-4' />
                            <span className='text-xs font-bold uppercase tracking-wider'>{meetings.length} Meetings</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className='max-w-5xl mx-auto px-6 mt-8'>
                {meetings.length === 0 ? (
                    <div className='text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10'>
                        <div className='bg-gray-50 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <Calendar className='w-8 h-8 text-gray-400 dark:text-gray-600' />
                        </div>
                        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>No meetings found</h2>
                        <p className='text-gray-500 dark:text-gray-400 mt-2'>Your meeting history will appear here once you join or create a meeting.<br /><span className='text-xs text-gray-400 mt-1 block'>Meetings are automatically deleted after 24 hours.</span></p>
                        <button 
                            onClick={() => navigate("/home")}
                            className='mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20'
                        >
                            Back to Home
                        </button>
                    </div>
                ) : (
                    <>
                        <div className='mb-6 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800/30'>
                            <AlertCircle className='w-4 h-4' />
                            <p className='text-sm font-medium'>Meetings are automatically deleted after 24 hours.</p>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {meetings.map((meeting, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={meeting.id}
                                    className='bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md dark:hover:shadow-blue-900/5 transition-all group'
                                >
                                    <div className='flex items-start justify-between mb-4'>
                                        <div className='bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                                            <Hash className='w-5 h-5' />
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-1 rounded'>
                                                ID: {meeting.meeting_code}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteMeeting(meeting.id)}
                                                className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all'
                                                title='Delete meeting'
                                            >
                                                <Trash2 className='w-4 h-4' />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2'>
                                        Code: <span className='text-blue-600 font-mono'>{meeting.meeting_code}</span>
                                    </h3>
                                    
                                    <div className='space-y-2 mt-4'>
                                        <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm'>
                                            <Calendar className='w-4 h-4' />
                                            <span>{formatDate(meeting.timestamp)}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500'>
                                            <AlertCircle className='w-3 h-3' />
                                            <span>{getTimeRemaining(meeting.timestamp)}</span>
                                        </div>
                                    </div>

                                    <div className='flex gap-2 mt-6'>
                                        <button 
                                            onClick={() => navigate(`/${meeting.meeting_code}`)}
                                            className='flex-1 py-3 bg-gray-50 dark:bg-white/5 text-sm font-bold text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-600/10'
                                        >
                                            Rejoin Meeting
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Delete All Confirmation Modal */}
            <AnimatePresence>
                {showDeleteAll && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className='bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5'
                        >
                            <div className='w-16 h-16 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                                <AlertCircle className='w-8 h-8 text-red-600' />
                            </div>
                            <h3 className='text-2xl font-bold text-center mb-2'>Delete All History?</h3>
                            <p className='text-gray-500 dark:text-gray-400 text-center mb-8'>This will permanently delete all your meeting history.</p>
                            <div className='flex flex-col sm:flex-row gap-3'>
                                <button 
                                    onClick={() => setShowDeleteAll(false)}
                                    className='flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all'
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAll}
                                    className='flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20'
                                >
                                    Delete All
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default withAuth(History)
