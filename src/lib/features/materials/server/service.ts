// Study materials: tenant-owned PDFs, links and reading notes. RLS scopes every query to the current institute.
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { studyMaterials } from '#lib/server/db/schema';
import { DomainError } from '#lib/server/http';
import { requireInstituteId } from '#lib/server/tenant/context';
import { materialInput, type MaterialDTO } from '../schema';

type MaterialRow = typeof studyMaterials.$inferSelect;

const toDTO = (m: MaterialRow): MaterialDTO => ({
	id: m.id,
	title: m.title,
	description: m.description,
	kind: m.kind,
	url: m.url,
	body: m.body,
	subjectId: m.subjectId,
	published: m.published,
	createdAt: m.createdAt.toISOString(),
	updatedAt: m.updatedAt.toISOString()
});

export async function listMaterials(opts: { publishedOnly?: boolean; subjectId?: string | null } = {}): Promise<MaterialDTO[]> {
	const where: (SQL | undefined)[] = [opts.publishedOnly ? eq(studyMaterials.published, true) : undefined];
	if (opts.subjectId) where.push(eq(studyMaterials.subjectId, opts.subjectId));
	const rows = await db()
		.select()
		.from(studyMaterials)
		.where(and(...where))
		.orderBy(desc(studyMaterials.createdAt));
	return rows.map(toDTO);
}

export async function getMaterial(id: string, publishedOnly = false): Promise<MaterialDTO> {
	const [m] = await db()
		.select()
		.from(studyMaterials)
		.where(and(eq(studyMaterials.id, id), publishedOnly ? eq(studyMaterials.published, true) : undefined))
		.limit(1);
	if (!m) throw new DomainError(404, 'Material not found.');
	return toDTO(m);
}

function parse(raw: unknown) {
	const r = materialInput.safeParse(raw);
	if (!r.success) throw new DomainError(400, r.error.issues[0]?.message ?? 'Check the material.');
	if (r.data.kind === 'link' && !r.data.url) throw new DomainError(400, 'A link material needs a URL.');
	if (r.data.kind === 'text' && !r.data.body) throw new DomainError(400, 'Write the reading material.');
	return r.data;
}

export async function createMaterial(raw: unknown, actorId: string | null): Promise<MaterialDTO> {
	const input = parse(raw);
	const [m] = await db()
		.insert(studyMaterials)
		.values({
			instituteId: requireInstituteId(),
			title: input.title,
			description: input.description,
			kind: input.kind,
			url: input.url || null,
			body: input.body,
			subjectId: input.subjectId || null,
			published: input.published,
			createdById: actorId
		})
		.returning();
	return toDTO(m!);
}

export async function updateMaterial(id: string, raw: unknown): Promise<MaterialDTO> {
	const input = parse(raw);
	const [m] = await db()
		.update(studyMaterials)
		.set({
			title: input.title,
			description: input.description,
			kind: input.kind,
			url: input.url || null,
			body: input.body,
			subjectId: input.subjectId || null,
			published: input.published,
			updatedAt: new Date()
		})
		.where(eq(studyMaterials.id, id))
		.returning();
	if (!m) throw new DomainError(404, 'Material not found.');
	return toDTO(m);
}

export async function deleteMaterial(id: string) {
	const [m] = await db().delete(studyMaterials).where(eq(studyMaterials.id, id)).returning({ id: studyMaterials.id });
	if (!m) throw new DomainError(404, 'Material not found.');
}

export async function setMaterialPublished(id: string, published: boolean) {
	const [m] = await db().update(studyMaterials).set({ published }).where(eq(studyMaterials.id, id)).returning({ id: studyMaterials.id });
	if (!m) throw new DomainError(404, 'Material not found.');
}
