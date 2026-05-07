import React, { useState } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { Video } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Authentication() {
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-[#111] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <div className='bg-blue-600 p-3 rounded-2xl shadow-lg'>
                        <Video className='text-white w-8 h-8' />
                    </div>
                </div>
                <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400 mb-8'>
                    Or{' '}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className='font-medium text-blue-600 hover:text-blue-500 transition-colors underline'
                    >
                        {isLogin ? 'create a new account' : 'sign in to your existing account'}
                    </button>
                </p>
            </div>

            <div className='sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center'>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='w-full'
                >
                    {isLogin ? (
                        <SignIn 
                            routing="hash"
                            signUpUrl="/auth#sign-up"
                            afterSignInUrl="/home"
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'w-full shadow-2xl rounded-[2rem] border border-gray-100 dark:border-white/5 dark:bg-[#1a1a1a]',
                                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm font-bold py-3 rounded-xl normal-case transition-all shadow-lg shadow-blue-600/20',
                                    headerTitle: 'dark:text-white font-bold',
                                    headerSubtitle: 'dark:text-gray-400',
                                    socialButtonsBlockButton: 'dark:bg-white/5 dark:border-white/10 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all',
                                    socialButtonsBlockButtonText: 'font-semibold',
                                    dividerText: 'dark:text-gray-400 uppercase text-[10px] font-bold tracking-widest',
                                    formFieldLabel: 'dark:text-gray-300 font-semibold text-xs uppercase tracking-wider',
                                    formFieldInput: 'dark:bg-white/5 dark:border-white/10 dark:text-white rounded-xl py-3 px-4 border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all',
                                    footerAction: 'hidden', // Hide Clerk's default footer link
                                    identityPreviewText: 'dark:text-white',
                                    identityPreviewEditButtonIcon: 'dark:text-blue-400',
                                    footer: 'dark:bg-[#1a1a1a] border-t dark:border-white/5'
                                }
                            }}
                        />
                    ) : (
                        <SignUp 
                            routing="hash"
                            signInUrl="/auth#sign-in"
                            afterSignUpUrl="/home"
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'w-full shadow-2xl rounded-[2rem] border border-gray-100 dark:border-white/5 dark:bg-[#1a1a1a]',
                                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm font-bold py-3 rounded-xl normal-case transition-all shadow-lg shadow-blue-600/20',
                                    headerTitle: 'dark:text-white font-bold',
                                    headerSubtitle: 'dark:text-gray-400',
                                    socialButtonsBlockButton: 'dark:bg-white/5 dark:border-white/10 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all',
                                    socialButtonsBlockButtonText: 'font-semibold',
                                    dividerText: 'dark:text-gray-400 uppercase text-[10px] font-bold tracking-widest',
                                    formFieldLabel: 'dark:text-gray-300 font-semibold text-xs uppercase tracking-wider',
                                    formFieldInput: 'dark:bg-white/5 dark:border-white/10 dark:text-white rounded-xl py-3 px-4 border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all',
                                    footerAction: 'hidden', // Hide Clerk's default footer link
                                    footer: 'dark:bg-[#1a1a1a] border-t dark:border-white/5'
                                }
                            }}
                        />
                    )}
                </motion.div>

                {/* Single, Unified Navigation Link at the Bottom */}
                <p className='mt-8 text-center text-sm text-gray-600 dark:text-gray-400'>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className='font-bold text-blue-600 hover:text-blue-500 transition-colors underline decoration-2 underline-offset-4'
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    )
}