"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoginModal from '../auth/LoginModal';
import { useSession } from 'next-auth/react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { data: session, status } = useSession();
  
  console.log('Client Session Status:', status);
  console.log('Client Session Data:', session);
  
  // 모바일 메뉴가 열리면 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
      <header className="bg-white px-4 md:px-6 py-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto relative">
          {/* Logo and brand name */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-400 rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="text-xl font-bold">#</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-lg tracking-tight whitespace-nowrap">Hash Korea</span>
              <span className="text-xs text-gray-500 hidden sm:block">Where to go? Just ask AI</span>
            </div>
          </div>
          
          {/* Search area - PC */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-[400px]">
              <input
                type="text"
                placeholder="Search places..."
                className="w-full pl-4 pr-12 py-2 text-sm text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              />
              <button className="absolute right-1 text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-all hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Right section - Login */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile search */}
            <div className="md:hidden flex items-center flex-1 min-w-0">
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="Search places..."
                  className="w-full pl-4 pr-12 py-2 text-sm text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
                <button className="absolute right-1 text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-all hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Login buttons - desktop */}
            <div className="hidden sm:flex items-center">
              <button 
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-400 rounded-full shadow-sm hover:shadow-md hover:from-red-600 hover:to-orange-500 transition-all"
              >
                Login
              </button>
            </div>
            
            {/* Profile icon - mobile */}
            <button className="sm:hidden text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.03-.696-.085-1.036A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Mobile menu button */}
            <button 
              type="button"
              className="md:hidden text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Modern Mobile menu */}
      {mobileMenuOpen && (
        <>
          {/* Background overlay */}
          <div 
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Menu sidebar - modern design */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-400 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <span className="text-lg font-bold">#</span>
                </div>
                <span className="font-bold text-gray-800 text-xl">Hash Korea</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* User profile area */}
            <div className="mx-6 mt-6 mb-8 flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Welcome</h4>
                <p className="text-xs text-gray-500">Sign in to access all features</p>
              </div>
            </div>
            
            {/* Menu items */}
            <div className="px-4 pb-8 overflow-y-auto flex-grow">
              <div className="mb-4">
                <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</h3>
                <nav className="mt-2 space-y-1">
                  <Link 
                    href="#" 
                    className="flex items-center px-4 py-3 text-base font-medium text-red-600 bg-red-50 rounded-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Tour
                  </Link>
                </nav>
              </div>
            </div>
            
            {/* Bottom actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div>
                <button 
                  onClick={() => {
                    setLoginModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-400 rounded-xl hover:from-red-600 hover:to-orange-500"
                >
                  <span>Login</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header; 