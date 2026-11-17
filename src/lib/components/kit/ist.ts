/** Parse a typed IST clock time. Date stays on the calendar; this is only hh:mm. */
export function parseIstTime(raw: string): { hh: number; mm: number } | null {
	const s = raw.trim().toUpperCase().replace(/\s+/g, ' ');
	if (!s) return null;
	const mer = /([AP])\.?M\.?\s*$/.exec(s);
	const core = (mer ? s.slice(0, mer.index) : s).trim();
	let hh: number;
	let mm: number;
	const hm = /^(\d{1,2})[:.](\d{2})$/.exec(core);
	const h = /^(\d{1,2})$/.exec(core);
	const compact = /^(\d{1,2})(\d{2})$/.exec(core);
	if (hm) {
		hh = Number(hm[1]);
		mm = Number(hm[2]);
	} else if (h) {
		hh = Number(h[1]);
		mm = 0;
	} else if (compact) {
		hh = Number(compact[1]);
		mm = Number(compact[2]);
	} else return null;
	if (!Number.isInteger(hh) || !Number.isInteger(mm) || mm > 59 || mm < 0) return null;
	if (mer) {
		if (hh < 1 || hh > 12) return null;
		if (hh === 12) hh = 0;
		if (mer[1] === 'P') hh += 12;
	} else if (hh > 23 || hh < 0) return null;
	return { hh, mm };
}

/** "10:00 AM" — what staff type back into the field. */
export function formatIstTime(hh: number, mm: number): string {
	return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
}
