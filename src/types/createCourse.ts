// ─── Content type for a lesson ───────────────────────────────────────────────
export type ContentType = 'text' | 'file' | 'video';

// ─── A single quiz question ───────────────────────────────────────────────────
export interface QuizQuestion {
  text: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

// ─── A lesson with its embedded quiz ─────────────────────────────────────────
export interface LessonDraft {
  id: number;                  // local-only, not sent to API
  title: string;
  description: string;
  duration: string;            // kept as string for input binding
  orderIndex: number;
  contentType: ContentType;
  text: string;                // lecture text OR extra notes
  videoUrl: string;
  videoFile: File | null;
  videoFileName: string;       // display name after pick
  pdfFile: File | null;
  pdfFileName: string;         // display name after pick
  quiz: QuizQuestion[];
  quizOpen: boolean;           // UI-only collapse state
}

// ─── Top-level course draft ───────────────────────────────────────────────────
export interface CourseDraft {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  thumbnail: string;           // emoji or data-URL
  tags: string[];
  lessons: LessonDraft[];
  visibility: 'draft' | 'published';
}

// ─── What gets sent to POST /courses ─────────────────────────────────────────
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
