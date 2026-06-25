export interface Author {
  name: string;
  role: string;
  avatar: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  content: string;
  snippet: string;
  imageUrl: string;
  imageAlt: string;
  readTime: string;
  date: string;
  author: Author;
  featured?: boolean;
}

export interface Summary {
  bulletPoints: string[];
  keyTakeaway: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface LibraryStats {
  minutesRead: number;
  articlesCompleted: number;
  streakDays: number;
}

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  authorRole?: string;
  authorDept?: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  likes?: number;
}

export interface BookmarkRecord {
  id: string;
  articleId: string;
  bookmarkedAt: string;
  completed: boolean;
  progressPercent: number;
  lastReadAt: string;
}