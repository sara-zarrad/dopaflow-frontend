import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';

const Signup = () => {
  const [step, setStep] = useState(1); // Track the current step (1, 2, or 3)
  const [direction, setDirection] = useState('next'); // Track transition direction ('next' or 'back')
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation (minimum 8 characters)
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Handle email input change with validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  // Handle password input change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword && !validatePassword(newPassword)) {
      setPasswordError('Password must be at least 8 characters long.');
    } else {
      setPasswordError('');
    }
  };

  // Trigger fade-in animation on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Handle "Next" button click
  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (
        !firstName.trim() || 
        !lastName.trim() || 
        firstName.trim().length < 2 || 
        lastName.trim().length < 2 || 
        !/^[a-zA-Z\s'-]+$/.test(firstName.trim()) || 
        !/^[a-zA-Z\s'-]+$/.test(lastName.trim())
      ) {
        setError('Please enter valid first or last names.');
        return;
      }
      setDirection('next');
      setStep(2);
    } else if (step === 2) {
      if (!email || !birthDate) {
        setError('Please fill in all fields.');
        return;
      }
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address.');
        return;
      }
      setDirection('next');
      setStep(3);
    }
  };

  // Handle "Back" button click
  const handleBack = () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setDirection('back');
    setStep(step - 1);
  };

  // Handle form submission on the final step
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        username: `${firstName} ${lastName}`,
        email,
        password,
        role: 'User',
        birthdate: birthDate,
      });
      if (response.status === 201) {
        setSuccessMessage('Signup successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000); // Redirect after 3 seconds
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  // Define animation variants for framer-motion (faster transition for steps 2 and 3)
  const variants = {
    initial: (direction) => ({
      x: direction === 'next' ? 300 : -300,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { duration: 0.1 }, // Very fast slide transition
        opacity: { duration: 0.1 }, // Very fast opacity transition
      },
    },
    exit: (direction) => ({
      x: direction === 'next' ? -300 : 300,
      opacity: 0,
      transition: {
        x: { duration: 0.1 }, // Very fast slide transition
        opacity: { duration: 0.1 }, // Very fast opacity transition
      },
    }),
  };

  // Step descriptions
  const stepDescriptions = {
    1: 'Enter your first name and last name & click on Next',
    2: 'Enter your email and your birthdate  & click on Next',
    3: 'Enter a Strong password & click on Create',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-blue-200 to-indigo-300 flex items-center justify-center p-4">
      {step === 1 && !successMessage ? (
        // Step 1: Simple fade-in transition like the Login page
        <div
          className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Dopaflow Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
          </div>


          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {step === 1 ? 'Create an Account' : step === 2 ? 'Continue account details' : 'All Done'}
          </h2>

          {/* Step Description */}
          <p className="text-sm text-gray-500 mb-4 text-center">
            {stepDescriptions[step]}
          </p>

          {/* Step Indicator */}
          <div className="flex justify-center mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                  step >= s ? 'bg-teal-500' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 mb-4 text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Form Step 1 */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-5 w-full"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                  placeholder="Your first name"
                  required
                />
                <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                  placeholder="Your last name"
                  required
                />
                <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                Next
              </button>
            </div>
          </form>

          {/* Link to Login */}
          <p className="text-sm text-gray-600 text-center mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-teal-600 hover:underline font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      ) : (
        // Steps 2, 3, and Success: Slide transition with framer-motion
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={successMessage ? 'success' : step} // Use step or 'success' as the key to trigger animation
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={direction}
            className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Dopaflow Logo */}
            <div className="flex justify-center mb-6">
              <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            {step === 1 ? 'Create an Account' : step === 2 ? 'Continue Creating' : 'All Done'}
          </h2>

            {/* Step Description */}
            {!successMessage && (
              <p className="text-sm text-gray-500 mb-4 text-center">
                {stepDescriptions[step]}
              </p>
            )}

            {!successMessage && (
              <>
                {/* Step Indicator */}
                <div className="flex justify-center mb-6">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                        step >= s ? 'bg-teal-500' : 'bg-gray-300'
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-red-500 mb-4 text-center bg-red-50 p-2 rounded-lg">
                    {error}
                  </p>
                )}
              </>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="text-sm text-green-600 mb-4 text-center bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm animate-fade-in">
                {successMessage}
              </div>
            )}

            {/* Form Steps */}
            {!successMessage && (
              <form
                onSubmit={step === 3 ? handleSignup : (e) => e.preventDefault()}
                className="space-y-5 w-full"
              >
                {step === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          className={`w-full px-4 py-3 pl-12 border-2 ${
                            emailError ? 'border-red-500' : 'border-gray-200'
                          } rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm`}
                          placeholder="Your email"
                          required
                        />
                        <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      </div>
                      {emailError && (
                        <p className="text-sm text-red-500 mt-1">{emailError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birth Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                          required
                        />
                        <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 pl-12 border-2 ${
                            passwordError ? 'border-red-500' : 'border-gray-200'
                          } rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm`}
                          placeholder="Your password"
                          required
                        />
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      </div>
                      {passwordError && (
                        <p className="text-sm text-red-500 mt-1">{passwordError}</p>
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
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                          placeholder="Confirm your password"
                          required
                        />
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 shadow-sm"
                    >
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md ml-auto"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md ml-auto"
                    >
                      Create
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Link to Login */}
            {!successMessage && (
              <p className="text-sm text-gray-600 text-center mt-4">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-teal-600 hover:underline font-semibold"
                >
                  Login
                </Link>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Signup;