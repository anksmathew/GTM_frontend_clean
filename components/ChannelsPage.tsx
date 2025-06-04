'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChannelDetailModal, { Channel, ChannelWithHistory } from './ChannelDetailModal';

const statusColors: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Paused': 'bg-yellow-100 text-yellow-700',
  'Inactive': 'bg-gray-100 text-gray-700',
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
    axios.get<{ channels: ChannelWithHistory[] }>('http://localhost:3001/api/channels')
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
    await axios.put(`http://localhost:3001/api/channels/${channel.id}`, { ...channel, status: newStatus });
    setChannels(channels.map(c => c.id === channel.id ? { ...c, status: newStatus } : c));
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`http://localhost:3001/api/channels/${id}`);
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
    alert('Saving channel: ' + JSON.stringify(updatedChannel, null, 2));
    console.log('Saving channel:', updatedChannel);
    if (editChannel) {
      const res = await axios.put(`http://localhost:3001/api/channels/${editChannel.id}`, updatedChannel);
      console.log('Backend response:', res.data);
      const refreshed = await axios.get(`http://localhost:3001/api/channels/${editChannel.id}`);
      setChannels(channels.map(c => c.id === editChannel.id ? refreshed.data.channel : c));
      setEditChannel(refreshed.data.channel);
      setSelectedChannel(refreshed.data.channel);
    } else {
      const response = await axios.post('http://localhost:3001/api/channels', updatedChannel);
      setChannels([...channels, response.data]);
    }
    setShowEditModal(false);
    setEditChannel(undefined);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
        <button
          onClick={() => { setEditChannel(undefined); setShowEditModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
        >
          + New Channel
        </button>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {channels.map(channel => {
          const percent = channel.budget ? Math.min(100, Math.round((channel.spend / channel.budget) * 100)) : 0;
          return (
            <div 
              key={channel.id} 
              className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border hover:shadow-lg transition relative cursor-pointer"
              onClick={() => handleViewDetails(channel)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[channel.type] || '📊'}</span>
                <div className="flex-1">
                  <div className="font-bold text-lg">{channel.name}</div>
                  <div className="text-xs text-gray-500">{channel.type}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[channel.status] || 'bg-gray-100 text-gray-700'}`}>{channel.status}</span>
                <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none"
                    onClick={() => setOpenMenuId(openMenuId === channel.id ? null : channel.id ?? null)}
                    aria-label="Actions"
                  >
                    <span className="text-xl">&#8942;</span>
                  </button>
                  {openMenuId === channel.id && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow-lg z-10 flex flex-col text-sm">
                      <button className="px-4 py-2 text-left hover:bg-gray-100" onClick={() => handleViewDetails(channel)}>View Details</button>
                      <button className="px-4 py-2 text-left hover:bg-gray-100" onClick={() => handleEdit(channel)}>Edit</button>
                      <button className="px-4 py-2 text-left hover:bg-gray-100" onClick={() => { handlePause(channel); setOpenMenuId(null); }}>{channel.status === 'Active' ? 'Pause' : 'Resume'}</button>
                      <button className="px-4 py-2 text-left text-red-600 hover:bg-gray-100" onClick={() => { setDeleteChannelId(channel.id ?? null); setDeleteChannelName(channel.name); setOpenMenuId(null); }}>Delete</button>
                      <button className="px-4 py-2 text-left hover:bg-gray-100">Duplicate</button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Budget</span>
                  <span>${channel.spend} / ${channel.budget}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <div>
                  <span className="font-semibold">CTR:</span> {(channel.ctr * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-semibold">Conv:</span> {(channel.conversion_rate * 100).toFixed(1)}%
                </div>
                <div>
                  <span className="font-semibold">ROI:</span> {channel.roi}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showEditModal && editChannel && (
        <ChannelDetailModal
          channel={editChannel}
          onClose={() => { setShowEditModal(false); setEditChannel(undefined); }}
          onEdit={handleSaveEdit}
        />
      )}

      {showDetailModal && selectedChannel && (
        <ChannelDetailModal
          channel={selectedChannel}
          onClose={() => { setShowDetailModal(false); setSelectedChannel(undefined); }}
          onEdit={handleEdit}
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