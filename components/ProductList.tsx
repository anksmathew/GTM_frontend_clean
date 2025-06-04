'use client';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

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

const statusOptions = ['Planned', 'In Progress', 'Launched', 'Delayed'];

const statusColors: Record<string, string> = {
  'Planned': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Launched': 'bg-green-100 text-green-700',
  'Delayed': 'bg-red-100 text-red-700',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ProductList = forwardRef((props, ref) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    launch_date: '',
    status: statusOptions[0],
    budget: 0,
    team: ''
  });
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: '',
    description: '',
    launch_date: '',
    status: statusOptions[0],
    budget: 0,
    team: ''
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const statusTabs = ['All', ...statusOptions];
  const [activeTab, setActiveTab] = useState('All');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [editSelectedChannels, setEditSelectedChannels] = useState<number[]>([]);

  useEffect(() => {
    fetchProducts();
    axios.get(`${API_URL}/api/channels`).then(res => setChannels(res.data.channels || []));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get<{ campaigns: Product[] }>(`${API_URL}/api/campaigns`);
      const campaigns = response.data.campaigns;
      // Fetch channels for each campaign
      const campaignsWithChannels = await Promise.all(campaigns.map(async (c: Product) => {
        const res = await axios.get<{ channels: Channel[] }>(`${API_URL}/api/campaigns/${c.id}/channels`);
        return { ...c, channelNames: res.data.channels.map((ch: Channel) => ch.name) };
      }));
      setProducts(campaignsWithChannels);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getYear = (date: string) => {
    if (!date) return NaN;
    return parseInt(date.split('-')[0], 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewProduct({ ...newProduct, [name]: type === 'number' ? Number(value) : value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditProduct({ ...editProduct, [name]: type === 'number' ? Number(value) : value });
  };

  const handleAddProduct = async () => {
    setError('');
    if (!newProduct.name.trim()) {
      setError('Please add a campaign name');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/campaigns`, newProduct);
      const newId = response.data.id;
      // Save assigned channels
      await axios.post(`${API_URL}/api/campaigns/${newId}/channels`, { channelIds: selectedChannels });
      await fetchProducts();
      setNewProduct({ name: '', description: '', launch_date: '', status: statusOptions[0], budget: 0, team: '' });
      setSelectedChannels([]);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Error adding campaign');
      }
    }
  };

  const handleEditProduct = async (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setEditId(id);
      setEditProduct({
        name: product.name ?? '',
        description: product.description ?? '',
        launch_date: product.launch_date ?? '',
        status: product.status || statusOptions[0],
        budget: product.budget || 0,
        team: product.team || ''
      });
      // Fetch assigned channels
      const res = await axios.get<{ channels: Channel[] }>(`${API_URL}/api/campaigns/${id}/channels`);
      setEditSelectedChannels(res.data.channels.map((c: Channel) => c.id));
      setError('');
    }
  };

  const handleSaveEdit = async (id: number) => {
    setError('');
    const year = getYear(editProduct.launch_date);
    if (!editProduct.name.trim()) {
      setError('Please add a campaign name');
      return;
    }
    if (isNaN(year) || year < 1000 || year > 9999) {
      setError('Please enter a valid year (1000-9999).');
      return;
    }
    try {
      const { name, description, launch_date, status, budget, team } = editProduct;
      await axios.put(`${API_URL}/api/campaigns/${id}`, { name, description, launch_date, status, budget, team });
      // Save assigned channels
      await axios.post(`${API_URL}/api/campaigns/${id}/channels`, { channelIds: editSelectedChannels });
      await fetchProducts();
      setEditId(null);
    } catch (error) {
      console.error('Error editing campaign:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setError('');
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/api/campaigns/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Filtering logic
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      (statusFilter ? product.status === statusFilter : true) &&
      (activeTab === 'All' ? true : product.status === activeTab);
    const matchesDate =
      (!dateRange.start || product.launch_date >= dateRange.start) &&
      (!dateRange.end || product.launch_date <= dateRange.end);
    return matchesSearch && matchesStatus && matchesDate;
  });

  useImperativeHandle(ref, () => ({
    refresh: fetchProducts
  }));

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-xl mt-10 shadow border border-gray-200">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Campaigns Gallore!</h1>
      {/* Notion-style Filter Button and Dropdown */}
      <div className="flex items-center mb-6 relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z" /></svg>
          Filter
        </button>
        {showFilters && (
          <div ref={filterDropdownRef} className="absolute left-0 top-12 z-10 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col gap-4 animate-fade-in">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 mb-1">Start date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 mb-1">End date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}
      </div>
      {/* Add Form */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-3 px-2 font-semibold text-left">Launch Name</th>
              <th className="py-3 px-2 font-semibold text-left">Description</th>
              <th className="py-3 px-2 font-semibold text-left">Target Date</th>
              <th className="py-3 px-2 font-semibold text-left">Status</th>
              <th className="py-3 px-2 font-semibold text-left">Budget</th>
              <th className="py-3 px-2 font-semibold text-left">Team Members</th>
              <th className="py-3 px-2 font-semibold text-left">Channel</th>
              <th className="py-3 px-2 font-semibold text-left"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-2 px-2">
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="Launch Name"
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                />
              </td>
              <td className="py-2 px-2">
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                  rows={1}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="date"
                  name="launch_date"
                  value={newProduct.launch_date}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                />
              </td>
              <td className="py-2 px-2">
                <select
                  name="status"
                  value={newProduct.status}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  name="budget"
                  value={newProduct.budget}
                  onChange={handleInputChange}
                  placeholder="Budget"
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="text"
                  name="team"
                  value={newProduct.team}
                  onChange={handleInputChange}
                  placeholder="Team Members"
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                />
              </td>
              <td className="py-2 px-2">
                <select
                  multiple
                  value={selectedChannels.map(String)}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedChannels(options);
                  }}
                  className="border rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                >
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </td>
              <td className="py-2 px-2">
                <button onClick={handleAddProduct} className="bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700 transition text-xs">Add</button>
              </td>
            </tr>
            {error && (
              <tr>
                <td colSpan={7} className="text-red-600 text-center py-2">{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Data Table */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {statusTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-3 px-2 font-semibold text-left">Launch Name</th>
              <th className="py-3 px-2 font-semibold text-left">Description</th>
              <th className="py-3 px-2 font-semibold text-left">Target Date</th>
              <th className="py-3 px-2 font-semibold text-left">Status</th>
              <th className="py-3 px-2 font-semibold text-left">Budget</th>
              <th className="py-3 px-2 font-semibold text-left">Team Members</th>
              <th className="py-3 px-2 font-semibold text-left">Channel</th>
              <th className="py-3 px-2 font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.filter(product => product.id != null).map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                {editId === product.id ? (
                  <>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        name="name"
                        value={editProduct.name}
                        onChange={handleEditInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <textarea
                        name="description"
                        value={editProduct.description ?? ''}
                        onChange={handleEditInputChange}
                        rows={1}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="date"
                        name="launch_date"
                        value={editProduct.launch_date}
                        onChange={handleEditInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        name="status"
                        value={editProduct.status}
                        onChange={handleEditInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        name="budget"
                        value={editProduct.budget}
                        onChange={handleEditInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        name="team"
                        value={editProduct.team}
                        onChange={handleEditInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        multiple
                        value={editId === product.id ? editSelectedChannels.map(String) : selectedChannels.map(String)}
                        onChange={e => {
                          const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                          if (editId === product.id) setEditSelectedChannels(options);
                          else setSelectedChannels(options);
                        }}
                        className="border rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                      >
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>{channel.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 space-x-2">
                      <button onClick={() => handleSaveEdit(product.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 transition text-xs">Save</button>
                      <button onClick={handleCancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded shadow hover:bg-gray-500 transition text-xs">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2 align-middle">
                      {product.name}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      {product.description}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      {product.launch_date}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[product.status] || 'bg-gray-100 text-gray-700'}`}>{product.status}</span>
                    </td>
                    <td className="py-2 px-2 align-middle">
                      ${product.budget}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      {product.team}
                    </td>
                    <td className="py-2 px-2 align-middle">
                      {product.channelNames ? product.channelNames.join(', ') : '-'}
                    </td>
                    <td className="py-2 px-2 space-x-2 align-middle">
                      <button onClick={() => handleEditProduct(product.id)} className="bg-yellow-500 text-white px-3 py-1 rounded shadow hover:bg-yellow-600 transition text-xs">Edit</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 transition text-xs">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ProductList.displayName = "ProductList";

export default ProductList; 