import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizService } from '../services/quiz.service';
import type { Quiz, QuizGenerateRequest } from '../types';
import { Brain, Plus, Sparkles, Target, CheckCircle } from 'lucide-react';
import { QuizGenerator } from '../components/QuizGenerator';
import { QuizList } from '../components/QuizList';

export const QuizPage = () => {
  const location = useLocation();
  const [showGenerator, setShowGenerator] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<{ 
    topic?: string; 
    content?: string; 
    mode?: 'topic' | 'content' | 'files';
    sourceId?: string;
    sourceTitle?: string;
  } | undefined>(undefined);

  useEffect(() => {
    if (location.state) {
      const { topic, contentText, sourceId, sourceTitle } = location.state as { 
        topic?: string; 
        contentText?: string;
        sourceId?: string;
        sourceTitle?: string;
      };
      
      if (topic || contentText) {
        setInitialValues({
          topic,
          content: contentText,
          mode: contentText ? 'content' : 'topic',
          sourceId,
          sourceTitle
        });
        setShowGenerator(true);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const allQuizzes = await quizService.getAll();
        setQuizzes(allQuizzes);
      } catch (error) {
        // Silently fail on initial load
      }
    };

    loadQuizzes();
  }, []);

  const handleGenerate = async (request: QuizGenerateRequest, files?: File[]) => {
    setLoading(true);
    const loadingToast = toast.loading('Generating your quiz...');
    
    try {
      // Start generation
      const { jobId } = await quizService.generate(request, files);
      
      // Poll for completion
      await quizService.pollForCompletion(jobId);
      
      // Refresh the quiz list to get the latest quizzes
      const allQuizzes = await quizService.getAll();
      setQuizzes(allQuizzes);
      
      setShowGenerator(false);
      toast.success('Quiz generated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to generate quiz. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting quiz...');
    try {
      await quizService.delete(id);
      
      // Refresh the quiz list
      const allQuizzes = await quizService.getAll();
      setQuizzes(allQuizzes);
      
      toast.success('Quiz deleted successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to delete quiz. Please try again.', { id: loadingToast });
    }
  };

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const completedQuizzes = quizzes.filter(quiz => 
    quiz.attempts && quiz.attempts.length > 0
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">AI-Powered Learning</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10" />
                Quiz Generator
              </h1>
              <p className="text-blue-100 dark:text-blue-200 text-lg">Create intelligent quizzes from any topic, content, or file</p>
            </div>
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {showGenerator ? 'Close Generator' : 'New Quiz'}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {totalQuizzes > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuizzes}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Quizzes</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Questions Created</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedQuizzes}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerator && (
        <QuizGenerator onGenerate={handleGenerate} loading={loading} initialValues={initialValues} />
      )}

      <QuizList quizzes={quizzes} onDelete={handleDelete} />
    </div>
  );
};
