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
    ensure12(initialChannel.monthlySpend, 0)
  );
  const [editSpend, setEditSpend] = useState<(number | '')[]>([...monthlySpend]);

  // Recommendations
  const [recommendations, setRecommendations] = useState<{ title: string; description: string }[]>(initialChannel.recommendations || []);
  const [manualRecommendationTitle, setManualRecommendationTitle] = useState('');
  const [manualRecommendationDesc, setManualRecommendationDesc] = useState('');
  const [editingRecommendationIdx, setEditingRecommendationIdx] = useState<number | null>(null);
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

  // Calculate total spend from monthlySpend for budget donut
  const totalMonthlySpend = monthlySpend.reduce((sum, v) => sum + v, 0);

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
        data: [totalMonthlySpend, channel.budget - totalMonthlySpend],
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
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const tabs = [
    { id: 'edit', label: 'Edit' },
    { id: 'performance', label: 'Performance' },
    { id: 'budget', label: 'Budget' },
    { id: 'campaigns', label: 'Campaigns' },
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

  // Add state for editing budget
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(form.budget);

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
  }, [activeTab, channel.id]);

  useEffect(() => {
    const initialMonthlySpend = ensure12(channel.monthlySpend, 0);
    const totalSpend = initialMonthlySpend.reduce((sum, v) => sum + v, 0);
    
    setForm({
      name: channel.name || '',
      type: channel.type || 'Email',
      budget: channel.budget || 0,
      spend: totalSpend,
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
    setMonthlySpend(initialMonthlySpend);
    setChannel({ ...channel, spend: totalSpend, monthlySpend: initialMonthlySpend });
    setRecommendations(Array.isArray(channel.recommendations) ? channel.recommendations : []);
  }, [channel.id]);

  const handleSaveAll = (overrideCTR?: number[], overrideCR?: number[]) => {
    const ctrArr = overrideCTR ? [...overrideCTR] : [...historicalCTR];
    const crArr = overrideCR ? [...overrideCR] : [...historicalConversionRate];
    const totalSpend = monthlySpend.reduce((sum, v) => sum + v, 0);
    const updatedChannel: ChannelWithHistory = {
      id: channel.id,
      name: form.name,
      type: form.type,
      budget: form.budget,
      spend: totalSpend,
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
      monthlySpend: monthlySpend,
      recommendations: recommendations,
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

  const handleEditSpendSave = async () => {
    // Convert blank fields to 0 before saving
    const normalizedSpend: number[] = editSpend.map(v => v === '' ? 0 : v as number);
    const safeSpend = ensure12(normalizedSpend, 0);
    const total = safeSpend.reduce((sum, v) => sum + v, 0);
    setMonthlySpend(safeSpend);
    setShowEditSpend(false);

    // Update the channel's spend to match the new total
    const updatedChannel = {
      ...channel,
      monthlySpend: safeSpend,
      spend: total
    };
    setChannel(updatedChannel);

    // Persist to backend
    try {
      await axios.put(`${API_URL}/api/channels/${channel.id}`, {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        status: channel.status,
        budget: channel.budget,
        spend: total,
        roi: channel.roi,
        ctr: channel.ctr,
        conversion_rate: channel.conversion_rate,
        historicalCTR: channel.historicalCTR || [],
        historicalConversionRate: channel.historicalConversionRate || [],
        monthlySpend: [...safeSpend],
      });

      // Refetch the latest channel data and update local state
      const res = await axios.get(`${API_URL}/api/channels/${channel.id}`);
      setChannel(res.data.channel);
      setMonthlySpend(res.data.channel.monthlySpend || []);
    } catch (error) {
      console.error('Failed to save spend:', error);
      // Optionally show an error to the user
    }

    if (onEdit) onEdit(updatedChannel);
  };

  // Claude API fetch
  const fetchClaudeRecommendations = async () => {
    setLoadingClaude(true);
    try {
      const res = await axios.post('/api/claude-recommendations', { channel });
      setRecommendations(Array.isArray(res.data.recommendations) ? res.data.recommendations : []);
    } catch {
      setRecommendations([{ title: 'Error', description: 'Could not fetch recommendations from Claude.' }]);
    }
    setLoadingClaude(false);
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCampaign(true);
    try {
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
      
      // Fetch only the campaigns assigned to this channel
      const all: Campaign[] = await axios.get(`${API_URL}/api/campaigns`).then(res => res.data.campaigns || []);
      const filtered: Campaign[] = [];
      for (const c of all) {
        const chRes = await axios.get<{ channels: Channel[] }>(`${API_URL}/api/campaigns/${c.id}/channels`);
        if (chRes.data.channels.some((ch: Channel) => ch.id === channel.id)) {
          filtered.push(c);
        }
      }
      setCampaigns(filtered);
      
      setNewCampaign({ name: '', status: 'Planned' });
      setShowAddCampaignModal(false);
    } catch (error) {
      console.error('Error adding campaign:', error);
    } finally {
      setAddingCampaign(false);
    }
  };

  // Fetch latest channel data when modal opens
  useEffect(() => {
    async function fetchChannel() {
      if (channel.id) {
        try {
          const res = await axios.get(`${API_URL}/api/channels/${channel.id}`);
          setChannel(res.data.channel);
        } catch (error) {
          console.error('Failed to fetch channel:', error);
        }
      }
    }
    fetchChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">{channel.name}</h2>
        </div>

        <div className="flex gap-4 border-b border-neutral-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-primary-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'edit' && (
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Edit Channel</h3>
              <div className="mb-3">
                <h4 className="text-xl font-bold text-neutral-900 mb-1">Channel Details</h4>
                <p className="text-sm text-neutral-700 mb-1">Fill in the details for this marketing channel. Fields marked with * are required.</p>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSaveAll();
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col justify-center">
                    <label className="block text-base font-semibold text-neutral-900 mb-0.5">Name *</label>
                    <span className="text-xs text-neutral-700 mb-1">Enter a unique name for this channel (e.g., 'Facebook Ads', 'Email Newsletter').</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full border rounded px-2 py-2 h-11 text-neutral-900"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-base font-semibold text-neutral-900 mb-0.5">Type *</label>
                    <span className="text-xs text-neutral-700 mb-1">Select the type of marketing channel.</span>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full border rounded px-2 py-2 h-11 text-neutral-900"
                      required
                    >
                      <option value="Email">Email</option>
                      <option value="Social">Social</option>
                      <option value="Paid Ads">Paid Ads</option>
                      <option value="Content">Content</option>
                      <option value="Events">Events</option>
                      <option value="SEO">SEO</option>
                      <option value="Partnerships">Partnerships</option>
                      <option value="Sales">Sales</option>
                      <option value="PR">PR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-base font-semibold text-neutral-900 mb-0.5">Budget ($) *</label>
                    <span className="text-xs text-neutral-700 mb-1">Set the total budget allocated for this channel.</span>
                    <input
                      type="number"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                      className="w-full border rounded px-2 py-2 h-11 text-neutral-900"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-neutral-900 mb-0.5">Status *</label>
                    <span className="text-xs text-neutral-700 mb-1">Set the current status of this channel.</span>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full border rounded px-2 py-2 h-11 text-neutral-900"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setForm({
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
                    })}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg relative">
                  <span className="inline-block text-black font-semibold px-2 py-1 rounded mb-2">
                    CTR & Conversion Trends
                  </span>
                  <button
                    className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                    onClick={() => { setEditCTR([...historicalCTR]); setEditConversionRate([...historicalConversionRate]); setShowEditGraph(true); }}
                  >
                    Edit Graph
                  </button>
                  <Line data={performanceData} options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: '%', color: '#1a202c', font: { weight: 'bold' } },
                        suggestedMax: yAxisMax,
                        max: yAxisMax,
                        ticks: { color: '#1a202c', font: { weight: 'bold' } },
                      }
                    },
                    plugins: {
                      legend: { labels: { color: '#1a202c', font: { weight: 'bold' } } },
                    }
                  }} />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-neutral-700 font-medium">Average CTR</div>
                      <div className="text-xl font-bold text-neutral-900">
                        {avgCTR !== null && !isNaN(avgCTR) ? `${avgCTR.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-neutral-700 font-medium">Average CR</div>
                      <div className="text-xl font-bold text-neutral-900">
                        {avgCR !== null && !isNaN(avgCR) ? `${avgCR.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow flex items-center gap-2">
                      <div>
                        <div className="text-sm text-neutral-700 font-medium">ROI</div>
                        {editingROI ? (
                          <form onSubmit={e => { e.preventDefault(); handleRoiSave(); }} className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={roiInput}
                              onChange={e => setRoiInput(Number(e.target.value))}
                              className="border rounded px-2 py-1 w-20 mr-1 text-neutral-900"
                              autoFocus
                            />
                            <button type="submit" className="text-blue-600 font-semibold">Save</button>
                            <button type="button" className="text-neutral-500 ml-1" onClick={() => { setEditingROI(false); setRoiInput(channel.roi); }}>Cancel</button>
                          </form>
                        ) : (
                          <span className="text-xl font-bold text-neutral-900">{channel.roi !== undefined && channel.roi !== null && !isNaN(channel.roi) ? `${channel.roi}x` : 'N/A'}</span>
                        )}
                      </div>
                      {!editingROI && (
                        <button onClick={() => setEditingROI(true)} className="ml-1 text-neutral-500 hover:text-blue-600" title="Edit ROI">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                        </button>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-neutral-700 font-medium">Spend</div>
                      <div className="text-xl font-bold text-neutral-900">
                        {channel.spend !== undefined && channel.spend !== null && !isNaN(channel.spend) ? `$${channel.spend}` : 'N/A'}
                      </div>
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
            
              <div className="mb-3">
                <h4 className="text-xl font-bold text-neutral-900 mb-1">Budget Allocation</h4>
                <p className="text-sm text-neutral-700 mb-1">View and manage your channel's budget allocation and spending timeline.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Allocation Card */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="text-base font-semibold text-neutral-900 mb-2">Budget vs Spend</h4>
                  <div className="w-full h-64 flex items-center justify-center">
                    <Bar
                      data={{
                        labels: [''],
                        datasets: [
                          {
                            label: 'Budget',
                            data: [channel.budget],
                            backgroundColor: '#4fd1c5',
                            barPercentage: 0.5,
                            categoryPercentage: 0.5,
                          },
                          {
                            label: 'Spend',
                            data: [totalMonthlySpend],
                            backgroundColor: totalMonthlySpend > channel.budget ? ['#ff6b8a', '#ef4444'] : ['#ff6b8a'],
                            barPercentage: 0.5,
                            categoryPercentage: 0.5,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: 'y',
                        plugins: {
                          legend: { display: true, position: 'top', labels: { color: '#1a202c', font: { weight: 'bold' } } },
                          tooltip: { enabled: true },
                        },
                        responsive: true,
                        scales: {
                          x: {
                            beginAtZero: true,
                            suggestedMax: Math.max(channel.budget, totalMonthlySpend) * 1.2,
                            title: { display: true, text: 'Amount ($)', color: '#1a202c', font: { weight: 'bold' } },
                            grid: { display: true },
                            ticks: { color: '#1a202c', font: { weight: 'bold' } },
                          },
                          y: {
                            grid: { display: false },
                            ticks: { display: false },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-neutral-700 font-medium">Total Budget</div>
                      <div className="text-xl font-extrabold text-neutral-900 flex items-center gap-2">
                        {editingBudget ? (
                          <form onSubmit={e => { e.preventDefault(); setForm(f => ({ ...f, budget: budgetInput })); setEditingBudget(false); }} className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              className="border rounded px-2 py-1 w-24 text-neutral-900"
                              value={budgetInput}
                              onChange={e => setBudgetInput(Number(e.target.value))}
                              autoFocus
                            />
                            <button type="submit" className="text-blue-600 font-semibold">Save</button>
                            <button type="button" className="text-neutral-500 ml-1" onClick={() => { setEditingBudget(false); setBudgetInput(form.budget); }}>Cancel</button>
                          </form>
                        ) : (
                          <>
                            ${form.budget}
                            <button onClick={() => { setEditingBudget(true); setBudgetInput(form.budget); }} className="ml-1 text-neutral-500 hover:text-blue-600" title="Edit Budget">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-neutral-700 font-medium">Total Spent</div>
                      <div className="text-xl font-extrabold text-neutral-900">${totalMonthlySpend}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow col-span-2">
                      <div className="text-sm text-neutral-700 font-medium">Status</div>
                      <div className={`text-lg font-bold ${totalMonthlySpend > channel.budget ? 'text-red-600' : 'text-green-600'}`}> 
                        {totalMonthlySpend > channel.budget ? (
                          <span>Over Budget! <span role="img" aria-label="alert">⚠️</span></span>
                        ) : (
                          <span>Within Budget</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Spending Timeline Card */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-base font-semibold text-neutral-900">Monthly Spending</h4>
                    <button
                      className="text-xs text-blue-600 underline hover:text-blue-800 font-semibold"
                      onClick={() => { setEditSpend([...monthlySpend]); setShowEditSpend(true); }}
                    >
                      Edit Spend
                    </button>
                  </div>
                  <div className="h-64">
                    {monthlySpend.every(v => v === 0) ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-lg">No spending data available</div>
                    ) : (
                      <Bar 
                        data={spendingTimelineData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              display: false 
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `$${context.raw}`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Amount ($)',
                                color: '#1a202c',
                                font: { weight: 'bold' }
                              },
                              ticks: {
                                color: '#1a202c',
                                font: { weight: 'bold' },
                                callback: function(value) {
                                  return '$' + value;
                                }
                              }
                            },
                            x: {
                              ticks: {
                                color: '#1a202c',
                                font: { weight: 'bold' }
                              }
                            }
                          }
                        }} 
                      />
                    )}
                  </div>
                  <div className="mt-4 bg-white p-3 rounded shadow">
                    <div className="text-sm text-neutral-700 font-medium">Budget Remaining</div>
                    <div className={`text-xl font-extrabold ${channel.budget - monthlySpend.reduce((sum, v) => sum + v, 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${channel.budget - monthlySpend.reduce((sum, v) => sum + v, 0)}
                    </div>
                  </div>
                </div>
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
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Edit Monthly Spend</h3>
                    <form onSubmit={e => { e.preventDefault(); handleEditSpendSave(); }}>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {months.map((month, idx) => (
                          <div key={month}>
                            <label className="block text-xs font-medium text-neutral-800 mb-1">{month}</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editSpend[idx] === 0 || editSpend[idx] === '' ? '' : editSpend[idx]}
                              onChange={e => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setEditSpend(prev => prev.map((v, i) => i === idx ? (val === '' ? '' : (isNaN(val) ? 0 : val)) : v));
                              }}
                              className="w-full border rounded px-2 py-1 text-neutral-900"
                              placeholder="Spend"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEditSpend(false)}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
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

          {activeTab === 'campaigns' && (
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Campaign Management</h3>
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-neutral-900">Active Campaigns</h4>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddCampaignModal(true)}
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {campaigns && campaigns.length > 0 ? (
                    campaigns.map(campaign => (
                      <div key={campaign.id} className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm flex justify-between items-center hover:bg-neutral-50 transition-colors">
                        <div>
                          <div className="font-semibold text-base text-neutral-900">{campaign.name}</div>
                          <div className="text-sm text-neutral-700">Status: {campaign.status}</div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            onClick={() => router.push(`/campaigns/${campaign.id}?edit=1`)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-error-600 hover:text-error-700 font-medium text-sm"
                            onClick={async () => {
                              // Remove campaign from this channel
                              try {
                                await axios.post(`${API_URL}/api/campaigns/${campaign.id}/channels`, { channelIds: [] });
                                // Refresh campaigns assigned to this channel
                                const all = await axios.get(`${API_URL}/api/campaigns`).then(res => res.data.campaigns || []);
                                const filtered = [];
                                for (const c of all) {
                                  const chRes = await axios.get<{ channels: Channel[] }>(`${API_URL}/api/campaigns/${c.id}/channels`);
                                  if (chRes.data.channels.some((ch: Channel) => ch.id === channel.id)) {
                                    filtered.push(c);
                                  }
                                }
                                setCampaigns(filtered);
                              } catch (error) {
                                console.error('Error removing campaign from channel:', error);
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-700">No campaigns assigned to this channel.</div>
                  )}
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
                      <form onSubmit={handleAddCampaign} className="flex flex-col gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Select Campaign</label>
                          <select
                            className="w-full border rounded px-2 py-1"
                            value={newCampaign.id || ''}
                            onChange={e => {
                              const selectedId = Number(e.target.value);
                              const selected = allCampaigns.find(c => c.id === selectedId);
                              if (selected) {
                                setNewCampaign({ id: selected.id, name: selected.name, status: selected.status });
                              }
                            }}
                            required
                          >
                            <option value="" disabled>Select a campaign</option>
                            {allCampaigns.map(campaign => (
                              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddCampaignModal(false)}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!newCampaign.id || addingCampaign}
                          >
                            {addingCampaign ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Recommendations</h3>
              {/* Add Recommendation Form */}
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <h4 className="text-md font-semibold text-neutral-900 mb-2">{editingRecommendationIdx !== null ? 'Edit Recommendation' : 'Add Recommendation'}</h4>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!manualRecommendationTitle.trim() || !manualRecommendationDesc.trim()) return;
                    if (editingRecommendationIdx !== null) {
                      // Update existing recommendation
                      setRecommendations(recommendations => recommendations.map((rec, idx) => idx === editingRecommendationIdx ? { title: manualRecommendationTitle, description: manualRecommendationDesc } : rec));
                      setEditingRecommendationIdx(null);
                    } else {
                      // Add new recommendation
                      setRecommendations([
                        ...recommendations,
                        { title: manualRecommendationTitle, description: manualRecommendationDesc }
                      ]);
                    }
                    setManualRecommendationTitle('');
                    setManualRecommendationDesc('');
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2 text-neutral-900"
                    placeholder="Recommendation Title"
                    value={manualRecommendationTitle}
                    onChange={e => setManualRecommendationTitle(e.target.value)}
                    maxLength={60}
                    required
                  />
                  <textarea
                    className="w-full border rounded px-2 py-2 text-neutral-900"
                    placeholder="Recommendation Description"
                    value={manualRecommendationDesc}
                    onChange={e => setManualRecommendationDesc(e.target.value)}
                    rows={3}
                    maxLength={300}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    {editingRecommendationIdx !== null && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingRecommendationIdx(null);
                          setManualRecommendationTitle('');
                          setManualRecommendationDesc('');
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!manualRecommendationTitle.trim() || !manualRecommendationDesc.trim()}
                    >
                      {editingRecommendationIdx !== null ? 'Save' : 'Add Recommendation'}
                    </button>
                  </div>
                </form>
              </div>
              {/* Existing Recommendations List */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {Array.isArray(recommendations) && recommendations.map((recommendation, idx) => (
                    <div key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center gap-2">
                      <div>
                        <div className="font-medium text-lg text-neutral-900">{recommendation.title}</div>
                        <div className="text-sm text-neutral-700">{recommendation.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                          onClick={() => {
                            setManualRecommendationTitle(recommendation.title);
                            setManualRecommendationDesc(recommendation.description);
                            setEditingRecommendationIdx(idx);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 font-semibold"
                          onClick={() => {
                            setRecommendations(recommendations.filter((_, i) => i !== idx));
                            // If deleting the one being edited, reset form
                            if (editingRecommendationIdx === idx) {
                              setEditingRecommendationIdx(null);
                              setManualRecommendationTitle('');
                              setManualRecommendationDesc('');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
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