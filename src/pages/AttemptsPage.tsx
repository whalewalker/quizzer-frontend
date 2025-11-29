import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Calendar, Filter, TrendingUp, Award, BookOpen, 
  Layers, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { attemptService } from '../services';
import type { Attempt } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function AttemptsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'flashcard'>('all');
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string; type: 'quiz' | 'flashcard' } | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  useEffect(() => {
    // Check if we have a specific quiz or flashcard to show
    const quizId = searchParams.get('quizId');
    const flashcardId = searchParams.get('flashcardId');
    
    if (quizId) {
      fetchQuizAttempts(quizId);
    } else if (flashcardId) {
      fetchFlashcardAttempts(flashcardId);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [attempts, filterType]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptService.getAll();
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      toast.error('Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizAttempts = async (quizId: string) => {
    try {
      setLoading(true);
      const data = await attemptService.getByQuizId(quizId);
      if (data.length > 0) {
        setSelectedItem({
          id: quizId,
          title: data[0].quiz?.title || 'Quiz',
          type: 'quiz'
        });
        setAttempts(data);
      }
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      toast.error('Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcardAttempts = async (flashcardId: string) => {
    try {
      setLoading(true);
      const data = await attemptService.getByFlashcardId(flashcardId);
      if (data.length > 0) {
        setSelectedItem({
          id: flashcardId,
          title: data[0].flashcardSet?.title || 'Flashcard Set',
          type: 'flashcard'
        });
        setAttempts(data);
      }
    } catch (error) {
      console.error('Error fetching flashcard attempts:', error);
      toast.error('Failed to load flashcard attempts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attempts];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(attempt => attempt.type === filterType);
    }
    
    setFilteredAttempts(filtered);
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
    setSearchParams({});
    fetchAttempts();
  };

  // Calculate statistics
  const stats = {
    total: filteredAttempts.length,
    quizzes: filteredAttempts.filter(a => a.type === 'quiz').length,
    flashcards: filteredAttempts.filter(a => a.type === 'flashcard').length,
    averageScore: filteredAttempts.length > 0
      ? Math.round(
          filteredAttempts
            .filter(a => a.score !== undefined && a.totalQuestions)
            .reduce((sum, a) => sum + ((a.score! / a.totalQuestions!) * 100), 0) /
          filteredAttempts.filter(a => a.score !== undefined && a.totalQuestions).length
        )
      : 0,
  };

  // Prepare chart data - Score trend over time
  const scoreTrendData = filteredAttempts
    .filter(a => a.score !== undefined && a.totalQuestions)
    .slice(0, 20)
    .reverse()
    .map((attempt, index) => {
      const scorePercent = Math.round((attempt.score! / attempt.totalQuestions!) * 100);
      return {
        name: format(parseISO(attempt.completedAt), 'MMM dd'),
        fullDate: format(parseISO(attempt.completedAt), 'MMM dd, yyyy h:mm a'),
        score: scorePercent,
        type: attempt.type,
        // Color based on performance
        fill: scorePercent >= 70 ? '#10b981' : scorePercent >= 50 ? '#f59e0b' : '#ef4444',
        attemptNumber: filteredAttempts.length - index,
      };
    });

  // Prepare pie chart data - Quiz vs Flashcard distribution
  const typeDistributionData = [
    { name: 'Quizzes', value: stats.quizzes },
    { name: 'Flashcards', value: stats.flashcards },
  ].filter(item => item.value > 0);

  // Group attempts by item (quiz or flashcard)
  const groupedAttempts = filteredAttempts.reduce((acc, attempt) => {
    const key = attempt.type === 'quiz' 
      ? `quiz-${attempt.quizId}` 
      : `flashcard-${attempt.flashcardSetId}`;
    
    if (!acc[key]) {
      acc[key] = {
        id: attempt.type === 'quiz' ? attempt.quizId! : attempt.flashcardSetId!,
        title: attempt.type === 'quiz' ? attempt.quiz?.title : attempt.flashcardSet?.title,
        topic: attempt.type === 'quiz' ? attempt.quiz?.topic : attempt.flashcardSet?.topic,
        type: attempt.type,
        attempts: [],
      };
    }
    acc[key].attempts.push(attempt);
    return acc;
  }, {} as Record<string, any>);

  const handleItemClick = (item: any) => {
    if (item.type === 'quiz') {
      setSearchParams({ quizId: item.id });
    } else {
      setSearchParams({ flashcardId: item.id });
    }
  };

  const handleAttemptClick = (attempt: Attempt) => {
    if (attempt.type === 'quiz' && attempt.quizId) {
      navigate(`/quiz/${attempt.quizId}/results/${attempt.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Attempt History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your progress across all quizzes and flashcards
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedItem && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <button
              onClick={handleClearSelection}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="w-4 h-4" />
              All Attempts
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white font-medium">
              {selectedItem.title}
            </span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quiz Attempts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.quizzes}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Flashcard Attempts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.flashcards}
                </p>
              </div>
              <Layers className="w-8 h-8 text-pink-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.averageScore}%
                </p>
              </div>
              <Award className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        {!selectedItem && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter:
              </span>
            </div>
            <div className="flex gap-2">
              {(['all', 'quiz', 'flashcard'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {filteredAttempts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Over Time
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your score progression (most recent {scoreTrendData.length} attempts)
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Good (≥70%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Fair (50-69%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Needs Work (&lt;50%)</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${payload[0].payload.fullDate} (Attempt #${payload[0].payload.attemptNumber})`;
                    }
                    return label;
                  }}
                />
                {/* Reference line at 70% */}
                <line 
                  x1="0" 
                  y1="30%" 
                  x2="100%" 
                  y2="30%" 
                  stroke="#10b981" 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                  opacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={payload.fill}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Type Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attempt Distribution
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistributionData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attempts List or Grouped View */}
      {selectedItem ? (
        // Detailed view for a specific quiz/flashcard
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Attempts for {selectedItem.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredAttempts.length} total attempts
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAttempts.map((attempt, index) => (
              <div
                key={attempt.id}
                onClick={() => handleAttemptClick(attempt)}
                className={`p-6 ${
                  attempt.type === 'quiz' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                } transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
                      #{filteredAttempts.length - index}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(parseISO(attempt.completedAt), 'MMM dd, yyyy • h:mm a')}
                      </p>
                      {attempt.score !== undefined && attempt.totalQuestions && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {attempt.score} / {attempt.totalQuestions} questions
                        </p>
                      )}
                    </div>
                  </div>
                  {attempt.score !== undefined && attempt.totalQuestions && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Score</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Grouped view by quiz/flashcard
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Attempts by Item
          </h2>
          {Object.values(groupedAttempts).map((item: any) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                    item.type === 'quiz' 
                      ? 'bg-purple-100 dark:bg-purple-900' 
                      : 'bg-pink-100 dark:bg-pink-900'
                  }`}>
                    {item.type === 'quiz' ? (
                      <BookOpen className={`w-6 h-6 ${
                        item.type === 'quiz' 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-pink-600 dark:text-pink-400'
                      }`} />
                    ) : (
                      <Layers className={`w-6 h-6 ${
                        item.type === 'quiz' 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-pink-600 dark:text-pink-400'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.topic} • {item.attempts.length} attempts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              
              {/* Mini chart for this item */}
              {item.attempts.length > 1 && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={item.attempts.slice(0, 10).reverse().map((a: Attempt, i: number) => ({
                      name: `#${i + 1}`,
                      score: a.score && a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0,
                    }))}>
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAttempts.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No attempts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filterType !== 'all' 
              ? `You haven't attempted any ${filterType}es yet.`
              : "You haven't attempted any quizzes or flashcards yet."}
          </p>
        </div>
      )}
    </div>
  );
}
