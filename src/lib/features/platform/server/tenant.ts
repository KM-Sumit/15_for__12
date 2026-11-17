// Tenant admin self-service: read/update the current institute. The institute id always comes from the
// verified membership (never from the browser) and every write is scoped by it.
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { institutes } from '#lib/server/db/schema';
import { DomainError } from '#lib/server/http';
import { audit } from '#lib/server/tenant/context';
import { instituteProfileInput } from '../schema';

export type InstituteProfile = {
	id: string;
	name: string;
	slug: string;
	status: 'active' | 'suspended';
	tagline: string;
	description: string;
	contactEmail: string | null;
	phone: string | null;
	address: string;
	website: string | null;
	logoUrl: string | null;
	primaryColor: string;
	createdAt: string;
};

export async function getInstituteProfile(instituteId: string): Promise<InstituteProfile> {
	const [i] = await db().select().from(institutes).where(eq(institutes.id, instituteId)).limit(1);
	if (!i) throw new DomainError(404, 'Institute not found.');
	return {
		id: i.id,
		name: i.name,
		slug: i.slug,
		status: i.status as 'active' | 'suspended',
		tagline: i.tagline,
		description: i.description,
		contactEmail: i.contactEmail,
		phone: i.phone,
		address: i.address,
		website: i.website,
		logoUrl: i.logoUrl,
		primaryColor: i.primaryColor,
		createdAt: i.createdAt.toISOString()
	};
}

export async function updateInstituteProfile(instituteId: string, raw: unknown, actorId: string | null) {
	const r = instituteProfileInput.safeParse(raw);
	if (!r.success) throw new DomainError(400, r.error.issues[0]?.message ?? 'Check the form.');
	const input = r.data;
	const [i] = await db()
		.update(institutes)
		.set({
			name: input.name,
			tagline: input.tagline,
			description: input.description,
			contactEmail: input.contactEmail || null,
			phone: input.phone || null,
			address: input.address,
			website: input.website || null,
			logoUrl: input.logoUrl || null,
			primaryColor: input.primaryColor,
			updatedAt: new Date()
		})
		.where(eq(institutes.id, instituteId))
		.returning({ slug: institutes.slug });
	if (!i) throw new DomainError(404, 'Institute not found.');
	await audit({ actorId, instituteId, action: 'institute.profile_update', target: i.slug });
}
