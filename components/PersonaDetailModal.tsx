import React, { useState, useEffect } from 'react';

export type Persona = {
  id?: number;
  name: string;
  title: string;
  avatar?: string;
  age_range: string;
  gender: string;
  location: string;
  income_bracket: string;
  job_role: string;
  company_size: string;
  pain_points: string;
  goals: string;
  motivations: string;
  interests: string;
  values: string;
  buying_habits: string;
  preferred_channels: string;
  tech_adoption: string;
  social_media_usage: string;
  decision_factors: string;
  market_size: number;
};

interface PersonaDetailModalProps {
  persona: Persona;
  onClose: () => void;
  onEdit: (persona: Persona) => void;
}

const PersonaDetailModal: React.FC<PersonaDetailModalProps> = ({ persona, onClose, onEdit }) => {
  const [form, setForm] = useState<Persona>({ ...persona });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setForm({ ...persona });
    setEditing(false);
  }, [persona]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(form);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Persona Details</h2>
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium">Name</label>
                <input name="name" value={form.name} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium">Title</label>
                <input name="title" value={form.title} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium">Age Range</label>
                <input name="age_range" value={form.age_range} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium">Gender</label>
                <input name="gender" value={form.gender} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium">Location</label>
                <input name="location" value={form.location} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium">Income Bracket</label>
                <input name="income_bracket" value={form.income_bracket} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium">Job/Role</label>
                <input name="job_role" value={form.job_role} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium">Company Size</label>
                <input name="company_size" value={form.company_size} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium">Pain Points</label>
              <textarea name="pain_points" value={form.pain_points} onChange={handleInput} className="w-full border rounded px-2 py-1" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium">Goals & Motivations</label>
              <textarea name="goals" value={form.goals} onChange={handleInput} className="w-full border rounded px-2 py-1" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium">Interests</label>
              <input name="interests" value={form.interests} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Values</label>
              <input name="values" value={form.values || ''} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Buying Habits</label>
              <input name="buying_habits" value={form.buying_habits} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Preferred Communication Channels</label>
              <input name="preferred_channels" value={form.preferred_channels} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Tech Adoption</label>
              <input name="tech_adoption" value={form.tech_adoption} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Social Media Usage</label>
              <input name="social_media_usage" value={form.social_media_usage} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Decision Factors</label>
              <input name="decision_factors" value={form.decision_factors} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs font-medium">Market Size (est.)</label>
              <input type="number" name="market_size" value={form.market_size} onChange={handleInput} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Name</div>
                <div className="font-medium text-neutral-900">{persona.name}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Title</div>
                <div className="font-medium text-neutral-900">{persona.title}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Age Range</div>
                <div className="font-medium text-neutral-900">{persona.age_range}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Gender</div>
                <div className="font-medium text-neutral-900">{persona.gender}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Location</div>
                <div className="font-medium text-neutral-900">{persona.location}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Income Bracket</div>
                <div className="font-medium text-neutral-900">{persona.income_bracket}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Job/Role</div>
                <div className="font-medium text-neutral-900">{persona.job_role}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-neutral-500">Company Size</div>
                <div className="font-medium text-neutral-900">{persona.company_size}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Pain Points</div>
              <div className="font-medium text-neutral-900">{persona.pain_points}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Goals & Motivations</div>
              <div className="font-medium text-neutral-900">{persona.goals}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Interests</div>
              <div className="font-medium text-neutral-900">{persona.interests}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Values</div>
              <div className="font-medium text-neutral-900">{persona.values}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Buying Habits</div>
              <div className="font-medium text-neutral-900">{persona.buying_habits}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Preferred Communication Channels</div>
              <div className="font-medium text-neutral-900">{persona.preferred_channels}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Tech Adoption</div>
              <div className="font-medium text-neutral-900">{persona.tech_adoption}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Social Media Usage</div>
              <div className="font-medium text-neutral-900">{persona.social_media_usage}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Decision Factors</div>
              <div className="font-medium text-neutral-900">{persona.decision_factors}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Market Size (est.)</div>
              <div className="font-medium text-neutral-900">{persona.market_size}</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(true)} className="btn btn-primary">Edit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaDetailModal; 