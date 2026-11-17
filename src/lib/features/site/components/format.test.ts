import { describe, expect, test } from 'bun:test';
import { BRAND, orgJsonLd, seoOrigin, seoTitle, websiteJsonLd } from './format';

const origin = 'https://ucisarthi.in';
const org = orgJsonLd({ contactPhone: '+919876543210' }, origin);

describe('seoTitle', () => {
	test('appends the public brand', () => expect(seoTitle('Faculty')).toBe(`Faculty · ${BRAND}`));
	test('does not double the brand', () => expect(seoTitle(`EduSphere | Official site`)).toBe('EduSphere | Official site'));
});

describe('seoOrigin', () => {
	test('prefers the layout origin', () => expect(seoOrigin('https://ucisarthi.in/', 'http://127.0.0.1:5174')).toBe(origin));
	test('falls back to the request origin', () => expect(seoOrigin(undefined, 'http://127.0.0.1:5174/')).toBe('http://127.0.0.1:5174'));
});

describe('brand JSON-LD', () => {
	test('organization names the public brand and legal name', () => {
		expect(org).toMatchObject({
			'@type': 'EducationalOrganization',
			'@id': `${origin}/#organization`,
			name: BRAND,
			legalName: 'EduSphere',
			url: origin
		});
		expect(org.alternateName).toContain('edusphere');
		expect(org.alternateName).toContain('EduSphere');
	});
	test('website points at the organization', () => {
		expect(websiteJsonLd(origin)).toMatchObject({
			'@type': 'WebSite',
			name: BRAND,
			url: origin,
			publisher: { '@id': `${origin}/#organization` }
		});
	});
});
