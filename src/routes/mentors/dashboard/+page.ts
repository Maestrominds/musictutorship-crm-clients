import { PUBLIC_API_URL } from '$env/static/public';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  if (typeof window === 'undefined') {
    return { mentorData: null };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return { mentorData: null };
  }

  try {
    const res = await fetch(`${PUBLIC_API_URL || ''}/api/v1/mentor/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      const classes = await res.json();
      return { mentorData: { classes } };
    }
  } catch (err) {
    console.error('Failed to load mentor classes:', err);
  }

  return { mentorData: null };
};

