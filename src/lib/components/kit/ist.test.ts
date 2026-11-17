import { expect, test } from 'bun:test';
import { formatIstTime, parseIstTime } from './ist';

test('parseIstTime reads 12-hour, 24-hour and compact clocks', () => {
	expect(parseIstTime('10:30 AM')).toEqual({ hh: 10, mm: 30 });
	expect(parseIstTime('10:30am')).toEqual({ hh: 10, mm: 30 });
	expect(parseIstTime('  2:05 pm ')).toEqual({ hh: 14, mm: 5 });
	expect(parseIstTime('12:00 AM')).toEqual({ hh: 0, mm: 0 });
	expect(parseIstTime('12:00 PM')).toEqual({ hh: 12, mm: 0 });
	expect(parseIstTime('10.30 PM')).toEqual({ hh: 22, mm: 30 });
	expect(parseIstTime('14:00')).toEqual({ hh: 14, mm: 0 });
	expect(parseIstTime('9 AM')).toEqual({ hh: 9, mm: 0 });
	expect(parseIstTime('9:30')).toEqual({ hh: 9, mm: 30 });
	expect(parseIstTime('0930')).toEqual({ hh: 9, mm: 30 });
	expect(parseIstTime('1430')).toEqual({ hh: 14, mm: 30 });
});

test('parseIstTime rejects empty or impossible times', () => {
	expect(parseIstTime('')).toBeNull();
	expect(parseIstTime('noon')).toBeNull();
	expect(parseIstTime('25:00')).toBeNull();
	expect(parseIstTime('10:75')).toBeNull();
	expect(parseIstTime('13:00 PM')).toBeNull();
});

test('formatIstTime is what the field shows', () => {
	expect(formatIstTime(0, 0)).toBe('12:00 AM');
	expect(formatIstTime(10, 30)).toBe('10:30 AM');
	expect(formatIstTime(12, 5)).toBe('12:05 PM');
	expect(formatIstTime(22, 0)).toBe('10:00 PM');
});
