// app/tasks/selection/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tasks } from '@/lib/tasks';

export default function TaskSelection() {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [repetitionMode, setRepetitionMode] = useState<'fixed' | 'ai'>('fixed');
  const [customInterval, setCustomInterval] = useState<number>(15);

  const handleStartTask = () => {
    if (selectedTask) {
      router.push(`/dashboard/tasks/execute?task=${selectedTask}&mode=${repetitionMode}&interval=${customInterval}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-black bg-white rounded-lg shadow-md flex flex-col justify-center">
      <h1 className="text-3xl font-bold mb-8 text-center">Select Daily Task</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
              selectedTask === task.id 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedTask(task.id)}
          >
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-blue-600 text-2xl">
              🦷
            </div>
            <h3 className="font-bold text-lg">{task.title}</h3>
            <p className="text-gray-600 text-sm">{task.description}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {task.category}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {task.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Task Settings</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Prompt Repetition</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={repetitionMode === 'fixed'}
                  onChange={() => setRepetitionMode('fixed')}
                  className="h-4 w-4 text-blue-600"
                />
                <span>Fixed Interval</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={repetitionMode === 'ai'}
                  onChange={() => setRepetitionMode('ai')}
                  className="h-4 w-4 text-blue-600"
                />
                <span>AI-Adjusted</span>
              </label>
            </div>
          </div>

          {repetitionMode === 'fixed' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Repeat every (seconds): {customInterval}
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={customInterval}
                onChange={(e) => setCustomInterval(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={handleStartTask}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Start Task
          </button>
        </div>
      )}
    </div>
  );
}