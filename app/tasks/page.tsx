'use client';
import React, { useEffect, useState } from 'react';
import TaskModal from '../../components/TaskModal';
import axios from 'axios';

const statusOptions = ['To-do', 'In Progress', 'Done'];

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  campaign_id: number;
  created_at: string;
  updated_at: string;
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks`);
      setTasks(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (task: any) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks`, task);
      fetchTasks();
      setError('');
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`);
      fetchTasks();
      setError('');
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`, {
        ...task,
        status: newStatus
      });
      fetchTasks();
      setError('');
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Kanban Board */}
      <div className="flex-1 p-6 bg-gray-50 rounded-l-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            onClick={() => setModalOpen(true)}
          >
            + New Task
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}
        <div className="flex gap-4">
          {statusOptions.map(status => (
            <div key={status} className="w-1/3 bg-white rounded-xl p-4 shadow min-h-[300px]">
              <div className="font-semibold mb-2">{status}</div>
              {loading ? (
                <div>Loading...</div>
              ) : (
                tasks.filter(t => t.status === status).map(t => (
                  <div key={t.id} className="mb-3 p-3 bg-gray-100 rounded-lg shadow-sm">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-500">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        {statusOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTask}
        />
      </div>
    </div>
  );
};

export default TasksPage; 