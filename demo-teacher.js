#!/usr/bin/env bun
// Demo script to populate teacher dashboard with test students

const API_URL = 'http://localhost:3000/api';

const demoStudents = [
  {
    studentId: 'student-1',
    studentName: 'Alice Johnson',
    studentEmail: 'alice@example.com',
  },
  {
    studentId: 'student-2',
    studentName: 'Bob Smith',
    studentEmail: 'bob@example.com',
  },
  {
    studentId: 'student-3',
    studentName: 'Carol Williams',
    studentEmail: 'carol@example.com',
  },
  {
    studentId: 'student-4',
    studentName: 'David Brown',
    studentEmail: 'david@example.com',
  },
  {
    studentId: 'student-5',
    studentName: 'Emma Davis',
    studentEmail: 'emma@example.com',
  },
];

const demoProgress = [
  {
    studentId: 'student-1',
    updates: [
      {
        type: 'subject',
        data: {
          subjectId: 'math',
          name: 'Mathematics',
          topicsCompleted: 8,
          totalTopics: 12,
        },
      },
      {
        type: 'quiz',
        data: { topic: 'Calculus', score: 85 },
      },
      {
        type: 'quiz',
        data: { topic: 'Algebra', score: 92 },
      },
      {
        type: 'quiz',
        data: { topic: 'Geometry', score: 78 },
      },
      {
        type: 'study-time',
        data: { minutes: 180 },
      },
    ],
  },
  {
    studentId: 'student-2',
    updates: [
      {
        type: 'subject',
        data: {
          subjectId: 'physics',
          name: 'Physics',
          topicsCompleted: 5,
          totalTopics: 10,
        },
      },
      {
        type: 'quiz',
        data: { topic: 'Mechanics', score: 65 },
      },
      {
        type: 'quiz',
        data: { topic: 'Thermodynamics', score: 55 },
      },
      {
        type: 'quiz',
        data: { topic: 'Optics', score: 88 },
      },
      {
        type: 'study-time',
        data: { minutes: 120 },
      },
    ],
  },
  {
    studentId: 'student-3',
    updates: [
      {
        type: 'subject',
        data: {
          subjectId: 'chemistry',
          name: 'Chemistry',
          topicsCompleted: 10,
          totalTopics: 10,
        },
      },
      {
        type: 'quiz',
        data: { topic: 'Organic Chemistry', score: 95 },
      },
      {
        type: 'quiz',
        data: { topic: 'Inorganic Chemistry', score: 91 },
      },
      {
        type: 'quiz',
        data: { topic: 'Physical Chemistry', score: 88 },
      },
      {
        type: 'study-time',
        data: { minutes: 240 },
      },
    ],
  },
  {
    studentId: 'student-4',
    updates: [
      {
        type: 'subject',
        data: {
          subjectId: 'biology',
          name: 'Biology',
          topicsCompleted: 6,
          totalTopics: 15,
        },
      },
      {
        type: 'quiz',
        data: { topic: 'Cell Biology', score: 72 },
      },
      {
        type: 'quiz',
        data: { topic: 'Genetics', score: 68 },
      },
      {
        type: 'quiz',
        data: { topic: 'Evolution', score: 45 },
      },
      {
        type: 'study-time',
        data: { minutes: 90 },
      },
    ],
  },
  {
    studentId: 'student-5',
    updates: [
      {
        type: 'subject',
        data: {
          subjectId: 'history',
          name: 'History',
          topicsCompleted: 12,
          totalTopics: 16,
        },
      },
      {
        type: 'quiz',
        data: { topic: 'World War II', score: 90 },
      },
      {
        type: 'quiz',
        data: { topic: 'Ancient Rome', score: 85 },
      },
      {
        type: 'quiz',
        data: { topic: 'Renaissance', score: 92 },
      },
      {
        type: 'study-time',
        data: { minutes: 210 },
      },
    ],
  },
];

async function enrollStudent(student) {
  try {
    const response = await fetch(`${API_URL}/teacher/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    const result = await response.json();
    console.log(`✅ Enrolled: ${student.studentName}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to enroll ${student.studentName}:`, error.message);
  }
}

async function updateProgress(studentId, update) {
  try {
    const response = await fetch(`${API_URL}/teacher/update-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, ...update }),
    });
    await response.json();
  } catch (error) {
    console.error(`❌ Failed to update progress for ${studentId}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Setting up demo teacher dashboard...\n');

  // Enroll students
  console.log('📝 Enrolling students...');
  for (const student of demoStudents) {
    await enrollStudent(student);
  }

  console.log('\n📊 Adding progress data...');
  // Add progress for each student
  for (const { studentId, updates } of demoProgress) {
    for (const update of updates) {
      await updateProgress(studentId, update);
    }
    console.log(`✅ Updated progress for ${studentId}`);
  }

  console.log('\n✨ Demo setup complete!');
  console.log('🌐 Visit http://localhost:5173/teacher to see the dashboard');
}

main();
