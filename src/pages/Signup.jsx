import React, { useState } from 'react';
import { FaUser, FaLock, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Basic required field validation
    if (!firstName || !lastName || !email || !birthDate || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // Validate username length
    const username = `${firstName} ${lastName}`;
    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate birthdate format
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDateRegex.test(birthDate)) {
      setError('Birth date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        role: 'User',
        birthdate: birthDate,
      });
      if (response.status === 201) {
        alert('Signup successful! Please check your email to verify your account.');
        navigate('/login');
      } else {
        // Handle unexpected status codes
        setError('Unexpected response from server. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err.response); // Log the full error for debugging
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || 'Signup failed. Please check your input and try again.');
      } else {
        setError('An error occurred while signing up. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#333] mb-6 text-center">Signup</h1>
        {error && <p className="text-sm text-[#DC3545] mb-4">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">First Name</label>
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                placeholder="Your first name"
                required
              />
              <FaUser className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Last Name</label>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                placeholder="Your last name"
                required
              />
              <FaUser className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                placeholder="Your email"
                required
              />
              <FaEnvelope className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Birth Date</label>
            <div className="relative">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                placeholder="Your password"
                required
              />
              <FaLock className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                placeholder="Confirm your password"
                required
              />
              <FaLock className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499]"
          >
            Sign Up
          </button>
          <p className="text-sm text-[#666] text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0056B3] hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;