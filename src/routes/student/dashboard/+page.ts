import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  if (typeof window === 'undefined') {
    return { dashboardData: null };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return { dashboardData: null };
  }

  try {
    const res = await fetch('/api/v1/student/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return { dashboardData: data };
    }
  } catch (err) {
    console.error('Failed to load student dashboard data:', err);
  }

  return { dashboardData: null };
};

