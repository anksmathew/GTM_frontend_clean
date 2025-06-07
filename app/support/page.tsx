import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';

export default function AboutMePage() {
  return (
    <div className="flex flex-col lg:flex-row gap-10 w-full h-full">
      {/* Left Section */}
      <div className="flex-1 flex flex-col justify-center gap-6 max-w-xl">
        <div>
          <h1 className="text-4xl font-bold text-[#181C2A] mb-2">Hi! I'm Ankita Mathew</h1>
          <p className="text-lg text-[#64748b]">I'm an engineer turned marketeer, and this is a tool I built to help me manage my product launches. Of course this isn't complete, but it's a start to what I can build.</p>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-[#181C2A] mb-2">Skills</h2>
          <ul className="list-disc pl-5 text-[#64748b]">
            <li>Product Management</li>
            <li>Marketing</li>
            <li>Engineering</li>
            <li>Web Development</li>
          </ul>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-[#181C2A] mb-2">Connect With Me</h2>
          <div className="flex gap-4">
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="text-[#007acc] hover:text-[#0062a3]">
              <FaGithub className="w-6 h-6" />
            </a>
            <a href="https://www.linkedin.com/in/ankita-elizabeth-mathew/" target="_blank" rel="noopener noreferrer" className="text-[#007acc] hover:text-[#0062a3]">
              <FaLinkedin className="w-6 h-6" />
            </a>
            <a href="mailto:ankitaemathew@gmail.com" className="text-[#007acc] hover:text-[#0062a3]">
              <FaEnvelope className="w-6 h-6" />
            </a>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary">Get In Touch</button>
        </div>
      </div>
      {/* Right Section - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="w-full max-w-md aspect-square bg-gradient-to-br from-[#e6f3ff] to-[#f8fafc] rounded-3xl flex items-center justify-center shadow-xl">
          {/* Placeholder SVG illustration */}
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="150" rx="70" ry="20" fill="#e2e8f0" />
            <rect x="60" y="60" width="60" height="60" rx="20" fill="#007acc" />
            <circle cx="90" cy="90" r="18" fill="#f8fafc" />
            <rect x="80" y="110" width="20" height="10" rx="5" fill="#22c55e" />
          </svg>
        </div>
      </div>
    </div>
  );
} 