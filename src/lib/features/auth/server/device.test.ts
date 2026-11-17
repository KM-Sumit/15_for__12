import { expect, test } from 'bun:test';
import { studentHoldDecision } from './device';

const now = new Date('2026-10-31T04:30:00Z');
const later = new Date(now.getTime() + 60_000);
const earlier = new Date(now.getTime() - 60_000);

test('staff can sign in on another device', () => {
	expect(studentHoldDecision({ role: 'teacher', sessionUntil: later }, false, now)).toBe('ok');
	expect(studentHoldDecision({ role: 'admin', sessionUntil: later }, false, now)).toBe('ok');
});

test('a student already signed in blocks a second phone or laptop', () => {
	expect(studentHoldDecision({ role: 'student', sessionUntil: later }, false, now)).toBe('busy');
});

test('the same browser can refresh its own sign-in', () => {
	expect(studentHoldDecision({ role: 'student', sessionUntil: later }, true, now)).toBe('ok');
});

test('no hold yet, or an expired hold, lets the next device in', () => {
	expect(studentHoldDecision({ role: 'student', sessionUntil: null }, false, now)).toBe('ok');
	expect(studentHoldDecision({ role: 'student', sessionUntil: earlier }, false, now)).toBe('replace');
});
