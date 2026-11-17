import { z } from 'zod';

export const materialInput = z.object({
	title: z.string().trim().min(2, 'Give the material a title.').max(160),
	description: z.string().trim().max(500).default(''),
	kind: z.enum(['pdf', 'link', 'text']).default('text'),
	url: z.union([z.string().trim().url('Enter a valid URL.'), z.literal('')]).default(''),
	body: z.string().trim().max(50000).default(''),
	subjectId: z.union([z.string().uuid(), z.literal('')]).default(''),
	published: z.boolean().default(false)
});

export type MaterialKind = 'pdf' | 'link' | 'text';

export type MaterialDTO = {
	id: string;
	title: string;
	description: string;
	kind: MaterialKind;
	url: string | null;
	body: string;
	subjectId: string | null;
	published: boolean;
	createdAt: string;
	updatedAt: string;
};
