import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export function Profile() {
  const { user, setUser, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ name: user?.name || '', bio: user?.bio || '' });
  }, [user]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [editing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateUser(form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">Profile</h1>
      <Card>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-silver-200 mb-1">Name</label>
              <input
                id="profile-name"
                ref={nameInputRef}
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onKeyDown={handleNameKeyDown}
                className="w-full p-2 rounded bg-black/30 border border-silver-200/20 text-silver-100 focus:ring-2 focus:ring-blue-500"
                placeholder="Name"
                aria-label="Name"
                aria-invalid={!form.name.trim()}
                aria-describedby={formError ? 'profile-name-error' : undefined}
              />
              {formError && (
                <div id="profile-name-error" className="text-red-400 text-xs mt-1" aria-live="polite">{formError}</div>
              )}
            </div>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/30 border border-silver-200/20 text-silver-100 focus:ring-2 focus:ring-blue-500"
              placeholder="Bio"
              aria-label="Bio"
              maxLength={300}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={saving || !form.name.trim() || (form.name === user?.name && form.bio === user?.bio)}
                className="focus:ring-2 focus:ring-blue-500"
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-silver-400">Name:</span> <span className="text-silver-100">{user?.name}</span>
            </div>
            <div>
              <span className="text-silver-400">Bio:</span> <span className="text-silver-100">{user?.bio || 'No bio yet.'}</span>
            </div>
            <Button onClick={() => setEditing(true)} className="focus:ring-2 focus:ring-blue-500">Edit Profile</Button>
          </div>
        )}
      </Card>
    </div>
  );
} 