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
    <div className="p-0 bg-white">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white text-[#181C2A] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64 shadow-sm"
          />
          <button className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#181C2A] text-sm font-medium hover:bg-[#F3F4F6] shadow-sm">Sort</button>
          <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#181C2A] text-sm font-medium hover:bg-[#F3F4F6] shadow-sm">Filter</button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2 rounded-lg bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition"
        >
          + Add Campaign
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex space-x-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-150
              ${activeTab === tab
                ? 'bg-green-100 text-green-700 border-b-4 border-green-500 shadow'
                : 'bg-white text-[#181C2A] hover:bg-green-50 border border-[#E5E7EB]'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#F3F4F6]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#7C8DB5] uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#7C8DB5] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#7C8DB5] uppercase tracking-wider">Launch Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#7C8DB5] uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#7C8DB5] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, idx) => (
              <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#181C2A]">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm
                    ${product.status === 'Planned' ? 'bg-blue-100 text-blue-700' :
                      product.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      product.status === 'Launched' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'}
                  `}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B5563]">
                  {product.launch_date ? new Date(product.launch_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B5563]">
                  ${product.budget?.toLocaleString() || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewDetails(product)}
                    className="text-green-600 hover:text-green-800 font-semibold"
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