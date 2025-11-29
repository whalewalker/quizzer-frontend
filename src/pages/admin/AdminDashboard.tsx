import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  FileText,
  Layers
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getSystemStats,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: `+${stats?.users.newLast7Days || 0} this week`,
    },
    {
      title: 'Active Users',
      value: stats?.users.active || 0,
      icon: Activity,
      color: 'bg-green-500',
      trend: 'Currently active',
    },
    {
      title: 'Total Quizzes',
      value: stats?.content.quizzes || 0,
      icon: BookOpen,
      color: 'bg-purple-500',
      trend: 'Platform wide',
    },
    {
      title: 'Total Attempts',
      value: stats?.engagement.totalAttempts || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: `+${stats?.engagement.attemptsLast7Days || 0} this week`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color} bg-opacity-10 text-white`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="font-medium text-green-600">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and edit users</p>
              </div>
            </Link>
            <Link
              to="/admin/content"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Content</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review platform content</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Content Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quizzes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total created</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.quizzes || 0}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Flashcards</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total sets</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.flashcards || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Study Materials</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generated content</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.studyMaterials || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
