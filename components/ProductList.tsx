'use client';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CampaignModal from './CampaignModal';

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
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleViewDetails = (product: Product) => {
    console.log('Navigating to campaign:', product.id);
    router.push(`/products/${product.id}`);
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchProducts
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">Campaigns</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            Filters
          </button>
          <button
            onClick={() => setShowAddModal(true)}
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
              px-4 py-2 rounded-md text-sm font-medium
              ${activeTab === tab
                ? 'bg-[#007acc] text-white'
                : 'bg-[#1a1a1a] text-[#e5e5e5] hover:bg-[#2a2a2a] border border-[#374151]'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#374151] overflow-hidden">
        <table className="min-w-full divide-y divide-[#374151]">
          <thead className="bg-[#2a2a2a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Launch Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-[#2a2a2a] transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'Planned' ? 'bg-[#007acc]/20 text-[#007acc]' :
                    product.status === 'In Progress' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                    product.status === 'Launched' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                    'bg-[#ef4444]/20 text-[#ef4444]'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e5e5e5]">
                  {product.launch_date ? new Date(product.launch_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e5e5e5]">
                  ${product.budget?.toLocaleString() || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewDetails(product)}
                    className="text-[#007acc] hover:text-[#0062a3] font-medium"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CampaignModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={fetchProducts}
        mode="add"
      />
    </div>
  );
});

ProductList.displayName = "ProductList";

export default ProductList; 