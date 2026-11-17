import { describe, expect, test } from 'bun:test';
import { mediaMark, sessionMark, stampCanvas } from './mark';

describe('sessionMark', () => {
	test('empty when signed out', () => {
		expect(sessionMark(null)).toBe('');
		expect(sessionMark({ email: null })).toBe('');
	});
	test('email plus short id', () => {
		expect(sessionMark({ id: 'abcdef01-2345-6789', email: 'a@b.c' })).toBe('a@b.c · abcdef01');
	});
});

describe('mediaMark', () => {
	test('falls back to the institute name', () => expect(mediaMark(null)).toBe('EduSphere'));
	test('uses the student mark when signed in', () => {
		expect(mediaMark({ id: 'aaaaaaaa-bbbb', email: 'sumit@uci.test' })).toBe('sumit@uci.test · aaaaaaaa');
	});
});

describe('stampCanvas', () => {
	test('tiles the mark across the page', () => {
		const written: string[] = [];
		const ctx = {
			save() {},
			restore() {},
			rotate() {},
			fillText(t: string) {
				written.push(t);
			},
			measureText: () => ({ width: 80 }),
			globalAlpha: 1,
			fillStyle: '',
			font: ''
		} as unknown as CanvasRenderingContext2D;
		stampCanvas(ctx, 400, 300, 'a@b.c · abcdef01');
		expect(written.some((t) => t.includes('a@b.c'))).toBe(true);
	});
});
