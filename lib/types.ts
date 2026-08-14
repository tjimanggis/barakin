export type UserRole = 'user' | 'author' | 'admin';

export type LessonLevel = 'pemula' | 'menengah' | 'mahir';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'other';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content_plain: string | null;
  content_voweled: string | null;
  level: LessonLevel;
  category_id: string | null;
  author_id: string;
  published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_id: string | null;
  author_id: string;
  tags: string[];
  read_time_minutes: number;
  published: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  passing_score: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string | null;
  quiz_id: string | null;
  status: ProgressStatus;
  score: number | null;
  bookmarked: boolean;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Tashrif {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  author_id: string;
  level: LessonLevel;
  base_verb: string;
  conjugations: Record<string, unknown>;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kosakata {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  author_id: string;
  level: LessonLevel;
  arabic_text: string;
  arabic_harakat: string | null;
  indonesia_meaning: string;
  example_sentence_ar: string | null;
  example_sentence_id: string | null;
  word_type: WordType | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: {
          name: string;
          slug: string;
          description?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
      };
      lessons: {
        Row: Lesson;
        Insert: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>> & {
          title: string;
          slug: string;
        };
        Update: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'author_id'>>;
      };
      articles: {
        Row: Article;
        Insert: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>> & {
          title: string;
          slug: string;
        };
        Update: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'author_id'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Partial<Omit<Quiz, 'id' | 'created_at' | 'updated_at'>> & {
          lesson_id: string;
          title: string;
        };
        Update: Partial<Omit<Quiz, 'id' | 'created_at' | 'updated_at' | 'lesson_id'>>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: Partial<Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<UserProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
    Functions: {
      set_user_role: {
        Args: { p_target_user: string; p_role: string };
        Returns: void;
      };
      admin_create_author: {
        Args: { p_user_id: string; p_display_name?: string };
        Returns: void;
      };
      admin_reset_display_name: {
        Args: { p_user_id: string; p_name: string };
        Returns: void;
      };
    };
  };
}
