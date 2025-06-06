import React from 'react';
import axios from 'axios';

type Campaign = {
  id?: number;
  name: string;
  description: string;
  launch_date: string;
  status: string;
  budget: number | string;
  team: string;
};

type CampaignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  campaign?: Campaign;
  mode: 'add' | 'edit';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const statusOptions = ['Planned', 'In Progress', 'Launched', 'Delayed'];
const teamOptions = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Customer Success', 
  'Support', 'HR', 'Finance', 'Operations', 'QA', 'IT', 'Legal'
];

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, campaign, mode }) => {
  const [form, setForm] = React.useState<Campaign>({
    name: '',
    description: '',
    launch_date: '',
    status: statusOptions[0],
    budget: '',
    team: ''
  });
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (campaign) {
      setForm(campaign);
    }
  }, [campaign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please add a campaign name');
      return;
    }

    try {
      if (mode === 'add') {
        await axios.post(`${API_URL}/api/campaigns`, form);
      } else if (mode === 'edit' && campaign?.id) {
        await axios.put(`${API_URL}/api/campaigns/${campaign.id}`, form);
      }
      onSave();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Error saving campaign');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          {mode === 'add' ? 'Add New Campaign' : 'Edit Campaign'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-error-100 text-error-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Campaign Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Launch Date</label>
              <input
                type="date"
                name="launch_date"
                value={form.launch_date}
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
              <label className="block text-sm font-medium text-neutral-600 mb-1">Budget</label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Team</label>
              <select
                name="team"
                value={form.team}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              >
                <option value="">Select Team</option>
                {teamOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
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
              {mode === 'add' ? 'Add Campaign' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal; 