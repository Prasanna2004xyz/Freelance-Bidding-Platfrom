import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Calendar, User, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useForm } from 'react-hook-form';
import { Contract, Task } from '../../types';
import { formatDate } from '../../lib/utils';

interface TaskBoardProps {
  contract: Contract;
  onAddTask: (taskData: Partial<Task>) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  canManage: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
}

export function TaskBoard({ contract, onAddTask, onUpdateTaskStatus, canManage }: TaskBoardProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState(contract.tasks || []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TaskFormData>();

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const handleAddTask = (data: TaskFormData) => {
    onAddTask({
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    });
    reset();
    setShowAddTask(false);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === taskId ? { ...task, status: newStatus } : task
      )
    );
    onUpdateTaskStatus(taskId, newStatus);
  };

  const TaskColumn = ({ 
    title, 
    tasks, 
    status, 
    color 
  }: { 
    title: string; 
    tasks: Task[]; 
    status: Task['status']; 
    color: string;
  }) => (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center justify-between mb-4 p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <h3 className={`font-semibold text-${color}-400`}>{title}</h3>
        <Badge variant="default" size="sm">{tasks.length}</Badge>
      </div>

      <Reorder.Group
        axis="y"
        values={tasks}
        onReorder={(newTasks) => {
          setTasks(prevTasks => {
            const otherTasks = prevTasks.filter(task => task.status !== status);
            return [...otherTasks, ...newTasks];
          });
        }}
        className="space-y-3"
      >
        {tasks.map((task) => (
          <Reorder.Item key={task._id} value={task}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-4 cursor-move hover:bg-black/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-silver-100 line-clamp-2">
                    {task.title}
                  </h4>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {task.description && (
                  <p className="text-sm text-silver-400 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-silver-400">
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Assigned</span>
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task._id, e.target.value as Task['status'])}
                      className="text-xs bg-black/20 border border-silver-200/20 rounded px-2 py-1 text-silver-200"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </Card>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-silver-100">Project Tasks</h2>
        {canManage && (
          <Button onClick={() => setShowAddTask(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskColumn
          title="To Do"
          tasks={todoTasks}
          status="todo"
          color="blue"
        />
        <TaskColumn
          title="In Progress"
          tasks={inProgressTasks}
          status="in_progress"
          color="yellow"
        />
        <TaskColumn
          title="Completed"
          tasks={completedTasks}
          status="completed"
          color="green"
        />
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Add New Task"
      >
        <form onSubmit={handleSubmit(handleAddTask)} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            error={errors.title?.message}
            {...register('title', { required: 'Task title is required' })}
          />

          <div>
            <label className="block text-sm font-medium text-silver-200 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 glass-card text-silver-100 placeholder-silver-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-lg resize-none"
              rows={3}
              placeholder="Enter task description (optional)"
              {...register('description')}
            />
          </div>

          <Input
            label="Due Date (Optional)"
            type="date"
            {...register('dueDate')}
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddTask(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}