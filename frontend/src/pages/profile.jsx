import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { ArrowLeft, User, Mail, Lock, Phone, Camera, Save, Loader2, Check, Sun, Moon, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import withAuth from '../utils/withAuth'

function ProfilePage() {
    const navigate = useNavigate()
    const { getUserData, updateProfile, setUserData } = useContext(AuthContext)
    const { isDark, toggleTheme } = useTheme()
    
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [nextUpdateDate, setNextUpdateDate] = useState(null)

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        profileImg: ''
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await getUserData()
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    username: data.username || '',
                    phone: data.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    profileImg: data.profileImg || ''
                })
                // Also update global AuthContext with fresh data
                setUserData(data)
            } catch (err) {
                console.error(err)
                setError('Failed to load profile data')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [getUserData, setUserData])

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, profileImg: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUpdating(true)
        setError('')
        setSuccess(false)
        
        try {
            if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
                if (!formData.currentPassword) {
                    throw new Error("Please enter your current password to change it")
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error("New passwords do not match")
                }
                if (formData.newPassword.length < 6) {
                    throw new Error("New password must be at least 6 characters")
                }
            }

            const updateData = {
                name: formData.name,
                phone: formData.phone,
                profileImg: formData.profileImg
            }

            if (formData.newPassword) {
                updateData.password = formData.newPassword
                updateData.currentPassword = formData.currentPassword
            }
            
            const response = await updateProfile(updateData)
            
            // Update token in localStorage
            if (response.token) {
                localStorage.setItem("token", response.token);
            }

            const updatedUser = response.user;
            setFormData({
                name: updatedUser.name || '',
                email: updatedUser.email || '',
                username: updatedUser.username || '',
                phone: updatedUser.phone || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                profileImg: updatedUser.profileImg || ''
            })
            // Update global AuthContext so Navbar changes immediately
            setUserData(updatedUser)
            
            setSuccess(true)
            setIsEditing(false) // Exit edit mode after success
            setNextUpdateDate(null)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setNextUpdateDate(err.response.data.nextUpdateDate)
                setError(err.response.data.message)
            } else if (err.response && err.response.status === 413) {
                setError("Image is too large. Please use a smaller image.")
            } else {
                setError(err.message || err.response?.data?.message || 'Failed to update profile')
            }
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className='min-h-screen bg-white dark:bg-[#111] flex items-center justify-center'>
                <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-[#111] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300'>
            {/* Simple Navbar for Profile */}
            <nav className='bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-white/5 px-6 py-4 sticky top-0 z-50'>
                <div className='max-w-3xl mx-auto flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button 
                            onClick={() => navigate("/home")}
                            className='p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-600 dark:text-gray-400'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <h1 className='text-xl font-bold tracking-tight'>TeamMeet</h1>
                    </div>
                    <div className='flex items-center gap-4'>
                        <button 
                            onClick={toggleTheme}
                            className='p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors'
                            title={isDark ? "Light Mode" : "Dark Mode"}
                        >
                            {isDark ? <Sun className='w-5 h-5 text-yellow-500' /> : <Moon className='w-5 h-5 text-blue-600' />}
                        </button>
                    </div>
                </div>
            </nav>

            <main className='max-w-3xl mx-auto px-6 py-12'>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden'
                >
                    <div className='p-8 sm:p-12'>
                        <div className='flex flex-col items-center mb-10'>
                            {/* Profile Settings Badge */}
                            <div className='mb-10 relative group'>
                                <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl rounded-full opacity-20 group-hover:opacity-40 transition-all duration-700 animate-pulse' />
                                <div className='relative flex items-center gap-3 px-6 py-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] group-hover:border-blue-500/30 transition-all duration-500'>
                                    <div className='relative flex items-center justify-center'>
                                        <div className='absolute w-3 h-3 rounded-full bg-blue-500 animate-ping opacity-75' />
                                        <div className='relative w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' />
                                    </div>
                                    <span className='text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent drop-shadow-sm'>
                                        Profile Settings
                                    </span>
                                </div>
                            </div>

                            <div className='relative'>
                                {/* Decorative rings */}
                                <div className='absolute inset-0 -m-4 rounded-[2.5rem] bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-xl opacity-50' />
                                <div className='absolute inset-0 -m-1 rounded-[2.2rem] border-2 border-dashed border-blue-600/30 animate-[spin_10s_linear_infinite]' />
                                
                                <div className='relative w-32 h-32 rounded-[2rem] bg-white dark:bg-[#222] overflow-hidden border-4 border-white dark:border-[#222] shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] group'>
                                    {formData.profileImg ? (
                                        <img src={formData.profileImg} alt="Profile" className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white text-4xl font-bold'>
                                            {formData.name.charAt(0)}
                                        </div>
                                    )}
                                    
                                    {isEditing && (
                                        <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                                            <Camera className='w-8 h-8 text-white' />
                                        </div>
                                    )}
                                </div>
                                
                                {isEditing && (
                                    <label className='absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all active:scale-95 border-4 border-white dark:border-[#1a1a1a] z-10'>
                                        <Camera className='w-5 h-5' />
                                        <input type="file" className='hidden' accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-8'>
                            <div className='flex items-center justify-between mb-2 px-1'>
                                <div className='flex items-center gap-2'>
                                    <div className='w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center'>
                                        <User className='w-4 h-4 text-blue-600' />
                                    </div>
                                    <h3 className='font-bold text-gray-800 dark:text-gray-200'>Personal Information</h3>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        isEditing 
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400' 
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/10 dark:text-blue-400'
                                    }`}
                                >
                                    {isEditing ? (
                                        <>Cancel</>
                                    ) : (
                                        <>
                                            <Save className='w-4 h-4' />
                                            Edit Profile
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div className='space-y-2'>
                                    <label className='text-sm font-bold text-gray-600 dark:text-gray-400 ml-1'>Full Name</label>
                                    <div className='relative'>
                                        <User className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            readOnly={!isEditing}
                                            className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium ${!isEditing ? 'cursor-not-allowed opacity-75' : ''}`}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-bold text-gray-600 dark:text-gray-400 ml-1'>Email Address (Cannot be changed)</label>
                                    <div className='relative'>
                                        <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                        <input 
                                            type="email" 
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className='w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none transition-all font-medium opacity-60 cursor-not-allowed'
                                            placeholder="Email"
                                        />
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-bold text-gray-600 dark:text-gray-400 ml-1'>Username (Cannot be changed)</label>
                                    <div className='relative'>
                                        <ShieldCheck className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                        <input 
                                            type="text" 
                                            name="username"
                                            value={formData.username}
                                            readOnly
                                            className='w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none transition-all font-medium opacity-60 cursor-not-allowed'
                                            placeholder="Username"
                                        />
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-bold text-gray-600 dark:text-gray-400 ml-1'>Phone Number (Optional)</label>
                                    <div className='relative'>
                                        <Phone className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                        <input 
                                            type="text" 
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            readOnly={!isEditing}
                                            className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium ${!isEditing ? 'cursor-not-allowed opacity-75' : ''}`}
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='pt-6 border-t border-gray-100 dark:border-white/5 space-y-6'>
                                <h3 className='text-lg font-bold flex items-center gap-2'>
                                    <Lock className='w-5 h-5 text-blue-600' />
                                    Security Settings
                                </h3>
                                
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                    <div className='space-y-2'>
                                        <label className='text-xs font-bold text-gray-500 uppercase tracking-wider ml-1'>Current Password</label>
                                        <div className='relative'>
                                            <input 
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full pl-4 pr-12 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium ${!isEditing ? 'cursor-not-allowed opacity-75' : ''}`}
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                disabled={!isEditing}
                                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:cursor-not-allowed'
                                            >
                                                {showCurrentPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-xs font-bold text-gray-500 uppercase tracking-wider ml-1'>New Password</label>
                                        <div className='relative'>
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full pl-4 pr-12 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium ${!isEditing ? 'cursor-not-allowed opacity-75' : ''}`}
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                disabled={!isEditing}
                                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:cursor-not-allowed'
                                            >
                                                {showNewPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='text-xs font-bold text-gray-500 uppercase tracking-wider ml-1'>Confirm New Password</label>
                                        <div className='relative'>
                                            <input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full pl-4 pr-12 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium ${!isEditing ? 'cursor-not-allowed opacity-75' : ''}`}
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={!isEditing}
                                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:cursor-not-allowed'
                                            >
                                                {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className='p-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl text-sm font-bold flex flex-col gap-1'>
                                    <div className='flex items-center gap-2'>
                                        <ShieldCheck className='w-4 h-4' />
                                        {error}
                                    </div>
                                    {nextUpdateDate && (
                                        <div className='text-xs opacity-80 ml-6'>
                                            Next update available on: {new Date(nextUpdateDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {success && (
                                <div className='p-4 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-2xl text-sm font-bold flex items-center gap-2'>
                                    <Check className='w-4 h-4' />
                                    Profile updated successfully!
                                </div>
                            )}

                            {isEditing && (
                                <button 
                                    type="submit"
                                    disabled={updating}
                                    className='w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50'
                                >
                                    {updating ? (
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                    ) : (
                                        <>
                                            <Save className='w-5 h-5' />
                                            Update All Information
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}

export default withAuth(ProfilePage)
