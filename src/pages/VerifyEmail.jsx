import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const VerifyEmail = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        if (response.status === 200) {
          setMessage('Email verified successfully! Redirecting you to login page  in 3 seconds...');

          // Start countdown
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                navigate('/login');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to verify email.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#333] mb-4">Email Verification</h1>
        <p className="text-[#666] mb-4">{message}</p>
        {countdown > 0 && message.includes('Redirecting') && (
          <p className="text-[#0056B3] font-semibold">Redirecting in {countdown} seconds...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;