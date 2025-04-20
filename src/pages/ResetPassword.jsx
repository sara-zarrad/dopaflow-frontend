import React, { useState } from 'react';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png'; // Updated to match Signup page

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(false); // State for password validation
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Password validation (minimum 8 characters)
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handlePasswordChange = (e) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    setIsPasswordValid(validatePassword(newPass)); // Update password validity in real-time
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowSuccessAnimation(false);

    // Validate password length
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(response.data.message);
      setShowForm(false);
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setShowForm(true);
        navigate('/login');
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setShowForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-blue-200 to-indigo-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-1000 ease-out">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl animate-fade-in">
              <div className="flex flex-col items-center">
                <FaCheckCircle className="text-6xl text-green-500 animate-pulse" />
                <p className="text-lg font-bold text-green-600 mt-4">
                  Password Reset Successfully!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Your password has been updated. Redirecting to login...
                </p>
                <Link
                  to="/login"
                  className="mt-4 text-sm text-teal-600 hover:underline transition-colors duration-200"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className={`transition-all duration-500 ease-in-out ${showSuccessAnimation ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
            <div className="flex justify-center mb-6">
              <img
                src={logo_dopaflow}
                alt="DopaFlow Logo"
                className="h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Reset Password
            </h1>
            {error && (
              <p className="text-sm text-red-500 mb-4 text-center bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
            {message && !showSuccessAnimation && (
              <p className="text-sm text-green-600 mb-4 text-center bg-green-50 p-2 rounded-lg">
                {message}
              </p>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 pl-12 border-2 ${
                      error && !isPasswordValid ? 'border-red-500' : 'border-gray-200'
                    } rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm`}
                    placeholder="Enter new password"
                    required
                    aria-label="New password"
                  />
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                {!isPasswordValid && newPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    Password must be at least 8 characters long.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 pl-12 border-2 ${
                      error && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-200'
                    } rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm`}
                    placeholder="Confirm new password"
                    required
                    aria-label="Confirm password"
                  />
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <button
                type="submit"
                disabled={!isPasswordValid}
                className={`w-full px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-md ${
                  isPasswordValid
                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Reset Password
              </button>
              <p className="text-sm text-gray-600 text-center mt-4">
                Back to{' '}
                <Link to="/login" className="text-teal-600 hover:underline font-semibold">
                  Login
                </Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};


export default ResetPassword;