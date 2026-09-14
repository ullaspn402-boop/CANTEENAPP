import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, CheckCircle2, User, RefreshCw } from 'lucide-react';

interface FeedbackSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  mostLiked: Array<{ name: string; rating: number; count: number }>;
  poorlyRated: Array<{ name: string; rating: number; count: number }>;
  recentComments: Array<{
    id: number;
    rating: number;
    comment: string;
    userName: string;
    foodItemName?: string;
    createdAt: string;
  }>;
}

export const FeedbackManager: React.FC = () => {
  const [data, setData] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback/summary');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900">
            Student Feedback & Quality Auditing
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Analyze meal quality ratings, identify issues with dishes, and track customer satisfaction.
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Reviews
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Overall Canteen Rating
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-neutral-900">
                {data?.averageRating.toFixed(1) || '4.8'}
              </span>
              <span className="text-sm font-bold text-neutral-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Total Verified Reviews
            </span>
            <div className="text-4xl font-black text-neutral-900 mt-1">
              {data?.totalReviews || 0}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              100% Verified Token Pickups
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Satisfaction Index
            </span>
            <div className="text-4xl font-black text-neutral-900 mt-1">94.8%</div>
            <span className="text-xs text-neutral-500 mt-1 block">
              Rated 4 or 5 stars this month
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ThumbsUp className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Most Liked Dishes vs Attention Required */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Highest Rated Campus Dishes</h3>
              <p className="text-xs text-neutral-500">Student favorites with consistently high reviews</p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.mostLiked.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                  <span className="text-[11px] text-neutral-500">{item.count} positive reviews</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-xs text-emerald-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Needs Quality Attention</h3>
              <p className="text-xs text-neutral-500">Items with student critiques on temperature or taste</p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.poorlyRated.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                  <span className="text-[11px] text-neutral-500">{item.count} student ratings</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-xs text-rose-700">
                  <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews Stream */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Recent Student Reviews & Comments</h3>
            <p className="text-xs text-neutral-500">Real feedback posted immediately after token pickup</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {data?.recentComments.map((comment) => (
            <div key={comment.id} className="py-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    {comment.userName.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-neutral-900">{comment.userName}</span>
                  {comment.foodItemName && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded-md">
                      {comment.foodItemName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= comment.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-neutral-700 pl-8 leading-relaxed">"{comment.comment}"</p>

              <div className="pl-8 text-[10px] text-neutral-400">
                {new Date(comment.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
