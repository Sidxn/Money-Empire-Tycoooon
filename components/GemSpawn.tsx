import React, { useEffect, useState } from 'react';

interface Props {
  x: number;
  y: number;
  onClick: () => void;
}

const GemSpawn: React.FC<Props> = ({ x, y, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`fixed z-[60] text-5xl cursor-pointer transition-all duration-500 transform hover:scale-110 active:scale-90 outline-none select-none
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`, 
        textShadow: '0 0 20px rgba(6, 182, 212, 0.8)' 
      }}
      aria-label="Collect Gem"
    >
      <div className="animate-bounce drop-shadow-lg">💎</div>
    </button>
  );
};

export default GemSpawn;