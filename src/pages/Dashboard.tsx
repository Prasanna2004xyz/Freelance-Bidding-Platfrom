import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  Star,
  MessageCircle,
  Plus,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { DashboardStats } from '../types';
import { getAnalytics } from '../services/api';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * (target - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
      else setValue(target);
    }
    requestAnimationFrame(animate);
    return () => setValue(target);
  }, [target, duration]);
  return value;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState<{ users: number; jobs: number; contracts: number; activeUsers: number; jobsThisWeek: number; revenue: number; averageContractValue: number } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [jobRecs, setJobRecs] = useState([]);
  const [jobRecsLoading, setJobRecsLoading] = useState(false);
  const [jobRecsError, setJobRecsError] = useState('');
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState('');

  // Prepare analytics values for useCountUp
  const usersCount = useCountUp(analytics?.users ?? 0);
  const jobsCount = useCountUp(analytics?.jobs ?? 0);
  const contractsCount = useCountUp(analytics?.contracts ?? 0);
  const activeUsersCount = useCountUp(analytics?.activeUsers ?? 0);
  const jobsThisWeekCount = useCountUp(analytics?.jobsThisWeek ?? 0);
  const revenueCount = useCountUp(analytics?.revenue ?? 0);
  const avgContractValueCount = useCountUp(analytics?.averageContractValue ?? 0);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    // Fetch AI widgets if freelancer
    if (user?.role === 'freelancer') {
      fetchJobRecs();
      fetchTrendingSkills();
    }
  }, [user?.role]);

  const fetchDashboardData = async () => {
    // Mock data for now
    if (user?.role === 'client') {
      setStats({
        totalJobs: 12,
        activeProjects: 3,
        totalBids: 45,
        completedProjects: 9,
        successRate: 85,
      });
    } else {
      setStats({
        totalBids: 28,
        activeProjects: 2,
        totalEarnings: 12450,
        completedProjects: 15,
        averageRating: 4.8,
        successRate: 92,
      });
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setAnalyticsError('Failed to load analytics');
      }
    } catch {
      setAnalyticsError('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchJobRecs = async () => {
    setJobRecsLoading(true);
    setJobRecsError('');
    try {
      const res = await axios.get('/api/jobs/recommendations', { withCredentials: true });
      setJobRecs(res.data.data);
    } catch {
      setJobRecsError('Failed to load recommendations');
    } finally {
      setJobRecsLoading(false);
    }
  };

  const fetchTrendingSkills = async () => {
    setSkillsLoading(true);
    setSkillsError('');
    try {
      const res = await axios.get('/api/jobs/trending-skills', { withCredentials: true });
      setTrendingSkills(res.data.data);
    } catch {
      setSkillsError('Failed to load trending skills');
    } finally {
      setSkillsLoading(false);
    }
  };

  const clientStats = [
    {
      title: 'Active Jobs',
      value: stats.totalJobs || 0,
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Total Bids',
      value: stats.totalBids || 0,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  const freelancerStats = [
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects || 0,
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Average Rating',
      value: stats.averageRating || 0,
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  const displayStats = user?.role === 'client' ? clientStats : freelancerStats;

  const quickActions = user?.role === 'client' ? [
    {
      title: 'Post a New Job',
      description: 'Find the perfect freelancer for your project',
      icon: Plus,
      link: '/post-job',
      color: 'from-blue-600 to-purple-600',
    },
    {
      title: 'View Applications',
      description: 'Review bids on your active jobs',
      icon: Users,
      link: '/my-jobs',
      color: 'from-green-600 to-teal-600',
    },
    {
      title: 'Messages',
      description: 'Chat with freelancers',
      icon: MessageCircle,
      link: '/messages',
      color: 'from-purple-600 to-pink-600',
    },
  ] : [
    {
      title: 'Find Jobs',
      description: 'Browse available opportunities',
      icon: Briefcase,
      link: '/find-jobs',
      color: 'from-blue-600 to-purple-600',
    },
    {
      title: 'My Proposals',
      description: 'Track your submitted bids',
      icon: Users,
      link: '/my-bids',
      color: 'from-green-600 to-teal-600',
    },
    {
      title: 'Messages',
      description: 'Chat with clients',
      icon: MessageCircle,
      link: '/messages',
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Platform Analytics Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-silver-100 mb-4">Platform Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {analyticsLoading ? (
            <div className="col-span-3 text-center text-silver-400">Loading analytics...</div>
          ) : analyticsError ? (
            <div className="col-span-3 text-center text-red-400">{analyticsError}</div>
          ) : analytics ? (
            <>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-silver-400 text-sm">Total Users</div>
                  <div className="text-2xl font-bold text-silver-100">{usersCount}</div>
                </div>
              </Card>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-green-400 outline-none cursor-pointer">
                <Briefcase className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-silver-400 text-sm">Total Jobs</div>
                  <div className="text-2xl font-bold text-silver-100">{jobsCount}</div>
                </div>
              </Card>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer">
                <Star className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-silver-400 text-sm">Total Contracts</div>
                  <div className="text-2xl font-bold text-silver-100">{contractsCount}</div>
                </div>
              </Card>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer">
                <UserCheck className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-silver-400 text-sm">Active Users</div>
                  <div className="text-2xl font-bold text-silver-100">{activeUsersCount}</div>
                </div>
              </Card>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-pink-400 outline-none cursor-pointer">
                <Briefcase className="w-8 h-8 text-pink-400" />
                <div>
                  <div className="text-silver-400 text-sm">Jobs This Week</div>
                  <div className="text-2xl font-bold text-silver-100">{jobsThisWeekCount}</div>
                </div>
              </Card>
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-green-400 outline-none cursor-pointer">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-silver-400 text-sm">Total Revenue</div>
                  <div className="text-2xl font-bold text-silver-100">${revenueCount}</div>
                </div>
              </Card>
              {/* Average Contract Value Card */}
              <Card className="p-6 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.03] focus:ring-2 focus:ring-cyan-400 outline-none cursor-pointer">
                <DollarSign className="w-8 h-8 text-cyan-400" />
                <div>
                  <div className="text-silver-400 text-sm">Avg. Contract Value</div>
                  <div className="text-2xl font-bold text-silver-100">${avgContractValueCount}</div>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </motion.div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-silver-100 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-silver-400">
          {user?.role === 'client' 
            ? 'Manage your projects and find the best talent' 
            : 'Discover new opportunities and grow your career'
          }
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-silver-400 text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-silver-100 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-silver-100 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={action.title} to={action.link}>
              <Card hover className="p-6 h-full">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-silver-100 mb-2">
                  {action.title}
                </h3>
                <p className="text-silver-400 text-sm">
                  {action.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-2xl font-bold text-silver-100 mb-6">Recent Activity</h2>
        <Card className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-silver-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Clock className="w-8 h-8 text-silver-400" />
              </div>
              <p className="text-silver-400">No recent activity</p>
              <p className="text-silver-500 text-sm mt-1">
                Your recent actions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Activity items will be rendered here */}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Jobs Posted (Last 6 Weeks) */}
      <Card className="p-6 mt-8">
        <h3 className="font-semibold text-silver-100 mb-4">Jobs Posted (Last 6 Weeks)</h3>
        <div className="h-48">
          <Line
            data={{
              labels: ['6w ago', '5w', '4w', '3w', '2w', 'Last week'],
              datasets: [
                {
                  label: 'Jobs',
                  data: analytics?.jobsPerWeek || [0, 0, 0, 0, 0, 0],
                  borderColor: '#60a5fa',
                  backgroundColor: 'rgba(96,165,250,0.2)',
                  tension: 0.4,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>

      {/* Revenue (Last 6 Weeks) */}
      <Card className="p-6 mt-8">
        <h3 className="font-semibold text-silver-100 mb-4">Revenue (Last 6 Weeks)</h3>
        <div className="h-48">
          <Line
            data={{
              labels: ['6w ago', '5w', '4w', '3w', '2w', 'Last week'],
              datasets: [
                {
                  label: 'Revenue',
                  data: analytics?.revenuePerWeek || [0, 0, 0, 0, 0, 0],
                  borderColor: '#34d399',
                  backgroundColor: 'rgba(52,211,153,0.2)',
                  tension: 0.4,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>

      {/* User Signups (Last 6 Weeks) */}
      <Card className="p-6 mt-8">
        <h3 className="font-semibold text-silver-100 mb-4">User Signups (Last 6 Weeks)</h3>
        <div className="h-48">
          <Line
            data={{
              labels: ['6w ago', '5w', '4w', '3w', '2w', 'Last week'],
              datasets: [
                {
                  label: 'Signups',
                  data: analytics?.signupsPerWeek || [0, 0, 0, 0, 0, 0],
                  borderColor: '#f472b6',
                  backgroundColor: 'rgba(244,114,182,0.2)',
                  tension: 0.4,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>

      {/* AI-powered Features for Freelancers */}
      {user?.role === 'freelancer' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-silver-100 mb-6">AI-Powered Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Job Recommendations */}
            <Card className="p-6">
              <h3 className="font-semibold text-silver-100 mb-2">Job Recommendations</h3>
              {jobRecsLoading ? (
                <div className="text-silver-400">Loading...</div>
              ) : jobRecsError ? (
                <div className="text-red-400">{jobRecsError}</div>
              ) : jobRecs.length === 0 ? (
                <div className="text-silver-400">No recommendations found.</div>
              ) : (
                <ul className="space-y-2">
                  {jobRecs.map(job => (
                    <li key={job._id} className="text-silver-300">
                      • {job.title} <span className="text-silver-500 text-xs">({job.skills?.join(', ')})</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-silver-500 text-xs mt-2">Personalized by AI based on your skills and history</p>
            </Card>
            {/* Skill Gap Analysis */}
            <Card className="p-6">
              <h3 className="font-semibold text-silver-100 mb-2">Skill Gap Analysis</h3>
              {skillsLoading ? (
                <div className="text-silver-400">Loading...</div>
              ) : skillsError ? (
                <div className="text-red-400">{skillsError}</div>
              ) : trendingSkills.length === 0 ? (
                <div className="text-silver-400">No trending skills found.</div>
              ) : (
                <ul className="space-y-2">
                  {trendingSkills.map(skill => (
                    <li key={skill} className="text-silver-300">• {skill}</li>
                  ))}
                </ul>
              )}
              <p className="text-silver-500 text-xs mt-2">AI suggests skills to boost your opportunities</p>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}