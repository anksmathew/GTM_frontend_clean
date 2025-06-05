"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { DraggableProvided, DroppableProvided } from '@hello-pangea/dnd';

// Persona data structure
type Persona = {
  id: number;
  name: string;
  title: string;
  avatar: string;
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

type Campaign = {
  id: number;
  name: string;
};

const ageRanges = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const genders = ["Male", "Female", "Non-binary", "Other"];
const incomeBrackets = ["< $25k", "$25k-$50k", "$50k-$100k", "$100k-$200k", "$200k+"];
const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const channels = ["Email", "Phone", "Social Media", "In-person", "SMS", "App"];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const personasApi = `${API_URL}/api/personas`;

// Helper to get avatar emoji by gender
const getAvatarEmoji = (gender?: string) => {
  if (gender === 'Female') return '👩🏻';
  return '👨🏼‍🚀';
};

const PersonaManager = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPersona, setEditPersona] = useState<Persona | null>(null);
  const [form, setForm] = useState<Omit<Persona, "id">>({
    name: "",
    title: "",
    avatar: "",
    age_range: "",
    gender: "",
    location: "",
    income_bracket: "",
    job_role: "",
    company_size: "",
    pain_points: "",
    goals: "",
    motivations: "",
    interests: "",
    values: "",
    buying_habits: "",
    preferred_channels: "",
    tech_adoption: "",
    social_media_usage: "",
    decision_factors: "",
    market_size: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assigned, setAssigned] = useState<{ [campaignId: number]: number[] }>({});
  const [unassigned, setUnassigned] = useState<number[]>([]);
  const [personaCampaigns, setPersonaCampaigns] = useState<{ [personaId: number]: Campaign[] }>({});

  useEffect(() => {
    fetchPersonas();
  }, []);

  useEffect(() => {
    if (personas.length > 0) {
      fetchCampaigns();
      // Fetch campaigns for each persona
      personas.forEach(persona => {
        fetchPersonaCampaigns(persona.id);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personas]);

  const fetchPersonas = async () => {
    const res = await axios.get(personasApi);
    setPersonas(res.data.personas);
  };

  const fetchCampaigns = async () => {
    const res = await axios.get<{ campaigns: Campaign[] }>(`${API_URL}/api/campaigns`);
    setCampaigns(res.data.campaigns || []);
    // Fetch assignments for each campaign
    const assignments: { [campaignId: number]: number[] } = {};
    const assignedPersonaIds = new Set<number>();
    for (const c of res.data.campaigns || []) {
      const r = await axios.get<{ personas: Persona[] }>(`${API_URL}/api/campaigns/${c.id}/personas`);
      assignments[c.id] = r.data.personas.map((p: Persona) => p.id);
      r.data.personas.forEach((p: Persona) => assignedPersonaIds.add(p.id));
    }
    setAssigned(assignments);
    // Unassigned personas
    const allPersonaIds = personas.map(p => p.id);
    setUnassigned(allPersonaIds.filter(id => !assignedPersonaIds.has(id)));
  };

  const fetchPersonaCampaigns = async (personaId: number) => {
    try {
      const res = await axios.get<{ campaigns: Campaign[] }>(`${API_URL}/api/personas/${personaId}/campaigns`);
      setPersonaCampaigns(prev => ({
        ...prev,
        [personaId]: res.data.campaigns
      }));
    } catch (error) {
      console.error(`Error fetching campaigns for persona ${personaId}:`, error);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const openModal = (persona?: Persona) => {
    if (persona) {
      setEditPersona(persona);
      setForm({ ...persona });
    } else {
      setEditPersona(null);
      setForm({
        name: "",
        title: "",
        avatar: "",
        age_range: "",
        gender: "",
        location: "",
        income_bracket: "",
        job_role: "",
        company_size: "",
        pain_points: "",
        goals: "",
        motivations: "",
        interests: "",
        values: "",
        buying_habits: "",
        preferred_channels: "",
        tech_adoption: "",
        social_media_usage: "",
        decision_factors: "",
        market_size: 0,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditPersona(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPersona) {
      await axios.put(`${API_URL}/api/personas/${editPersona.id}`, form);
    } else {
      await axios.post(API_URL + "/api/personas", form);
    }
    fetchPersonas();
    closeModal();
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/api/personas/${id}`);
    fetchPersonas();
  };

  // Filtering
  const filteredPersonas = personas.filter((p) =>
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase())) &&
    (filterGender ? p.gender === filterGender : true) &&
    (filterAge ? p.age_range === filterAge : true)
  );

  // Drag-and-drop handler
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const personaId = parseInt(draggableId);
    // Unassign
    if (source.droppableId !== 'unassigned') {
      await axios.delete(`${API_URL}/api/campaigns/${source.droppableId}/personas/${personaId}`);
    }
    // Assign
    if (destination.droppableId !== 'unassigned') {
      await axios.post(`${API_URL}/api/campaigns/${destination.droppableId}/personas/${personaId}`);
    }
    fetchCampaigns();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">Target Personas</h2>
        <button className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600" onClick={() => openModal()}>
          Add Persona
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonas.map((persona) => (
          <div
            key={persona.id}
            className="card card-hover p-6"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="text-3xl">{getAvatarEmoji(persona.gender)}</div>
              <div>
                <h3 className="font-medium text-[var(--color-neutral-900)]">{persona.name}</h3>
                <p className="text-sm text-[var(--color-neutral-500)]">{persona.title}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="w-24 text-[var(--color-neutral-500)]">Age Range:</span>
                <span className="text-[var(--color-neutral-900)]">{persona.age_range}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-24 text-[var(--color-neutral-500)]">Gender:</span>
                <span className="text-[var(--color-neutral-900)]">{persona.gender}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-24 text-[var(--color-neutral-500)]">Location:</span>
                <span className="text-[var(--color-neutral-900)]">{persona.location}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-[var(--color-neutral-700)] mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {persona.interests.split(',').map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Campaigns Section */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-[var(--color-neutral-700)] mb-2">Targeted Campaigns</h4>
              <div className="space-y-2">
                {personaCampaigns[persona.id]?.length > 0 ? (
                  personaCampaigns[persona.id].map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-2 bg-[var(--color-neutral-50)] rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors duration-150"
                    >
                      <span className="text-sm text-[var(--color-neutral-900)]">{campaign.name}</span>
                      <button
                        onClick={() => {/* Navigate to campaign */}}
                        className="text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium"
                      >
                        View →
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-neutral-500)] italic">No campaigns targeting this persona</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => openModal(persona)}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => {/* Handle view details */}}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Persona Builder Wizard */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">{editPersona ? "Edit Persona" : "New Persona"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
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
                  <select name="age_range" value={form.age_range} onChange={handleInput} className="w-full border rounded px-2 py-1">
                    <option value="">Select</option>
                    {ageRanges.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleInput} className="w-full border rounded px-2 py-1">
                    <option value="">Select</option>
                    {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium">Location</label>
                  <input name="location" value={form.location} onChange={handleInput} className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium">Income Bracket</label>
                  <select name="income_bracket" value={form.income_bracket} onChange={handleInput} className="w-full border rounded px-2 py-1">
                    <option value="">Select</option>
                    {incomeBrackets.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium">Job/Role</label>
                  <input name="job_role" value={form.job_role} onChange={handleInput} className="w-full border rounded px-2 py-1" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium">Company Size</label>
                  <select name="company_size" value={form.company_size} onChange={handleInput} className="w-full border rounded px-2 py-1">
                    <option value="">Select</option>
                    {companySizes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
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
                <input name="values" value={form.values || ""} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs font-medium">Buying Habits</label>
                <input name="buying_habits" value={form.buying_habits} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs font-medium">Preferred Communication Channels</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {channels.map((ch) => (
                    <label key={ch} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        name="preferred_channels"
                        checked={form.preferred_channels.includes(ch)}
                        onChange={e => {
                          setForm(f => ({
                            ...f,
                            preferred_channels: e.target.checked
                              ? (f.preferred_channels ? f.preferred_channels + "," + ch : ch)
                              : f.preferred_channels.split(",").filter(x => x !== ch).join(",")
                          }));
                        }}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
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
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-700 transition mt-2">
                {editPersona ? "Save Changes" : "Create Persona"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaManager; 