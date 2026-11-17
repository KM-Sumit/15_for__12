import { z } from 'zod';

export const slug = z
	.string()
	.trim()
	.min(2, 'Use at least 2 characters.')
	.max(48)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');

export const email = z.string().trim().toLowerCase().email('Enter a valid email address.');

export const createInstituteInput = z.object({
	name: z.string().trim().min(2, 'Enter the institute name.').max(120),
	slug,
	tagline: z.string().trim().max(160).default(''),
	contactEmail: z.union([email, z.literal('')]).default(''),
	phone: z.string().trim().max(32).default(''),
	address: z.string().trim().max(500).default(''),
	planId: z.union([z.string().uuid(), z.literal('')]).default(''),
	adminName: z.string().trim().max(120).default(''),
	adminEmail: email,
	adminPassword: z.string().min(8, 'Password must be at least 8 characters.').max(128),
	modules: z.array(z.string()).default([])
});

export const updateInstituteInput = z.object({
	name: z.string().trim().min(2).max(120),
	tagline: z.string().trim().max(160).default(''),
	description: z.string().trim().max(4000).default(''),
	contactEmail: z.union([email, z.literal('')]).default(''),
	phone: z.string().trim().max(32).default(''),
	address: z.string().trim().max(500).default(''),
	website: z.union([z.string().trim().url(), z.literal('')]).default(''),
	logoUrl: z.union([z.string().trim().url(), z.literal('')]).default(''),
	/** Payment page is external and admin-only. Super admin sets it; students never see it. */
	paymentLink: z
		.union([
			z
				.string()
				.trim()
				.url('Enter a valid payment page URL.')
				.refine((v) => v.startsWith('https://'), 'Payment link must start with https://'),
			z.literal('')
		])
		.default(''),
	primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #e2580b.').default('#e2580b'),
	planId: z.union([z.string().uuid(), z.literal('')]).default(''),
	notes: z.string().trim().max(2000).default('')
});

export const planInput = z.object({
	name: z.string().trim().min(2).max(80),
	slug: z
		.string()
		.trim()
		.min(2)
		.max(48)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	description: z.string().trim().max(1000).default(''),
	priceInr: z.coerce.number().int().min(0).default(0),
	maxStudents: z.union([z.coerce.number().int().min(1), z.literal('')]).default(''),
	maxAdmins: z.union([z.coerce.number().int().min(1), z.literal('')]).default(''),
	maxTests: z.union([z.coerce.number().int().min(1), z.literal('')]).default(''),
	modules: z.array(z.string()).default([]),
	active: z.boolean().default(true)
});

export const adminAccountInput = z.object({
	email,
	name: z.string().trim().max(120).default(''),
	role: z.enum(['admin', 'teacher']).default('admin'),
	password: z.string().min(8, 'Password must be at least 8 characters.').max(128)
});

export const resetPasswordInput = z.object({
	userId: z.string().uuid(),
	password: z.string().min(8, 'Password must be at least 8 characters.').max(128)
});

/** What a coaching admin may change about their own institute (slug and plan stay platform-controlled). */
export const instituteProfileInput = z.object({
	name: z.string().trim().min(2, 'Enter the institute name.').max(120),
	tagline: z.string().trim().max(160).default(''),
	description: z.string().trim().max(4000).default(''),
	contactEmail: z.union([email, z.literal('')]).default(''),
	phone: z.string().trim().max(32).default(''),
	address: z.string().trim().max(500).default(''),
	website: z.union([z.string().trim().url(), z.literal('')]).default(''),
	logoUrl: z.union([z.string().trim().url(), z.literal('')]).default(''),
	primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #e2580b.').default('#e2580b')
});

