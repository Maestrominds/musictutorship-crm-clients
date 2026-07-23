import { writable } from 'svelte/store';

export interface Student {
  id: number;
  name: string;
  email: string;
  mentor_name?: string;
  course_id?: number;
  course_name?: string;
}

export interface Mentor {
  id: number;
  name: string;
  role: string;
  email: string;
  specialty?: string;
  phone?: string;
  status?: string;
  assigned_course?: string;
  student_count?: number;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  price: string;
  duration?: string;
  mentor_name?: string;
  mentor_id?: number;
}

// Stores start empty — data is fetched from the backend API
export const studentsStore = writable<Student[]>([]);
export const mentorsStore = writable<Mentor[]>([]);
export const coursesStore = writable<Course[]>([]);
