import React, { useState, useEffect } from 'react';
import calendarApi from '../../services/calendarApi';
import { formatDate, formatTime, todayStr } from './calendarMeta';
import Pagination from '../Pagination';

const inputClass =
  'w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner';

const PRIORITY_META = {
  low: { label: 'Low', chip: 'bg-slate-800/60 text-slate-300 border-slate-700' },
  medium: { label: 'Medium', chip: 'bg-amber-950/50 text-amber-300 border-amber-800/70' },
  high: { label: 'High', chip: 'bg-rose-950/50 text-rose-300 border-rose-800/70' },
};

const EMPTY_FORM = { title: '', date: todayStr(), time: '', priority: 'medium' };

export default function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const load = async (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    setError('');
    try {
      const res = await calendarApi.listTasks({ page: targetPage, limit: targetLimit });
      setTasks(res.data.tasks || []);

      const meta = res.data.pagination || null;
      setPagination(meta);
      // Completing or deleting the last task on the final page removes it from
      // the result set, which can leave us past the end. Step back.
      if (meta && meta.totalPages >= 1 && targetPage > meta.totalPages) {
        setPage(meta.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await calendarApi.createTask({
        title: form.title.trim(),
        date: form.date || '',
        time: form.time || '',
        priority: form.priority,
      });
      setForm({ ...EMPTY_FORM });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    setActionId(task._id);
    setError('');
    try {
      await calendarApi.updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (task) => {
    setActionId(task._id);
    setError('');
    try {
      await calendarApi.deleteTask(task._id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setActionId(null);
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    const doneA = a.status === 'completed' ? 1 : 0;
    const doneB = b.status === 'completed' ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99:99').localeCompare(b.time || '99:99');
  });

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Tasks</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Personal tasks — visible only to you.</p>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          {tasks.filter((t) => t.status !== 'completed').length} open
        </span>
      </div>

      {error && (
        <div className="p-3 text-xs rounded-2xl font-medium shadow-inner bg-rose-950/50 border border-rose-800/80 text-rose-300 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3 mb-5">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Add a task, e.g. Draft pitch deck"
          className={inputClass}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            className={inputClass}
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            className={inputClass}
          />
          <select
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
            className={inputClass}
          >
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label} priority
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition disabled:opacity-50"
        >
          {saving ? 'Adding...' : '+ Add Task'}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500 font-medium">Loading tasks...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-1.5">📝</div>
          <p className="text-xs text-slate-400">No tasks yet. Add your first personal task above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const prio = PRIORITY_META[task.priority] || PRIORITY_META.medium;
            const done = task.status === 'completed';
            return (
              <div
                key={task._id}
                className={`flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-4 py-3 transition ${
                  done ? 'opacity-60' : ''
                }`}
              >
                <button
                  onClick={() => toggleTask(task)}
                  disabled={actionId === task._id}
                  className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center text-xs transition ${
                    done
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-700 text-transparent hover:border-emerald-600'
                  }`}
                  title={done ? 'Mark pending' : 'Mark completed'}
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold text-white tracking-tight truncate ${done ? 'line-through' : ''}`}>
                    {task.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {task.date ? formatDate(task.date) : 'No date'}
                    {task.time ? ` • ${formatTime(task.time)}` : ''}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${prio.chip}`}>
                  {prio.label}
                </span>
                <button
                  onClick={() => handleDelete(task)}
                  disabled={actionId === task._id}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition shrink-0"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 tasks" before the response lands. */}
      {pagination && pagination.total > 0 && (
        <div className="pt-4 border-t border-slate-800/80">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
            disabled={loading}
            label="tasks"
          />
        </div>
      )}
    </div>
  );
}