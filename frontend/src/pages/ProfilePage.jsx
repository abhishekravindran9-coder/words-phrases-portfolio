import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/categoryService';
import { reminderService } from '../services/reminderService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CATEGORY_COLORS } from '../utils/constants';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Profile page – manage display name, categories, and reminder settings.
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Category modal
  const [catModal,  setCatModal]  = useState(false);
  const [catForm,   setCatForm]   = useState({ name: '', color: CATEGORY_COLORS[0], description: '' });
  const [catSaving, setCatSaving] = useState(false);

  // Reminder modal
  const [remModal,  setRemModal]  = useState(false);
  const [remForm,   setRemForm]   = useState({ type: 'EMAIL', frequency: 'DAILY', reminderTime: '08:00', daysOfWeek: [] });
  const [remSaving, setRemSaving] = useState(false);

  useEffect(() => {
    Promise.all([categoryService.getCategories(), reminderService.getReminders()])
      .then(([cats, rems]) => { setCategories(cats); setReminders(rems); })
      .finally(() => setLoading(false));
  }, []);

  // -- Categories --
  const createCategory = async (e) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      const cat = await categoryService.createCategory(catForm);
      setCategories((cs) => [...cs, cat]);
      setCatModal(false);
      setCatForm({ name: '', color: CATEGORY_COLORS[0], description: '' });
      toast.success('Category created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoryService.deleteCategory(id);
      setCategories((cs) => cs.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // -- Reminders --
  const createReminder = async (e) => {
    e.preventDefault();
    setRemSaving(true);
    try {
      const rem = await reminderService.createReminder({
        ...remForm,
        daysOfWeek: remForm.daysOfWeek.length ? remForm.daysOfWeek : undefined,
      });
      setReminders((rs) => [...rs, rem]);
      setRemModal(false);
      toast.success('Reminder added!');
    } catch { toast.error('Failed to add reminder'); }
    finally { setRemSaving(false); }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await reminderService.deleteReminder(id);
      setReminders((rs) => rs.filter((r) => r.id !== id));
      toast.success('Reminder deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const toggleDay = (d) => setRemForm((f) => ({
    ...f,
    daysOfWeek: f.daysOfWeek.includes(d)
      ? f.daysOfWeek.filter((x) => x !== d)
      : [...f.daysOfWeek, d],
  }));

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900">Profile & Settings</h1>

      {/* User info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Username</p>
            <p className="text-gray-800 font-semibold mt-1">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</p>
            <p className="text-gray-800 font-semibold mt-1">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Display Name</p>
            <p className="text-gray-800 font-semibold mt-1">{user?.displayName || '—'}</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">Word Categories</h2>
          <Button size="sm" onClick={() => setCatModal(true)}>
            <PlusIcon className="h-4 w-4" /> New
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color || '#4f46e5' }} />
                <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                <span className="text-xs text-gray-400">{cat.wordCount} words</span>
                <button onClick={() => deleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reminders */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">Reminders</h2>
          <Button size="sm" onClick={() => setRemModal(true)}>
            <PlusIcon className="h-4 w-4" /> Add
          </Button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-sm text-gray-400">No reminders set. Add one to stay on track!</p>
        ) : (
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                <span className="text-lg">{r.type === 'EMAIL' ? '📧' : '🔔'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {r.frequency} at {r.reminderTime}
                    {r.daysOfWeek && ` (${r.daysOfWeek})`}
                  </p>
                  <p className="text-xs text-gray-400">{r.type} • {r.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Category modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="New Category">
        <form onSubmit={createCategory} className="space-y-4">
          <Input id="cat-name" label="Name *" value={catForm.name}
            onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setCatForm((f) => ({ ...f, color: c }))}
                  className={`h-7 w-7 rounded-full border-2 transition-transform
                    ${catForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Input id="cat-desc" label="Description" value={catForm.description}
            onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCatModal(false)}>Cancel</Button>
            <Button type="submit" loading={catSaving}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Reminder modal */}
      <Modal isOpen={remModal} onClose={() => setRemModal(false)} title="Add Reminder">
        <form onSubmit={createReminder} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={remForm.type} onChange={(e) => setRemForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="EMAIL">📧 Email</option>
                <option value="PUSH">🔔 Push (future)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={remForm.frequency} onChange={(e) => setRemForm((f) => ({ ...f, frequency: e.target.value }))}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <Input id="rem-time" label="Time" type="time" value={remForm.reminderTime}
            onChange={(e) => setRemForm((f) => ({ ...f, reminderTime: e.target.value }))} />

          {remForm.frequency === 'WEEKLY' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors
                      ${remForm.daysOfWeek.includes(d)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRemModal(false)}>Cancel</Button>
            <Button type="submit" loading={remSaving}>Add Reminder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
