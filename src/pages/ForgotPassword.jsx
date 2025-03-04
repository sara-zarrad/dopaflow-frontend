import React, { useState } from 'react';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false); // State for success animation
  const [showForm, setShowForm] = useState(true); // State to toggle form visibility
  const [isEmailValid, setIsEmailValid] = useState(false); // State for email validation
  const navigate = useNavigate();

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsEmailValid(validateEmail(newEmail)); // Update email validity in real-time
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowSuccessAnimation(false); // Reset animation state

    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setShowForm(false); // Hide the form on success
      setShowSuccessAnimation(true); // Trigger success animation
      setTimeout(() => {
        setShowSuccessAnimation(false); // Hide animation after 3 seconds
        setShowForm(true); // Show form again (though we’ll redirect)
        navigate('/login'); // Redirect to login after animation
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
      setShowForm(true); // Ensure form is visible on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all hover:shadow-3xl relative">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl animate-bounce">
              <div className="flex flex-col items-center">
                <FaCheckCircle className="text-6xl text-green-500 animate-pulse" />
                <p className="text-lg font-bold text-green-600">
                  Email sent successfully!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Please check your email for the password reset link.
                </p>
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
              Forgot Password
            </h1>
            {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
            {message && !showSuccessAnimation && (
              <p className="text-sm text-green-500 mb-4 text-center">{message}</p>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange} // Updated to use handleEmailChange for real-time validation
                    className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition-all duration-200 hover:border-green-300"
                    placeholder="Your email address"
                    required
                    aria-label="Email address"
                  />
                  <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
                  {isEmailValid && (
                    <FaCheckCircle
                      className="absolute right-3 top-3 text-green-500 opacity-0 transition-opacity duration-300 ease-in-out animate-fadeIn"
                      style={{ opacity: isEmailValid ? 1 : 0 }} // Ensure smooth animation
                    />
                  )}
                </div>
                {!isEmailValid && email && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!isEmailValid}
                className={`w-full px-6 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  isEmailValid
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send Reset Link
              </button>
              <p className="text-sm text-gray-600 text-center">
                Remember your password?{' '}
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
export default ForgotPassword;