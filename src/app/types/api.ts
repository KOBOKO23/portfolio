/**
 * API Response Types
 * TypeScript interfaces for all API endpoints
 */

// Common response wrapper
export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}

export interface APIError {
  message: string;
  status?: number;
  details?: Record<string, string[]>;
}

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Blog types
export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  article_count: number;
}

export interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  thumbnail_alt: string;
  category: BlogCategory | null;
  tags: string[];
  author: string;
  language: string;
  read_time: number;
  views: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  published_date: string;
}

export interface BlogArticleDetail extends BlogArticle {
  content: string;
  content_html: string;
  author_bio: string;
  allow_comments: boolean;
  reaction_summary: Record<string, number>;
  share_counts: Record<string, number>;
  user_liked: boolean;
  user_reaction: string | null;
  updated_at: string;
  gallery: { id: number; image: string; alt_text: string; caption: string; order: number }[];
}

// Project types
export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  project_count: number;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  detailed_description?: string;
  category_name: string;
  category_slug: string;
  image: string | null;
  technologies: string;
  technologies_list: string[];
  github_url: string;
  live_url: string;
  year: number;
  is_featured: boolean;
  created_at: string;
}

// Fashion types
export interface FashionCategory {
  id: number;
  name: string;
  slug: string;
  image_count: number;
}

export interface FashionImage {
  id: number;
  title: string;
  image: string;
  category_name: string;
  category_slug: string;
  description: string;
  location: string;
  photographer: string;
  date_taken: string | null;
}

// Music types
export interface MusicTrack {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  youtube_url: string;
  spotify_url: string;
  apple_music_url: string;
  soundcloud_url: string;
  release_date: string;
  duration: string;
  is_featured: boolean;
}

// Book types
export interface BookTestimonial {
  id: number;
  quote: string;
  author_name: string;
  author_title: string;
  author_photo: string | null;
  rating: number;
}

export interface Book {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  cover_image: string;
  author: string;
  isbn: string;
  page_count: number;
  release_date: string;
  publisher: string;
  amazon_url: string;
  preview_pdf: string | null;
  testimonials: BookTestimonial[];
}

// Great Men Moves types
export interface GreatMenProgram {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  spots: string;
  image: string | null;
}

export interface ImpactGoal {
  id: number;
  number: string;
  label: string;
  progress: number;
  icon: string;
}

export interface VolunteerApplication {
  id?: number;
  full_name: string;
  email: string;
  phone: string;
  profession?: string;
  motivation: string;
  created_at?: string;
}

// Newsletter types
export interface NewsletterSubscriber {
  id?: number;
  name: string;
  email: string;
  subscribed_at?: string;
}

export interface NewsletterIssue {
  id: number;
  number: string;
  title: string;
  excerpt: string;
  content: string;
  published_date: string;
  topics: string;
  topics_list: string[];
}

// Feedback types
export interface Feedback {
  id?: number;
  rating: number;
  message: string;
  email?: string;
  page_url?: string;
  created_at?: string;
}

// Contact types
export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: string;
}

// Profile types
export interface Skill {
  id: number;
  name: string;
  category: 'technical' | 'creative' | 'leadership' | 'other';
  proficiency: number;
  icon: string;
}

export interface Profile {
  id: number;
  full_name: string;
  tagline: string;
  bio: string;
  profile_image: string;
  resume_pdf: string | null;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  instagram_url: string;
  years_experience: number;
  projects_completed: number;
  skills: Skill[];
}

// Weather types (for weather forecast feature)
export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  timestamp: string;
  humidity?: number;
  wind_speed?: number;
  precipitation?: number;
}

export interface WeatherForecast {
  location: string;
  timezone: string;
  current: WeatherData;
  hourly: WeatherData[];
  daily: WeatherData[];
}
