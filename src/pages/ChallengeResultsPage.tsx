import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { challengeService } from "../services";
import type { Challenge, ChallengeProgress } from "../types";
import {
  Trophy,
  TrendingUp,
  ArrowLeft,
  Share2,
  Eye,
  Sparkles,
  Award,
  Target,
  Zap,
} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";

export const ChallengeResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { width, height } = useWindowSize();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  useEffect(() => {
    if (challenge) {
      // Update location state with breadcrumbs to be picked up by global Layout
      const breadcrumbItems = [
        {
          label:
            challenge.category ||
            challenge.type.charAt(0).toUpperCase() +
              challenge.type.slice(1) +
              " Challenges",
          path: "/challenges",
        },
        { label: challenge.title, path: `/challenges/${id}` },
        { label: "Results" },
      ];

      // Only update if not already set to avoid infinite loop
      if (
        JSON.stringify((location.state as any)?.breadcrumb) !==
        JSON.stringify(breadcrumbItems)
      ) {
        navigate(".", {
          replace: true,
          state: { ...(location.state as any), breadcrumb: breadcrumbItems },
        });
      }
    }
  }, [challenge, id, navigate, location]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const [challengeData, progressData] = await Promise.all([
        challengeService.getChallengeById(id!),
        challengeService.getChallengeProgress(id!),
      ]);
      setChallenge(challengeData);
      setProgress(progressData);

      // Show confetti if score >= 70%
      if (progressData.finalScore && progressData.finalScore >= 70) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (_error) {
      toast.error("Failed to load results");
      navigate("/challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!resultsRef.current) return;

    try {
      const canvas = await html2canvas(resultsRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2, // Higher quality
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "challenge-results.png", {
          type: "image/png",
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Challenge Results",
              text: `I just completed the "${challenge?.title}" challenge!`,
            });
          } catch (error) {
            console.error("Error sharing:", error);
          }
        } else {
          // Fallback to download
          const link = document.createElement("a");
          link.download = "challenge-results.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast.success("Image saved to device!");
        }
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate share image");
    }
  };

  if (loading || !challenge || !progress) {
    return (
      <div className="space-y-6 pb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const finalScore = progress.finalScore || 0;
  const isExcellent = finalScore >= 90;
  const isGood = finalScore >= 70;
  const isPass = finalScore >= 50;

  return (
    <div className="space-y-6 pb-8 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Results Hero */}
      <div
        ref={resultsRef}
        className="relative overflow-hidden rounded-3xl bg-primary-600 dark:bg-primary-900 shadow-xl border border-primary-500/30"
      >
        {/* Background - Clean Lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-white opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-white opacity-[0.03] rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
        </div>

        <div className="relative z-10 px-6 py-8 md:p-12">
          {/* Header Action Row */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <button
              onClick={handleShare}
              className="p-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full md:rounded-xl text-white transition-all flex items-center gap-2 border border-white/10"
              aria-label="Share Results"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline font-medium text-sm">Share</span>
            </button>
          </div>

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Trophy Icon with Glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
              <div className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 border border-white/20 shadow-2xl backdrop-blur-sm animate-float">
                <Trophy className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-3 tracking-tight">
              {isExcellent
                ? "Outstanding Performance!"
                : isGood
                  ? "Great Job!"
                  : isPass
                    ? "Well Done!"
                    : "Challenge Completed"}
            </h1>

            <p className="text-primary-100 text-base md:text-xl mb-8 md:mb-12 max-w-xl mx-auto leading-relaxed">
              {isExcellent
                ? "You've mastered this challenge with exceptional skill."
                : isGood
                  ? "Solid performance! You're on the right track."
                  : isPass
                    ? "Good effort. Keep practicing to reach the top."
                    : "Review your answers and try again to improve."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full items-center">
              {/* Circular Progress */}
              <div className="flex flex-col items-center justify-center order-1 md:order-none">
                <div className="relative">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full transform scale-110"></div>
                  
                  <svg className="transform -rotate-90 w-48 h-48 md:w-56 md:h-56 drop-shadow-xl relative z-10">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * (window.innerWidth < 768 ? 80 : 96)}`} // Approx radius calculation
                      // Simpler radius approach for SVG consistency:
                      style={{
                        strokeDasharray: '280', 
                        strokeDashoffset: `${280 * (1 - finalScore / 100)}` 
                      }} 
                      pathLength={280} // Explicit path length for easy calcs
                      className={`${
                        isExcellent
                          ? "text-green-400"
                          : isGood
                            ? "text-blue-300"
                            : isPass
                              ? "text-yellow-300"
                              : "text-red-300"
                      } transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
                      {finalScore}%
                    </span>
                    <span className="text-sm font-medium text-white/70 uppercase tracking-widest mt-1">
                      Final Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full order-2 md:order-none">
                {/* Stat Cards - Glassmorphism */}
                {[
                  {
                    icon: TrendingUp,
                    label: "Ranking",
                    value: progress.percentile !== null && progress.percentile !== undefined 
                      ? `Top ${Math.round(100 - progress.percentile)}%`
                      : "-",
                    color: "text-blue-200"
                  },
                  {
                    icon: Sparkles,
                    label: "XP Earned",
                    value: `+${challenge.reward}`,
                    color: "text-yellow-200"
                  },
                  {
                    icon: Target,
                    label: "Completed",
                    value: `${progress.completedQuizzes}/${progress.totalQuizzes}`,
                    color: "text-green-200"
                  },
                  {
                    icon: Award,
                    label: "Grade",
                    value: isExcellent ? "A+" : isGood ? "A" : isPass ? "B" : "C",
                    color: "text-purple-200"
                  }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-white/5 hover:bg-white/15 transition-colors group">
                    <div className="flex items-center gap-2 mb-2 text-primary-100">
                       <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
                       <span className="text-xs font-medium uppercase tracking-wider opacity-70">{stat.label}</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Quiz Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary-100 dark:bg-primary-900/40 rounded-xl">
                <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Detailed Breakdown
              </h2>
            </div>
            
            <div className="space-y-4">
              {progress.quizAttempts.map((attempt, index) => {
                const quiz = challenge.quizzes?.[index];

                return (
                  <div
                    key={index}
                    className="group relative p-4 md:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2.5 mb-1.5">
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-bold ring-2 ring-white dark:ring-gray-800 mt-0.5 opacity-90">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {quiz?.quiz.title || "Quiz"}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-8.5 pl-0.5">
                          {attempt.score}/{attempt.totalQuestions} correct • {quiz?.quiz.topic}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end ml-0 sm:ml-4 pl-8 sm:pl-0 border-t sm:border-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 mt-1 sm:mt-0">
                        {/* Removed progress circle section as requested */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-base uppercase tracking-wider opacity-80">
              Next Steps
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/challenges")}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Challenges
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-gray-300"
              >
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Valid Leaderboard
              </button>

              <button
                onClick={() => navigate("/attempts")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-gray-300"
              >
                <Eye className="w-5 h-5 text-primary-500" />
                Review Answers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
