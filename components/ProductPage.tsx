'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ChannelDetailModal, { ChannelWithHistory } from './ChannelDetailModal';

type Product = {
  id: number;
  name: string;
  description: string;
  launch_date: string;
  status: string;
  budget: number;
  team: string;
  channelNames?: string[];
};

type Channel = {
  id: number;
  name: string;
  type?: string;
  status?: string;
  budget?: number;
  spend?: number;
  roi?: number;
  ctr?: number;
  conversion_rate?: number;
  kpis?: string;
  integration_settings?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const statusOptions = ['Planned', 'In Progress', 'Launched', 'Delayed'];
const teamOptions = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Customer Success', 'Support', 'HR', 'Finance', 'Operations', 'QA', 'IT', 'Legal'
];

const ProductPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | ''>('');
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [addChannelLoading, setAddChannelLoading] = useState(false);
  const [addChannelError, setAddChannelError] = useState('');
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        console.log('ProductPage params:', params);
        if (!params?.id) {
          setError('No campaign ID provided');
          setLoading(false);
          return;
        }

        const campaignId = params.id;
        console.log('Fetching campaign with ID:', campaignId);
        console.log('API URL:', `${API_URL}/api/campaigns/${campaignId}`);

        const [productRes, channelsRes] = await Promise.all([
          axios.get(`${API_URL}/api/campaigns/${campaignId}`),
          axios.get(`${API_URL}/api/campaigns/${campaignId}/channels`)
        ]);
        
        console.log('Product data:', productRes.data);
        setProduct(productRes.data);
        setChannels(channelsRes.data.channels || []);
      } catch (err) {
        console.error('Error fetching product data:', err);
        if (axios.isAxiosError(err)) {
          console.error('Response data:', err.response?.data);
          console.error('Response status:', err.response?.status);
        }
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [params]);

  useEffect(() => {
    axios.get(`${API_URL}/api/channels`).then(res => setAllChannels(res.data.channels || []));
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [productRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/api/campaigns/${params.id}`),
        axios.get(`${API_URL}/api/campaigns/${params.id}/channels`)
      ]);
      setProduct(productRes.data);
      setChannels(channelsRes.data.channels || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditProduct({ ...product });
    setEditMode(true);
  };
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditProduct((prev: any) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };
  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/api/campaigns/${product?.id}`, editProduct);
      setEditMode(false);
      await refreshData();
    } catch (err) {
      alert('Failed to save changes.');
    }
  };
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditProduct(null);
  };

  const handleAssignChannel = async () => {
    if (!selectedChannelId) return;
    try {
      const newChannelIds = [...channels.map(c => c.id), selectedChannelId];
      await axios.post(`${API_URL}/api/campaigns/${product?.id}/channels`, { channelIds: newChannelIds });
      setSelectedChannelId('');
      await refreshData();
    } catch (err) {
      alert('Failed to assign channel.');
    }
  };

  const handleAddChannel = async (newChannel: ChannelWithHistory) => {
    setAddChannelLoading(true);
    setAddChannelError('');
    try {
      const res = await axios.post(`${API_URL}/api/channels`, newChannel);
      const newId = res.data.id;
      await axios.post(`${API_URL}/api/campaigns/${product?.id}/channels`, { channelIds: [...channels.map(c => c.id), newId] });
      setShowAddChannelModal(false);
      await refreshData();
    } catch (err) {
      setAddChannelError('Failed to add channel.');
    } finally {
      setAddChannelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="text-red-500">{error || 'Product not found'}</div>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 text-neutral-700 font-medium"
          >
            ← Back to Campaigns
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
            {editMode ? (
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Name</label>
                  <input name="name" value={editProduct.name} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Description</label>
                  <textarea name="description" value={editProduct.description} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Launch Date</label>
                  <input name="launch_date" type="date" value={editProduct.launch_date} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
                  <select name="status" value={editProduct.status} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400">
                    {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Budget</label>
                  <input name="budget" type="number" value={editProduct.budget} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Team</label>
                  <select name="team" value={editProduct.team} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400">
                    <option value="">Select Team</option>
                    {teamOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                  <button type="button" onClick={handleSaveEdit} className="btn btn-primary">Save</button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Description</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Launch Date</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.launch_date ? new Date(product.launch_date).toLocaleDateString() : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${product.status === 'Planned' ? 'bg-primary-100 text-primary-700' : product.status === 'In Progress' ? 'bg-warning-100 text-warning-700' : product.status === 'Launched' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>{product.status}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Budget</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">${product.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Team</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.team}</p>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button onClick={handleEditClick} className="btn btn-primary">Edit</button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Marketing Channels</h2>
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <select
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                value={selectedChannelId}
                onChange={e => setSelectedChannelId(Number(e.target.value))}
              >
                <option value="">Select Channel</option>
                {allChannels.filter(ch => !channels.some(c => c.id === ch.id)).map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
              <button onClick={handleAssignChannel} className="btn btn-primary" disabled={!selectedChannelId}>Assign</button>
              <button onClick={() => setShowAddChannelModal(true)} className="btn btn-secondary">Add Channel</button>
            </div>
            {channels.length > 0 ? (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="border-b border-neutral-100 pb-4 last:border-b-0">
                    <h3 className="font-medium text-white">{channel.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {channel.type && (
                        <div>
                          <span className="text-[#9ca3af]">Type:</span> {channel.type}
                        </div>
                      )}
                      {channel.status && (
                        <div>
                          <span className="text-[#9ca3af]">Status:</span> <span className={`px-2 py-1 text-xs font-medium rounded-full ${channel.status.toLowerCase() === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : channel.status.toLowerCase() === 'paused' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : channel.status.toLowerCase() === 'inactive' ? 'bg-[#64748b]/20 text-[#64748b]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>{channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}</span>
                        </div>
                      )}
                      {channel.budget && (
                        <div>
                          <span className="text-[#9ca3af]">Budget:</span> ${channel.budget.toLocaleString()}
                        </div>
                      )}
                      {channel.spend && (
                        <div>
                          <span className="text-[#9ca3af]">Spend:</span> ${channel.spend.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500">No channels assigned to this product.</p>
            )}
          </div>
        </div>
        {showAddChannelModal && (
          <ChannelDetailModal
            channel={{ name: '', type: 'Email', budget: 0, spend: 0, ctr: 0, conversion_rate: 0, roi: 0, status: 'Active' }}
            onClose={() => setShowAddChannelModal(false)}
            onEdit={handleAddChannel}
          />
        )}
      </div>
    </div>
  );
};

export default ProductPage; 