// Client-safe session user: what layouts hand to pages (no session version, no suspension internals).
export type Role = 'student' | 'teacher' | 'admin' | 'super_admin';

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	avatarUrl: string | null;
	role: Role;
	onboarded: boolean;
	instituteId: string | null;
	instituteName: string | null;
	instituteSlug: string | null;
};

export const toSessionUser = (u: {
	id: string;
	email: string;
	name: string;
	avatarUrl: string | null;
	role: Role;
	onboardedAt: Date | null;
	instituteId?: string | null;
}): SessionUser => ({
	id: u.id,
	email: u.email,
	name: u.name,
	avatarUrl: u.avatarUrl,
	role: u.role,
	onboarded: u.onboardedAt !== null,
	instituteId: u.instituteId ?? null,
	instituteName: null,
	instituteSlug: null
});

/** Client-safe landing path: public site, super admin, staff console, student app, or onboarding. */
export function homeHref(user: { role: string; onboarded?: boolean } | null | undefined) {
	if (!user) return '/';
	if (user.role === 'super_admin') return '/super';
	if (user.role === 'admin' || user.role === 'teacher') return '/admin';
	return user.onboarded ? '/app' : '/onboarding';
}
