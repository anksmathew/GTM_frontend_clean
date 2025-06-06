'use client';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ChannelDetailModal, { ChannelWithHistory } from './ChannelDetailModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const statusColors: Record<string, string> = {
  'Active': 'bg-success-100 text-success-700',
  'Paused': 'bg-warning-100 text-warning-700',
  'Delayed': 'bg-neutral-100 text-neutral-700',
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
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'spend' | 'budget'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [statusOrder, setStatusOrder] = useState(['Active', 'Paused', 'Delayed']);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  useEffect(() => {
    function handleMenuClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleMenuClickOutside);
    } else {
      document.removeEventListener('mousedown', handleMenuClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleMenuClickOutside);
  }, [openMenuId]);

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Status', value: 'status' },
    { label: 'Launch Date', value: 'launch_date' },
    { label: 'Budget', value: 'budget' },
  ];

  // Filter, sort, and search channels
  const filteredChannels = channels
    .filter(channel => channel.name.toLowerCase().includes(search.toLowerCase()))
    .filter(channel => (typeFilter ? channel.type === typeFilter : true))
    .sort((a, b) => {
      let aValue = a[sortField] ?? '';
      let bValue = b[sortField] ?? '';
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Group filtered channels by status
  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    const status = channel.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(channel);
    return acc;
  }, {} as Record<string, ChannelWithHistory[]>);

  useEffect(() => {
    axios.get<{ channels: ChannelWithHistory[] }>(`${API_URL}/api/channels`)
      .then(res => {
        // Calculate total spend from monthlySpend for each channel
        const channelsWithCalculatedSpend = res.data.channels.map(channel => ({
          ...channel,
          spend: channel.monthlySpend?.reduce((sum, v) => sum + v, 0) ?? channel.spend ?? 0
        }));
        setChannels(channelsWithCalculatedSpend);
      })
      .catch(() => {
        setError('Could not load channels. Showing sample data.');
        const sampleChannels = [
          { 
            id: 1, 
            name: 'Email Marketing', 
            type: 'Email', 
            status: 'Active', 
            budget: 5000, 
            spend: 1200, 
            roi: 2.5, 
            ctr: 0.18, 
            conversion_rate: 0.04,
            monthlySpend: [200, 200, 200, 200, 200, 200, 0, 0, 0, 0, 0, 0]
          },
          { 
            id: 2, 
            name: 'Social Media', 
            type: 'Social', 
            status: 'Active', 
            budget: 8000, 
            spend: 3000, 
            roi: 1.8, 
            ctr: 0.12, 
            conversion_rate: 0.03,
            monthlySpend: [500, 500, 500, 500, 500, 500, 0, 0, 0, 0, 0, 0]
          },
        ];
        setChannels(sampleChannels);
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

  const handleEdit = async (channel: ChannelWithHistory) => {
    // Fetch the latest data for this channel
    const res = await axios.get(`${API_URL}/api/channels/${channel.id}`);
    setEditChannel(res.data.channel);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = async (channel: ChannelWithHistory) => {
    const res = await axios.get(`${API_URL}/api/channels/${channel.id}`);
    setSelectedChannel(res.data.channel);
    setShowDetailModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (updatedChannel: ChannelWithHistory) => {
    console.log('handleSaveEdit called, updatedChannel:', updatedChannel);
    // Calculate total spend from monthlySpend if available
    const totalSpend = updatedChannel.monthlySpend?.reduce((sum, v) => sum + v, 0) ?? updatedChannel.spend ?? 0;
    
    // Ensure required backend fields are present and valid
    const payload = {
      name: updatedChannel.name || '',
      type: updatedChannel.type || '',
      status: updatedChannel.status || 'Active',
      budget: updatedChannel.budget ?? 0,
      spend: totalSpend,
      roi: updatedChannel.roi ?? 0,
      ctr: updatedChannel.ctr ?? 0,
      conversion_rate: updatedChannel.conversion_rate ?? 0,
      kpis: '',
      integration_settings: '',
      historicalCTR: Array.isArray(updatedChannel.historicalCTR) ? updatedChannel.historicalCTR : [],
      historicalConversionRate: Array.isArray(updatedChannel.historicalConversionRate) ? updatedChannel.historicalConversionRate : [],
      recommendations: Array.isArray(updatedChannel.recommendations) ? updatedChannel.recommendations : [],
      monthlySpend: Array.isArray(updatedChannel.monthlySpend) ? updatedChannel.monthlySpend : [],
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

  // Handle drag end
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (type === 'column') {
      // Column reordering
      const newOrder = Array.from(statusOrder);
      const [removed] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, removed);
      setStatusOrder(newOrder);
      return;
    }
    // Card drag
    if (source.droppableId === destination.droppableId) return;
    const channelId = parseInt(draggableId, 10);
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    const newStatus = destination.droppableId;
    await axios.put(`${API_URL}/api/channels/${channelId}`, { ...channel, status: newStatus });
    setChannels(channels.map(c => c.id === channelId ? { ...c, status: newStatus } : c));
  };

  // Helper to ensure id is number or null
  function safeId(id: unknown): number | null {
    return typeof id === 'number' ? id : null;
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-6">
          <button
            className="text-base font-semibold px-1 pb-2 transition-colors duration-150 border-b-2 text-green-600 border-green-600"
            style={{ background: 'none', boxShadow: 'none' }}
            disabled
          >
            All Channels
          </button>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Email">Email</option>
            <option value="Social">Social</option>
            <option value="Paid Ads">Paid Ads</option>
            <option value="Content">Content</option>
            <option value="Events">Events</option>
            <option value="SEO">SEO</option>
            <option value="Partnerships">Partnerships</option>
            <option value="Direct Sales">Direct Sales</option>
            <option value="PR">PR</option>
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
            <input
              className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 w-48"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 relative">
            <button
              className="ml-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
            >
              Sort
            </button>
            {showSortMenu && (
              <div
                ref={sortMenuRef}
                className="absolute left-0 top-full w-48 bg-white rounded-2xl shadow-lg z-50 py-2"
                style={{ border: 'none' }}
              >
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-6 py-2 text-sm font-medium flex items-center gap-2 transition-colors
                      ${sortField === opt.value ? 'text-gray-900 font-bold bg-gray-50' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => {
                      if (sortField === opt.value) {
                        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField(opt.value as any);
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span>{opt.label}{sortField === opt.value && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-5 py-2 text-sm shadow"
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
          >
            + Add Channel
          </button>
        </div>
      </div>
      <div className="border-b border-gray-200 mb-6" />

      {/* Kanban Board */}
      <DragDropContext
        onDragEnd={onDragEnd}
        onDragStart={result => setDraggingId(result.draggableId)}
        onDragUpdate={result => setDraggingId(result.draggableId)}
      >
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {statusOrder.map((status, idx) => (
                <Draggable draggableId={status} index={idx} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-[#F4F5F7] rounded-xl p-4 min-h-[500px] flex flex-col ${snapshot.isDragging ? 'ring-2 ring-green-400 scale-[1.02] z-30' : ''}`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4" {...provided.dragHandleProps}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status === 'Active' ? 'bg-green-100 text-green-700' : status === 'Paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>{status === 'Delayed' ? 'Delayed' : status}</span>
                          <span className="text-xs text-gray-500 font-medium">{groupedChannels[status]?.length || 0}</span>
                        </div>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200 transition"
                          onClick={() => {
                            setEditChannel({
                              name: '',
                              type: 'Email',
                              budget: 0,
                              spend: 0,
                              ctr: 0,
                              conversion_rate: 0,
                              roi: 0,
                              status: status,
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
                        >
                          <span className="text-xl leading-none">+</span>
                        </button>
                      </div>
                      {/* Cards */}
                      <Droppable droppableId={status} type="card">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            className="flex-1 flex flex-col gap-4"
                            {...provided.droppableProps}
                          >
                            {groupedChannels[status]?.map((channel, idx) => (
                              <Draggable draggableId={String(channel.id)} index={idx} key={channel.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col gap-2
                                      ${snapshot.isDragging ? 'ring-2 ring-green-400 shadow-lg opacity-90 scale-[1.03] z-20' : ''}
                                      ${draggingId === String(channel.id) ? 'border-green-400' : ''}
                                    `}
                                    onClick={() => handleViewDetails(channel)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-2xl">{typeIcons[channel.type] || '📊'}</span>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 leading-tight">{channel.name}</h4>
                                        <p className="text-xs text-gray-500">{channel.type}</p>
                                      </div>
                                      <div className="ml-auto relative">
                                        <button
                                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none"
                                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === channel.id ? null : safeId(channel.id)); }}
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
                                        </button>
                                        {openMenuId === channel.id && (
                                          <div
                                            ref={menuRef}
                                            className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg z-50 py-2 border border-gray-100"
                                            onClick={e => e.stopPropagation()}
                                          >
                                            <button
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                              onClick={() => { setShowEditModal(true); setEditChannel(channel); setOpenMenuId(null); }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                              onClick={() => { setDeleteChannelId(safeId(channel.id)); setDeleteChannelName(channel.name ?? ''); setOpenMenuId(null); }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-600">
                                      <div>
                                        <span className="block font-medium text-gray-400">Spend</span>
                                        <span className="font-semibold text-gray-700">${channel.spend?.toLocaleString()}</span>
                                      </div>
                                      <div>
                                        <span className="block font-medium text-gray-400">Budget</span>
                                        <span className="font-semibold text-gray-700">${channel.budget?.toLocaleString()}</span>
                                      </div>
                                      <div>
                                        <span className="block font-medium text-gray-400">Progress</span>
                                        <span className="font-semibold text-gray-700">{Math.round((channel.spend / channel.budget) * 100)}%</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        className="text-green-600 hover:text-green-800 font-semibold text-xs"
                                      >
                                        View Details →
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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