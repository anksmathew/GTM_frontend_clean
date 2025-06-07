'use client';
import React, { useEffect, useState } from 'react';
import TaskModal from '../../components/TaskModal';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  const [search, setSearch] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`, {
        ...task,
        status: newStatus
      });
      
      // Optimistically update the UI
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (err) {
      setError('Failed to update task status');
      // Revert the optimistic update
      fetchTasks();
    }
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.description.toLowerCase().includes(search.toLowerCase())
  );

  // Group tasks by status
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="bg-[#F7F8FA] min-h-screen p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-6">
          <button
            className="text-base font-semibold px-1 pb-2 transition-colors duration-150 border-b-2 text-green-600 border-green-600"
            style={{ background: 'none', boxShadow: 'none' }}
            disabled
          >
            All Tasks
          </button>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
            <input
              className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 w-48"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-5 py-2 text-sm shadow"
            onClick={() => setModalOpen(true)}
          >
            + New Task
          </button>
        </div>
      </div>
      <div className="border-b border-gray-200 mb-6" />

      {/* Kanban Board */}
      <DragDropContext
        onDragEnd={onDragEnd}
        onDragStart={result => setDraggingId(result.draggableId)}
        onDragUpdate={result => setDraggingId(result.draggableId)}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusOptions.map(status => (
            <div key={status} className="bg-[#F4F5F7] rounded-xl p-4 min-h-[500px] flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    status === 'To-do' ? 'bg-blue-100 text-blue-700' :
                    status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{status}</span>
                  <span className="text-xs text-gray-500 font-medium">{groupedTasks[status]?.length || 0}</span>
                </div>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200 transition"
                  onClick={() => setModalOpen(true)}
                >
                  <span className="text-xl leading-none">+</span>
                </button>
              </div>
              {/* Cards */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    className={`flex-1 flex flex-col gap-4 ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                    {...provided.droppableProps}
                  >
                    {groupedTasks[status]?.map((task, idx) => (
                      <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col gap-2
                              ${snapshot.isDragging ? 'ring-2 ring-green-400 shadow-lg opacity-90 scale-[1.03] z-20' : ''}
                              ${draggingId === String(task.id) ? 'border-green-400' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <div>
                                <h4 className="font-semibold text-gray-900 leading-tight">{task.title}</h4>
                                <p className="text-xs text-gray-500">{task.description}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-600">
                              <div>
                                <span className="block font-medium text-gray-400">Due Date</span>
                                <span className="font-semibold text-gray-700">
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default TasksPage; 