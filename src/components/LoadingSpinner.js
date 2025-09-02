import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '', 
  className = '',
  variant = 'primary' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'border-blue-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin border-4 rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`}
        role="status"
        aria-label={text || "로딩 중"}
      />
      {text && (
        <p className={`mt-3 text-gray-600 ${textSizes[size]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;