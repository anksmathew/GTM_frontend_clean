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

const API_URL = 'http://localhost:3001/api/personas';

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

  useEffect(() => {
    fetchPersonas();
  }, []);

  useEffect(() => {
    if (personas.length > 0) {
      fetchCampaigns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personas]);

  const fetchPersonas = async () => {
    const res = await axios.get(API_URL);
    setPersonas(res.data.personas);
  };

  const fetchCampaigns = async () => {
    const res = await axios.get<{ campaigns: Campaign[] }>('http://localhost:3001/api/campaigns');
    setCampaigns(res.data.campaigns || []);
    // Fetch assignments for each campaign
    const assignments: { [campaignId: number]: number[] } = {};
    const assignedPersonaIds = new Set<number>();
    for (const c of res.data.campaigns || []) {
      const r = await axios.get<{ personas: Persona[] }>(`http://localhost:3001/api/campaigns/${c.id}/personas`);
      assignments[c.id] = r.data.personas.map((p: Persona) => p.id);
      r.data.personas.forEach((p: Persona) => assignedPersonaIds.add(p.id));
    }
    setAssigned(assignments);
    // Unassigned personas
    const allPersonaIds = personas.map(p => p.id);
    setUnassigned(allPersonaIds.filter(id => !assignedPersonaIds.has(id)));
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
      await axios.put(`${API_URL}/${editPersona.id}`, form);
    } else {
      await axios.post(API_URL, form);
    }
    fetchPersonas();
    closeModal();
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/${id}`);
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
      await axios.delete(`http://localhost:3001/api/campaigns/${source.droppableId}/personas/${personaId}`);
    }
    // Assign
    if (destination.droppableId !== 'unassigned') {
      await axios.post(`http://localhost:3001/api/campaigns/${destination.droppableId}/personas/${personaId}`);
    }
    fetchCampaigns();
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-xl mt-10 shadow border border-gray-200">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Personas</h1>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
        <input
          type="text"
          placeholder="Search personas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Genders</option>
          {genders.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Ages</option>
          {ageRanges.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button
          onClick={() => openModal()}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + New Persona
        </button>
      </div>
      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredPersonas.map((persona) => {
          const avatarEmoji = getAvatarEmoji(persona.gender);
          return (
            <div key={persona.id} className="bg-white rounded-xl shadow p-6 flex flex-col items-center relative group hover:shadow-lg transition min-w-[220px]">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-5xl mb-2 border">
                {avatarEmoji}
              </div>
              <div className="font-bold text-lg text-center mb-1">{persona.name}</div>
              <div className="text-sm text-gray-500 text-center mb-2">{persona.title}</div>
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {persona.age_range && <span className="bg-gray-100 rounded px-2 py-1 text-xs">{persona.age_range}</span>}
                {persona.gender && <span className="bg-gray-100 rounded px-2 py-1 text-xs">{persona.gender}</span>}
                {persona.location && <span className="bg-gray-100 rounded px-2 py-1 text-xs">{persona.location}</span>}
              </div>
              <div className="flex gap-2 mt-2 justify-center w-full">
                <button
                  onClick={() => openModal(persona)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded shadow hover:bg-yellow-500 text-xs"
                >Edit</button>
                <button
                  onClick={() => handleDelete(persona.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 text-xs"
                >Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Campaigns</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            <Droppable droppableId="unassigned">
              {(provided: DroppableProvided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col bg-gray-100 rounded-xl shadow min-w-[260px] max-w-[320px] px-3 py-4">
                  <div className="font-bold text-base mb-4 text-center">Unassigned</div>
                  <div className="flex-1 flex flex-col gap-3">
                    {unassigned.map((pid, idx) => {
                      const persona = personas.find(p => p.id === pid);
                      if (!persona) return null;
                      const avatarEmoji = getAvatarEmoji(persona.gender);
                      return (
                        <Draggable key={persona.id} draggableId={String(persona.id)} index={idx}>
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white border rounded-lg shadow flex items-center gap-3 px-3 py-2 mb-1 hover:shadow-md transition"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                                {avatarEmoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{persona.name}</div>
                                <div className="text-xs text-gray-400 truncate">{persona.title}</div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                  <button className="mt-4 text-blue-600 text-xs font-semibold hover:underline" onClick={() => openModal()}>+ Add a persona</button>
                </div>
              )}
            </Droppable>
            {campaigns.map((campaign) => (
              <Droppable droppableId={String(campaign.id)} key={campaign.id}>
                {(provided: DroppableProvided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col bg-gray-100 rounded-xl shadow min-w-[260px] max-w-[320px] px-3 py-4">
                    <div className="font-bold text-base mb-4 text-center">{campaign.name}</div>
                    <div className="flex-1 flex flex-col gap-3">
                      {(assigned[campaign.id] || []).map((pid, idx) => {
                        const persona = personas.find(p => p.id === pid);
                        if (!persona) return null;
                        const avatarEmoji = getAvatarEmoji(persona.gender);
                        return (
                          <Draggable key={persona.id} draggableId={String(persona.id)} index={idx}>
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white border rounded-lg shadow flex items-center gap-3 px-3 py-2 mb-1 hover:shadow-md transition"
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                                  {avatarEmoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{persona.name}</div>
                                  <div className="text-xs text-gray-400 truncate">{persona.title}</div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                    <button className="mt-4 text-blue-600 text-xs font-semibold hover:underline" onClick={() => openModal()}>+ Add a persona</button>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
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