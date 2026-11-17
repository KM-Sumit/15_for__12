import type { User } from '#lib/server/db/schema';
import type { TenantInfo } from '#lib/server/tenant/context';
import type { ModuleKey } from '#lib/features/platform/modules';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			/** Verified membership for this request. null for super admins and anonymous visitors. */
			tenant: TenantInfo | null;
			isSuperAdmin: boolean;
			enabledModules: ModuleKey[];
		}
	}
}

export {};
