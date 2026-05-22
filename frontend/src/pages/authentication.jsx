import React, { useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Video, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Home, Github, Linkedin, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

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

    const { handleLogin, handleRegister } = useContext(AuthContext)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (isLogin) {
                await handleLogin(username, password)
            } else {
                await handleRegister(name, username, password, email)
                // Automatically login after registration
                await handleLogin(username, password)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-[#111] flex flex-col font-sans transition-colors duration-300'>
            {/* Navigation */}
            <nav className='flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full'>
                <div className='flex items-center gap-2 cursor-pointer' onClick={() => navigate("/")}>
                    <div className='bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20'>
                        <Video className='text-white w-6 h-6' />
                    </div>
                    <h1 className='text-2xl font-bold tracking-tight text-white'>TeamMeet</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={() => navigate("/")}
                        className='flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold hover:bg-white/10 transition-all border border-white/10 active:scale-95'
                    >
                        <Home className='w-4 h-4' />
                        Home
                    </button>
                </div>
            </nav>

            <div className='flex-1 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8'>
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
                            <label className='block text-sm font-semibold text-gray-300 mb-1.5'>Username</label>
                            <div className='mt-1 relative'>
                                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                    <User className='h-5 w-5 text-gray-400' />
                                </div>
                                <input
                                    type='text'
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className='appearance-none block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-2xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/5 text-white text-sm'
                                    placeholder='username123'
                                />
                            </div>
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
                                    onChange={(e) => setPassword(e.target.value)}
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
                            <span className='hover:text-blue-500 cursor-pointer transition-colors'>Privacy</span>
                            <span className='hover:text-blue-500 cursor-pointer transition-colors'>Terms</span>
                            <span className='hover:text-blue-500 cursor-pointer transition-colors'>Security</span>
                        </div>
                    </div>

                    <div className='flex flex-col items-center md:items-end gap-2'>
                        <p className='text-gray-400 text-sm font-bold'>© 2026 TeamMeet Inc.</p>
                        <p className='text-gray-600 text-[10px] uppercase tracking-tighter'>Made with ❤️ for the community</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
