import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { flashcardService } from '../services/flashcard.service';
import type { FlashcardSet, FlashcardGenerateRequest } from '../types';
import { CreditCard, Plus, Sparkles, Layers, BookOpen, X } from 'lucide-react';
import { FlashcardGenerator } from '../components/FlashcardGenerator';
import { FlashcardSetList } from '../components/FlashcardSetList';
import { Modal } from '../components/Modal';

export const FlashcardsPage = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);

  useEffect(() => {
    const loadFlashcardSets = async () => {
      try {
        const sets = await flashcardService.getAll();
        setFlashcardSets(sets);
      } catch (error) {
        // Silently fail on initial load
      }
    };

    loadFlashcardSets();
  }, []);

  const handleGenerate = async (request: FlashcardGenerateRequest, files?: File[]) => {
    setLoading(true);
    const loadingToast = toast.loading('Generating your flashcards...');
    
    try {
      // Start generation
      const { jobId } = await flashcardService.generate(request, files);
      
      // Poll for completion
      await flashcardService.pollForCompletion(jobId);
      
      // Refresh the flashcard list to get the latest sets
      const sets = await flashcardService.getAll();
      setFlashcardSets(sets);
      
      setShowGenerator(false);
      toast.success('Flashcards generated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to generate flashcards. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteSetId(id);
  };

  const confirmDeleteSet = async () => {
    if (!deleteSetId) return;

    const loadingToast = toast.loading('Deleting flashcard set...');
    try {
      await flashcardService.delete(deleteSetId);
      
      // Refresh the flashcard list
      const sets = await flashcardService.getAll();
      setFlashcardSets(sets);
      
      toast.success('Flashcard set deleted successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to delete flashcard set. Please try again.', { id: loadingToast });
    } finally {
      setDeleteSetId(null);
    }
  };

  // Calculate stats
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, set) => 
    sum + (Array.isArray(set.cards) ? set.cards.length : 0), 0
  );
  const studiedSets = flashcardSets.filter(set => set.lastStudiedAt).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Smart Learning Cards</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <CreditCard className="w-10 h-10" />
                Flashcard Generator
              </h1>
              <p className="text-emerald-100 dark:text-emerald-200 text-lg">Transform any content into effective study flashcards</p>
            </div>
            {!showGenerator && (
              <button
                onClick={() => setShowGenerator(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Set
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {totalSets > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 border-emerald-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSets}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Sets</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-cyan-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCards}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Cards</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 border-teal-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studiedSets}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Studied Sets</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerator && (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button 
            onClick={() => setShowGenerator(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <FlashcardGenerator onGenerate={handleGenerate} loading={loading} />
        </div>
      )}

      <FlashcardSetList sets={flashcardSets} onDelete={handleDelete} />

      <Modal
        isOpen={!!deleteSetId}
        onClose={() => setDeleteSetId(null)}
        title="Delete Flashcard Set"
        footer={
          <>
            <button
              onClick={() => setDeleteSetId(null)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteSet}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Set
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this flashcard set? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
