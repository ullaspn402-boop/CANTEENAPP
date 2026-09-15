export interface OfficialCanteenProfile {
  officialEmail: string;
  operatorName: string;
  photoUrl: string;
  phone: string;
  canteenName: string;
  campusName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  campusZones: string[];
  address: string;
  isVerified: boolean;
  registeredAt: string;
}

// In-Memory persistent official canteen account profile
let officialProfile: OfficialCanteenProfile = {
  officialEmail: 'agent202006@gmail.com',
  operatorName: 'Campus Canteen Head',
  photoUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80',
  phone: '+91 98765 01234',
  canteenName: 'Central Campus Canteen & Food Court',
  campusName: 'Main University Campus, Engineering Block A',
  latitude: 12.9716, // Default Campus Center Latitude
  longitude: 77.5946, // Default Campus Center Longitude
  radiusMeters: 5000, // Expanded Campus Coverage: 5 km (covers Hostels, Sports, Tech Parks)
  campusZones: [
    'Central Food Court & Academic Core (0 - 800m)',
    'Campus Hostels & Residential Quarters (800m - 2.5km)',
    'Sports Complex & Engineering Grounds (2.5km - 5km)',
    'Extended University Town & Student Housing (5km - 10km)',
  ],
  address: 'Ground Floor, Student Activities Center, North Avenue',
  isVerified: true,
  registeredAt: new Date().toISOString(),
};

export const getOfficialPasscode = (): string => {
  // Check process.env first (Node.js server environment on Render / Cloud)
  if (typeof process !== 'undefined' && process?.env) {
    const val =
      process.env.VITE_CANTEEN_MASTER_PASSCODE ||
      process.env.VITE_OFFICIAL_PASSCODE ||
      process.env.CANTEEN_MASTER_PASSCODE ||
      process.env.OFFICIAL_PASSCODE;
    if (val) return val;
  }
  // Check import.meta.env safely (Vite browser frontend environment)
  try {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env : undefined;
    if (metaEnv) {
      const val = metaEnv.VITE_CANTEEN_MASTER_PASSCODE || metaEnv.VITE_OFFICIAL_PASSCODE;
      if (val) return val;
    }
  } catch {
    // Ignore in CommonJS or non-ESM environments
  }
  return 'CANTEEN2026';
};

export const OFFICIAL_PASSCODE = getOfficialPasscode();

export function verifyOfficialPasscode(inputPasscode?: string): boolean {
  if (!inputPasscode) return false;
  return inputPasscode.trim() === getOfficialPasscode().trim();
}

export function getOfficialCanteenProfile(): OfficialCanteenProfile {
  return { ...officialProfile };
}

export function isOfficialCanteenAccount(email?: string | null): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  const currentOfficial = officialProfile.officialEmail.trim().toLowerCase();
  // ONLY the registered official canteen account is permitted
  return norm === currentOfficial;
}

export function registerOfficialCanteen(data: {
  operatorName: string;
  officialEmail: string;
  photoUrl?: string;
  phone?: string;
  canteenName?: string;
  campusName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  address?: string;
  passcode: string;
}): { success: boolean; profile?: OfficialCanteenProfile; error?: string } {
  if (!verifyOfficialPasscode(data.passcode)) {
    return {
      success: false,
      error: 'Invalid Canteen Verification Passcode. Please enter the authorized master canteen passkey.',
    };
  }

  const cleanEmail = (data.officialEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid official campus email is required.' };
  }

  officialProfile = {
    ...officialProfile,
    officialEmail: cleanEmail,
    operatorName: data.operatorName.trim() || 'Official Canteen Operator',
    photoUrl:
      data.photoUrl?.trim() ||
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80',
    phone: data.phone?.trim() || '+91 98765 00000',
    canteenName: data.canteenName?.trim() || 'Smart College Canteen',
    campusName: data.campusName?.trim() || officialProfile.campusName,
    latitude: typeof data.latitude === 'number' ? data.latitude : officialProfile.latitude,
    longitude: typeof data.longitude === 'number' ? data.longitude : officialProfile.longitude,
    radiusMeters: typeof data.radiusMeters === 'number' ? data.radiusMeters : officialProfile.radiusMeters,
    address: data.address?.trim() || officialProfile.address,
    isVerified: true,
    registeredAt: new Date().toISOString(),
  };

  return { success: true, profile: { ...officialProfile } };
}

/**
 * Transfers official canteen ownership and privileges to a new Gmail address.
 * Immediately invalidates privileges for the old email account.
 */
export function transferOfficialCanteenEmail(data: {
  oldEmail: string;
  newEmail: string;
  passcode: string;
}): { success: boolean; oldEmail?: string; newEmail?: string; profile?: OfficialCanteenProfile; error?: string } {
  if (!verifyOfficialPasscode(data.passcode)) {
    return {
      success: false,
      error: 'Unauthorized: Invalid Canteen Passcode. Master passkey required.',
    };
  }

  const cleanNew = (data.newEmail || '').trim().toLowerCase();
  const cleanOld = (data.oldEmail || '').trim().toLowerCase();

  if (!cleanNew || !cleanNew.includes('@')) {
    return { success: false, error: 'A valid new official Gmail / campus email is required.' };
  }

  if (cleanNew === cleanOld) {
    return {
      success: false,
      error: 'The new official email must be different from the current official email address.',
    };
  }

  // Update in-memory official email
  officialProfile = {
    ...officialProfile,
    officialEmail: cleanNew,
    registeredAt: new Date().toISOString(),
  };

  return {
    success: true,
    oldEmail: cleanOld,
    newEmail: cleanNew,
    profile: { ...officialProfile },
  };
}

/**
 * Updates official canteen location coordinates and campus perimeter.
 */
export function updateOfficialCanteenLocation(coords: {
  latitude: number;
  longitude: number;
  campusName?: string;
  radiusMeters?: number;
  address?: string;
}): OfficialCanteenProfile {
  officialProfile = {
    ...officialProfile,
    latitude: coords.latitude,
    longitude: coords.longitude,
    campusName: coords.campusName || officialProfile.campusName,
    radiusMeters: coords.radiusMeters || officialProfile.radiusMeters,
    address: coords.address || officialProfile.address,
  };
  return { ...officialProfile };
}

/**
 * Updates campus area coverage radius and campus sub-zones.
 */
export function updateCampusCoverage(radiusMeters: number, campusZones?: string[]): OfficialCanteenProfile {
  officialProfile = {
    ...officialProfile,
    radiusMeters: Math.max(500, Math.min(25000, radiusMeters)),
    campusZones: campusZones && campusZones.length > 0 ? campusZones : officialProfile.campusZones,
  };
  return { ...officialProfile };
}


