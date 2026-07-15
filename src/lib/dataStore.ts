import { writable } from 'svelte/store';

export interface Student {
  id: number;
  name: string;
  email: string;
  course: string;
  mentor: string;
  enrollmentDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Failed';
  amount: string;
  paymentMethod: string;
  paymentDate: string;
}

export interface Mentor {
  id: number;
  name: string;
  role: string;
  specialty: string;
  specialtyTag: string;
  email: string;
  phone: string;
  studentCount: number;
  status: 'Active' | 'Inactive';
}

export interface Course {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: string;
  mentorName: string;
  isPremium: boolean;
}

// Stores start empty — data is fetched from the backend API
export const studentsStore = writable<Student[]>([]);
export const mentorsStore = writable<Mentor[]>([]);
export const coursesStore = writable<Course[]>([]);
