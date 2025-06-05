"use client";
import React, { useState } from 'react';
import ChannelsPage from './ChannelsPage';
import ProductList from './ProductList';
import PersonaManager from './PersonaManager';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('channels');
  
  const tabs = [
    { id: 'channels', label: 'Channels', icon: '📊' },
    { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
    { id: 'personas', label: 'Personas', icon: '👥' },
  ];

  return (
    <div className="space-y-8">
      <nav className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center px-4 py-2.5 text-sm font-medium rounded-lg
              transition-all duration-200 ease-in-out
              ${activeTab === tab.id 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {activeTab === 'channels' && <ChannelsPage />}
        {activeTab === 'campaigns' && <ProductList />}
        {activeTab === 'personas' && <PersonaManager />}
      </div>
    </div>
  );
};

export default Dashboard; 