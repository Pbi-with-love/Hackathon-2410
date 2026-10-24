import { describe, it, expect } from 'vitest';
import {
  CAMPUS_CENTER,
  CAMPUS_BOUNDS,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  HACKATHON_ZONES,
  isWithinCampus,
  geoToImagePercent,
  mentorStatusColor,
  mentorStatusLabel,
} from './mapConstants';

describe('campus constants', () => {
  it('center is Tampere University lat/lng', () => {
    const [lat, lng] = CAMPUS_CENTER;
    expect(lat).toBeCloseTo(61.4978, 3);
    expect(lng).toBeCloseTo(23.761, 2);
  });

  it('bounds SW corner is south-west of center', () => {
    const [[swLat, swLng]] = CAMPUS_BOUNDS;
    expect(swLat).toBeLessThan(CAMPUS_CENTER[0]);
    expect(swLng).toBeLessThan(CAMPUS_CENTER[1]);
  });

  it('bounds NE corner is north-east of center', () => {
    const [, [neLat, neLng]] = CAMPUS_BOUNDS;
    expect(neLat).toBeGreaterThan(CAMPUS_CENTER[0]);
    expect(neLng).toBeGreaterThan(CAMPUS_CENTER[1]);
  });

  it('default zoom is higher than min zoom', () => {
    expect(DEFAULT_ZOOM).toBeGreaterThan(MIN_ZOOM);
  });

  it('max zoom is higher than default zoom', () => {
    expect(MAX_ZOOM).toBeGreaterThanOrEqual(DEFAULT_ZOOM);
  });

  it('default zoom is at least 16 (campus-level, not city-level)', () => {
    expect(DEFAULT_ZOOM).toBeGreaterThanOrEqual(16);
  });

  it('min zoom prevents zooming out to full city (must be >= 14)', () => {
    expect(MIN_ZOOM).toBeGreaterThanOrEqual(14);
  });
});

describe('isWithinCampus', () => {
  it('returns true for campus center', () => {
    expect(isWithinCampus(CAMPUS_CENTER[0], CAMPUS_CENTER[1])).toBe(true);
  });

  it('returns false for Helsinki (far from campus)', () => {
    expect(isWithinCampus(60.1699, 24.9384)).toBe(false);
  });

  it('returns false for coordinates outside the campus NE boundary', () => {
    const [, [neLat, neLng]] = CAMPUS_BOUNDS;
    expect(isWithinCampus(neLat + 0.01, neLng + 0.01)).toBe(false);
  });

  it('returns false for coordinates outside the campus SW boundary', () => {
    const [[swLat, swLng]] = CAMPUS_BOUNDS;
    expect(isWithinCampus(swLat - 0.01, swLng - 0.01)).toBe(false);
  });
});

describe('geoToImagePercent', () => {
  it('maps campus center to roughly (50, 50)', () => {
    const { left, top } = geoToImagePercent(CAMPUS_CENTER[0], CAMPUS_CENTER[1]);
    expect(left).toBeCloseTo(50, 0);
    expect(top).toBeCloseTo(51, 0); // slightly below center due to asymmetric bounds
  });

  it('maps SW corner to (0, 100) — bottom-left in CSS', () => {
    const [[swLat, swLng]] = CAMPUS_BOUNDS;
    const { left, top } = geoToImagePercent(swLat, swLng);
    expect(left).toBeCloseTo(0, 1);
    expect(top).toBeCloseTo(100, 1);
  });

  it('maps NE corner to (100, 0) — top-right in CSS', () => {
    const [, [neLat, neLng]] = CAMPUS_BOUNDS;
    const { left, top } = geoToImagePercent(neLat, neLng);
    expect(left).toBeCloseTo(100, 1);
    expect(top).toBeCloseTo(0, 1);
  });

  it('higher latitude yields smaller top (closer to top edge)', () => {
    const { top: t1 } = geoToImagePercent(61.495, 23.76);
    const { top: t2 } = geoToImagePercent(61.500, 23.76);
    expect(t2).toBeLessThan(t1);
  });

  it('higher longitude yields larger left (closer to right edge)', () => {
    const { left: l1 } = geoToImagePercent(61.498, 23.74);
    const { left: l2 } = geoToImagePercent(61.498, 23.78);
    expect(l2).toBeGreaterThan(l1);
  });
});

describe('HACKATHON_ZONES', () => {
  it('has at least 5 zones', () => {
    expect(HACKATHON_ZONES.length).toBeGreaterThanOrEqual(5);
  });

  it('each zone has required fields', () => {
    for (const zone of HACKATHON_ZONES) {
      expect(zone.id).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(zone.building).toBeTruthy();
      expect(typeof zone.left).toBe('number');
      expect(typeof zone.top).toBe('number');
    }
  });

  it('all zone ids are unique', () => {
    const ids = HACKATHON_ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all zone positions are within 0-100 range', () => {
    for (const zone of HACKATHON_ZONES) {
      expect(zone.left).toBeGreaterThanOrEqual(0);
      expect(zone.left).toBeLessThanOrEqual(100);
      expect(zone.top).toBeGreaterThanOrEqual(0);
      expect(zone.top).toBeLessThanOrEqual(100);
    }
  });

  it('includes essential hackathon zones', () => {
    const names = HACKATHON_ZONES.map((z) => z.name.toLowerCase());
    expect(names.some((n) => n.includes('hack'))).toBe(true);
    expect(names.some((n) => n.includes('mentor'))).toBe(true);
    expect(names.some((n) => n.includes('stage'))).toBe(true);
  });
});

describe('mentorStatusColor', () => {
  it('returns green for available', () => {
    expect(mentorStatusColor('available')).toBe('#22c55e');
  });

  it('returns yellow for busy', () => {
    expect(mentorStatusColor('busy')).toBe('#eab308');
  });

  it('returns grey for away', () => {
    expect(mentorStatusColor('away')).toBe('#9ca3af');
  });

  it('each status has a distinct color', () => {
    const colors = ['available', 'busy', 'away'].map(
      (s) => mentorStatusColor(s as 'available' | 'busy' | 'away'),
    );
    expect(new Set(colors).size).toBe(3);
  });
});

describe('mentorStatusLabel', () => {
  it('returns capitalised label for each status', () => {
    expect(mentorStatusLabel('available')).toBe('Available');
    expect(mentorStatusLabel('busy')).toBe('Busy');
    expect(mentorStatusLabel('away')).toBe('Away');
  });
});
