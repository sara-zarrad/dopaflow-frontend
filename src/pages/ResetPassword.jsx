import React, { useState } from 'react';
import { FaLock, FaCheckCircle } from 'react-icons/fa'; // Added FaCheckCircle for the green checkmark
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false); // State for success animation
  const [showForm, setShowForm] = useState(true); // State to toggle form visibility
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowSuccessAnimation(false); // Reset animation state

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(response.data.message);
      setShowForm(false); // Hide the form on success
      setShowSuccessAnimation(true); // Trigger success animation
      setTimeout(() => {
        setShowSuccessAnimation(false); // Hide animation after 5 seconds
        setShowForm(true); // Show form again (though we’ll redirect)
        navigate('/login'); // Redirect to login after animation
      }, 5000); // 5 seconds delay before redirect
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setShowForm(true); // Ensure form is visible on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all hover:shadow-3xl relative">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl animate-slideInSlow">
              <div className="flex flex-col items-center">
                <FaCheckCircle className="text-6xl text-green-500 animate-pulse" />
                <p className="text-lg font-bold text-green-600 mt-4">
                  Password reset successfully!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Your password has been updated. You can now log in.
                </p>
                <Link
                  to="/login"
                  className="mt-4 text-sm text-blue-600 hover:underline transition-colors duration-200"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Form (with transition) */}
        {showForm && (
          <div className={`transition-all duration-500 ease-in-out ${showSuccessAnimation ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
            <div className="flex justify-center mb-6">
              <img
                src={logo_dopaflow}
                alt="DopaFlow Logo"
                className="w-16 h-16 object-contain rounded-full shadow-md"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Reset Password
            </h1>
            {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
            {message && !showSuccessAnimation && (
              <p className="text-sm text-green-500 mb-4 text-center">{message}</p>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter new password"
                    required
                    aria-label="New password"
                  />
                  <FaLock className="absolute left-3 top-3 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="Confirm new password"
                    required
                    aria-label="Confirm password"
                  />
                  <FaLock className="absolute left-3 top-3 text-gray-500" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Reset Password
              </button>
              <p className="text-sm text-gray-600 text-center">
                Back to{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
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

// Ensure Tailwind animations are configured
export default ResetPassword;