import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Users, Shield, Zap, ChevronRight, X, Github, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'
import InstallPWAButton from '../components/InstallPWAButton'

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen-safe w-full bg-[#111] text-gray-100 font-sans selection:bg-blue-900/30 selection:text-blue-200 transition-colors duration-300 overflow-x-hidden safe-x'>
            {/* Navigation */}
            <nav className='flex items-center justify-between px-4 xs:px-6 py-4 xs:py-5 md:px-12 md:py-6 max-w-7xl mx-auto w-full safe-top'>
                <div className='flex items-center gap-2 cursor-pointer shrink-0' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-1.5 xs:p-2 rounded-lg shadow-lg shadow-blue-600/20'>
                        <Video className='text-white w-5 h-5 xs:w-6 xs:h-6' />
                    </div>
                    <h1 className='text-xl xs:text-2xl font-bold tracking-tight text-white truncate'>TeamMeet</h1>
                </div>
                <div className='flex items-center gap-2 xs:gap-3 md:gap-4 min-w-0'>
                    <button 
                        onClick={() => navigate("/auth")}
                        className='text-gray-400 hover:text-white px-2 xs:px-3 md:px-4 py-2 text-[11px] xs:text-xs md:text-sm font-bold transition-colors shrink-0 whitespace-nowrap'
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => navigate("/auth")}
                        className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 xs:px-4 md:px-7 py-1.5 xs:py-2 md:py-3 rounded-full text-[10px] xs:text-xs md:text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 shrink-0 whitespace-nowrap'
                    >
                        Join Now
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className='max-w-7xl mx-auto px-4 xs:px-6 md:px-12 pt-10 xs:pt-12 md:pt-16 pb-16 xs:pb-20 md:pb-24 text-center md:text-left flex flex-col md:flex-row items-center gap-8 xs:gap-10 md:gap-12 w-full'>
                <div className='flex-1 space-y-6 xs:space-y-8 w-full'>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className='inline-block px-3 xs:px-4 py-1 xs:py-1.5 bg-blue-900/10 text-blue-400 rounded-full text-[10px] xs:text-xs font-bold uppercase tracking-wider mb-4 xs:mb-6 border border-blue-500/20'>
                            The Future of Video Calls
                        </span>
                        <h2 className='text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-4 xs:mb-6 text-white'>
                            Video calls for <span className='text-blue-600'>everyone</span>, <br className='hidden sm:block' />everywhere.
                        </h2>
                        <p className='text-base xs:text-lg md:text-xl text-gray-400 max-w-xl mx-auto md:mx-0 leading-relaxed'>
                            Connect, collaborate, and celebrate from anywhere with TeamMeet. 
                            Reliable video conferencing for your teams and friends.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center md:justify-start'
                    >
                        <button 
                            onClick={() => navigate("/auth")}
                            className='w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 sm:gap-3 group active:scale-95 whitespace-nowrap'
                        >
                            Start Meeting
                            <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform' />
                        </button>
                        <button 
                            onClick={() => navigate("/auth")}
                            className='w-full sm:w-auto text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold hover:bg-blue-500/20 transition-all active:scale-95 backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 whitespace-nowrap shadow-lg shadow-blue-500/5'
                        >
                            <span className='relative z-10 flex items-center justify-center gap-2'>
                                Join Now
                            </span>
                        </button>
                    </motion.div>

                    <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2 xs:pt-4'>
                        <div className='flex -space-x-2 xs:-space-x-3 justify-center sm:justify-start'>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className='w-8 h-8 xs:w-10 xs:h-10 rounded-full border-2 border-[#222] bg-white/5 overflow-hidden shrink-0'>
                                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className='w-full h-full object-cover' />
                                </div>
                            ))}
                        </div>
                        <p className='text-xs xs:text-sm text-gray-500 font-medium text-center sm:text-left'>
                            <span className='text-white font-bold'>100+</span> users already joined
                        </p>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className='flex-1 relative w-full max-w-lg mx-auto md:max-w-none'
                >
                    <div className='relative z-10 rounded-2xl xs:rounded-3xl overflow-hidden shadow-2xl border-4 xs:border-8 border-[#222] bg-white/5 aspect-video md:aspect-square lg:aspect-video flex items-center justify-center w-full'>
                        <img 
                            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=60&w=800" 
                            alt="Meeting App Interface" 
                            className='object-cover w-full h-full'
                            loading="eager"
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
                        <div className='absolute bottom-3 xs:bottom-6 left-3 xs:left-6 flex gap-1 xs:gap-2'>
                            <div className='bg-white/20 backdrop-blur-md p-1.5 xs:p-2 rounded-lg border border-white/30'>
                                <Video className='text-white w-4 h-4 xs:w-5 xs:h-5' />
                            </div>
                            <div className='bg-white/20 backdrop-blur-md p-1.5 xs:p-2 rounded-lg border border-white/30'>
                                <Users className='text-white w-4 h-4 xs:w-5 xs:h-5' />
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className='absolute -top-8 xs:-top-12 -right-8 xs:-right-12 w-40 xs:w-64 h-40 xs:h-64 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse' />
                    <div className='absolute -bottom-8 xs:-bottom-12 -left-8 xs:-left-12 w-40 xs:w-64 h-40 xs:h-64 bg-purple-600/10 rounded-full blur-3xl -z-10' />
                </motion.div>
            </main>

            {/* Features Section */}
            <section className='bg-white/5 py-16 xs:py-20 md:py-24 px-4 xs:px-6 md:px-12 border-t border-white/5 w-full'>
                <div className='max-w-7xl mx-auto'>
                    <div className='text-center mb-10 xs:mb-12 md:mb-16'>
                        <h3 className='text-2xl xs:text-3xl md:text-4xl font-bold mb-3 xs:mb-4 text-white'>Everything you need to connect</h3>
                        <p className='text-gray-400 max-w-2xl mx-auto text-sm xs:text-base'>
                            TeamMeet provides professional-grade features for free. No credit card required.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-6 md:gap-8'>
                        {[
                            { icon: <Zap className='text-orange-500' />, title: "Instant Meetings", desc: "Start a meeting with one click and share your link instantly." },
                            { icon: <Shield className='text-green-500' />, title: "Secure & Private", desc: "Your data is encrypted and your privacy is our top priority." },
                            { icon: <Users className='text-blue-500' />, title: "500+ Participants", desc: "Host large-scale meetings with hundreds of attendees without compromising quality." }
                        ].map((feature, idx) => (
                            <div key={idx} className='bg-[#1a1a1a] p-5 xs:p-6 md:p-8 rounded-xl xs:rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all border border-white/5'>
                                <div className='w-10 h-10 xs:w-12 xs:h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 xs:mb-6'>
                                    {feature.icon}
                                </div>
                                <h4 className='text-lg xs:text-xl font-bold mb-2 xs:mb-3 text-white'>{feature.title}</h4>
                                <p className='text-gray-400 leading-relaxed text-sm xs:text-base'>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className='py-6 xs:py-8 px-4 xs:px-6 md:px-12 bg-[#0d0d0d] border-t border-white/5 relative overflow-hidden w-full safe-bottom'>
                <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent' />
                <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 xs:gap-8 relative z-10'>
                    <div className='flex flex-col items-center md:items-start gap-3 xs:gap-4'>
                        <div className='flex items-center gap-2 xs:gap-2.5 group cursor-pointer' onClick={() => navigate("/")}>
                            <div className='bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform'>
                                <Video className='text-white w-4 h-4 xs:w-5 xs:h-5' />
                            </div>
                            <h1 className='text-lg xs:text-xl font-black tracking-tight text-white'>TeamMeet</h1>
                        </div>
                        <p className='text-gray-500 text-xs max-w-[200px] text-center md:text-left leading-relaxed'>
                            Secure, high-quality video conferencing for everyone, everywhere.
                        </p>
                    </div>
                    
                    <div className='flex flex-col items-center gap-4 xs:gap-6'>
                        <div className='flex gap-3 xs:gap-4'>
                            {[
                                { icon: <X className='w-4 h-4 xs:w-5 xs:h-5' />, url: 'https://x.com/saketraj235', label: 'Twitter' },
                                { icon: <Github className='w-4 h-4 xs:w-5 xs:h-5' />, url: 'https://github.com/Saketraj234', label: 'GitHub' },
                                { icon: <Linkedin className='w-4 h-4 xs:w-5 xs:h-5' />, url: 'https://www.linkedin.com/in/saket-raj62/', label: 'LinkedIn' }
                            ].map((social, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => window.open(social.url)} 
                                    className='p-2 xs:p-3 bg-white/5 text-gray-400 rounded-xl xs:rounded-2xl hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300 border border-white/5 shadow-xl'
                                    title={social.label}
                                >
                                    {social.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='flex flex-col items-center md:items-end gap-2'>
                        <p className='text-gray-400 text-xs xs:text-sm font-bold'>© 2026 TeamMeet Inc.</p>
                    </div>
                </div>
            </footer>
            <InstallPWAButton floating />
        </div>
    )
}
