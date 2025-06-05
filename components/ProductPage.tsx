'use client';

import React, { useState, useEffect, use } from 'react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ProductPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        console.log('ProductPage params:', unwrappedParams);
        if (!unwrappedParams?.id) {
          setError('No campaign ID provided');
          setLoading(false);
          return;
        }

        const campaignId = unwrappedParams.id;
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
  }, [unwrappedParams]);

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
    <div className="p-6">
      <div className="mb-6">
        <button 
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Back to Products
        </button>
        <h1 className="text-3xl font-bold text-[var(--color-neutral-900)]">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--color-neutral-500)]">Description</label>
              <p className="mt-1">{product.description}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--color-neutral-500)]">Launch Date</label>
              <p className="mt-1">{new Date(product.launch_date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--color-neutral-500)]">Status</label>
              <p className="mt-1">
                <span className={`status-badge status-badge-${product.status}`}>
                  {product.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm text-[var(--color-neutral-500)]">Budget</label>
              <p className="mt-1">${product.budget.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--color-neutral-500)]">Team</label>
              <p className="mt-1">{product.team}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Marketing Channels</h2>
          {channels.length > 0 ? (
            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-medium">{channel.name}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    {channel.type && (
                      <div>
                        <span className="text-[var(--color-neutral-500)]">Type:</span> {channel.type}
                      </div>
                    )}
                    {channel.status && (
                      <div>
                        <span className="text-[var(--color-neutral-500)]">Status:</span> {channel.status}
                      </div>
                    )}
                    {channel.budget && (
                      <div>
                        <span className="text-[var(--color-neutral-500)]">Budget:</span> ${channel.budget.toLocaleString()}
                      </div>
                    )}
                    {channel.spend && (
                      <div>
                        <span className="text-[var(--color-neutral-500)]">Spend:</span> ${channel.spend.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-neutral-500)]">No channels assigned to this product.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage; 