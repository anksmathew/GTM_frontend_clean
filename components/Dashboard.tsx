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
      <nav className="flex space-x-1 bg-white rounded-lg p-1 border border-[#E5E7EB]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center px-4 py-2.5 text-sm font-medium rounded-md
              transition-all duration-150 ease-in-out
              ${activeTab === tab.id 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-[#181C2A] hover:bg-green-50 hover:text-green-700'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {activeTab === 'channels' && <ChannelsPage />}
        {activeTab === 'campaigns' && <ProductList />}
        {activeTab === 'personas' && <PersonaManager />}
      </div>
    </div>
  );
};

export default Dashboard; 