export type ContentType = 'text' | 'file' | 'video';

export interface QuizQuestion {
  text: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export interface LessonDraft {
  id: number;
  title: string;
  description: string;
  duration: string;
  orderIndex: number;
  contentType: ContentType;
  text: string;
  videoUrl: string;
  videoFile: File | null;
  videoFileName: string;
  pdfFile: File | null;
  pdfFileName: string;
  quiz: QuizQuestion[];
  quizOpen: boolean;
}

export interface CourseDraft {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  thumbnail: string;
  tags: string[];
  lessons: LessonDraft[];
  visibility: 'draft' | 'published';
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  level: string;
  published: boolean;
  thumbnail: string;
  estimatedHours: number | null;
  tags: string[];
  lessons: CreateLessonPayload[];
}

export interface CreateLessonPayload {
  title: string;
  description: string;
  orderIndex: number;
  duration: number | null;
  contentType: ContentType;
  lectureText: string | null;
  videoUrl: string | null;
  videoFileName: string | null;
  lecturePdfFileName: string | null;
  quiz: CreateQuizPayload[];
}

export interface CreateQuizPayload {
  question: string;
  answers: string[];
  correctIndex: number;
}
