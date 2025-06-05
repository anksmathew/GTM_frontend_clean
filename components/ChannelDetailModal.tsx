'use client';
import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { useRouter } from 'next/navigation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Channel {
  id?: number;
  name: string;
  type: string;
  budget: number;
  spend: number;
  ctr: number;
  conversion_rate: number;
  roi: number;
  status: string;
  target_ctr?: number;
  target_conversion?: number;
  target_roi?: number;
  api_key?: string;
  tracking_code?: string;
  assigned_campaigns?: number[];
  assigned_personas?: number[];
}

type Campaign = { id: number; name: string; status: string };
type Persona = { id: number; name: string; title?: string; gender?: string; avatar?: string };

export type ChannelWithHistory = Channel & {
  historicalCTR?: number[];
  historicalConversionRate?: number[];
  monthlySpend?: number[];
  recommendations?: { title: string; description: string }[];
};

interface ChannelDetailModalProps {
  channel: ChannelWithHistory;
  onClose: () => void;
  onEdit: (channel: ChannelWithHistory) => void;
  isViewOnly?: boolean;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const average = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

const getDefaultAvatar = (gender?: string) => {
  if (gender === 'Female') return 'https://api.dicebear.com/7.x/emoji/svg?seed=👩🏻';
  return 'https://api.dicebear.com/7.x/emoji/svg?seed=👨🏼‍🚀';
};

// Helper to ensure array is length 12
function ensure12(arr: number[] | undefined, fallback: number = 0): number[] {
  if (!arr || !Array.isArray(arr)) return Array(12).fill(fallback);
  if (arr.length >= 12) return arr.slice(0, 12);
  return [...arr, ...Array(12 - arr.length).fill(fallback)];
}

const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({ channel: initialChannel, onClose, onEdit, isViewOnly = false }) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [channel, setChannel] = useState<ChannelWithHistory>(initialChannel);
  const [showEditGraph, setShowEditGraph] = useState(false);
  const [historicalCTR, setHistoricalCTR] = useState<number[]>(
    ensure12(initialChannel.historicalCTR, (initialChannel.ctr || 0) * 100)
  );
  const [historicalConversionRate, setHistoricalConversionRate] = useState<number[]>(
    ensure12(initialChannel.historicalConversionRate, (initialChannel.conversion_rate || 0) * 100)
  );
  const [editCTR, setEditCTR] = useState([...historicalCTR]);
  const [editConversionRate, setEditConversionRate] = useState([...historicalConversionRate]);
  const [editingROI, setEditingROI] = useState(false);
  const [roiInput, setRoiInput] = useState(channel.roi);
  const [showEditSpend, setShowEditSpend] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState<number[]>(
    initialChannel.monthlySpend && Array.isArray(initialChannel.monthlySpend)
      ? initialChannel.monthlySpend
      : [800, 1200, 1000, 1500, 2000, 1800, 0, 0, 0, 0, 0, 0]
  );
  const [editSpend, setEditSpend] = useState([...monthlySpend]);

  // Recommendations
  const [recommendations, setRecommendations] = useState<{ title: string; description: string }[]>(initialChannel.recommendations || []);
  const [manualRecommendationTitle, setManualRecommendationTitle] = useState('');
  const [manualRecommendationDesc, setManualRecommendationDesc] = useState('');
  const [loadingClaude, setLoadingClaude] = useState(false);

  // Find the max value for dynamic Y-axis scaling
  const maxGraphValue = Math.max(
    ...historicalCTR,
    ...historicalConversionRate,
    10 // fallback minimum
  );
  const yAxisMax = Math.ceil(maxGraphValue * 1.1) || 10;

  // Calculate averages for key metrics
  const avgCTR = historicalCTR.length ? average(historicalCTR) : null;
  const avgCR = historicalConversionRate.length ? average(historicalConversionRate) : null;

  // Chart data uses percentage values
  const performanceData = {
    labels: months,
    datasets: [
      {
        label: 'CTR',
        data: historicalCTR,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        pointBackgroundColor: 'rgb(75, 192, 192)',
      },
      {
        label: 'Conversion Rate',
        data: historicalConversionRate,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        pointBackgroundColor: 'rgb(255, 99, 132)',
      },
    ],
  };

  const budgetData = {
    labels: ['Spent', 'Remaining'],
    datasets: [
      {
        data: [channel.spend, channel.budget - channel.spend],
        backgroundColor: ['#ff6b8a', '#4fd1c5'],
      },
    ],
  };

  const spendingTimelineData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Spend',
        data: monthlySpend,
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const tabs = [
    { id: 'edit', label: 'Edit' },
    { id: 'performance', label: 'Performance' },
    { id: 'budget', label: 'Budget' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'personas', label: 'Personas' },
    { id: 'recommendations', label: 'Recommendations' },
  ];

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  const router = useRouter();
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [addMode, setAddMode] = useState<'select' | 'create'>('select');
  const [newCampaign, setNewCampaign] = useState<{ id?: number; name: string; status: string }>({ name: '', status: 'Planned' });
  const [addingCampaign, setAddingCampaign] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

  const [form, setForm] = useState({
    name: channel.name || '',
    type: channel.type || 'Email',
    budget: channel.budget || 0,
    spend: channel.spend || 0,
    ctr: channel.ctr || 0,
    conversion_rate: channel.conversion_rate || 0,
    roi: channel.roi || 0,
    status: channel.status || 'Active',
    target_ctr: channel.target_ctr || 0,
    target_conversion: channel.target_conversion || 0,
    target_roi: channel.target_roi || 0,
    api_key: channel.api_key || '',
    tracking_code: channel.tracking_code || '',
    assigned_campaigns: channel.assigned_campaigns || [],
    assigned_personas: channel.assigned_personas || [],
  });

  useEffect(() => {
    if (activeTab === 'campaigns') {
      axios.get(`${API_URL}/api/campaigns`).then(async res => {
        const all: Campaign[] = res.data.campaigns || [];
        setAllCampaigns(all);
        const filtered: Campaign[] = [];
        for (const c of all) {
          const chRes = await axios.get<{ channels: Channel[] }>(`${API_URL}/api/campaigns/${c.id}/channels`);
          if (chRes.data.channels.some((ch: Channel) => ch.id === channel.id)) {
            filtered.push(c);
          }
        }
        setCampaigns(filtered);
      });
    }
    if (activeTab === 'personas') {
      axios.get(`${API_URL}/api/personas`).then(res => setPersonas(res.data.personas || []));
    }
  }, [activeTab, channel.id]);

  useEffect(() => {
    setForm({
      name: channel.name || '',
      type: channel.type || 'Email',
      budget: channel.budget || 0,
      spend: channel.spend || 0,
      ctr: channel.ctr || 0,
      conversion_rate: channel.conversion_rate || 0,
      roi: channel.roi || 0,
      status: channel.status || 'Active',
      target_ctr: channel.target_ctr || 0,
      target_conversion: channel.target_conversion || 0,
      target_roi: channel.target_roi || 0,
      api_key: channel.api_key || '',
      tracking_code: channel.tracking_code || '',
      assigned_campaigns: channel.assigned_campaigns || [],
      assigned_personas: channel.assigned_personas || [],
    });
    setHistoricalCTR(
      ensure12(channel.historicalCTR, (channel.ctr || 0) * 100)
    );
    setHistoricalConversionRate(
      ensure12(channel.historicalConversionRate, (channel.conversion_rate || 0) * 100)
    );
    setMonthlySpend(
      channel.monthlySpend && Array.isArray(channel.monthlySpend)
        ? channel.monthlySpend
        : [800, 1200, 1000, 1500, 2000, 1800, 0, 0, 0, 0, 0, 0]
    );
    setRecommendations(channel.recommendations || []);
  }, [channel.id]);

  const handleSaveAll = (overrideCTR?: number[], overrideCR?: number[]) => {
    const ctrArr = overrideCTR ? [...overrideCTR] : [...historicalCTR];
    const crArr = overrideCR ? [...overrideCR] : [...historicalConversionRate];
    const updatedChannel: ChannelWithHistory = {
      id: channel.id,
      name: form.name,
      type: form.type,
      budget: form.budget,
      spend: form.spend,
      ctr: form.ctr,
      conversion_rate: form.conversion_rate,
      roi: form.roi,
      status: form.status,
      target_ctr: form.target_ctr,
      target_conversion: form.target_conversion,
      target_roi: form.target_roi,
      api_key: form.api_key,
      tracking_code: form.tracking_code,
      assigned_campaigns: form.assigned_campaigns,
      assigned_personas: form.assigned_personas,
      historicalCTR: ctrArr ?? [],
      historicalConversionRate: crArr ?? [],
    };
    console.log('handleSaveAll called, updatedChannel:', updatedChannel);
    setChannel(updatedChannel);
    if (onEdit) onEdit(updatedChannel);
    if (onClose) onClose();
  };

  const handleEditGraphSave = () => {
    setHistoricalCTR([...editCTR]);
    setHistoricalConversionRate([...editConversionRate]);
    setShowEditGraph(false);
    // Persist graph changes to backend
    const updatedChannel: ChannelWithHistory = {
      ...channel,
      historicalCTR: [...editCTR],
      historicalConversionRate: [...editConversionRate],
    };
    if (onEdit) onEdit(updatedChannel);
  };

  const handleRoiSave = () => {
    const updated = { ...channel, roi: roiInput };
    setChannel(updated);
    setEditingROI(false);
    if (onEdit) onEdit(updated);
  };

  const handleEditSpendSave = () => {
    setMonthlySpend([...editSpend]);
    setShowEditSpend(false);
    setChannel({ ...channel, monthlySpend: [...editSpend] });
  };

  // Claude API fetch
  const fetchClaudeRecommendations = async () => {
    setLoadingClaude(true);
    try {
      const res = await axios.post('/api/claude-recommendations', { channel });
      setRecommendations(res.data.recommendations || []);
    } catch {
      setRecommendations([{ title: 'Error', description: 'Could not fetch recommendations from Claude.' }]);
    }
    setLoadingClaude(false);
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCampaign(true);
    if (addMode === 'create') {
      if (!newCampaign.name.trim()) return;
      // Create new campaign
      const res = await axios.post(`${API_URL}/api/campaigns`, { name: newCampaign.name, status: newCampaign.status });
      const newId = res.data.id;
      // Assign to this channel
      await axios.post(`${API_URL}/api/campaigns/${newId}/channels`, { channelIds: [channel.id] });
    } else {
      // Assign existing campaign
      if (!newCampaign.id) return;
      await axios.post(`${API_URL}/api/campaigns/${newCampaign.id}/channels`, { channelIds: [channel.id] });
    }
    await axios.get(`${API_URL}/api/campaigns`).then(res => setCampaigns(res.data.campaigns || []));
    setNewCampaign({ name: '', status: 'Planned' });
    setShowAddCampaignModal(false);
    setAddingCampaign(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{channel.name}</h2>
        </div>

        <div className="flex gap-4 border-b mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg relative">
                  <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                    CTR & Conversion Trends
                    <button
                      className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                      onClick={() => { setEditCTR([...historicalCTR]); setEditConversionRate([...historicalConversionRate]); setShowEditGraph(true); }}
                    >
                      Edit Graph
                    </button>
                  </h4>
                  <Line data={performanceData} options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: '%' },
                        suggestedMax: yAxisMax,
                        max: yAxisMax,
                      }
                    }
                  }} />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-gray-500">CTR</div>
                      <div className="text-xl font-bold">{avgCTR !== null ? `${avgCTR.toFixed(1)}%` : '-'}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-gray-500">Conversion Rate</div>
                      <div className="text-xl font-bold">{avgCR !== null ? `${avgCR.toFixed(1)}%` : '-'}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow flex items-center gap-2">
                      <div>
                        <div className="text-sm text-gray-500">ROI</div>
                        {editingROI ? (
                          <form onSubmit={e => { e.preventDefault(); handleRoiSave(); }} className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={roiInput}
                              onChange={e => setRoiInput(Number(e.target.value))}
                              className="border rounded px-2 py-1 w-20 mr-1"
                              autoFocus
                            />
                            <button type="submit" className="text-blue-600 font-semibold">Save</button>
                            <button type="button" className="text-gray-400 ml-1" onClick={() => { setEditingROI(false); setRoiInput(channel.roi); }}>Cancel</button>
                          </form>
                        ) : (
                          <span className="text-xl font-bold">{channel.roi}x</span>
                        )}
                      </div>
                      {!editingROI && (
                        <button onClick={() => setEditingROI(true)} className="ml-1 text-gray-400 hover:text-blue-600" title="Edit ROI">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                        </button>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-gray-500">Spend</div>
                      <div className="text-xl font-bold">${channel.spend}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Edit Graph Modal */}
              {showEditGraph && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative">
                    <button
                      onClick={() => setShowEditGraph(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="text-lg font-bold mb-4">Edit CTR & Conversion Rate for Each Month</h3>
                    <form onSubmit={e => { e.preventDefault(); handleEditGraphSave(); }}>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {months.map((month, idx) => (
                          <div key={month}>
                            <label className="block text-xs font-medium mb-1">{month}</label>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-cyan-700 font-semibold w-10">CTR</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editCTR[idx]}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setEditCTR(prev => prev.map((v, i) => i === idx ? (isNaN(val) ? 0 : val) : v));
                                  }}
                                  className="w-full border rounded px-2 py-1 text-cyan-700 focus:ring-cyan-400"
                                  placeholder="CTR %"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-pink-700 font-semibold w-10">CR</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editConversionRate[idx]}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setEditConversionRate(prev => prev.map((v, i) => i === idx ? (isNaN(val) ? 0 : val) : v));
                                  }}
                                  className="w-full border rounded px-2 py-1 text-pink-700 focus:ring-pink-400"
                                  placeholder="Conv. Rate %"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditGraph(false)}
                          className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'budget' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
                  <h4 className="text-sm font-medium mb-2">Budget Allocation</h4>
                  <div className="relative w-56 h-56">
                    <Doughnut
                      data={budgetData}
                      options={{
                        cutout: '75%',
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 16, font: { size: 14 } }
                          },
                          tooltip: { enabled: true },
                        },
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-pink-500">${channel.spend}</span>
                      <span className="text-xs text-gray-500">Spent</span>
                      <span className="text-lg font-bold text-teal-500 mt-2">${channel.budget - channel.spend}</span>
                      <span className="text-xs text-gray-500">Remaining</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg relative">
                  <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                    Spending Timeline
                    <button
                      className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                      onClick={() => { setEditSpend([...monthlySpend]); setShowEditSpend(true); }}
                    >
                      Edit Spend
                    </button>
                  </h4>
                  <Bar data={spendingTimelineData} options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...monthlySpend, 2000) * 1.1,
                        max: Math.max(...monthlySpend, 2000) * 1.1,
                      }
                    }
                  }} />
                  <div className="mt-4 text-center font-semibold text-gray-700">
                    Budget Remaining: ${channel.budget - monthlySpend.reduce((sum, v) => sum + v, 0)}
                  </div>
                  {showEditSpend && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
                        <button
                          onClick={() => setShowEditSpend(false)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <h3 className="text-lg font-bold mb-4">Edit Monthly Spend</h3>
                        <form onSubmit={e => { e.preventDefault(); handleEditSpendSave(); }}>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            {months.map((month, idx) => (
                              <div key={month}>
                                <label className="block text-xs font-medium mb-1">{month}</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editSpend[idx]}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setEditSpend(prev => prev.map((v, i) => i === idx ? (isNaN(val) ? 0 : val) : v));
                                  }}
                                  className="w-full border rounded px-2 py-1"
                                  placeholder="Spend"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowEditSpend(false)}
                              className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign Management</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Active Campaigns</h4>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                    onClick={() => setShowAddCampaignModal(true)}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {campaigns.filter(campaign => campaign.id != null).map(campaign => (
                    <div key={campaign.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                      <div>
                        <div className="font-medium text-lg">{campaign.name}</div>
                        <div className="text-sm text-gray-500">Status: {campaign.status}</div>
                      </div>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                        onClick={() => router.push(`/campaigns/${campaign.id}?edit=1`)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {showAddCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                    <button
                      onClick={() => setShowAddCampaignModal(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h2 className="text-xl font-bold mb-4">Add Campaign</h2>
                    <div className="flex gap-2 mb-4">
                      <button
                        className={`px-3 py-1 rounded font-semibold border ${addMode === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => { setAddMode('select'); setShowAddCampaignModal(true); }}
                      >
                        Select Existing
                      </button>
                      <button
                        className={`px-3 py-1 rounded font-semibold border ${addMode === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => { setAddMode('create'); setShowAddCampaignModal(true); }}
                      >
                        Create New
                      </button>
                    </div>
                    {addMode === 'select' && (
                      <div className="flex gap-2 mb-4">
                        {allCampaigns.map(campaign => (
                          <button
                            key={campaign.id}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded font-semibold hover:bg-blue-600 hover:text-white"
                            onClick={() => { setNewCampaign({ id: campaign.id, name: campaign.name, status: campaign.status }); setShowAddCampaignModal(false); }}
                          >
                            {campaign.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {addMode === 'create' && (
                      <form onSubmit={handleAddCampaign}>
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={newCampaign.name}
                            onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            placeholder="Campaign Name"
                            className="border rounded px-2 py-1"
                          />
                          <select
                            value={newCampaign.status}
                            onChange={e => setNewCampaign({ ...newCampaign, status: e.target.value })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="Planned">Planned</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddCampaignModal(false)}
                            className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                          >
                            Add Campaign
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'personas' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Personas</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {personas.map(persona => (
                    <div key={persona.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                      <div>
                        <div className="font-medium text-lg">{persona.name}</div>
                        <div className="text-sm text-gray-500">Title: {persona.title}</div>
                        <div className="text-sm text-gray-500">Gender: {persona.gender}</div>
                      </div>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                        onClick={() => router.push(`/personas/${persona.id}?edit=1`)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {recommendations.map((recommendation, idx) => (
                    <div key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center">
                      <div>
                        <div className="font-medium text-lg">{recommendation.title}</div>
                        <div className="text-sm text-gray-500">{recommendation.description}</div>
                      </div>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                        onClick={() => {
                          setManualRecommendationTitle(recommendation.title);
                          setManualRecommendationDesc(recommendation.description);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelDetailModal;