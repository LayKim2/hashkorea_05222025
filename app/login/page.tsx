"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
      // 에러 처리를 여기서 할 수 있습니다
    } else {
      // 자동으로 Google 로그인 시도
      signIn('google', { callbackUrl });
    }
  }, [error, callbackUrl]);

  return (
    <div className="text-center">
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
        {error ? 'Login Error' : 'Redirecting to login...'}
      </h2>
      {error && (
        <p className="mt-2 text-sm text-gray-600">
          An error occurred during login. Please try again.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <Suspense fallback={
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
} 