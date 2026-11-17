// Client-safe formatting for the public site. All times are shown in IST.
const IST = 'Asia/Kolkata';

/** "Tue 21 Oct" */
export const dayIST = (iso: string) => new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));
/** "10:00 am IST" */
export const timeIST = (iso: string) =>
	new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).toUpperCase() + ' IST';
/** "₹1,499" */
export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
/** "3 h 20 min" / "45 min" */
export const hours = (sec: number) => {
	const m = Math.round(sec / 60);
	return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
};
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
/** Seeded placeholder copy ("Add the institute address in Admin > Site") is not real content. */
export const real = (v: string | undefined | null) => (v && !/^Add (the|your) /i.test(v) ? v : '');
export const waLink = (num: string | undefined, text = '') =>
	num ? `https://wa.me/${num.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null;

export const BRAND = 'EduSphere';
export const LEGAL_NAME = 'EduSphere';
export const BRAND_ALIASES = ['edusphere', LEGAL_NAME];

/** Production origin when the layout passed one; else the request origin, no trailing slash. */
export const seoOrigin = (fromLayout: unknown, fallback: string) =>
	(typeof fromLayout === 'string' && fromLayout ? fromLayout : fallback).replace(/\/$/, '');

/** Page title with the public brand, unless the title already names it. */
export const seoTitle = (title: string) => (title.includes(BRAND) ? title : `${title} · ${BRAND}`);

export const jsonLdScript = (o: unknown) =>
	`<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</` + `script>`;

/** schema.org organisation block from the admin-editable settings (only real values). */
export function orgJsonLd(s: import('../schema').SiteSettings, origin: string) {
	const sameAs = Object.values(s.socials ?? {}).filter(Boolean);
	return {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		'@id': `${origin}/#organization`,
		name: BRAND,
		legalName: LEGAL_NAME,
		alternateName: BRAND_ALIASES,
		slogan: 'Dream. Prepare. Achieve.',
		url: origin,
		logo: origin + '/brand/uci-mark.png',
		image: origin + '/brand/uci-mark.png',
		...(s.contactPhone ? { telephone: s.contactPhone } : {}),
		...(s.email ? { email: s.email } : {}),
		...(real(s.address) ? { address: { '@type': 'PostalAddress', streetAddress: real(s.address), addressRegion: 'Madhya Pradesh', addressCountry: 'IN' } } : {}),
		...(sameAs.length ? { sameAs } : {})
	};
}

/** WebSite node so Google can match brand queries (edusphere) to this host. */
export function websiteJsonLd(origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${origin}/#website`,
		name: BRAND,
		alternateName: BRAND_ALIASES,
		url: origin,
		inLanguage: 'en-IN',
		publisher: { '@id': `${origin}/#organization` }
	};
}
