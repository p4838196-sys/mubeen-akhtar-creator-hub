// Hand-written types mirroring supabase/schema.sql.
// If you change the schema, update this file to match (or generate it with
// `npx supabase gen types typescript` once the Supabase CLI is linked).

export type Platform =
  | 'tiktok' | 'instagram' | 'youtube' | 'facebook'
  | 'snapchat' | 'x' | 'linkedin' | 'other';

export type ReviewStatus = 'pending' | 'approved' | 'hidden';
export type ContactStatus = 'new' | 'read' | 'archived';
export type RatingTargetType = 'photo' | 'video';
export type VideoSourceType = 'storage' | 'external';
export type UserRole = 'admin' | 'creator' | 'student';

export interface SiteProfile {
  id: string;
  display_name: string;
  tagline: string;
  short_intro: string;
  bio: string;
  journey: string;
  interests: string[];
  skills: string[];
  future_vision: string;
  avatar_url: string | null;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  og_image_url: string | null;
  contact_email: string | null;
  reviews_require_review: boolean;
  ai_zone_enabled: boolean;
  maintenance_mode: boolean;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  profile_url: string;
  icon: string | null;
  follower_count: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_photo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  album_id: string | null;
  title: string;
  description: string | null;
  storage_path: string;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  source_type: VideoSourceType;
  storage_path: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  target_type: RatingTargetType;
  target_id: string;
  stars: number;
  session_id: string;
  user_id: string | null;
  created_at: string;
}

export interface ContentLike {
  id: string;
  target_type: RatingTargetType;
  target_id: string;
  session_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  display_name: string;
  message: string;
  stars: number;
  status: ReviewStatus;
  is_featured: boolean;
  session_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}

export interface UserRoleRow {
  user_id: string;
  role: UserRole;
  created_at: string;
}

// Aggregate shape used across the app instead of storing denormalized counts
// on photos/videos — always computed live from `ratings` / `content_likes`.
export interface RatingSummary {
  average: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface Database {
  public: {
    Tables: {
      site_profile: { Row: SiteProfile; Insert: Partial<SiteProfile>; Update: Partial<SiteProfile> };
      site_settings: { Row: SiteSettings; Insert: Partial<SiteSettings>; Update: Partial<SiteSettings> };
      social_accounts: { Row: SocialAccount; Insert: Partial<SocialAccount>; Update: Partial<SocialAccount> };
      albums: { Row: Album; Insert: Partial<Album>; Update: Partial<Album> };
      photos: { Row: Photo; Insert: Partial<Photo>; Update: Partial<Photo> };
      videos: { Row: Video; Insert: Partial<Video>; Update: Partial<Video> };
      ratings: { Row: Rating; Insert: Partial<Rating>; Update: Partial<Rating> };
      content_likes: { Row: ContentLike; Insert: Partial<ContentLike>; Update: Partial<ContentLike> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      contact_messages: { Row: ContactMessage; Insert: Partial<ContactMessage>; Update: Partial<ContactMessage> };
      user_roles: { Row: UserRoleRow; Insert: Partial<UserRoleRow>; Update: Partial<UserRoleRow> };
    };
  };
}
