"use client";

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Google 로그인 핸들러
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/' });
      onClose();
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* 모달 */}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* 닫기 버튼 */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-900 hover:bg-white/90 p-2 rounded-full transition-all shadow-sm hover:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* 상단 그라데이션 배경 */}
                <div className="h-32 bg-gradient-to-r from-red-500 to-orange-400 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">#</span>
                    </div>
                  </div>
                </div>
                
                {/* 컨텐츠 영역 */}
                <div className="p-8 pt-6">
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-center text-gray-600 mb-8 text-sm">
                    Sign in to continue your journey with Hash Korea
                  </p>
                  
                  {/* 소셜 로그인 옵션 */}
                  <div className="space-y-4">
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70 shadow-sm hover:shadow-md"
                    >
                      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                      </svg>
                      <span className="font-medium">{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
                      {isLoading && (
                        <div className="absolute right-4 w-5 h-5 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                      )}
                    </button>
                    
                    <button 
                      disabled
                      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70 shadow-sm hover:shadow-md"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                      </svg>
                      <span className="font-medium">Continue with Apple</span>
                    </button>

                    <button 
                      disabled
                      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70 shadow-sm hover:shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="font-medium">Continue with Phone</span>
                    </button>
                  </div>

                  {/* 하단 텍스트 */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                      By continuing, you agree to our{' '}
                      <a href="#" className="text-red-500 hover:text-red-600 font-medium">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-red-500 hover:text-red-600 font-medium">Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal; 