'use client';
import React, { useEffect, useState } from 'react';
import TaskModal from '../../components/TaskModal';
import axios from 'axios';

const statusOptions = ['To-do', 'In Progress', 'Done'];

const TasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/tasks/api');
      setTasks(res.data);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (task: any) => {
    await axios.post('/tasks/api', task);
    fetchTasks();
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
        <div className="flex gap-4">
          {statusOptions.map(status => (
            <div key={status} className="w-1/3 bg-white rounded-xl p-4 shadow min-h-[300px]">
              <div className="font-semibold mb-2">{status}</div>
              {loading ? (
                <div>Loading...</div>
              ) : (
                tasks.filter(t => t.status === status).map(t => (
                  <div key={t.id} className="mb-3 p-3 bg-gray-100 rounded-lg shadow-sm cursor-pointer">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-500">Due: {t.dueDate || 'N/A'}</div>
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
      {/* Task Details Panel */}
      <div className="w-1/3 p-6 bg-white rounded-r-2xl shadow-lg border-l border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Task Details</h2>
        {/* TODO: Task details content goes here */}
      </div>
    </div>
  );
};

export default TasksPage; 