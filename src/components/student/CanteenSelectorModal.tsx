import React from 'react';
import { useCanteen } from '../../context/CanteenContext.tsx';
import {
  Store,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Check,
  Sparkles,
  X,
  Compass,
  Navigation,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface CanteenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
}

export const CanteenSelectorModal: React.FC<CanteenSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const {
    officialCanteen,
    selectedCanteen,
    setSelectedCanteen,
    userCoords,
    distanceMeters,
    matchedZone,
    locationStatus,
    isInsideCampus,
    detectLocation,
  } = useCanteen();

  if (!isOpen) return null;

  const handleSelectOfficial = () => {
    if (officialCanteen) {
      setSelectedCanteen(officialCanteen);
    }
    if (onSelect) onSelect();
    onClose();
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Campus Canteen Selector</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Select Your College Canteen
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Expanded Area Access active: Covers Central Food Court, Hostels, Sports Complex, and Residential Quarters.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* GPS Location Detection Action */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Expanded Campus Area Detection</span>
              </span>
              {isInsideCampus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Inside College Campus Zone
                </span>
              )}
            </div>

            {/* Location Status Feedback */}
            {locationStatus === 'requesting' && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Scanning device GPS across campus perimeter zones...</span>
              </div>
            )}

            {locationStatus === 'inside_campus' && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-200">
                <Navigation className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">🎯 Campus Geofence Confirmed!</div>
                  <div className="text-emerald-900 font-semibold text-[11px] mt-0.5">
                    Zone: {matchedZone || 'College Campus Area'}
                  </div>
                  <div className="text-emerald-800 text-[11px]">
                    Distance: {formatDistance(distanceMeters)} to Food Court Counter. Expanded Area Access active for all students!
                  </div>
                </div>
              </div>
            )}

            {locationStatus === 'nearby' && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-900 text-xs border border-blue-200">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">📍 Campus Proximity Detected</div>
                  <div className="text-blue-800 text-[11px] mt-0.5">
                    Located {formatDistance(distanceMeters)} from campus. Pre-orders will be queued for rapid pickup upon arrival.
                  </div>
                </div>
              </div>
            )}

            {locationStatus === 'off_campus' && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">📍 Off-Campus Location ({formatDistance(distanceMeters)})</div>
                  <div className="text-amber-800 text-[11px] mt-0.5">
                    Orders are prepared exclusively at {officialCanteen?.canteenName || 'Central Canteen'}.
                  </div>
                </div>
              </div>
            )}

            {locationStatus === 'denied' && (
              <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs">
                Location access was not granted. Using standard registered campus canteen.
              </div>
            )}

            <button
              type="button"
              id="detect-gps-canteen-btn"
              onClick={detectLocation}
              disabled={locationStatus === 'requesting'}
              className="w-full py-2.5 px-3 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl border border-neutral-300 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {locationStatus === 'requesting'
                  ? 'Accessing GPS...'
                  : userCoords
                  ? 'Re-scan Precise Campus Location'
                  : '📍 Detect My Campus via GPS Location Access'}
              </span>
            </button>
          </div>

          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Verified Official Campus Canteen:
          </div>

          {/* Official Registered Canteen Card */}
          {officialCanteen ? (
            <div
              onClick={handleSelectOfficial}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedCanteen?.officialEmail === officialCanteen.officialEmail
                  ? 'border-amber-500 bg-amber-50/50 shadow-md shadow-amber-500/10'
                  : 'border-neutral-200 hover:border-amber-300 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 overflow-hidden flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  {officialCanteen.photoUrl ? (
                    <img
                      src={officialCanteen.photoUrl}
                      alt="Canteen"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-7 h-7" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-neutral-900 text-base leading-tight">
                      {officialCanteen.canteenName || 'Central Campus Canteen'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      Official
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 font-medium mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span>Head: {officialCanteen.operatorName} • {officialCanteen.campusName || 'Main Campus'}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Open Now
                    </span>
                    {distanceMeters !== null && (
                      <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                        <Navigation className="w-3 h-3" />
                        {formatDistance(distanceMeters)} away
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ~8 min prep
                    </span>
                    {officialCanteen.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        {officialCanteen.phone}
                      </span>
                    )}
                  </div>
                </div>

                {selectedCanteen?.officialEmail === officialCanteen.officialEmail && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-neutral-400">
              Loading official canteen details...
            </div>
          )}

          <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Campus Safety & Direct Routing:</strong> Your order is processed exclusively by the authorized college canteen counter, preventing wrong-campus delivery or payment discrepancies.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSelectOfficial}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-sm rounded-2xl shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Confirm & Order from this Canteen</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

