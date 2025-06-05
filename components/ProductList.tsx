'use client';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
  'Planned': 'bg-primary-100 text-primary-700',
  'In Progress': 'bg-warning-100 text-warning-700',
  'Launched': 'bg-success-100 text-success-700',
  'Delayed': 'bg-error-100 text-error-700',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ProductList = forwardRef((props, ref) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    launch_date: '',
    status: statusOptions[0],
    budget: '',
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
      console.log('Fetched campaigns:', campaigns);
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
      setNewProduct({ name: '', description: '', launch_date: '', status: statusOptions[0], budget: '', team: '' });
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

  const handleRowClick = (id: number, event: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    event.preventDefault();
    console.log('Navigating to campaign:', id);
    router.push(`/products/${id}`);
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchProducts
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">Campaigns</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary"
        >
          Filters
        </button>
      </div>

      {/* Add Campaign Form */}
      <div className="mb-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Add New Campaign</h3>
        {error && <div className="mb-4 p-3 bg-error-100 text-error-700 rounded-lg">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            value={newProduct.name}
            onChange={handleInputChange}
            placeholder="Campaign Name"
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <input
            type="text"
            name="description"
            value={newProduct.description}
            onChange={handleInputChange}
            placeholder="Description"
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <input
            type="date"
            name="launch_date"
            value={newProduct.launch_date}
            onChange={handleInputChange}
            placeholder="Launch Date"
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <select
            name="status"
            value={newProduct.status}
            onChange={handleInputChange}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-neutral-400 font-medium pointer-events-none">Budget</span>
            <input
              type="number"
              name="budget"
              value={newProduct.budget}
              onChange={handleInputChange}
              className="pl-20 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 w-full bg-white text-neutral-900 placeholder:text-neutral-400"
              min="0"
            />
          </div>
          <select
            name="team"
            value={newProduct.team}
            onChange={handleInputChange}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          >
            <option value="">Select Team</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Customer Success">Customer Success</option>
            <option value="Support">Support</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="QA">QA</option>
            <option value="IT">IT</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddProduct}
            className="btn btn-primary"
          >
            Add Campaign
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex space-x-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Launch Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-neutral-50 cursor-pointer"
                onClick={(e) => handleRowClick(product.id, e)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-neutral-900">{product.name}</div>
                  <div className="text-sm text-neutral-500">{product.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[product.status]}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {product.launch_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  ${product.budget.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products/${product.id}`);
                    }}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    className="text-error-600 hover:text-error-900"
                  >
                    Delete
                  </button>
                </td>
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