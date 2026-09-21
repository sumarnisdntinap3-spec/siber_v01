import React from 'react';

interface TutWuriHandayaniLogoProps {
  className?: string;
  size?: number | string;
}

export const TutWuriHandayaniLogo: React.FC<TutWuriHandayaniLogoProps> = ({
  className = 'w-full h-full object-contain',
}) => {
  return (
    <img
      src="/tut-wuri-handayani.svg"
      alt="Logo Tut Wuri Handayani"
      className={className}
      onError={(e) => {
        // Fallback to logo.svg if needed
        const target = e.currentTarget;
        if (!target.src.includes('logo.svg')) {
          target.src = '/logo.svg';
        }
      }}
    />
  );
};

export default TutWuriHandayaniLogo;
