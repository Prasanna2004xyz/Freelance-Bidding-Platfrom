import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sun, Moon, Bell, BellOff, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [notificationSound, setNotificationSound] = useState(() => localStorage.getItem('notificationSound') !== 'off');
  const [pushNotifications, setPushNotifications] = useState(() => localStorage.getItem('pushNotifications') === 'on');

  useEffect(() => {
    localStorage.setItem('notificationSound', notificationSound ? 'on' : 'off');
  }, [notificationSound]);

  useEffect(() => {
    localStorage.setItem('pushNotifications', pushNotifications ? 'on' : 'off');
  }, [pushNotifications]);

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  };

  const handleNotificationSoundToggle = () => {
    setNotificationSound(!notificationSound);
    toast.success(`Notification sound ${!notificationSound ? 'enabled' : 'disabled'}`);
  };

  const handlePushNotificationsToggle = () => {
    setPushNotifications(!pushNotifications);
    toast.success(`Push notifications ${!pushNotifications ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-silver-100">Settings</h1>
          <p className="text-silver-400">Customize your experience</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-silver-200 font-medium">Theme</p>
              <p className="text-silver-400 text-sm">Choose your preferred color scheme</p>
            </div>
            <Button
              onClick={handleThemeToggle}
              variant="secondary"
              className="flex items-center gap-2 px-4 py-2 glass-card hover:scale-[1.02] transition-all duration-200"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-400" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-silver-200 font-medium">Notification Sound</p>
                <p className="text-silver-400 text-sm">Play sounds for new notifications</p>
              </div>
              <Button
                onClick={handleNotificationSoundToggle}
                variant={notificationSound ? 'primary' : 'secondary'}
                className="flex items-center gap-2 px-4 py-2 hover:scale-[1.02] transition-all duration-200"
              >
                {notificationSound ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span>{notificationSound ? 'On' : 'Off'}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-silver-200 font-medium">Browser Push Notifications</p>
                <p className="text-silver-400 text-sm">Receive notifications even when the app is closed</p>
              </div>
              <Button
                onClick={handlePushNotificationsToggle}
                variant={pushNotifications ? 'primary' : 'secondary'}
                className="flex items-center gap-2 px-4 py-2 hover:scale-[1.02] transition-all duration-200"
              >
                <span>{pushNotifications ? 'On' : 'Off'}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-silver-200 font-medium">Profile</p>
                <p className="text-silver-400 text-sm">Manage your profile information</p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-2 hover:scale-[1.02] transition-all duration-200"
                onClick={() => window.location.href = '/profile'}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-4">About</h2>
          <div className="space-y-2 text-silver-400">
            <p><strong className="text-silver-200">Version:</strong> 1.0.0</p>
            <p><strong className="text-silver-200">Platform:</strong> FreelanceHub</p>
            <p className="text-sm">A modern freelance bidding platform built with React, Node.js, and AI-powered features.</p>
          </div>
        </Card>
      </div>
    </div>
  );
} 