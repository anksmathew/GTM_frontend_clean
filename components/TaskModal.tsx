'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Campaign {
  id: number;
  name: string;
}

interface Task {
  title: string;
  description: string;
  dueDate: string;
  status: string;
  campaignId: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

const statusOptions = ['To-do', 'In Progress', 'Done'];

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<Task>({
    title: '',
    description: '',
    dueDate: '',
    status: statusOptions[0],
    campaignId: ''
  });
  const [error, setError] = useState('');
  const [showNewCampaignInput, setShowNewCampaignInput] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [newCampaignError, setNewCampaignError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns`)
        .then(res => {
          const campaignsData = Array.isArray(res.data) ? res.data : (res.data.campaigns || []);
          setCampaigns(campaignsData);
        })
        .catch(() => setCampaigns([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      setShowNewCampaignInput(true);
      setForm(prev => ({ ...prev, campaignId: "" }));
    } else {
      setShowNewCampaignInput(false);
      setForm(prev => ({ ...prev, campaignId: value }));
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      setNewCampaignError("Campaign name is required");
      return;
    }
    setCreatingCampaign(true);
    setNewCampaignError("");
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns`, {
        name: newCampaignName,
        description: '',
        launch_date: '',
        status: 'Planned',
        budget: '',
        team: ''
      });
      const created = res.data;
      setCampaigns(prev => [...prev, created]);
      setForm(prev => ({ ...prev, campaignId: created.id.toString() }));
      setShowNewCampaignInput(false);
      setNewCampaignName("");
    } catch (err) {
      setNewCampaignError("Failed to create campaign");
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.campaignId) {
      setError('Title and Campaign are required');
      return;
    }
    setError('');
    onSave(form);
    onClose();
    setForm({ title: '', description: '', dueDate: '', status: statusOptions[0], campaignId: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Create Task</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Campaign *</label>
            <select
              name="campaignId"
              value={form.campaignId}
              onChange={handleCampaignChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              required
              disabled={loading}
            >
              <option value="">Select Campaign</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__create_new__">Create new campaign...</option>
            </select>
            {showNewCampaignInput && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="New campaign name"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  disabled={creatingCampaign}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                    disabled={creatingCampaign}
                  >
                    {creatingCampaign ? 'Creating...' : 'Add Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCampaignInput(false); setNewCampaignName(""); setNewCampaignError(""); }}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium"
                    disabled={creatingCampaign}
                  >
                    Cancel
                  </button>
                </div>
                {newCampaignError && <div className="text-red-600 text-sm">{newCampaignError}</div>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal; 