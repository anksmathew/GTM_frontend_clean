import React from 'react';
import { FaLinkedin, FaGlobe, FaEnvelope, FaGithub } from 'react-icons/fa';

export default function SupportPage() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-[80vh] w-full bg-white relative overflow-hidden">
      {/* Left: Profile Image */}
      <div className="flex-1 flex items-center justify-center relative z-10 min-w-[260px]">
        {/* Decorative shapes */}
        <div className="absolute left-0 top-0 w-64 h-64 bg-pink-500 rounded-full opacity-30 -z-10" style={{filter:'blur(20px)'}} />
        {/* User's image behind the profile circle */}
        <img src="/profile.jpg" alt="Ankita Mathew" className="absolute left-20 top-32 w-32 h-32 object-cover rounded-lg shadow-lg -z-10" />
        {/* Placeholder profile image */}
        <div className="relative z-10 flex items-center justify-center">
          <span className="inline-block w-56 h-56 rounded-full bg-pink-400 flex items-center justify-center text-[6rem] shadow-lg border-8 border-white">
            <span role="img" aria-label="profile">👩‍💻</span>
          </span>
        </div>
      </div>
      {/* Right: Info */}
      <div className="flex-1 flex flex-col justify-center items-start max-w-xl px-6 py-10 md:py-0">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#181C2A] mb-2">
          Hello, I'm <span className="text-pink-600">Ankita Mathew</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-pink-500 mb-4">Engineer turned Marketeer</h2>
        <p className="text-[#181C2A] text-base md:text-lg mb-4">
          I built this tool to help manage my product launches and marketing campaigns. It's a work in progress, but a great start to what I can build!<br/>
          If you'd like to connect, collaborate, or just say hi, feel free to reach out below.
        </p>
        <a href="mailto:ankita@modemhive.com" className="inline-block mb-4 px-6 py-2 rounded-full bg-pink-500 text-white font-semibold shadow hover:bg-pink-600 transition">GET IN TOUCH!</a>
        <div className="flex items-center gap-4 mb-2">
          <a href="mailto:ankita@modemhive.com" className="text-[#181C2A] hover:text-pink-500 text-lg flex items-center gap-2">
            <FaEnvelope /> ankita@modemhive.com
          </a>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <a href="https://www.linkedin.com/in/ankita-elizabeth-mathew/" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 text-2xl">
            <FaLinkedin />
          </a>
          <a href="https://ankitaelizabethmathew.com" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 text-2xl">
            <FaGlobe />
          </a>
          <a href="https://github.com/anksmathew" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 text-2xl">
            <FaGithub />
          </a>
        </div>
      </div>
      {/* Bottom right decorative shape */}
      <div className="hidden md:block absolute bottom-0 right-0 w-80 h-48 bg-pink-300 rounded-tl-[120px] rounded-br-full opacity-80 -z-10" />
    </div>
  );
} 