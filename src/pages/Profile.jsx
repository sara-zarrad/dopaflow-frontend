import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaHistory, FaQrcode, FaKey, FaCheckCircle, FaTimesCircle, FaCamera, FaImages } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import api from '../utils/api';
import avatar1 from '../images/avatar1.png';
import avatar2 from '../images/avatar2.png';
import avatar3 from '../images/avatar3.png';
import avatar4 from '../images/avatar4.png';

// OtpInput component (unchanged)
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
      if (val && i < numInputs - 1) inputRefs.current[i + 1].focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1].focus();
  };

  return (
    <div className="flex space-x-2">
      {Array.from({ length: numInputs }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056B3] transition duration-150"
          value={digits[i]}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

const Profile = ({ setUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    twoFactorEnabled: false,
    lastLogin: null,
    loginHistory: [],
    profilePhotoUrl: '',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [otp, setOtp] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // To detect login redirect

  const defaultAvatars = [
    { src: avatar1, name: 'avatar1.png' },
    { src: avatar2, name: 'avatar2.png' },
    { src: avatar3, name: 'avatar3.png' },
    { src: avatar4, name: 'avatar4.png' },
  ];

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await api.get('/profile', { headers: { Authorization: `Bearer ${token}` } });
      const photoUrl = response.data.profilePhotoUrl
        ? `http://localhost:8080${response.data.profilePhotoUrl}`
        : '';
      setProfile({
        ...response.data,
        profilePhotoUrl: photoUrl,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setUser({
        ...response.data,
        profilePhotoUrl: photoUrl,
      });
      setError(''); // Clear error on success
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      navigate('/login');
    }
  };

  // Fetch profile data on mount, but only refresh if coming from login success
  useEffect(() => {
    const isFromLogin = location.state?.fromLogin; // Check if redirected from login
    fetchProfile().then(() => {
      if (isFromLogin) {
        fetchProfile(); // Refresh only on successful login
      }
    });
  }, [location, navigate, setUser]); // Depend on location to catch redirect
  useEffect(() => {
    const highlight = location.state?.highlight;
    const searchQuery = location.state?.searchQuery;
    const section = location.state?.section;
    if (highlight && searchQuery) {
      setActiveTab(highlight); // Switch to the highlighted tab
      // Highlight specific sections (e.g., add a class or style):
      if (section === 'twoFactor') {
        // Highlight 2FA text, e.g., in the 2FA div or button
        // Use a ref or state to apply `bg-yellow-200` to elements containing "2FA"
      } else if (section === 'passwordManagement') {
        // Highlight Password Management text or form elements
      } else if (section === 'avatars') {
        // Highlight Avatars grid or buttons
      } else if (section === 'profilePhoto') {
        // Highlight Profile Photo section or image
      } else if (section === 'username') {
        // Highlight Username input
      } else if (section === 'loginHistory') {
        // Highlight Login History button or modal content
      }
    }
  }, [location.state, setActiveTab]);
  const getInitials = (name = '') => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const payload = { username: profile.username };
      await api.put('/profile/update', payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchProfile(); // Refetch profile after update
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (profile.newPassword !== profile.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const payload = { currentPassword: profile.currentPassword, newPassword: profile.newPassword };
      await api.put('/profile/change-password', payload, { headers: { Authorization: `Bearer ${token}` } });
      setProfile((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
      setMessage('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    }
  };

  const handleEnable2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await api.post('/auth/2fa/enable', {}, { headers: { Authorization: `Bearer ${token}` } });
      setQrCodeUrl(response.data.qrUrl);
      setSecretKey(response.data.secret);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleVerify2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await api.post('/auth/2fa/verify', { code: otp }, { headers: { Authorization: `Bearer ${token}` } });
      setProfile((prev) => ({ ...prev, twoFactorEnabled: true }));
      setUser((prev) => ({ ...prev, twoFactorEnabled: true }));
      setMessage('2FA enabled successfully');
      setQrCodeUrl('');
      setSecretKey('');
      setShowManualPopup(false);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    }
  };

  const handleDisable2FA = () => {
    setError('');
    setMessage('');
    setIsDisabling2FA(true);
  };

  const handleVerifyDisable2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await api.post('/auth/2fa/verify', { code: disableOtp }, { headers: { Authorization: `Bearer ${token}` } });
      await api.put('/profile/update', { twoFactorEnabled: false }, { headers: { Authorization: `Bearer ${token}` } });
      setProfile((prev) => ({ ...prev, twoFactorEnabled: false }));
      setUser((prev) => ({ ...prev, twoFactorEnabled: false }));
      setMessage('2FA disabled successfully');
      setDisableOtp('');
      setIsDisabling2FA(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code or failed to disable 2FA');
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const token = localStorage.getItem('token');
      const uploadResponse = await api.post('/profile/upload-photo', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = `http://localhost:8080${uploadResponse.data.photoUrl}`;
      setProfile((prev) => ({ ...prev, profilePhotoUrl: photoUrl }));
      setUser((prev) => ({ ...prev, profilePhotoUrl: photoUrl }));
      setMessage('Photo uploaded successfully');
      clearMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed');
      clearMessage();
    }
  };

  const handleUploadAvatar = async (avatarSrc, avatarName) => {
    try {
      const response = await fetch(avatarSrc);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('photo', blob, avatarName);
      const token = localStorage.getItem('token');
      const uploadResponse = await api.post('/profile/upload-photo', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = `http://localhost:8080${uploadResponse.data.photoUrl}`;
      setProfile((prev) => ({ ...prev, profilePhotoUrl: photoUrl }));
      setUser((prev) => ({ ...prev, profilePhotoUrl: photoUrl }));
      setSelectedAvatar(avatarSrc);
      setMessage('Avatar uploaded successfully');
      clearMessage();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
      clearMessage();
    }
  };

  const lastLoginInfo = profile.loginHistory.length > 0 ? profile.loginHistory[profile.loginHistory.length - 1] : null;

  const TabButton = ({ id, icon, title }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center justify-center px-6 py-3 rounded-t-lg space-x-2 transition-all duration-200 ${
        activeTab === id ? 'bg-white text-[#0056B3] border-b-2 border-[#0056B3] shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-50 hover:shadow-sm'
      }`}
      aria-label={`Switch to ${title} tab`}
    >
      {icon}
      <span className="font-medium">{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 rounded-[10px] border">
      <div className="max-w-6xl mx-auto">
        <div className="flex space-x-1 mb-6 rounded-t-lg overflow-hidden bg-gray-200 shadow-md">
          <TabButton id="profile" icon={<FaUser className="text-lg" />} title="Profile" />
          <TabButton id="avatars" icon={<FaImages className="text-lg" />} title="Avatars" />
          <TabButton id="security" icon={<FaShieldAlt className="text-lg" />} title="Security" />
          <TabButton id="twoFactor" icon={<FaQrcode className="text-lg" />} title="2FA" />
        </div>
        <div className="bg-white rounded-b-xl rounded-r-xl rounded-l-xl shadow-lg p-8 border border-gray-200">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <FaUser className="text-[#0056B3] text-2xl" />
                <span>Profile Settings</span>
              </h2>
              {error && <div className="mb-6 bg-red-100 text-red-700 p-4 rounded-lg shadow-md">{error}</div>}
              {message && <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-lg shadow-md">{message}</div>}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-700 mb-4">Profile Photo</label>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-gray-300">
                    {profile.profilePhotoUrl && (
                      <img src={profile.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    )}
                    {!profile.profilePhotoUrl && (
                      <span
                        className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: '#0056B3' }}
                      >
                        {getInitials(profile.username)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col space-y-4">
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center space-x-2 px-4 py-2 bg-[#0056B3] text-white rounded-lg hover:bg-[#004499] cursor-pointer transition-all duration-200 shadow-md"
                    >
                      <FaCamera className="text-lg" />
                      <span>Upload Photo</span>
                    </label>
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="hidden"
                      aria-label="Upload profile photo"
                    />
                  </div>
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Profile update form">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B3] transition duration-200 shadow-sm"
                      required
                      aria-label="Username"
                    />
                    <FaUser className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-gray-200 cursor-not-allowed"
                      aria-label="Email"
                    />
                    <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-[#0056B3] text-white px-6 py-3 rounded-lg hover:bg-[#004499] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                    aria-label="Update profile"
                  >
                    <FaKey className="text-lg" />
                    <span>Update Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
          {activeTab === 'avatars' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <FaImages className="text-[#0056B3] text-2xl" />
                <span>Select Avatar</span>
              </h2>
              {error && <div className="mb-6 bg-red-100 text-red-700 p-4 rounded-lg shadow-md">{error}</div>}
              {message && <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-lg shadow-md">{message}</div>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {defaultAvatars.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleUploadAvatar(avatar.src, avatar.name)}
                    className={`w-32 h-32 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl ${
                      selectedAvatar === avatar.src ? 'ring-4 ring-[#0056B3]' : ''
                    }`}
                    aria-label={`Select avatar ${index + 1}`}
                  >
                    <img src={avatar.src} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'security' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                  <FaShieldAlt className="text-[#0056B3] text-2xl" />
                  <span>Security Dashboard</span>
                </h2>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center space-x-2 bg-[#0056B3]/10 text-[#0056B3] px-4 py-2 rounded-lg hover:bg-[#0056B3]/20 transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label="View login history"
                >
                  <FaHistory className="text-lg" />
                  <span>View History</span>
                </button>
              </div>
              {error && <div className="mb-6 bg-red-100 text-red-700 p-4 rounded-lg shadow-md">{error}</div>}
              {message && <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-lg shadow-md">{message}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">Recent Activity</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Last Activity:</span>
                      <span className="text-gray-900">
                        {lastLoginInfo ? new Date(lastLoginInfo.loginTime).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">IP Address:</span>
                      <span className="text-gray-900">{lastLoginInfo ? lastLoginInfo.ipAddress : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Location:</span>
                      <span className="text-gray-900">{lastLoginInfo ? lastLoginInfo.location : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Device:</span>
                      <span className="text-gray-900 truncate max-w-[200px]">
                        {lastLoginInfo?.deviceInfo?.substring(0, 30) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                  <h3 className="text-xl font-semibold text-orange-800 mb-4">Password Management</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4" aria-label="Password change form">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={profile.currentPassword}
                          onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B3] transition duration-200 shadow-sm"
                          required
                          aria-label="Current password"
                        />
                        <FaLock className="absolute left-3 top-3 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={profile.newPassword}
                          onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B3] transition duration-200 shadow-sm"
                          required
                          aria-label="New password"
                        />
                        <FaLock className="absolute left-3 top-3 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={profile.confirmNewPassword}
                          onChange={(e) => setProfile({ ...profile, confirmNewPassword: e.target.value })}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0056B3] transition duration-200 shadow-sm"
                          required
                          aria-label="Confirm new password"
                        />
                        <FaLock className="absolute left-3 top-3 text-gray-500" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                      aria-label="Change password"
                    >
                      <FaKey className="text-lg" />
                      <span>Change Password</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'twoFactor' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center space-x-3">
                <FaQrcode className="text-[#0056B3] text-2xl" />
                <span>Two-Factor Authentication</span>
              </h2>
              {error && <div className="mb-6 bg-red-100 text-red-700 p-4 rounded-lg shadow-md">{error}</div>}
              {message && <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-lg shadow-md">{message}</div>}
              <div className="max-w-lg mx-auto text-center">
                {profile.twoFactorEnabled ? (
                  isDisabling2FA ? (
                    <div className="space-y-6">
                      <p className="text-gray-600 text-lg font-medium px-4">
                        Enter the 6-digit code from your authenticator app to disable 2FA.
                      </p>
                      <div className="flex justify-center">
                        <OtpInput value={disableOtp} onChange={setDisableOtp} numInputs={6} />
                      </div>
                      <button
                        onClick={handleVerifyDisable2FA}
                        className="w-full bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2 shadow-md"
                        aria-label="Verify and disable 2FA"
                      >
                        <FaCheckCircle className="text-lg" />
                        <span>Verify and Disable</span>
                      </button>
                      <button
                        onClick={() => setIsDisabling2FA(false)}
                        className="w-full bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 flex items-center justify-center space-x-2 shadow-md"
                        aria-label="Cancel disable 2FA"
                      >
                        <FaTimesCircle className="text-lg" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="inline-block p-6 bg-green-100 rounded-full shadow-md border-2 border-green-200">
                        <FaCheckCircle className="text-4xl text-green-600" />
                      </div>
                      <p className="text-gray-600 text-lg font-medium">2FA is currently enabled on your account.</p>
                      <button
                        onClick={handleDisable2FA}
                        className="w-full bg-red-100 text-red-600 px-6 py-3 rounded-lg hover:bg-red-200 flex items-center justify-center space-x-2 shadow-md"
                        aria-label="Initiate disable 2FA"
                      >
                        <FaTimesCircle className="text-lg" />
                        <span>Disable 2FA</span>
                      </button>
                    </div>
                  )
                ) : qrCodeUrl ? (
                  <div className="space-y-6 relative">
                    <div className="flex justify-center mb-4">
                      <div className="p-6 bg-white rounded-xl shadow-lg border-2 border-[#0056B3]">
                        <QRCodeSVG value={qrCodeUrl} size={160} bgColor="#FFFFFF" fgColor="#0056B3" level="H" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-lg font-medium px-4">
                      Scan this QR code with your authenticator app and enter the 6-digit code below.
                    </p>
                    <button
                      onClick={() => setShowManualPopup(true)}
                      className="text-blue-600 text-sm underline hover:text-blue-800 focus:outline-none"
                      aria-label="Show manual entry details"
                    >
                      Can’t scan the QR code?
                    </button>
                    {showManualPopup && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-36 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-2xl p-5 w-80 z-20">
                        <div className="relative">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Manual 2FA Setup
                          </h3>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="flex justify-between">
                              <span className="font-medium text-gray-800">Name:</span>
                              <span className="text-gray-600 truncate">DopaFlow:{profile.email}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="font-medium text-gray-800">Key:</span>
                              <span className="text-gray-600 font-mono truncate">{secretKey}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="font-medium text-gray-800">Type:</span>
                              <span className="text-gray-600">Time-based (TOTP, 30s)</span>
                            </p>
                          </div>
                          <button
                            onClick={() => setShowManualPopup(false)}
                            className="mt-4 w-full py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md focus:outline-none"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center">
                      <OtpInput value={otp} onChange={setOtp} numInputs={6} />
                    </div>
                    <button
                      onClick={handleVerify2FA}
                      className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2 shadow-md"
                      aria-label="Verify 2FA code"
                    >
                      <FaCheckCircle className="text-lg" />
                      <span>Verify Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="inline-block p-6 bg-blue-100 rounded-full shadow-lg border-2 border-blue-200">
                      <FaQrcode className="text-4xl text-blue-600" />
                    </div>
                    <p className="text-gray-600 text-lg font-medium">
                      Two-factor authentication adds an extra layer of security.
                    </p>
                    <button
                      onClick={handleEnable2FA}
                      className="w-full bg-[#0056B3] text-white px-6 py-3 rounded-lg hover:bg-[#004499] flex items-center justify-center space-x-2 shadow-md"
                      aria-label="Enable 2FA"
                    >
                      <FaKey className="text-lg" />
                      <span>Enable 2FA</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {showHistoryModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              aria-labelledby="login-history-modal"
            >
              <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 id="login-history-modal" className="text-2xl font-bold text-gray-800">
                    Login History
                  </h3>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-600 hover:text-gray-800 text-2xl focus:outline-none"
                    aria-label="Close login history"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  {profile.loginHistory.length > 0 ? (
                    profile.loginHistory
                      .slice()
                      .reverse()
                      .map((login, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition duration-200"
                        >
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span>{' '}
                            {new Date(login.loginTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">IP Address:</span> {login.ipAddress}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {login.location || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            <span className="font-medium">Device:</span>{' '}
                            {login.deviceInfo?.substring(0, 50) || 'N/A'}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-600 text-center">No login history available.</p>
                  )}
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full mt-4 bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;