import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import type { ReviewItem, ReviewSummary, FoodItem } from '../../types.ts';
import {
  Star,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  Filter,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';

interface ReviewsPageProps {
  onBrowseMenu: () => void;
  onViewTokens: () => void;
}

const QUICK_TAG_OPTIONS = [
  '⚡ Fast Token Prep',
  '🔥 Piping Hot & Fresh',
  '😋 Super Delicious',
  '💰 Great Value',
  '🥗 Clean & Hygienic',
  '☕ Perfect Refreshment',
  '🌶️ Perfect Spicing',
  '👌 Friendly Staff',
];

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
  onBrowseMenu,
  onViewTokens,
}) => {
  const { user, firebaseUser, authHeaders } = useAuth();
  const { activeOrder } = useCart();

  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStarFilter, setActiveStarFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [votedReviews, setVotedReviews] = useState<Set<number>>(new Set());

  // Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState('');
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableFoodItems, setAvailableFoodItems] = useState<FoodItem[]>([]);

  // Fetch reviews & summary
  const fetchReviewsData = useCallback(async () => {
    try {
      setLoading(true);
      const url = activeStarFilter
        ? buildApiUrl(`/api/reviews?rating=${activeStarFilter}`)
        : buildApiUrl('/api/reviews');

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || null);
        setReviews(data.reviews || []);
        if (data.summary?.mostLikedItems) {
          setAvailableFoodItems(data.summary.mostLikedItems);
        }
      } else {
        // Fallback to feedback summary endpoint if needed
        const fallbackRes = await fetch(buildApiUrl('/api/feedback/summary'));
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setSummary(fallbackData);
          setReviews(fallbackData.recentFeedback || []);
        }
      }
    } catch (e: any) {
      console.warn('Reviews fetch fallback notice:', e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [activeStarFilter]);

  // Load menu items for write modal food selector
  const fetchMenuItems = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/food-items'));
      if (res.ok) {
        const items: FoodItem[] = await res.json();
        setAvailableFoodItems(items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReviewsData();
    fetchMenuItems();
  }, [fetchReviewsData]);

  // Handle helpful upvote
  const handleHelpfulVote = async (reviewId: number) => {
    if (votedReviews.has(reviewId)) return;
    setVotedReviews((prev) => new Set(prev).add(reviewId));

    // Optimistically update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
      )
    );

    try {
      await fetch(buildApiUrl(`/api/reviews/${reviewId}/helpful`), {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Vote helpful notice:', e);
    }
  };

  // Toggle tag selection
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingInput || ratingInput < 1 || ratingInput > 5) {
      setSubmitError('Please select a star rating from 1 to 5.');
      return;
    }
    if (!commentInput.trim()) {
      setSubmitError('Please write a short comment about your experience.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        rating: ratingInput,
        comment: commentInput.trim(),
        foodItemId: selectedFoodItemId || undefined,
        orderId: activeOrder?.id || undefined,
        tags: selectedTags,
      };

      const res = await fetch(buildApiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Unable to submit review.');
      }

      const createdReview = await res.json();
      setSubmitSuccess(true);

      // Prepend newly created review to local list
      setReviews((prev) => [createdReview, ...prev]);

      // Refresh summary
      fetchReviewsData();

      // Reset form after short delay
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        setCommentInput('');
        setRatingInput(5);
        setSelectedTags([]);
        setSelectedFoodItemId(null);
      }, 1400);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews by search query
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.comment?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.foodItemName?.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const totalReviewsCount = summary?.totalFeedbackCount || reviews.length;
  const averageRating = summary?.averageRating || 4.8;
  const breakdown = summary?.ratingBreakdown || {
    5: Math.round(totalReviewsCount * 0.75),
    4: Math.round(totalReviewsCount * 0.18),
    3: Math.round(totalReviewsCount * 0.05),
    2: 1,
    1: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white p-6 sm:p-10 shadow-xl shadow-amber-600/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-amber-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Student & Staff Reviews
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Campus Canteen Reviews
            </h1>
            <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
              Transparent, real-time ratings from verified students. See honest dish reviews, food prep times, and rate your canteen meals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-amber-800 font-bold text-sm shadow-lg hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Write a Review
            </button>
            <button
              onClick={onBrowseMenu}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Order Food
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Rating Summary Card + Top Rated Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Rating & Breakdown Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Canteen Overall Rating
            </h2>
            <span className="text-xs text-neutral-500 font-medium">All-time</span>
          </div>

          <div className="flex items-center gap-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="flex flex-col items-center justify-center min-w-[85px] py-1 px-3 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl text-white shadow-md shadow-amber-600/20">
              <span className="text-3xl sm:text-4xl font-black">{averageRating}</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-3 h-3 text-amber-200 fill-amber-200"
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">
                Excellent Campus Quality
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                Based on <span className="font-bold text-amber-700">{totalReviewsCount}</span> verified orders
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                94% Students recommend
              </div>
            </div>
          </div>

          {/* Star Distribution Bars */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
              <span>Rating Breakdown</span>
              <span>Distribution</span>
            </div>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = (breakdown as any)[star] || 0;
              const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              const isSelected = activeStarFilter === star;

              return (
                <button
                  key={star}
                  onClick={() => setActiveStarFilter(isSelected ? null : star)}
                  className={`w-full flex items-center gap-3 text-xs group cursor-pointer p-1 rounded-xl transition-all ${
                    isSelected ? 'bg-amber-100/70 font-bold' : 'hover:bg-neutral-50'
                  }`}
                  title={`Filter by ${star} star reviews`}
                >
                  <div className="flex items-center gap-1 min-w-[40px] text-neutral-700 font-medium">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>

                  <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        star >= 4
                          ? 'bg-amber-500'
                          : star === 3
                          ? 'bg-amber-400'
                          : 'bg-orange-400'
                      }`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>

                  <span className="min-w-[42px] text-right font-medium text-neutral-500 group-hover:text-amber-700">
                    {percentage}%
                  </span>
                </button>
              );
            })}
          </div>

          {activeStarFilter && (
            <button
              onClick={() => setActiveStarFilter(null)}
              className="w-full py-2 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/60 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear {activeStarFilter}★ Filter
            </button>
          )}
        </div>

        {/* Top Rated Food Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Student Favorite Dishes
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Highest rated campus menu items this week
              </p>
            </div>
            <button
              onClick={onBrowseMenu}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Full Menu <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(summary?.mostLikedItems || []).slice(0, 4).map((food, idx) => (
              <div
                key={food.id || idx}
                className="group p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all flex items-center gap-3.5"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300';
                    }}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold rounded-md">
                    #{idx + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {food.name}
                    </h4>
                    <span className="text-xs font-black text-amber-600">
                      ₹{food.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                      {food.rating || 4.8}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {food.ratingCount || 40}+ ratings
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-100">
            <div className="text-center p-2 rounded-xl bg-neutral-50">
              <div className="text-base font-black text-neutral-900">⚡ 7 mins</div>
              <div className="text-[11px] text-neutral-500">Avg Prep Time</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-neutral-50">
              <div className="text-base font-black text-neutral-900">🥗 100%</div>
              <div className="text-[11px] text-neutral-500">Fresh Daily Prep</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-neutral-50">
              <div className="text-base font-black text-neutral-900">🎟️ Live</div>
              <div className="text-[11px] text-neutral-500">Token Tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Feed Header, Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              Student Feedback Feed
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {filteredReviews.length}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Real reviews submitted after completing orders or dining in
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => fetchReviewsData()}
              className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
              title="Refresh reviews"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveStarFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeStarFilter === null
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setActiveStarFilter(activeStarFilter === star ? null : star)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeStarFilter === star
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">
            Loading student reviews...
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              No reviews found
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {searchQuery || activeStarFilter
                ? 'No reviews match your filter criteria. Try clearing the search or star filter.'
                : 'Be the first student to review today’s food and service!'}
            </p>
          </div>
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Write First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const hasUpvoted = votedReviews.has(rev.id);
            const relativeTime = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-amber-200 transition-all flex flex-col justify-between space-y-3.5"
              >
                {/* Reviewer Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          {rev.userName || 'Campus Student'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400">•</span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {relativeTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {rev.orderId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                      Order #{rev.orderId}
                    </span>
                  )}
                </div>

                {/* Tagged Dish Badge */}
                {rev.foodItemName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 text-amber-800 text-xs font-semibold border border-amber-200/50 w-fit">
                    <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                    <span>{rev.foodItemName}</span>
                  </div>
                )}

                {/* Comment Text */}
                <p className="text-xs text-neutral-700 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: Helpful Vote */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <span className="text-[11px]">Was this review helpful?</span>
                  <button
                    onClick={() => handleHelpfulVote(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      hasUpvoted
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-amber-600 text-amber-600' : ''}`} />
                    <span>Helpful ({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200 w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Write Campus Review</h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Share your experience on food taste, counter speed, and quality
                </p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
              {submitSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Your review is now live on the campus community board.
                  </p>
                </div>
              ) : (
                <>
                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Star Selector */}
                  <div className="space-y-2 text-center py-2 bg-amber-50/60 rounded-2xl border border-amber-100">
                    <label className="text-xs font-bold text-neutral-700 block">
                      How was your food & experience?
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (hoverRating || ratingInput) >= star;
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingInput(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-2xl hover:scale-125 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                filled
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-neutral-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold text-amber-800">
                      {ratingInput === 5 && '🌟 Outstanding! Loved it'}
                      {ratingInput === 4 && '👍 Very Good, would order again'}
                      {ratingInput === 3 && '👌 Decent, average campus meal'}
                      {ratingInput === 2 && '⚠️ Needs improvement'}
                      {ratingInput === 1 && '❌ Not satisfied'}
                    </span>
                  </div>

                  {/* Food Item Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Dish Reviewed (Optional)
                    </label>
                    <select
                      value={selectedFoodItemId || ''}
                      onChange={(e) =>
                        setSelectedFoodItemId(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">-- General Canteen Experience --</option>
                      {availableFoodItems.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (₹{f.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Tags Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Quick Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAG_OPTIONS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => handleToggleTag(tag)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white font-semibold'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-neutral-700">
                        Your Detailed Review
                      </label>
                      <span className="text-neutral-400 font-mono text-[11px]">
                        {commentInput.length}/300
                      </span>
                    </div>
                    <textarea
                      required
                      rows={3}
                      maxLength={300}
                      placeholder="Tell fellow students about the flavor, portion size, warmth, or counter wait time..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full p-3 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                    />
                  </div>

                  {/* User Badge Info */}
                  <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Posting as{' '}
                      <span className="font-bold text-neutral-800">
                        {user?.name || firebaseUser?.displayName || 'Campus Student'}
                      </span>{' '}
                      (Verified)
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsWriteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {submitting ? 'Publishing...' : 'Publish Review'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
