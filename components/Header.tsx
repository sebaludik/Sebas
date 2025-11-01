import React from 'react';

interface HeaderProps {
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={onReset}
        >
          <svg
            className="w-8 h-8 text-purple-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            <path d="M15.5 4l-1.5-1.5-4 4 1.5 1.5 4-4zM8.5 4l1.5-1.5 4 4-1.5 1.5-4-4z" />
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
          </svg>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Gemini Expression Editor
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
