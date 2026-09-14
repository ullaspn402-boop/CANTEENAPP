import React, { useState, useEffect } from 'react';
import { AnalyticsData, CanteenStatus } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useCanteen } from '../../context/CanteenContext.tsx';
import { TransferOfficialAccountModal } from '../common/TransferOfficialAccountModal.tsx';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Sparkles,
  Flame,
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Compass,
  Navigation,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  canteenStatus: CanteenStatus | null;
  onStatusUpdated: (status: CanteenStatus) => void;
}

const COLORS = ['#f59e0b', '#ea580c', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  canteenStatus,
  onStatusUpdated,
}) => {
  const { authHeaders } = useAuth();
  const {
    officialCanteen,
    userCoords,
    distanceMeters,
    calibrateCanteenLocation,
    detectLocation,
  } = useCanteen();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [calibratingGps, setCalibratingGps] = useState(false);
  const [gpsCalibratedMsg, setGpsCalibratedMsg] = useState<string | null>(null);

  // Canteen Controls
  const [isOpen, setIsOpen] = useState(canteenStatus?.isOpen ?? true);
  const [waitTime, setWaitTime] = useState(canteenStatus?.currentWaitTimeMinutes ?? 8);
  const [announcement, setAnnouncement] = useState(canteenStatus?.announcement ?? '');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (canteenStatus) {
      setIsOpen(canteenStatus.isOpen);
      setWaitTime(canteenStatus.currentWaitTimeMinutes);
      setAnnouncement(canteenStatus.announcement || '');
    }
  }, [canteenStatus]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/analytics/dashboard'), { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.warn('Analytics poll error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchAnalytics();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/canteen/status', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          isOpen,
          currentWaitTimeMinutes: Number(waitTime),
          announcement: announcement.trim() || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onStatusUpdated(updated);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900">
            Canteen Performance & Sales Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time business intelligence, daily token volumes, peak periods, and sales distribution.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* 0. Official Authority & Campus Geofence Status Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-neutral-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-blue-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Canteen Authority & Location</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {officialCanteen?.canteenName || 'Central Campus Canteen'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/90 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered Email: <strong>{officialCanteen?.officialEmail}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{officialCanteen?.campusName || 'Main Campus'} (Radius: {officialCanteen?.radiusMeters || 1500}m)</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-blue-200">
              <Compass className="w-3.5 h-3.5 text-blue-300" />
              <span>{officialCanteen?.latitude?.toFixed(4)}° N, {officialCanteen?.longitude?.toFixed(4)}° E</span>
            </span>
          </div>

          {gpsCalibratedMsg && (
            <div className="mt-2 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{gpsCalibratedMsg}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          <button
            id="admin-calibrate-gps-btn"
            type="button"
            disabled={calibratingGps}
            onClick={async () => {
              setCalibratingGps(true);
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    const ok = await calibrateCanteenLocation({
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                    });
                    setCalibratingGps(false);
                    if (ok) {
                      setGpsCalibratedMsg('Canteen GPS coordinates calibrated to current device!');
                      setTimeout(() => setGpsCalibratedMsg(null), 4000);
                    }
                  },
                  (err) => {
                    setCalibratingGps(false);
                    console.warn('GPS calibration error:', err.message);
                  }
                );
              } else {
                setCalibratingGps(false);
              }
            }}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 disabled:opacity-50"
            title="Update official canteen coordinates with this device's current location"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-300" />
            <span>{calibratingGps ? 'Pinning GPS...' : 'Pin Device GPS as Canteen'}</span>
          </button>

          <button
            id="admin-transfer-email-btn"
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer"
            title="Transfer official canteen authority to another Gmail account"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
            <span>Transfer Official Email</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Operations Control Banner (OPEN/CLOSED, Wait Time, Announcements) */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-neutral-900">Live Canteen Operations Control</h2>
        </div>

        <form onSubmit={handleUpdateCanteen} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          {/* Canteen Open / Closed Toggle */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Service Status</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isOpen
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                🟢 OPEN
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isOpen
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                🔴 CLOSED
              </button>
            </div>
          </div>

          {/* Wait Time Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-neutral-700 mb-1">
              <span>Avg Estimated Wait Time</span>
              <span className="text-amber-600 font-extrabold">{waitTime} Minutes</span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={waitTime}
              onChange={(e) => setWaitTime(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-600 mt-2"
            />
          </div>

          {/* Announcement Input */}
          <div className="sm:col-span-3 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Campus Announcement Broadcast Banner
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. Special South Indian Lunch Combo available today at Counter 2!"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={savingStatus}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
            >
              {savingStatus ? (
                <span>Saving...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Broadcasted!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Update Canteen Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Key Metrics Cards (Prompt Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Total Orders Today
            </span>
            <div className="text-3xl font-black text-neutral-900 mt-1">
              {data?.totalOrdersToday || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              {data?.completedOrdersCount || 0} fulfilled
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Total Revenue Today
            </span>
            <div className="text-3xl font-black text-neutral-900 mt-1">
              ₹{data?.totalSalesToday || 0}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Pay-at-counter & tokens</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="text-3xl font-black text-neutral-900 mt-1">
              ₹{data?.averageOrderValue || 0}
            </div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Per student tray</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Peak Rush Slot
            </span>
            <div className="text-2xl font-black text-neutral-900 mt-1">12:30 - 1:30 PM</div>
            <span className="text-[11px] text-rose-600 font-bold mt-0.5 block">Lunch break high rush</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizations: Weekly Sales & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend (Bar/Line Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Weekly Revenue & Order Volume</h3>
              <p className="text-[11px] text-neutral-500">Mon - Sat sales progression across campus</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              Campus Peak: Friday
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'sales' ? `₹${value}` : `${value} orders`,
                    name === 'sales' ? 'Revenue' : 'Orders',
                  ]}
                />
                <Bar dataKey="sales" fill="#f59e0b" radius={[6, 6, 0, 0]} name="sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Revenue by Category</h3>
            <p className="text-[11px] text-neutral-500">Meals, Fast Food, Snacks & Beverages</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="revenue"
                  nameKey="category"
                >
                  {(data?.categoryBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100">
            {(data?.categoryBreakdown || []).map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate font-medium text-neutral-700">{cat.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Popular Dishes vs Least Popular Dishes (Prompt Section 11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Popular */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Top Selling Campus Favorites</h3>
              <p className="text-[11px] text-neutral-500">High demand items requiring batch pre-prep</p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.popularFoodItems?.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                    <span className="text-[10px] text-neutral-500">₹{item.price} • {item.categoryName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-neutral-900">{item.totalOrders} sold</span>
                  <span className="text-[10px] text-emerald-600 block">★ {item.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Rush Pattern */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Rush Hour Intensity Heatmap</h3>
              <p className="text-[11px] text-neutral-500">Peak ordering intervals to stagger kitchen tokens</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data?.hourlyPeakData?.map((slot) => (
              <div
                key={slot.time}
                className="flex items-center justify-between p-3 rounded-2xl border border-neutral-100 bg-neutral-50/70"
              >
                <div>
                  <span className="text-xs font-bold text-neutral-900">{slot.time}</span>
                  <span className="text-[10px] text-neutral-500 block">{slot.slot}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-700">{slot.orders} orders</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      slot.intensity === 'Peak'
                        ? 'bg-rose-100 text-rose-800'
                        : slot.intensity === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {slot.intensity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Official Account Modal */}
      <TransferOfficialAccountModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
};
