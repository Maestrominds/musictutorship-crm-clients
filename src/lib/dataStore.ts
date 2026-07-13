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

// Share exact same student list for Students View & Payments View
const initialStudents: Student[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john.doe@example.com', 
    course: 'Piano Advanced', 
    mentor: 'Prof. Marcus Smith', 
    enrollmentDate: 'Oct 15, 2023', 
    paymentStatus: 'Paid',
    amount: '$250.00',
    paymentMethod: 'Credit Card (**** 4242)',
    paymentDate: 'Oct 15, 2023'
  },
  { 
    id: 2, 
    name: 'Sarah Jenkins', 
    email: 'sarah.j@outlook.com', 
    course: 'Vocal Basics', 
    mentor: 'Dr. Elena Rossi', 
    enrollmentDate: 'Nov 02, 2023', 
    paymentStatus: 'Pending',
    amount: '$149.00',
    paymentMethod: 'Credit Card (**** 4242)',
    paymentDate: 'Oct 24, 2023'
  },
  { 
    id: 3, 
    name: 'Michael Chen', 
    email: 'm.chen.music@gmail.com', 
    course: 'Guitar Intermediate', 
    mentor: 'Prof. Marcus Smith', 
    enrollmentDate: 'Sep 28, 2023', 
    paymentStatus: 'Overdue',
    amount: '$85.00',
    paymentMethod: 'Bank Transfer',
    paymentDate: 'Oct 23, 2023'
  },
  { 
    id: 4, 
    name: 'Emily White', 
    email: 'emily.w@studio.com', 
    course: 'Violin Beginner', 
    mentor: 'Sarah Thompson', 
    enrollmentDate: 'Oct 20, 2023', 
    paymentStatus: 'Paid',
    amount: '$210.00',
    paymentMethod: 'Credit Card (**** 9012)',
    paymentDate: 'Oct 22, 2023'
  },
  { 
    id: 5, 
    name: 'Daniel Lee', 
    email: 'dlee.drums@example.com', 
    course: 'Percussion 101', 
    mentor: 'David Miller', 
    enrollmentDate: 'Oct 21, 2023', 
    paymentStatus: 'Paid',
    amount: '$120.00',
    paymentMethod: 'PayPal',
    paymentDate: 'Oct 21, 2023'
  },
  { 
    id: 6, 
    name: 'Sophia Garcia', 
    email: 'soph.garcia@example.com', 
    course: 'Piano Level 2', 
    mentor: 'Jonathan Doe', 
    enrollmentDate: 'Oct 20, 2023', 
    paymentStatus: 'Paid',
    amount: '$149.00',
    paymentMethod: 'Credit Card (**** 1122)',
    paymentDate: 'Oct 20, 2023'
  }
];

const initialMentors: Mentor[] = [
  { id: 1, name: 'Jonathan Doe', role: 'Senior Instructor', specialty: 'Piano / Classical', specialtyTag: 'Piano / Classical', email: 'j.doe@academy.com', phone: '+1 (555) 012-3456', studentCount: 24, status: 'Active' },
  { id: 2, name: 'Sarah Jenkins', role: 'Guest Teacher', specialty: 'Vocal / Jazz', specialtyTag: 'Vocal / Jazz', email: 'sarah.j@musicpro.com', phone: '+1 (555) 098-7654', studentCount: 12, status: 'Active' },
  { id: 3, name: 'Michael Chen', role: 'Lead Instructor', specialty: 'Electric Guitar', specialtyTag: 'Electric Guitar', email: 'm.chen@academy.com', phone: '+1 (555) 234-5678', studentCount: 31, status: 'Inactive' },
  { id: 4, name: 'Emily Watson', role: 'Instructor', specialty: 'Violin / Theory', specialtyTag: 'Violin / Theory', email: 'emily.w@music.edu', phone: '+1 (555) 456-7890', studentCount: 18, status: 'Active' },
  { id: 5, name: 'David Miller', role: 'Drums Specialist', specialty: 'Drums / Percussion', specialtyTag: 'Drums / Percussion', email: 'd.miller@percussion.com', phone: '+1 (555) 888-9999', studentCount: 15, status: 'Active' }
];

const initialCourses: Course[] = [
  { id: 1, name: 'Piano Advanced', description: 'Master classical techniques, complex rhythms, and recital performance.', price: '$250/mo', duration: '6 Months', mentorName: 'Alex Rivers', isPremium: true },
  { id: 2, name: 'Vocal Basics', description: 'Develop healthy vocal production, pitch accuracy, and basic breath control.', price: '$149/mo', duration: '3 Months', mentorName: 'Sarah Jenkins', isPremium: true },
  { id: 3, name: 'Guitar Intermediate', description: 'Explore scales, dynamic chord voicings, and solo improvisation techniques.', price: '$180/mo', duration: '4 Months', mentorName: 'Michael Chen', isPremium: true },
  { id: 4, name: 'Violin Beginner', description: 'Introduction to bow control, finger positions, and simple melodies.', price: '$210/mo', duration: '6 Months', mentorName: 'Emily Watson', isPremium: true }
];

export const studentsStore = writable<Student[]>(initialStudents);
export const mentorsStore = writable<Mentor[]>(initialMentors);
export const coursesStore = writable<Course[]>(initialCourses);
