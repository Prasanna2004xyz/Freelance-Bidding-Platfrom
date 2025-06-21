import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications(page);
    // eslint-disable-next-line
  }, [page]);

  const fetchNotifications = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications({ page: pageNum, limit: 20 });
      if (res.success) {
        setNotifications(res.data.notifications);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setActionError(null);
    } catch {
      setActionError('Failed to mark as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter(n => n._id !== id));
      setActionError(null);
    } catch {
      setActionError('Failed to delete notification.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">Notifications</h1>
      {actionError && <div className="mb-4 text-red-400 text-sm text-center" aria-live="polite">{actionError}</div>}
      {loading ? (
        <div className="text-center text-silver-400 py-12">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-silver-400 py-12">No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className={`p-4 flex items-start space-x-4 focus:ring-2 focus:ring-blue-500 transition outline-none ${!n.read ? 'bg-blue-500/10' : ''}`}
              tabIndex={0}
              aria-label={`Notification: ${n.title}. ${n.read ? 'Read' : 'Unread'}`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-silver-100 text-base">{n.title}</h2>
                  {!n.read && <Badge variant="danger" aria-label="Unread notification">Unread</Badge>}
                </div>
                <p className="text-silver-400 text-sm mt-1">{n.message}</p>
                <p className="text-silver-500 text-xs mt-2">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {!n.read && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(n._id)}
                    className="focus:ring-2 focus:ring-blue-500"
                    aria-label="Mark notification as read"
                  >
                    Mark as read
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDelete(n._id)}
                  className="focus:ring-2 focus:ring-blue-500"
                  aria-label="Delete notification"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-silver-400 px-2">Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 