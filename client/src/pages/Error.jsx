import React from 'react';
import { useNavigate } from 'react-router-dom';

const Error = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">404</p>
        <h1 className="text-base font-medium text-gray-900 mb-1">Page not found</h1>
        <p className="text-xs text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default Error;