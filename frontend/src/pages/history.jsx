import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Calendar, Hash, ArrowLeft, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import withAuth from '../utils/withAuth'

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.error(err)
            }
        }
        fetchHistory();
    }, [getHistoryOfUser])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                    <div className='flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-3 py-1 rounded-full'>
                        <Video className='w-4 h-4' />
                        <span className='text-xs font-bold uppercase tracking-wider'>{meetings.length} Meetings</span>
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
                        <p className='text-gray-500 dark:text-gray-400 mt-2'>Your meeting history will appear here once you join or create a meeting.</p>
                        <button 
                            onClick={() => navigate("/home")}
                            className='mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20'
                        >
                            Back to Home
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {meetings.map((meeting, index) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={index}
                                className='bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md dark:hover:shadow-blue-900/5 transition-all group'
                            >
                                <div className='flex items-start justify-between mb-4'>
                                    <div className='bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                                        <Hash className='w-5 h-5' />
                                    </div>
                                    <span className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-1 rounded'>
                                        ID: {meeting._id.slice(-6)}
                                    </span>
                                </div>
                                
                                <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2'>
                                    Code: <span className='text-blue-600 font-mono'>{meeting.meetingCode}</span>
                                </h3>
                                
                                <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-4'>
                                    <Calendar className='w-4 h-4' />
                                    <span>{formatDate(meeting.date)}</span>
                                </div>

                                <button 
                                    onClick={() => navigate(`/${meeting.meetingCode}`)}
                                    className='mt-6 w-full py-3 bg-gray-50 dark:bg-white/5 text-sm font-bold text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-600/10'
                                >
                                    Rejoin Meeting
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default withAuth(History)
