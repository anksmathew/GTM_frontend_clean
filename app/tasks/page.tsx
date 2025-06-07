'use client';
import React, { useEffect, useState } from 'react';
import TaskModal from '../../components/TaskModal';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const statusOptions = ['To-do', 'In Progress', 'Done'];

interface Campaign {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  campaignIds: string[];
}

interface TaskModalData {
  id?: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  campaignIds: string[];
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, Campaign>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/campaigns`);
      const campaignsData = Array.isArray(res.data) ? res.data : (res.data.campaigns || []);
      const campaignsMap = campaignsData.reduce((acc: Record<string, Campaign>, campaign: Campaign) => {
        acc[campaign.id.toString()] = campaign;
        return acc;
      }, {});
      setCampaigns(campaignsMap);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

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
    fetchCampaigns();
  }, []);

  const handleSaveTask = async (taskData: TaskModalData) => {
    try {
      const taskPayload = {
        ...taskData,
        dueDate: taskData.due_date || null,
        campaignIds: taskData.campaignIds
      };

      if (editingTask) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${editingTask.id}`, {
          ...taskPayload,
          id: editingTask.id
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks`, taskPayload);
      }
      fetchTasks();
      setModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
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

  const handleEditTask = (task: Task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      status: task.status,
      campaignIds: task.campaignIds
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
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
  const filteredTasks = tasks.filter(task => {
    const searchLower = search.toLowerCase();
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    const campaignNames = task.campaignIds
      .map(id => campaigns[id]?.name || '')
      .join(' ')
      .toLowerCase();
    return taskText.includes(searchLower) || campaignNames.includes(searchLower);
  });

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
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
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
                  onClick={() => {
                    setEditingTask(null);
                    setModalOpen(true);
                  }}
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
                            className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col gap-2 cursor-pointer
                              ${snapshot.isDragging ? 'ring-2 ring-green-400 shadow-lg opacity-90 scale-[1.03] z-20' : ''}
                              ${draggingId === String(task.id) ? 'border-green-400' : ''}
                            `}
                            onClick={() => handleEditTask(task)}
                          >
                            <div className="flex flex-col gap-2">
                              <h3 className="font-medium text-neutral-900">{task.title}</h3>
                              <p className="text-sm text-neutral-600 line-clamp-2">{task.description}</p>
                              {task.due_date && (
                                <p className="text-sm text-neutral-500">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                              {task.campaignIds.length > 0 && (
                                <div className="mt-2">
                                  <span className="block text-xs font-semibold text-neutral-500 mb-1">Associated Campaigns</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {task.campaignIds.map(campaignId => {
                                      const campaign = campaigns[campaignId];
                                      return campaign ? (
                                        <span
                                          key={campaignId}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                                        >
                                          {campaign.name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
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
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};

export default TasksPage; 