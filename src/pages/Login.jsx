import React, { useState, useEffect } from 'react';
import { FaLock, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';
import logo_authenticator from '../images/google_authenticator_logo.png';

const OtpInput = ({ value, onChange, numInputs = 6 }) => {
  const inputRefs = React.useRef([]);
  const digits = Array.from({ length: numInputs }, (_, i) => value[i] || '');

  const handleChange = (e, i) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      let newDigits = [...digits];
      newDigits[i] = val.slice(-1);
      const newOtp = newDigits.join('');
      onChange(newOtp);
      if (val && i < numInputs - 1) {
        inputRefs.current[i + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1].focus();
    }
  };

  return (
    <div className="flex space-x-3">
      {Array.from({ length: numInputs }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-14 h-14 text-center text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
          value={digits[i]}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
};

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [failed2FAAttempts, setFailed2FAAttempts] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('suspended') === 'true') {
      setError('Account suspended due to multiple failed 2FA attempts. Contact an admin.');
      setShow2FA(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setFailed2FAAttempts(0);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      if (data.requires2FA) {
        setShow2FA(true);
        setTempToken(data.tempToken);
        console.log('Switched to 2FA view');
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        navigate('/profile');
   
      } else {
        setError('Unexpected login response');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.log('Login error:', err);
    }
  };

  const handleVerify2FA = async (code) => {
    setError('');
    console.log(`2FA Attempt ${failed2FAAttempts + 1} with code: ${code}`);

    try {
      const response = await api.post(
        '/auth/verify-2fa',
        { code: parseInt(code) },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      console.log('2FA successful');
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      navigate('/profile');
      window.location.reload(); // Only refresh on successful 2FA
    } catch (err) {
      const newAttempts = failed2FAAttempts + 1;
      setFailed2FAAttempts(newAttempts);
      console.log(`Failed 2FA attempt ${newAttempts}`);

      if (newAttempts < 3) {
        setError(`Invalid 2FA code. ${3 - newAttempts} attempts remaining`);
        setOtp('');
      } else {
        try {
          await api.post('/users/suspend-self', {}, {
            headers: { Authorization: `Bearer ${tempToken}` }
          });
          console.log('Account suspended, refreshing');
          window.location.reload(); // ✅ refresh only on successful suspension          
        } catch (suspendErr) {
          window.location.reload();
          setError('Failed to suspend account. Please contact support.');
          setOtp('');
          console.log('Suspension failed:', suspendErr);
       
        }
      }
    }
  };

  useEffect(() => {
    if (otp.length === 6 && !isNaN(otp)) {
      console.log('Auto-verifying 6-digit OTP');
      handleVerify2FA(otp);
    }
  }, [otp]);

  const handleSubmit2FA = (e) => {
    e.preventDefault();
    if (otp.length === 6 && !isNaN(otp)) {
      console.log('Manual verify button clicked');
      handleVerify2FA(otp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-blue-200 to-indigo-300 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex justify-center mb-3">
          <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          {show2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
        </h1>
        {error && (
          <p className="text-sm text-red-500 mb-4 text-center bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}

        {!show2FA ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                  placeholder="Your email"
                  required
                />
                <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                  placeholder="Your password"
                  required
                />
                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-teal-600 hover:underline transition-all duration-300"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              Login
            </button>
            <p className="text-sm text-gray-600 text-center mt-4">
              No account?{' '}
              <Link
                to="/signup"
                className="text-teal-600 hover:underline font-semibold"
              >
                Sign up
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
              <span className="text-gray-400 text-2xl">↔</span>
              <img
                src={logo_authenticator}
                alt="Google Authenticator Logo"
                className="w-12 h-12"
              />
            </div>
            <p className="text-center text-sm text-gray-600">
              Enter the 6-digit code from your Google Authenticator app
            </p>
            <div className="flex justify-center">
              <OtpInput value={otp} onChange={setOtp} numInputs={6} />
            </div>
            <button
              type="button"
              disabled={otp.length < 6}
              onClick={handleSubmit2FA}
              className={`w-full px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-md ${
                otp.length < 6
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700'
              }`}
            >
              Verify
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;