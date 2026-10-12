import * as Location from 'expo-location';

/**
 * Request location permission and get the user's current coordinates.
 * Returns { latitude, longitude } or null if permission denied or error.
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Add a random privacy offset (~200m) to coordinates so the exact
 * household location is not revealed on the public map.
 * Returns { latitude, longitude } with offset applied.
 */
export function addPrivacyOffset(latitude, longitude) {
  if (!latitude || !longitude) return { latitude, longitude };

  // ~200m offset: 0.002 degrees ≈ 200m at equator
  const offsetLat = (Math.random() - 0.5) * 0.004;
  const offsetLng = (Math.random() - 0.5) * 0.004;

  return {
    latitude: latitude + offsetLat,
    longitude: longitude + offsetLng,
  };
}

/**
 * Format distance for display.
 * Returns a human-readable string like "1.5 km away" or "nearby".
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return null;
  if (distanceKm < 0.1) return 'Nearby';
  if (distanceKm < 1) return `${(distanceKm * 1000).toFixed(0)} m away`;
  return `${distanceKm} km away`;
}

// Default map center: Colombo, Sri Lanka
export const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
