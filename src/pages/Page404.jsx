import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Page404 = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate(isLoggedIn ? '/profile' : '/login');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, isLoggedIn]);

  return (
    <div className=" bg-white flex items-center justify-center p-4">
      <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h1 className="text-8xl font-bold text-blue-600">404</h1>
        <h2 className="text-2xl font-semibold text-blue-800 mt-4">Page Not Found</h2>
        <p className="text-blue-600 mt-2">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <div className="relative w-16 h-16 mx-auto">
            <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-blue-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray="251"
                strokeDashoffset="75"
                className="text-blue-600"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-blue-800">
              {countdown}
            </span>
          </div>
          <p className="text-blue-600 mt-4 text-sm">
            Redirecting to {isLoggedIn ? 'Profile' : 'Login'} in {countdown} seconds...
          </p>
        </div>
        <button
          onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          Go Back Now
        </button>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Page404;