import React, { useState, useEffect } from 'react';
import { FaLock, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';
import logo_authenticator from '../images/google_authenticator_logo.png';
// Custom OTP input component for premium look
const OtpInput = ({ value, onChange, numInputs = 6 }) => {
  const inputRefs = React.useRef([]);

  // Break the OTP string into individual digits (or empty strings)
  const digits = Array.from({ length: numInputs }, (_, i) => value[i] || '');

  const handleChange = (e, i) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) { // Allow only digits
      let newDigits = [...digits];
      newDigits[i] = val.slice(-1); // Take only the last entered digit
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
    <div className="flex space-x-2">
      {Array.from({ length: numInputs }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-12 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          value={digits[i]}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [attempts, setAttempts] = useState(0); // Track 2FA attempts
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        setAttempts(0); // Reset attempts when starting 2FA
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/profile');
        window.location.reload();  // Forces the page to reload
      } else {
        setError('Unexpected login response');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleVerify2FA = async (code) => {
    setError('');
    
    setAttempts((prevAttempts) => {
      if (prevAttempts >= 2) {
        setError('Too many 2FA attempts. Redirecting to login...');
        setTimeout(() => {
          setRequires2FA(false);
          setOtp('');
          navigate('/login'); // Redirect after 2 seconds
          window.location.reload();  // Forces the page to reload
        }, 2000);
        return prevAttempts; // Prevent further increments
      }
  
      return prevAttempts + 1; // Correctly increment attempts
    });
  
    try {
      const response = await api.post(
        '/auth/verify-2fa',
        { code: parseInt(code) },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      localStorage.setItem('token', response.data.token);
      navigate('/profile');
      window.location.reload();  // Forces the page to reload
    } catch (err) {
      setError(
        err.response?.data?.message || 
        `Invalid 2FA code. ${2 - attempts} attempts remaining`
      );
    }
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !isNaN(otp)) {
      handleVerify2FA(otp);
    }
  }, [otp]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {!requires2FA ? 'Login' : 'Two-Factor Authentication'}
        </h1>
        {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}

        {!requires2FA ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  placeholder="Your email"
                  required
                />
                <FaUser className="absolute left-3 top-3 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  placeholder="Your password"
                  required
                />
                <FaLock className="absolute left-3 top-3 text-gray-500" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
            <button
  onClick={() => navigate('/forgot-password')}
  className="w-full mt-4 text-sm text-yellow-600 hover:underline transition-colors"
>
  Forgot Password?
</button>
            <p className="text-sm text-gray-600 text-center">
              No account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img
               src={logo_dopaflow}
                alt="Dopaflow Logo"
                className="w-12 h-12"
              />
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
              className={`w-full px-6 py-3 rounded-lg transition-all transform hover:scale-105 ${
                otp.length < 6
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
              }`}
              onClick={() => otp.length === 6 && handleVerify2FA(otp)}
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