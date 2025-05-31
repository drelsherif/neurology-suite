import React from 'react';

const Card = ({ 
  title, 
  icon: Icon, 
  description, 
  onClick, 
  className = '', 
  children,
  disabled = false 
}) => {
  return (
    <div
      className={`
        bg-slate-700 p-6 rounded-lg shadow-md transition-all duration-200
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-lg hover:bg-slate-600 cursor-pointer'
        }
        flex flex-col items-center text-center
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
    >
      {Icon && (
        <Icon 
          size={48} 
          className={`mb-4 ${disabled ? 'text-gray-500' : 'text-blue-400'}`} 
        />
      )}
      
      {title && (
        <h3 className={`text-xl font-semibold mb-2 ${disabled ? 'text-gray-400' : 'text-white'}`}>
          {title}
        </h3>
      )}
      
      {description && (
        <p className={`${disabled ? 'text-gray-500' : 'text-slate-300'} mb-4`}>
          {description}
        </p>
      )}
      
      {children}
    </div>
  );
};

export default Card;