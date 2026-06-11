import React, { useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Video, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Home, Github, Linkedin, X, Shield, Users } from 'lucide-react'
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

    // Popup states
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)

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
                            <span onClick={() => setShowPrivacyModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Privacy</span>
                            <span onClick={() => setShowTermsModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Terms</span>
                            <span onClick={() => setShowSupportModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Support</span>
                            <span onClick={() => setShowContactModal(true)} className='hover:text-blue-500 cursor-pointer transition-colors'>Contact</span>
                        </div>
                    </div>

                    <div className='flex flex-col items-center md:items-end gap-2'>
                        <p className='text-gray-400 text-sm font-bold'>© 2026 TeamMeet Inc.</p>
                        <p className='text-gray-600 text-[10px] uppercase tracking-tighter'>Made with ❤️ for the community</p>
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
                                    <Mail className='text-blue-600 w-8 h-8' />
                                    Need Assistance?
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
                                    Whether you're experiencing technical issues, having trouble joining a meeting, or need help with your account, we're here to assist.
                                </p>

                                <div className='bg-blue-900/10 p-6 rounded-2xl border border-blue-800/30'>
                                    <h4 className='font-bold text-white mb-4'>Popular Topics</h4>
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
                                        <p className='text-blue-600 text-lg font-semibold'>contact@teammeet.com</p>
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
