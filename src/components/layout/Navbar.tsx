import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  MessageCircle,
  Briefcase,
  PlusCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi } from '../../services/api';

export function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, setNotifications } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.read);

  const clientNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Briefcase },
    { path: '/post-job', label: 'Post Job', icon: PlusCircle },
    { path: '/my-jobs', label: 'My Jobs', icon: Briefcase },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  const freelancerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Briefcase },
    { path: '/find-jobs', label: 'Find Jobs', icon: Briefcase },
    { path: '/my-bids', label: 'My Bids', icon: Briefcase },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  const navItems = user?.role === 'client' ? clientNavItems : freelancerNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      if (setNotifications) {
        setNotifications((prev: Notification[]) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      }
    } catch {
      // Optionally show toast error
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-silver-200/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold gradient-text">
              FreelanceHub
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-silver-200/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="text-2xl font-bold gradient-text">
            FreelanceHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                      : 'text-silver-300 hover:text-white hover:bg-white/5 hover:border hover:border-white/10'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 hover:bg-silver-700/40 transition-colors rounded-lg"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 hover:bg-silver-700/40 transition-colors rounded-lg"
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <Badge 
                    variant="danger" 
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    role="menu"
                    aria-label="Notifications"
                    className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl max-h-80 overflow-y-auto scrollbar-thin z-50 bg-black/95 backdrop-blur-xl border border-silver-200/20"
                  >
                    <div className="p-4 border-b border-silver-200/20 flex items-center justify-between bg-silver-800/20">
                      <h3 className="font-semibold text-base text-silver-100">Notifications</h3>
                      {notifications.length > 10 && (
                        <Link 
                          to="/notifications" 
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors px-2 py-1 rounded hover:bg-blue-500/10"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          View all
                        </Link>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-silver-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 border-b border-silver-200/10 hover:bg-silver-700/30 cursor-pointer flex items-start space-x-3 transition-all duration-200 ${
                            !notification.read ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                          }`}
                          tabIndex={0}
                          role="menuitem"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleMarkNotificationAsRead(notification._id);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-base text-silver-100 truncate">
                              {notification.title}
                            </h4>
                            <p className="text-silver-400 text-sm mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-silver-500 text-xs mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkNotificationAsRead(notification._id);
                              }}
                              className="ml-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors flex-shrink-0"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-silver-700/40 transition-colors rounded-lg"
                aria-label="Profile menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-silver-200">{user.name}</span>
              </Button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    role="menu"
                    aria-label="Profile Menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-50 bg-black/95 backdrop-blur-xl border border-silver-200/20"
                  >
                    <div className="p-3 border-b border-silver-200/20 bg-silver-800/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-silver-100">{user.name}</p>
                          <p className="text-xs text-silver-400 capitalize">{user.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-silver-700/30 transition-colors text-base text-silver-200 hover:text-silver-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 text-silver-400" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-silver-700/30 transition-colors text-base text-silver-200 hover:text-silver-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 text-silver-400" />
                        <span>Settings</span>
                      </Link>
                    </div>
                    
                    <div className="border-t border-silver-200/20 my-1"></div>
                    
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-base"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 hover:bg-silver-700/40 transition-colors rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-silver-200/10 py-4"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                        : 'text-silver-300 hover:text-white hover:bg-white/5 hover:border hover:border-white/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}