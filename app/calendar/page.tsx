'use client';
import React, { useEffect, useState } from 'react';
import Calendar from '../../components/Calendar';
import axios from 'axios';

interface Campaign {
  id: number;
  name: string;
  launch_date: string;
}

interface Task {
  id: number;
  title: string;
  due_date: string;
}

const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [campaignRes, taskRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks`),
        ]);
        const campaigns = Array.isArray(campaignRes.data) ? campaignRes.data : (campaignRes.data.campaigns || []);
        const tasks = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data.tasks || taskRes.data);
        const campaignEvents = campaigns.filter((c: Campaign) => c.launch_date).map((c: Campaign) => ({
          id: `campaign-${c.id}`,
          title: c.name,
          date: c.launch_date,
          type: 'campaign',
        }));
        const taskEvents = tasks.filter((t: Task) => t.due_date).map((t: Task) => ({
          id: `task-${t.id}`,
          title: t.title,
          date: t.due_date,
          type: 'task',
        }));
        setEvents([...campaignEvents, ...taskEvents]);
      } catch (e) {
        setEvents([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center mb-1">
          <h1 className="text-2xl font-bold text-neutral-900">Calendar</h1>
        </div>
        <div className="border-b border-[#E5E7EB] mt-2" />
      </div>
      <div className="rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96 text-neutral-400 text-lg">Loading calendar...</div>
        ) : (
          <Calendar events={events} />
        )}
      </div>
    </div>
  );
};

export default CalendarPage; 