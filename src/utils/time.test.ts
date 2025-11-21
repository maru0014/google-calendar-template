import { parseTime } from './time';
import { describe, it, expect } from 'vitest';

describe('parseTime', () => {
  it('should parse 24-hour format correctly', () => {
    expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
    expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('should parse 12-hour AM format correctly', () => {
    expect(parseTime('09:00 AM')).toEqual({ hours: 9, minutes: 0 });
    expect(parseTime('9:00am')).toEqual({ hours: 9, minutes: 0 });
    expect(parseTime('12:00 AM')).toEqual({ hours: 0, minutes: 0 }); // Midnight
    expect(parseTime('12:30 am')).toEqual({ hours: 0, minutes: 30 });
  });

  it('should parse 12-hour PM format correctly', () => {
    expect(parseTime('02:30 PM')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('2:30pm')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('12:00 PM')).toEqual({ hours: 12, minutes: 0 }); // Noon
    expect(parseTime('12:30 pm')).toEqual({ hours: 12, minutes: 30 });
  });

  it('should parse Japanese format correctly', () => {
    expect(parseTime('午前9:00')).toEqual({ hours: 9, minutes: 0 });
    expect(parseTime('午後2:30')).toEqual({ hours: 14, minutes: 30 });
  });

  it('should return null for invalid inputs', () => {
    expect(parseTime('')).toBeNull();
    expect(parseTime('invalid')).toBeNull();
    expect(parseTime('25:00')).toBeNull(); // Invalid hour
    expect(parseTime('10:60')).toBeNull(); // Invalid minute
  });
});
