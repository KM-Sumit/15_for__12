import { error } from '@sveltejs/kit';
import { getPublicInstitute } from '#lib/features/platform/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const institute = await getPublicInstitute(params.slug);
	if (!institute) error(404, 'Institute not found.');
	return {
		institute: {
			id: institute.id,
			name: institute.name,
			slug: institute.slug,
			tagline: institute.tagline,
			description: institute.description,
			logoUrl: institute.logoUrl,
			primaryColor: institute.primaryColor,
			address: institute.address,
			phone: institute.phone,
			contactEmail: institute.contactEmail,
			website: institute.website
		},
		signedIn: Boolean(locals.user)
	};
};
