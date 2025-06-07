import React from 'react';
import { FaLinkedin, FaGlobe } from 'react-icons/fa';

export default function AboutMePage() {
  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left: Vertical HELLO */}
      <div className="flex flex-col justify-between w-1/2 p-0">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-[10vw] font-extrabold text-[#232946] tracking-tight" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '-0.05em', lineHeight: 1 }}>
            HELLO
          </h1>
        </div>
        <div className="pb-8 pl-8">
          <span className="text-2xl font-extrabold text-[#232946] tracking-wide">ENJOY THE MOMENT</span>
        </div>
      </div>
      {/* Right: Image and Icons */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-full h-full max-w-xl max-h-[80vh] aspect-square bg-[#fff] overflow-hidden flex items-center justify-center" style={{boxShadow: '0 8px 32px rgba(0,0,0,0.10)'}}>
          {/* Replace src with your own image if available */}
          <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=600&q=80" alt="Profile" className="object-cover w-full h-full" />
        </div>
        <div className="flex flex-row gap-6 mt-6">
          <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="text-[#007acc] hover:text-[#005580] transition-colors" aria-label="LinkedIn">
            <FaLinkedin className="w-10 h-10" />
          </a>
          <a href="https://yourwebsite.com" target="_blank" rel="noopener noreferrer" className="text-[#007acc] hover:text-[#005580] transition-colors" aria-label="Website">
            <FaGlobe className="w-10 h-10" />
          </a>
        </div>
      </div>
    </div>
  );
} 