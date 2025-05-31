import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'primary',
  size = 'medium',
  loading = false,
  type = 'button'
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: disabled 
      ? 'bg-gray-500 text-gray-300' 
      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:ring-blue-500',
    secondary: disabled
      ? 'bg-gray-500 text-gray-300'
      : 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500',
    danger: disabled
      ? 'bg-gray-500 text-gray-300'
      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: disabled
      ? 'bg-gray-500 text-gray-300'
      : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    outline: disabled
      ? 'border-gray-400 text-gray-400'
      : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white border-2 focus:ring-blue-500'
  };
  
  const sizes = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;