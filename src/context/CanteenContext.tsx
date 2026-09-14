import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../lib/apiClient.ts';
import { OfficialCanteenProfile } from '../db/canteenProfile.ts';

export type LocationStatus =
  | 'prompt'
  | 'requesting'
  | 'inside_campus'
  | 'nearby'
  | 'off_campus'
  | 'denied'
  | 'unsupported';

interface CanteenContextType {
  officialCanteen: OfficialCanteenProfile | null;
  selectedCanteen: OfficialCanteenProfile | null;
  setSelectedCanteen: (canteen: OfficialCanteenProfile | null) => void;
  isCanteenSelectorOpen: boolean;
  setIsCanteenSelectorOpen: (open: boolean) => void;
  refreshOfficialCanteen: () => Promise<void>;
  // Geolocation & Campus Location Detection
  userCoords: { latitude: number; longitude: number; accuracy?: number } | null;
  distanceMeters: number | null;
  matchedZone: string | null;
  locationStatus: LocationStatus;
  isInsideCampus: boolean;
  detectLocation: () => Promise<void>;
  calibrateCanteenLocation: (coords: {
    latitude: number;
    longitude: number;
    campusName?: string;
    radiusMeters?: number;
    address?: string;
  }) => Promise<boolean>;
}

const CanteenContext = createContext<CanteenContextType | undefined>(undefined);

const CANTEEN_STORAGE_KEY = 'campusbite_selected_canteen';
const COORDS_STORAGE_KEY = 'campusbite_user_coords';

export function getCampusZone(dist: number, profile?: OfficialCanteenProfile | null): string {
  if (dist <= 800) return 'Central Food Court & Academic Core (0 - 800m)';
  if (dist <= 2500) return 'Campus Hostels & Residential Quarters (800m - 2.5km)';
  if (dist <= 5000) return 'Sports Complex & Engineering Grounds (2.5km - 5km)';
  if (dist <= Math.max(10000, profile?.radiusMeters || 10000)) return 'Extended Campus Zone & Student Housing (5km - 10km)';
  return 'Off-Campus Area';
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const CanteenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [officialCanteen, setOfficialCanteen] = useState<OfficialCanteenProfile | null>(null);
  const [selectedCanteen, setSelectedCanteenState] = useState<OfficialCanteenProfile | null>(null);
  const [isCanteenSelectorOpen, setIsCanteenSelectorOpen] = useState(false);

  // Geolocation State
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(() => {
    const saved = localStorage.getItem(COORDS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [matchedZone, setMatchedZone] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('prompt');

  const refreshOfficialCanteen = useCallback(async () => {
    try {
      const res = await fetch(buildApiUrl('/api/canteen/official-profile'));
      if (res.ok) {
        const profile: OfficialCanteenProfile = await res.json();
        setOfficialCanteen(profile);

        // Auto-select official canteen if none is selected yet or load from localStorage
        const saved = localStorage.getItem(CANTEEN_STORAGE_KEY);
        if (saved) {
          try {
            setSelectedCanteenState(JSON.parse(saved));
          } catch {
            setSelectedCanteenState(profile);
            localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(profile));
          }
        } else {
          setSelectedCanteenState(profile);
          localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(profile));
        }

        // Recompute distance if userCoords already exists
        if (userCoords && profile.latitude && profile.longitude) {
          const dist = calculateDistanceMeters(
            userCoords.latitude,
            userCoords.longitude,
            profile.latitude,
            profile.longitude
          );
          setDistanceMeters(dist);
          const zone = getCampusZone(dist, profile);
          setMatchedZone(zone);

          const campusRadius = profile.radiusMeters || 5000;
          if (dist <= campusRadius) {
            setLocationStatus('inside_campus');
          } else if (dist <= campusRadius * 1.5) {
            setLocationStatus('nearby');
          } else {
            setLocationStatus('off_campus');
          }
        }
      }
    } catch (err) {
      console.warn('Canteen profile fetch notice:', err);
    }
  }, [userCoords]);

  useEffect(() => {
    refreshOfficialCanteen();
  }, [refreshOfficialCanteen]);

  const setSelectedCanteen = (canteen: OfficialCanteenProfile | null) => {
    setSelectedCanteenState(canteen);
    if (canteen) {
      localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(canteen));
    } else {
      localStorage.removeItem(CANTEEN_STORAGE_KEY);
    }
  };

  // Precise Geolocation Detection
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserCoords(coords);
        localStorage.setItem(COORDS_STORAGE_KEY, JSON.stringify(coords));

        const targetLat = officialCanteen?.latitude ?? 12.9716;
        const targetLon = officialCanteen?.longitude ?? 77.5946;
        const dist = calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          targetLat,
          targetLon
        );
        setDistanceMeters(dist);

        const zone = getCampusZone(dist, officialCanteen);
        setMatchedZone(zone);

        const radius = officialCanteen?.radiusMeters || 5000;
        if (dist <= radius) {
          setLocationStatus('inside_campus');
        } else if (dist <= radius * 1.5) {
          setLocationStatus('nearby');
        } else {
          setLocationStatus('off_campus');
        }

        // Auto-select official registered canteen on successful location match
        if (officialCanteen) {
          setSelectedCanteenState(officialCanteen);
          localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(officialCanteen));
        }
      },
      (err) => {
        console.warn('GPS location permission denied or error:', err.message);
        setLocationStatus('denied');
        // Gracefully ensure official canteen is still default selected
        if (officialCanteen && !selectedCanteen) {
          setSelectedCanteenState(officialCanteen);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [officialCanteen, selectedCanteen]);

  // Calibrate Canteen GPS Location (Staff/Admin)
  const calibrateCanteenLocation = async (coords: {
    latitude: number;
    longitude: number;
    campusName?: string;
    radiusMeters?: number;
    address?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch(buildApiUrl('/api/canteen/location'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coords),
      });
      if (res.ok) {
        await refreshOfficialCanteen();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Calibrate canteen location notice:', err);
      return false;
    }
  };

  const isInsideCampus =
    locationStatus === 'inside_campus' ||
    (distanceMeters !== null && distanceMeters <= (officialCanteen?.radiusMeters || 5000));

  return (
    <CanteenContext.Provider
      value={{
        officialCanteen,
        selectedCanteen,
        setSelectedCanteen,
        isCanteenSelectorOpen,
        setIsCanteenSelectorOpen,
        refreshOfficialCanteen,
        userCoords,
        distanceMeters,
        matchedZone,
        locationStatus,
        isInsideCampus,
        detectLocation,
        calibrateCanteenLocation,
      }}
    >
      {children}
    </CanteenContext.Provider>
  );
};

export const useCanteen = () => {
  const context = useContext(CanteenContext);
  if (!context) {
    throw new Error('useCanteen must be used within a CanteenProvider');
  }
  return context;
};

