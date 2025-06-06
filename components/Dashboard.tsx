"use client";
import React, { useState } from 'react';
import ChannelsPage from './ChannelsPage';
import ProductList from './ProductList';
import PersonaManager from './PersonaManager';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  
  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
    { id: 'channels', label: 'Channels', icon: '📊' },
    { id: 'personas', label: 'Personas', icon: '👥' },
  ];

  return (
    <div className="space-y-8">
      <nav className="flex space-x-1 bg-[#1a1a1a] rounded-lg p-1 border border-[#374151]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center px-4 py-2.5 text-sm font-medium rounded-md
              transition-all duration-150 ease-in-out
              ${activeTab === tab.id 
                ? 'bg-[#007acc] text-white shadow-sm' 
                : 'text-[#e5e5e5] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-[#1a1a1a] rounded-lg border border-[#374151] overflow-hidden">
        {activeTab === 'channels' && <ChannelsPage />}
        {activeTab === 'campaigns' && <ProductList />}
        {activeTab === 'personas' && <PersonaManager />}
      </div>
    </div>
  );
};

export default Dashboard; 