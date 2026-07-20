import { writable } from 'svelte/store';

export interface Student {
  id: number;
  name: string;
  email: string;
}

export interface Mentor {
  id: number;
  name: string;
  role: string;
  email: string;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  price: string;
}

// Stores start empty — data is fetched from the backend API
export const studentsStore = writable<Student[]>([]);
export const mentorsStore = writable<Mentor[]>([]);
export const coursesStore = writable<Course[]>([]);
