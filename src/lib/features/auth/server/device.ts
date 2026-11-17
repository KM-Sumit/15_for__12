/** How long a student sign-in blocks every other phone and laptop. Matches the session cookie (30 days), slid while they use the app. */
export const SESSION_HOLD_MS = 30 * 24 * 60 * 60 * 1000;

export type HoldDecision = 'ok' | 'busy' | 'replace';

/**
 * Students get one live sign-in.
 * `busy` — another browser still holds it; refuse.
 * `replace` — the hold expired, so this sign-in may take the account and drop the old cookie.
 * `ok` — staff, the same browser, or nobody is signed in.
 */
export function studentHoldDecision(
	user: { role: string; sessionUntil: Date | null },
	sameBrowser: boolean,
	now = new Date()
): HoldDecision {
	if (user.role !== 'student') return 'ok';
	const until = user.sessionUntil?.getTime() ?? 0;
	if (until > now.getTime() && !sameBrowser) return 'busy';
	if (until > 0 && until <= now.getTime() && !sameBrowser) return 'replace';
	return 'ok';
}
