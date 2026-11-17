import { z } from 'zod';

/** PushSubscription.toJSON() as the browser sends it. */
export const subscriptionInput = z.object({
	endpoint: z.url().max(1000).startsWith('https://'),
	keys: z.object({ p256dh: z.string().min(80).max(100), auth: z.string().min(16).max(32) })
});
export type SubscriptionInput = z.infer<typeof subscriptionInput>;

/** Native Android app registers its FCM token here. */
export const fcmTokenInput = z.object({ token: z.string().min(10).max(512) });
export type FcmTokenInput = z.infer<typeof fcmTokenInput>;

export const unsubscribeInput = z.object({ endpoint: z.string().max(1000) });

export type PushPayload = { title: string; body: string; url: string };
export type PushTarget = { userIds?: string[]; batchId?: string; all?: true };
