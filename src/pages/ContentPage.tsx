import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Highlighter, MessageSquare, Brain, ArrowLeft, Loader2, StickyNote, Trash2, Calendar, Check, Edit3, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { format } from 'date-fns';
import { flashcardService } from '../services/flashcard.service';
import { quizService } from '../services/quiz.service';
import { contentService, type Content } from '../services/content.service';
import toast from 'react-hot-toast';
import './ContentPage.css';

interface Highlight {
  id: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'pink';
  createdAt: string;
}

interface ExtendedContent extends Content {
  highlights?: Highlight[];
}

const HIGHLIGHT_COLORS = {
  yellow: 'bg-yellow-200',
  green: 'bg-green-200',
  pink: 'bg-pink-200'
};

const HIGHLIGHT_BORDER_COLORS = {
  yellow: 'border-yellow-400',
  green: 'border-green-400',
  pink: 'border-pink-400'
};

const DARK_HIGHLIGHT_COLORS = {
  yellow: 'dark:bg-yellow-900/50 dark:text-yellow-100',
  green: 'dark:bg-green-900/50 dark:text-green-100',
  pink: 'dark:bg-pink-900/50 dark:text-pink-100'
};

const DARK_HIGHLIGHT_BORDER_COLORS = {
  yellow: 'dark:border-yellow-700',
  green: 'dark:border-green-700',
  pink: 'dark:border-pink-700'
};

export const ContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<ExtendedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'green' | 'pink'>('yellow');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchContent = async () => {
    if (!id) return;
    try {
      const data = await contentService.getById(id);
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [id, navigate]);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(sel.toString().trim());
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY
        });
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-toolbar') && window.getSelection()?.toString().length === 0) {
        setToolbarPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHighlight = async (color: 'yellow' | 'green' | 'pink' = selectedColor) => {
    if (!selectedText || !id) return;
    
    try {
      await contentService.addHighlight(id, {
        text: selectedText,
        startOffset: 0, 
        endOffset: 0,   
        color: color
      });
      toast.success('Text highlighted');
      fetchContent(); // Refresh to show new highlight
    } catch (error) {
      console.error('Failed to highlight:', error);
      toast.error('Failed to save highlight');
    } finally {
      setToolbarPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCreateFlashcard = async () => {
    if (!selectedText) return;
    
    try {
      setIsCreating(true);
      const { jobId } = await flashcardService.generate({
        topic: content?.topic || 'General',
        content: selectedText,
        numberOfCards: 5 // Minimum 5 cards
      });

      toast.loading('Creating flashcards...', { id: 'create-flashcard' });
      
      await flashcardService.pollForCompletion(jobId);
      
      toast.success('Flashcards created successfully!', { id: 'create-flashcard' });
    } catch (error) {
      console.error('Failed to create flashcard:', error);
      toast.error('Failed to create flashcards. Try selecting more text.', { id: 'create-flashcard' });
    } finally {
      setIsCreating(false);
      setToolbarPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedText) return;

    try {
      setIsCreating(true);
      const { jobId } = await quizService.generate({
        topic: content?.topic || 'General',
        content: selectedText,
        numberOfQuestions: 1,
        difficulty: 'medium'
      });

      toast.loading('Creating question...', { id: 'create-question' });

      await quizService.pollForCompletion(jobId);

      toast.success('Question created successfully!', { id: 'create-question' });
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question', { id: 'create-question' });
    } finally {
      setIsCreating(false);
      setToolbarPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleAddNote = async () => {
    if (!selectedText || !id) return;
    
    const note = prompt('Enter your note:');
    if (!note) return;

    try {
      await contentService.addHighlight(id, {
        text: selectedText,
        startOffset: 0,
        endOffset: 0,
        note: note,
        color: 'yellow'
      });
      toast.success('Note added');
      fetchContent();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setToolbarPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) return;
    try {
      await contentService.deleteHighlight(highlightId);
      toast.success('Highlight removed');
      fetchContent();
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      toast.error('Failed to delete highlight');
    }
  };

  const handleGenerateQuiz = () => {
    if (!content) return;
    
    // Truncate content if it's too long (e.g., > 5000 chars) to prevent token limits
    // This is a simple truncation, ideally we'd want to be smarter about it
    const maxContentLength = 5000;
    const contentText = content.content.length > maxContentLength 
      ? content.content.substring(0, maxContentLength) + '...'
      : content.content;

    navigate('/quiz', { 
      state: { 
        topic: content.topic, 
        contentText: contentText,
        sourceId: content.id,
        sourceTitle: content.title
      } 
    });
  };

  const handleEdit = () => {
    if (!content) return;
    setEditedTitle(content.title);
    setEditedContent(content.content);
    setIsEditing(true);
    setToolbarPosition(null); // Hide highlight toolbar
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
  };

  const handleSave = async () => {
    if (!id || !content) return;
    
    setIsSaving(true);
    const loadingToast = toast.loading('Saving changes...');
    
    try {
      await contentService.update(id, {
        title: editedTitle,
        content: editedContent,
        topic: content.topic
      });
      
      toast.success('Content updated successfully!', { id: loadingToast });
      setIsEditing(false);
      fetchContent(); // Refresh content
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save changes', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting content...');
    try {
      await contentService.delete(id);
      toast.success('Content deleted successfully!', { id: loadingToast });
      navigate('/study');
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast.error('Failed to delete content', { id: loadingToast });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;
      
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Esc to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editedTitle, editedContent]);

  // Helper function to apply highlights to markdown content
  const applyHighlights = (markdown: string, highlights: Highlight[]) => {
    if (!highlights || highlights.length === 0) return markdown;

    let processed = markdown;
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    const replacements: Map<string, string> = new Map();

    sortedHighlights.forEach((highlight) => {
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedText, 'g');
      
      const colorKey = highlight.color as keyof typeof HIGHLIGHT_COLORS;
      const lightClass = HIGHLIGHT_COLORS[colorKey] || 'bg-yellow-200';
      const darkClass = DARK_HIGHLIGHT_COLORS[colorKey] || '';
      const combinedClass = `${lightClass} ${darkClass}`.trim();
      
      processed = processed.replace(regex, (match) => {
        const placeholder = `__HL_${replacements.size}__`;
        replacements.set(placeholder, `<mark class="${combinedClass}">${match}</mark>`);
        return placeholder;
      });
    });

    replacements.forEach((replacement, placeholder) => {
      processed = processed.split(placeholder).join(replacement);
    });

    return processed;
  };

  // Process content to inject highlights
  const processedContent = useMemo(() => {
    if (!content?.content) return '';
    return applyHighlights(content.content, content.highlights || []);
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content not found</h2>
        <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 flex gap-8">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-8">
          <Link to="/study" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Study
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800 uppercase tracking-wide">
                  {content.topic}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(content.createdAt), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{content.title}</h1>
            </div>
            <div className="flex gap-3">
              {!isEditing && (
                <>
                  <button 
                    onClick={() => setShowNotes(!showNotes)}
                    className={`btn-secondary flex items-center gap-2 ${showNotes ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-200 dark:ring-gray-600' : ''}`}
                  >
                    <StickyNote className="w-4 h-4" />
                    {showNotes ? 'Hide Notes' : 'Show Notes'}
                  </button>
                  <button 
                    onClick={handleEdit}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="btn-secondary flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button 
                    onClick={handleGenerateQuiz}
                    className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Brain className="w-4 h-4" />
                    Generate Quiz
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    className="btn-secondary flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div ref={contentRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12 min-h-[500px]">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Content title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content (Markdown)</label>
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm min-h-[400px] resize-y"
                  placeholder="Write your content in markdown..."
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview</h4>
                <div className="prose prose-sm max-w-none bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editedContent || '*No content to preview*'}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="font-semibold mb-1">💡 Markdown Tips:</p>
                <ul className="space-y-0.5 ml-4">
                  <li>**bold** for <strong>bold text</strong></li>
                  <li>*italic* for <em>italic text</em></li>
                  <li># Heading for headers</li>
                  <li>- item for bullet lists</li>
                  <li>```code``` for code blocks</li>
                  <li>Keyboard shortcuts: Ctrl+S to save, Esc to cancel</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none content-markdown font-sans">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[
                  rehypeRaw,
                  [rehypeSanitize, {
                    ...defaultSchema,
                    tagNames: [...(defaultSchema.tagNames || []), 'mark'],
                    attributes: {
                      ...defaultSchema.attributes,
                      mark: [['className', /^bg-(yellow|green|pink)-200.*$/]]
                    }
                  }]
                ]}
                components={{
                  mark: (props) => <mark {...props} />,
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Notes Sidebar */}
      {showNotes && (
        <div className="w-80 flex-shrink-0 hidden xl:block animate-in slide-in-from-right duration-300">
          <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                <StickyNote className="w-5 h-5 text-primary-600" />
                Notes & Highlights
              </h3>
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                {content.highlights?.length || 0}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {content.highlights && content.highlights.length > 0 ? (
                content.highlights.map((highlight) => (
                  <div 
                    key={highlight.id} 
                    className={`p-4 rounded-xl border transition-all hover:shadow-md group ${
                      HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] || 'bg-yellow-50'
                    } ${
                      HIGHLIGHT_BORDER_COLORS[highlight.color as keyof typeof HIGHLIGHT_BORDER_COLORS] || 'border-yellow-200'
                    } ${
                      DARK_HIGHLIGHT_COLORS[highlight.color as keyof typeof DARK_HIGHLIGHT_COLORS] || 'dark:bg-yellow-900/30'
                    } ${
                      DARK_HIGHLIGHT_BORDER_COLORS[highlight.color as keyof typeof DARK_HIGHLIGHT_BORDER_COLORS] || 'dark:border-yellow-700'
                    } bg-opacity-30 dark:bg-opacity-30`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider opacity-70 dark:text-gray-300`}>
                        {highlight.note ? 'Note' : 'Highlight'}
                      </span>
                      <button 
                        onClick={() => handleDeleteHighlight(highlight.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 italic mb-3 pl-3 border-l-2 border-black/10 dark:border-white/10 leading-relaxed">
                      "{highlight.text}"
                    </p>
                    {highlight.note && (
                      <div className="text-sm text-gray-800 dark:text-gray-200 mt-3 pt-3 border-t border-black/5 dark:border-white/5 font-medium">
                        <p>{highlight.note}</p>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(highlight.createdAt), 'MMM d')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Highlighter className="w-8 h-8 opacity-20 dark:text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No highlights yet</p>
                  <p className="text-xs mt-1 max-w-[150px] dark:text-gray-400">Select text in the content to add highlights or notes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toolbar - only show when not editing */}
      {!isEditing && toolbarPosition && (
        <div
          className="floating-toolbar fixed z-50 bg-gray-900 text-white rounded-xl shadow-2xl flex items-center p-1.5 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in duration-200"
          style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
        >
          <div className="flex items-center gap-1 pr-2 border-r border-gray-700 mr-2">
            <button 
              onClick={() => setSelectedColor('yellow')}
              className={`w-6 h-6 rounded-full bg-yellow-400 hover:scale-110 transition-transform flex items-center justify-center ${selectedColor === 'yellow' ? 'ring-2 ring-white' : ''}`}
            >
              {selectedColor === 'yellow' && <Check className="w-3 h-3 text-yellow-900" />}
            </button>
            <button 
              onClick={() => setSelectedColor('green')}
              className={`w-6 h-6 rounded-full bg-green-400 hover:scale-110 transition-transform flex items-center justify-center ${selectedColor === 'green' ? 'ring-2 ring-white' : ''}`}
            >
              {selectedColor === 'green' && <Check className="w-3 h-3 text-green-900" />}
            </button>
            <button 
              onClick={() => setSelectedColor('pink')}
              className={`w-6 h-6 rounded-full bg-pink-400 hover:scale-110 transition-transform flex items-center justify-center ${selectedColor === 'pink' ? 'ring-2 ring-white' : ''}`}
            >
              {selectedColor === 'pink' && <Check className="w-3 h-3 text-pink-900" />}
            </button>
          </div>

          <button onClick={() => handleHighlight()} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Highlight">
            <Highlighter className="w-4 h-4" />
            <span className="text-[10px] font-medium">Mark</span>
          </button>
          
          <button onClick={handleAddNote} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Add Note">
            <StickyNote className="w-4 h-4" />
            <span className="text-[10px] font-medium">Note</span>
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1"></div>
          
          {isCreating ? (
            <div className="p-2 flex items-center justify-center min-w-[3rem]">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <>
              <button onClick={handleCreateFlashcard} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Create Flashcard">
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px] font-medium">Card</span>
              </button>
              <button onClick={handleCreateQuestion} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Create Question">
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] font-medium">Quiz</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
