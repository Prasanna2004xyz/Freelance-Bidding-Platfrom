import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      setUsers(res.data.data);
    } catch (e) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (id, banned) => {
    setActionLoading(id);
    try {
      if (banned) {
        await axios.put(`/api/admin/users/${id}/unban`, {}, { withCredentials: true });
        toast.success('User unbanned');
      } else {
        await axios.put(`/api/admin/users/${id}/ban`, {}, { withCredentials: true });
        toast.success('User banned');
      }
      fetchUsers();
    } catch (e) {
      setError('Failed to update user');
      toast.error('Failed to update user');
    } finally {
      setActionLoading('');
    }
  };

  // Analytics
  const totalUsers = users.length;
  const bannedUsers = users.filter(u => u.banned).length;
  const activeUsers = users.filter(u => !u.banned).length;
  const clients = users.filter(u => u.role === 'client').length;
  const freelancers = users.filter(u => u.role === 'freelancer').length;
  const admins = users.filter(u => u.role === 'admin').length;

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold text-silver-100 mb-2">Admin Access Only</h1>
          <p className="text-silver-400">You do not have permission to view this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">Admin Dashboard</h1>
      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Total Users</div>
          <div className="text-2xl font-bold text-silver-100">{totalUsers}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Active</div>
          <div className="text-2xl font-bold text-green-400">{activeUsers}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Banned</div>
          <div className="text-2xl font-bold text-red-400">{bannedUsers}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Admins</div>
          <div className="text-2xl font-bold text-blue-400">{admins}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Clients</div>
          <div className="text-2xl font-bold text-purple-400">{clients}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-silver-400 text-xs">Freelancers</div>
          <div className="text-2xl font-bold text-yellow-400">{freelancers}</div>
        </Card>
      </div>
      {/* Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4 space-y-2 md:space-y-0">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-md bg-silver-800/30 text-silver-100 border border-silver-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-silver-800/30 text-silver-100 border border-silver-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <Card className="p-6">
        <h2 className="font-semibold text-silver-100 mb-4">User Management</h2>
        {loading ? (
          <div className="text-silver-400">Loading users...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-silver-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-silver-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} className={u.banned ? 'bg-red-900/10' : ''}>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">{u.banned ? <span className="text-red-400">Banned</span> : <span className="text-green-400">Active</span>}</td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        variant={u.banned ? 'primary' : 'danger'}
                        disabled={actionLoading === u._id}
                        onClick={() => handleBanToggle(u._id, u.banned)}
                      >
                        {actionLoading === u._id ? '...' : u.banned ? 'Unban' : 'Ban'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
} 