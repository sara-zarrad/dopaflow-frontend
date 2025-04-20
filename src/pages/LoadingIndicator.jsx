
import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingIndicator = () => {
  return (
    <div className="inset-0 flex items-left justify-left z-50">
      <FaSpinner className="animate-spin text-blue-600 text-2xl" />
    </div>
  );
};

export default LoadingIndicator;