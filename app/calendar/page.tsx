'use client';
import React, { useEffect, useState } from 'react';
import Calendar from '../../components/Calendar';
import axios from 'axios';
import TaskModal from '../../components/TaskModal';

interface Campaign {
  id: number;
  name: string;
  launch_date: string;
  status: string;
}

interface Task {
  id: number;
  title: string;
  due_date: string;
  description: string;
  status: string;
  campaignIds: string[];
}

const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

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
          status: c.status,
        }));
        const taskEvents = tasks.filter((t: Task) => t.due_date).map((t: Task) => ({
          id: `task-${t.id}`,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          date: t.due_date,
          type: 'task',
          status: t.status,
          campaignIds: t.campaignIds,
        }));
        setEvents([...campaignEvents, ...taskEvents]);
      } catch (e) {
        setEvents([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEventMove = async (event: any, newDate: string) => {
    // Update backend
    if (event.type === 'campaign') {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns/${event.id.toString().replace('campaign-', '')}`, {
        launch_date: newDate,
      });
    } else if (event.type === 'task') {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${event.id.toString().replace('task-', '')}`, {
        ...event,
        due_date: newDate,
      });
    }
    // Update state
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, date: newDate } : e));
  };

  const handleTaskClick = (event: any) => {
    setEditingTask(event);
    setModalOpen(true);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask && editingTask.id) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${editingTask.id.toString().replace('task-', '')}`, {
          ...editingTask,
          ...taskData,
          due_date: taskData.due_date,
        });
        setEvents(prev => prev.map(e => e.id === editingTask.id ? { ...e, ...taskData, date: taskData.due_date } : e));
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

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
          <Calendar events={events} onEventMove={handleEventMove} onTaskClick={handleTaskClick} />
        )}
      </div>
      <TaskModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};

export default CalendarPage; 