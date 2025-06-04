"use client";
import React, { useState } from 'react';
import ChannelsPage from './ChannelsPage';
import ProductList from './ProductList';
import PersonaManager from './PersonaManager';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('channels');
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex gap-4 border-b mb-8">
        <button
          className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === 'channels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('channels')}
        >
          Channels
        </button>
        <button
          className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === 'campaigns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns
        </button>
        <button
          className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === 'personas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setActiveTab('personas')}
        >
          Personas
        </button>
      </div>
      <div>
        {activeTab === 'channels' && <ChannelsPage />}
        {activeTab === 'campaigns' && <ProductList />}
        {activeTab === 'personas' && <PersonaManager />}
      </div>
    </div>
  );
};

export default Dashboard; 