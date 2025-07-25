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
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [addChannelLoading, setAddChannelLoading] = useState(false);
  const [addChannelError, setAddChannelError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
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

  const handleAssignChannels = async () => {
    if (!selectedChannelIds.length) return;
    try {
      const newChannelIds = [
        ...channels.map(c => c.id),
        ...selectedChannelIds.filter(id => !channels.some(c => c.id === id)),
      ];
      await axios.post(`${API_URL}/api/campaigns/${product?.id}/channels`, { channelIds: newChannelIds });
      setSelectedChannelIds([]);
      await refreshData();
    } catch (err) {
      alert('Failed to assign channels.');
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

  const handleDeleteCampaign = async () => {
    if (!product?.id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_URL}/api/campaigns/${product.id}`);
      router.push('/'); // Redirect to home page after deletion
    } catch (err) {
      alert('Failed to delete campaign.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
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
    <div className="min-h-screen bg-[#F7F8FA] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-700 font-semibold shadow-sm"
          >
            ← Back to Campaigns
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow"
            >
              Edit Campaign
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow"
            >
              Delete Campaign
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Delete Campaign</h3>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete "{product.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCampaign}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
            {editMode ? (
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Name</label>
                  <input name="name" value={editProduct.name} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Description</label>
                  <textarea name="description" value={editProduct.description} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Launch Date</label>
                  <input name="launch_date" type="date" value={editProduct.launch_date} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Status</label>
                  <select name="status" value={editProduct.status} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400">
                    {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Budget</label>
                  <input name="budget" type="number" value={editProduct.budget} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Team</label>
                  <select name="team" value={editProduct.team} onChange={handleEditInputChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400">
                    <option value="">Select Team</option>
                    {teamOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-700 font-semibold shadow-sm">Cancel</button>
                  <button type="button" onClick={handleSaveEdit} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow">Save</button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Description</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Launch Date</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.launch_date ? new Date(product.launch_date).toLocaleDateString() : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold 
                    ${product.status === 'Planned' ? 'bg-primary-100 text-primary-700' : 
                      product.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
                      product.status === 'Launched' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.status}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Budget</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">${product.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Team</label>
                  <p className="text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2">{product.team}</p>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button onClick={handleEditClick} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow">Edit</button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Marketing Channels</h2>
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <select
                multiple
                className="px-4 py-2 border border-neutral-200 rounded-lg bg-white text-neutral-700 font-semibold shadow-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 min-w-[200px]"
                value={selectedChannelIds.map(String)}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setSelectedChannelIds(options);
                }}
              >
                {allChannels.filter(ch => !channels.some(c => c.id === ch.id)).map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name} {channel.type ? `(${channel.type})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignChannels}
                className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-700 font-semibold shadow-sm"
                disabled={!selectedChannelIds.length}
                type="button"
              >
                Assign Selected Channels
              </button>
              <button onClick={() => setShowAddChannelModal(true)} className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-700 font-semibold shadow-sm">Add Channel</button>
            </div>
            {channels.length > 0 ? (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="border border-neutral-200 bg-neutral-50 rounded-lg p-4 mb-2 shadow-sm">
                    <h3 className="font-semibold text-neutral-900 text-lg mb-1">{channel.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {channel.type && (
                        <div>
                          <span className="text-neutral-500 font-medium">Type:</span> <span className="text-neutral-900">{channel.type}</span>
                        </div>
                      )}
                      {channel.status && (
                        <div>
                          <span className="text-neutral-500 font-medium">Status:</span> <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                            ${channel.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 
                              channel.status.toLowerCase() === 'paused' ? 'bg-yellow-100 text-yellow-700' : 
                              channel.status.toLowerCase() === 'inactive' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>{channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}</span>
                        </div>
                      )}
                      {channel.budget !== undefined && (
                        <div>
                          <span className="text-neutral-500 font-medium">Budget:</span> <span className="text-neutral-900">${channel.budget.toLocaleString()}</span>
                        </div>
                      )}
                      {channel.spend !== undefined && (
                        <div>
                          <span className="text-neutral-500 font-medium">Spend:</span> <span className="text-neutral-900">${channel.spend.toLocaleString()}</span>
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