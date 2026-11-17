/** User-specific mark burned into PDFs/videos and floated on the app. */

export type MarkUser = { id?: string | null; email?: string | null; name?: string | null } | null | undefined;

/** Empty when signed out — public pages stay clean. */
export function sessionMark(user: MarkUser): string {
	if (!user?.email) return '';
	const id = user.id ? user.id.replace(/-/g, '').slice(0, 8) : '';
	return id ? `${user.email} · ${id}` : user.email;
}

/** Always a string so a leaked PDF/video still names the institute or the student. */
export function mediaMark(user: MarkUser): string {
	return sessionMark(user) || 'EduSphere';
}

/** Tile rotated text across a canvas (PDF page or video frame). */
export function stampCanvas(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
	if (!text || w < 8 || h < 8) return;
	ctx.save();
	ctx.globalAlpha = 0.16;
	ctx.fillStyle = '#111';
	ctx.font = `600 ${Math.max(11, Math.floor(w / 26))}px ui-sans-serif, system-ui, sans-serif`;
	ctx.rotate(-Math.PI / 6);
	const stepX = Math.max(ctx.measureText(text).width + 64, 160);
	const stepY = Math.max(64, Math.floor(h / 8));
	for (let y = -h; y < h * 2; y += stepY) {
		for (let x = -w; x < w * 2; x += stepX) ctx.fillText(text, x, y);
	}
	ctx.restore();
}
