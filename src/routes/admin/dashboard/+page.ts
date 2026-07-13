import type { PageLoad } from './$types';
import { studentsStore, mentorsStore, coursesStore } from '$lib/dataStore';
import { get } from 'svelte/store';

// Load function — currently returns hardcoded store data.
// TODO: Replace with Go API calls when backend is ready:
// const students = await fetch('/api/students').then(r => r.json());
export const load: PageLoad = () => {
  return {
    students: get(studentsStore),
    mentors: get(mentorsStore),
    courses: get(coursesStore)
  };
};
