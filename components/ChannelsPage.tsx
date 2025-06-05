'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChannelDetailModal, { ChannelWithHistory } from './ChannelDetailModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const statusColors: Record<string, string> = {
  'Active': 'bg-success-100 text-success-700',
  'Paused': 'bg-warning-100 text-warning-700',
  'Inactive': 'bg-neutral-100 text-neutral-700',
};

const typeIcons: Record<string, string> = {
  'Email': '✉️',
  'Social': '📱',
  'Paid Ads': '💰',
  'Content': '📝',
  'Events': '🎤',
  'SEO': '🔍',
  'Partnerships': '🤝',
  'Direct Sales': '📞',
  'PR': '📰',
};

const ChannelsPage = () => {
  const [channels, setChannels] = useState<ChannelWithHistory[]>([]);
  const [editChannel, setEditChannel] = useState<ChannelWithHistory | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithHistory | undefined>(undefined);
  const [deleteChannelId, setDeleteChannelId] = useState<number | null>(null);
  const [deleteChannelName, setDeleteChannelName] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get<{ channels: ChannelWithHistory[] }>(`${API_URL}/api/channels`)
      .then(res => {
        setChannels(res.data.channels);
      })
      .catch(() => {
        setError('Could not load channels. Showing sample data.');
        setChannels([
          { id: 1, name: 'Email Marketing', type: 'Email', status: 'Active', budget: 5000, spend: 1200, roi: 2.5, ctr: 0.18, conversion_rate: 0.04 },
          { id: 2, name: 'Social Media', type: 'Social', status: 'Active', budget: 8000, spend: 3000, roi: 1.8, ctr: 0.12, conversion_rate: 0.03 },
        ]);
      });
  }, []);

  const handlePause = async (channel: ChannelWithHistory) => {
    const newStatus = channel.status === 'Active' ? 'Paused' : 'Active';
    await axios.put(`${API_URL}/api/channels/${channel.id}`, { ...channel, status: newStatus });
    setChannels(channels.map(c => c.id === channel.id ? { ...c, status: newStatus } : c));
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/api/channels/${id}`);
    setChannels(channels.filter(c => c.id !== id));
    setDeleteChannelId(null);
    setDeleteChannelName('');
  };

  const handleEdit = (channel: ChannelWithHistory) => {
    setEditChannel(channel);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = (channel: ChannelWithHistory) => {
    setSelectedChannel(channel);
    setShowDetailModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (updatedChannel: ChannelWithHistory) => {
    console.log('handleSaveEdit called, updatedChannel:', updatedChannel);
    // Ensure required backend fields are present and valid
    const payload = {
      name: updatedChannel.name || '',
      type: updatedChannel.type || '',
      status: updatedChannel.status || 'Active',
      budget: updatedChannel.budget ?? 0,
      spend: updatedChannel.spend ?? 0,
      roi: updatedChannel.roi ?? 0,
      ctr: updatedChannel.ctr ?? 0,
      conversion_rate: updatedChannel.conversion_rate ?? 0,
      kpis: '',
      integration_settings: '',
      historicalCTR: Array.isArray(updatedChannel.historicalCTR) ? updatedChannel.historicalCTR : [],
      historicalConversionRate: Array.isArray(updatedChannel.historicalConversionRate) ? updatedChannel.historicalConversionRate : [],
      recommendations: Array.isArray(updatedChannel.recommendations) ? updatedChannel.recommendations : [],
    };
    if (updatedChannel.id !== undefined) {
      await axios.put(`${API_URL}/api/channels/${updatedChannel.id}`, payload);
    } else {
      await axios.post(`${API_URL}/api/channels`, payload);
    }
    setShowEditModal(false);
    setEditChannel(undefined);
    const refreshed = await axios.get(`${API_URL}/api/channels`);
    setChannels(refreshed.data.channels);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">Marketing Channels</h2>
        <button
          onClick={() => {
            setEditChannel({
              name: '',
              type: 'Email',
              budget: 0,
              spend: 0,
              ctr: 0,
              conversion_rate: 0,
              roi: 0,
              status: 'Active',
              target_ctr: 0,
              target_conversion: 0,
              target_roi: 0,
              api_key: '',
              tracking_code: '',
              assigned_campaigns: [],
              assigned_personas: [],
              historicalCTR: [],
              historicalConversionRate: [],
              monthlySpend: [],
              recommendations: [],
            });
            setShowEditModal(true);
          }}
          className="btn btn-primary"
        >
          Add Channel
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{typeIcons[channel.type] || '📊'}</span>
                <div>
                  <h3 className="font-medium text-neutral-900">{channel.name}</h3>
                  <p className="text-sm text-neutral-500">{channel.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[channel.status]}`}>
                {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Budget Spent</span>
                  <span className="font-medium text-neutral-900">
                    ${channel.spend.toLocaleString()} / ${channel.budget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${(channel.spend / channel.budget) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(channel);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(channel);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEditModal && editChannel && (
        <ChannelDetailModal
          channel={editChannel}
          onClose={() => {
            setShowEditModal(false);
            setEditChannel(undefined);
          }}
          onEdit={handleSaveEdit}
        />
      )}

      {showDetailModal && selectedChannel && (
        <ChannelDetailModal
          channel={selectedChannel}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedChannel(undefined);
          }}
          onEdit={handleSaveEdit}
          isViewOnly={true}
        />
      )}

      {deleteChannelId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              onClick={() => { setDeleteChannelId(null); setDeleteChannelName(''); }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Delete Channel</h2>
            <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{deleteChannelName}</span>?</p>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                onClick={() => { setDeleteChannelId(null); setDeleteChannelName(''); }}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                onClick={() => handleDelete(deleteChannelId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsPage; 