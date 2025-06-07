'use client';
import React from 'react';
import { FaTachometerAlt, FaTasks, FaCalendarAlt, FaUserFriends, FaEnvelope, FaChartBar, FaCog, FaQuestionCircle } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { section: 'Marketing (To be built next)', items: [
    { label: 'Forms', icon: <FaEnvelope />, active: false },
    { label: 'Emails', icon: <FaEnvelope />, active: false },
    { label: 'Social Media Ads', icon: <FaChartBar />, active: false },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col justify-between h-full w-64 bg-[#181C2A] rounded-2xl p-6 shadow-lg">
      <div>
        <div className="flex items-center mb-10">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">C</div>
          <span className="text-xl font-bold text-white">Catapult</span>
        </div>
        <nav className="space-y-8">
          <div>
            <div className="text-xs uppercase text-[#7C8DB5] font-bold mb-2">Main</div>
            <ul className="space-y-1">
              <li>
                <Link href="/" legacyBehavior>
                  <a className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold ${pathname === '/' ? 'bg-[#232946] text-white' : 'text-[#A0AEC0] hover:bg-[#232946] hover:text-white'}`}>
                    <FaTachometerAlt className="text-lg" /> Dashboard
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/tasks" legacyBehavior>
                  <a className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold ${pathname === '/tasks' ? 'bg-[#232946] text-white' : 'text-[#A0AEC0] hover:bg-[#232946] hover:text-white'}`}>
                    <FaTasks className="text-lg" /> Task
                  </a>
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#A0AEC0] hover:bg-[#232946] hover:text-white">
                  <FaCalendarAlt className="text-lg" /> Calendar
                </a>
              </li>
            </ul>
          </div>
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="text-xs uppercase text-[#7C8DB5] font-bold mb-2 mt-4">{section.section}</div>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href="#"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold ${item.active ? 'bg-[#232946] text-white' : 'text-[#A0AEC0] hover:bg-[#232946] hover:text-white'}`}
                    >
                      <span className="text-lg">{item.icon}</span> {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="text-xs uppercase text-[#7C8DB5] font-bold mb-2 mt-4">Help and Support</div>
            <ul className="space-y-1">
              <li>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#A0AEC0] hover:bg-[#232946] hover:text-white">
                  <FaQuestionCircle className="text-lg" /> Help and Support
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#A0AEC0] hover:bg-[#232946] hover:text-white">
                  <FaCog className="text-lg" /> Settings
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="flex items-center gap-3 mt-10 p-3 rounded-lg bg-[#232946]">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">AEM</div>
        <div>
          <div className="text-sm font-semibold text-white">Ankita Mathew</div>
          <div className="text-xs text-[#A0AEC0]">ankitaemathew@gmail.com</div>
        </div>
      </div>
    </aside>
  );
} 