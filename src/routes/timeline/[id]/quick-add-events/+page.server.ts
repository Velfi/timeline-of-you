import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const timelineId = parseInt(params.id);
    if (isNaN(timelineId)) {
      throw error(400, 'Invalid timeline ID');
    }

    // Just pass the ID to the client, which will load the timeline from IndexedDB
    return {
      timelineId
    };
  } catch (err) {
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'An unexpected error occurred');
  }
}; 