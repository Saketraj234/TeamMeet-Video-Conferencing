import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, Users, Shield, Zap, ChevronRight, X, Github, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300'>
            {/* Navigation */}
            <nav className='flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-2 rounded-lg'>
                        <Video className='text-white w-6 h-6' />
                    </div>
                    <h1 className='text-2xl font-bold tracking-tight'>TeamMeet</h1>
                </div>
                <div className='flex items-center gap-6'>
                    <Link to="/auth" className='text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>Join as Guest</Link>
                    <Link to="/auth" className='bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95'>
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className='max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-24 text-center md:text-left flex flex-col md:flex-row items-center gap-12'>
                <div className='flex-1 space-y-8'>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className='inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6'>
                            The Future of Video Calls
                        </span>
                        <h2 className='text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6'>
                            Video calls for <span className='text-blue-600'>everyone</span>, everywhere.
                        </h2>
                        <p className='text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed'>
                            Connect, collaborate, and celebrate from anywhere with TeamMeet. 
                            Reliable video conferencing for your teams and friends.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className='flex flex-col sm:flex-row items-center gap-4'
                    >
                        <button 
                            onClick={() => navigate("/auth")}
                            className='w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group'
                        >
                            Start a Meeting
                            <ChevronRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                        </button>
                        <button 
                            onClick={() => navigate("/auth")}
                            className='w-full sm:w-auto bg-white dark:bg-white/5 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-white/10 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all'
                        >
                            Join Meeting
                        </button>
                    </motion.div>

                    <div className='flex items-center gap-4 pt-4'>
                        <div className='flex -space-x-3'>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className='w-10 h-10 rounded-full border-2 border-white dark:border-white/10 bg-gray-200 dark:bg-white/5 overflow-hidden'>
                                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 font-medium'>
                            <span className='text-gray-900 dark:text-white font-bold'>1,000+</span> users already joined
                        </p>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className='flex-1 relative'
                >
                    <div className='relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-[#222] bg-gray-100 dark:bg-white/5 aspect-video md:aspect-square lg:aspect-video flex items-center justify-center'>
                        <img 
                            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=1000" 
                            alt="Meeting App Interface" 
                            className='object-cover w-full h-full'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
                        <div className='absolute bottom-6 left-6 flex gap-2'>
                            <div className='bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30'>
                                <Video className='text-white w-5 h-5' />
                            </div>
                            <div className='bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30'>
                                <Users className='text-white w-5 h-5' />
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className='absolute -top-12 -right-12 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -z-10 animate-pulse' />
                    <div className='absolute -bottom-12 -left-12 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl -z-10' />
                </motion.div>
            </main>

            {/* Features Section */}
            <section className='bg-gray-50 dark:bg-white/5 py-24 px-6 md:px-12 border-t border-gray-100 dark:border-white/5'>
                <div className='max-w-7xl mx-auto'>
                    <div className='text-center mb-16'>
                        <h3 className='text-3xl md:text-4xl font-bold mb-4'>Everything you need to connect</h3>
                        <p className='text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
                            TeamMeet provides professional-grade features for free. No credit card required.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                        {[
                            { icon: <Zap className='text-orange-500' />, title: "Instant Meetings", desc: "Start a meeting with one click and share your link instantly." },
                            { icon: <Shield className='text-green-500' />, title: "Secure & Private", desc: "Your data is encrypted and your privacy is our top priority." },
                            { icon: <Users className='text-blue-500' />, title: "Unlimited Participants", desc: "Invite as many people as you want without any restrictions." }
                        ].map((feature, idx) => (
                            <div key={idx} className='bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-blue-900/5 transition-all border border-gray-100 dark:border-white/5'>
                                <div className='w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-6'>
                                    {feature.icon}
                                </div>
                                <h4 className='text-xl font-bold mb-3'>{feature.title}</h4>
                                <p className='text-gray-600 dark:text-gray-400 leading-relaxed'>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className='border-t border-gray-200 dark:border-white/5 py-12 px-6 md:px-12 dark:bg-[#111]'>
                <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8'>
                    <div className='flex items-center gap-2'>
                        <div className='bg-blue-600 p-1.5 rounded-lg'>
                            <Video className='text-white w-4 h-4' />
                        </div>
                        <h1 className='text-xl font-bold'>TeamMeet Team</h1>
                    </div>
                    <p className='text-gray-500 dark:text-gray-400 text-sm'>
                        © 2026 TeamMeet.
                    </p>
                    <div className='flex gap-5'>
                        <button 
                            onClick={() => window.open('https://x.com/saketraj235')} 
                            className='p-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300'
                            title="Twitter"
                        >
                            <X className='w-5 h-5' />
                        </button>
                        <button 
                            onClick={() => window.open('https://github.com/Saketraj234')} 
                            className='p-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all duration-300'
                            title="GitHub"
                        >
                            <Github className='w-5 h-5' />
                        </button>
                        <button 
                            onClick={() => window.open('https://www.linkedin.com/in/saket-raj62/')} 
                            className='p-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300'
                            title="LinkedIn"
                        >
                            <Linkedin className='w-5 h-5' />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    )
}
