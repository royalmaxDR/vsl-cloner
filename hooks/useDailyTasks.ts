import { useState, useEffect } from 'react';
import tasksData from '@/data/tasksDB.json';

export type Task = {
  id: string;
  type: string;
  title: string;
  description: string;
  reward: number;
  timeEstimate: string;
  requiredModule: string | null;
  data: any;
  completed?: boolean;
};

// Simple seeded random function
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const useDailyTasks = () => {
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('dailyTasksState');
    
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyTasks(parsed.tasks);
        setLoading(false);
        return;
      }
    }

    // Generate new tasks for today
    // Use date string as seed base
    let seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Shuffle tasks
    // We create a copy to avoid mutating the original import if it's cached/frozen
    const shuffled = [...tasksData].sort(() => 0.5 - seededRandom(seed++));
    
    // Pick 5 unique tasks
    const selected = shuffled.slice(0, 5).map(t => ({...t, completed: false}));
    
    setDailyTasks(selected);
    localStorage.setItem('dailyTasksState', JSON.stringify({ date: today, tasks: selected }));
    setLoading(false);
  }, []);

  const completeTask = (taskId: string) => {
    setDailyTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, completed: true } : t);
      const today = new Date().toDateString();
      localStorage.setItem('dailyTasksState', JSON.stringify({ date: today, tasks: updated }));
      return updated;
    });
  };

  return { dailyTasks, loading, completeTask };
};
