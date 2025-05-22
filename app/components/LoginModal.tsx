"use client";

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      ></div>
      
      {/* 모달 */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 로그인 헤더 */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Log In</h2>
            <p className="text-center text-gray-600 mb-6 text-sm">
              By continuing, you agree to Hash Korea's User Agreement and Privacy Policy.
            </p>
            
            {/* 소셜 로그인 옵션 */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <button 
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 py-3 px-4 rounded-full cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>Continue with Phone</span>
                </button>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="relative w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-70"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
                {isLoading && (
                  <div className="absolute right-4 w-5 h-5 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                )}
              </button>
              
              <div className="relative">
                <button 
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 py-3 px-4 rounded-full cursor-not-allowed"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <span>Continue with Apple</span>
                </button>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
            
            {/* 구분선 */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-300 absolute w-full"></div>
              <div className="bg-white px-4 relative text-sm text-gray-500">OR</div>
            </div>
            
            {/* 이메일 로그인 폼 */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Email or Username"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400 cursor-not-allowed">Forgot password?</span>
              </div>
              <div className="relative">
                <button 
                  disabled
                  className="w-full bg-gray-200 text-gray-400 py-3 rounded-full cursor-not-allowed"
                >
                  Log In
                </button>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
            
            {/* 회원가입 안내 */}
            <div className="text-center text-sm">
              <span className="text-gray-400">New to Hash Korea?</span>{' '}
              <span className="text-gray-400 cursor-not-allowed">Sign Up</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal; 