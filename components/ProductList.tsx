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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">Product Campaigns</h2>
        <button className="btn btn-primary">
          Add Campaign
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Product</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Target Date</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Status</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Budget</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Team</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Channel</th>
              <th className="py-4 px-4 font-medium text-[var(--color-neutral-500)] text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-neutral-100)]">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-[var(--color-neutral-50)] transition-colors duration-150">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-[var(--color-neutral-900)]">{product.name}</div>
                    <div className="text-sm text-[var(--color-neutral-500)]">{product.description}</div>
                  </div>
                </td>
                <td className="py-4 px-4 text-[var(--color-neutral-600)]">
                  {new Date(product.launch_date).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <span className={`status-badge status-badge-${product.status}`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-[var(--color-neutral-900)]">
                    ${product.budget.toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex -space-x-2">
                    {product.team.split(', ').slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center text-sm font-medium border-2 border-white"
                      >
                        {member.split(' ')[0][0]}
                      </div>
                    ))}
                    {product.team.split(', ').length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] flex items-center justify-center text-sm font-medium border-2 border-white">
                        +{product.team.split(', ').length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-[var(--color-neutral-600)]">
                  {product.channelNames ? product.channelNames.join(', ') : '-'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-[var(--color-neutral-500)] hover:text-[var(--color-primary-500)] transition-colors duration-150"
                      onClick={() => handleEditProduct(product.id)}
                    >
                      ✏️
                    </button>
                    <button
                      className="p-2 text-[var(--color-neutral-500)] hover:text-[var(--color-error-500)] transition-colors duration-150"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      🗑️
                    </button>
                  </div>
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