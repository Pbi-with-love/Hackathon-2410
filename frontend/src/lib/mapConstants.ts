/** Tampere University Hervanta campus — geographic reference */
export const CAMPUS_CENTER: [number, number] = [61.4978, 23.7610];

/**
 * Geographic bounding box for the campus.
 * SW corner, NE corner.
 */
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [61.4900, 23.7380],
  [61.5060, 23.7840],
];

export const DEFAULT_ZOOM = 17;
export const MIN_ZOOM = 15;
export const MAX_ZOOM = 19;

/** Returns whether a lat/lng coordinate falls within the campus bounds. */
export function isWithinCampus(lat: number, lng: number): boolean {
  const [[swLat, swLng], [neLat, neLng]] = CAMPUS_BOUNDS;
  return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
}

/**
 * Convert geographic lat/lng to CSS percentage coordinates (top-left origin).
 * Returns { left, top } in 0-100 range for use with position: absolute.
 */
export function geoToImagePercent(lat: number, lng: number): { left: number; top: number } {
  const [[swLat, swLng], [neLat, neLng]] = CAMPUS_BOUNDS;
  const left = ((lng - swLng) / (neLng - swLng)) * 100;
  const top = ((neLat - lat) / (neLat - swLat)) * 100;
  return { left, top };
}

/** Hackathon zone definitions — mapped to real campus buildings. */
export interface HackathonZone {
  id: string;
  name: string;
  building: string;
  left: number; // x% from left edge of image
  top: number;  // y% from top edge of image
}

export const HACKATHON_ZONES: HackathonZone[] = [
  { id: 'hacking-hall',  name: 'Hacking hall',  building: 'Festia',         left: 46, top: 57 },
  { id: 'main-stage',    name: 'Main stage',    building: 'Kampusareena',   left: 34, top: 47 },
  { id: 'mentor-corner', name: 'Mentor corner', building: 'Main Building',  left: 48, top: 47 },
  { id: 'hardware-lab',  name: 'Hardware lab',  building: 'Sähkötalo',      left: 34, top: 37 },
  { id: 'quiet-room',    name: 'Quiet room',    building: 'Tietotalo',      left: 20, top: 37 },
  { id: 'food',          name: 'Food',          building: 'Konetalo',       left: 34, top: 67 },
  { id: 'demo-stage',    name: 'Demo stage',    building: 'Tamppi Areena',  left: 55, top: 56 },
  { id: 'entrance',      name: 'Entrance',      building: 'Kampusareena A', left: 36, top: 52 },
];

/** Marker colour for mentor availability status. */
export function mentorStatusColor(status: 'available' | 'busy' | 'away'): string {
  switch (status) {
    case 'available': return '#22c55e';
    case 'busy':      return '#eab308';
    case 'away':      return '#9ca3af';
  }
}

/** Accessible label for mentor availability status. */
export function mentorStatusLabel(status: 'available' | 'busy' | 'away'): string {
  switch (status) {
    case 'available': return 'Available';
    case 'busy':      return 'Busy';
    case 'away':      return 'Away';
  }
}
