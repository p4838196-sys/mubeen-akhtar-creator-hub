import { z } from 'zod';

// Shared, deliberately simple spam guard: reject messages containing raw
// URLs beyond a small threshold, and cap length. This is basic bot/spam
// friction, not a full anti-spam system — combined with Postgres-side
// constraints (status forced to 'pending', RLS insert-only for anon) it
// covers the "basic spam protection" requirement for Phase 1.
const urlPattern = /https?:\/\/|www\./gi;

function tooManyLinks(value: string, max = 2) {
  const matches = value.match(urlPattern);
  return (matches?.length ?? 0) > max;
}

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Please enter a valid email').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(3000, 'Message is too long')
    .refine((v) => !tooManyLinks(v), 'Please remove extra links from your message'),
  honeypot: z.string().max(0).optional(), // bots fill hidden fields; humans leave it empty
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const reviewFormSchema = z.object({
  display_name: z.string().trim().min(2, 'Please enter your name').max(80),
  message: z
    .string()
    .trim()
    .min(5, 'Review must be at least 5 characters')
    .max(1000, 'Review is too long')
    .refine((v) => !tooManyLinks(v, 0), 'Links are not allowed in reviews'),
  stars: z.number().int().min(1).max(5),
  session_id: z.string().uuid(),
  honeypot: z.string().max(0).optional(),
});
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const ratingSubmitSchema = z.object({
  target_type: z.enum(['photo', 'video']),
  target_id: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  session_id: z.string().uuid(),
});
export type RatingSubmitValues = z.infer<typeof ratingSubmitSchema>;

export const likeSubmitSchema = z.object({
  target_type: z.enum(['photo', 'video']),
  target_id: z.string().uuid(),
  session_id: z.string().uuid(),
});
export type LikeSubmitValues = z.infer<typeof likeSubmitSchema>;

export const socialAccountSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'facebook', 'snapchat', 'x', 'linkedin', 'other']),
  username: z.string().trim().min(1).max(100),
  profile_url: z.string().trim().url('Must be a valid URL'),
  follower_count: z.coerce.number().int().min(0).nullable().optional(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const albumSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  description: z.string().trim().max(500).optional().nullable(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const photoMetaSchema = z.object({
  album_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
});

export const videoMetaSchema = z
  .object({
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().max(1000).optional().nullable(),
    category: z.string().trim().max(60).optional().nullable(),
    source_type: z.enum(['storage', 'external']),
    external_url: z.string().trim().url().optional().nullable(),
    thumbnail_url: z.string().trim().url().optional().nullable(),
    is_featured: z.boolean().default(false),
    is_published: z.boolean().default(true),
    display_order: z.coerce.number().int().default(0),
  })
  .refine((v) => v.source_type !== 'external' || !!v.external_url, {
    message: 'External URL is required when source is External',
    path: ['external_url'],
  });

export const siteProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).optional().default(''),
  short_intro: z.string().trim().max(400).optional().default(''),
  bio: z.string().trim().max(4000).optional().default(''),
  journey: z.string().trim().max(4000).optional().default(''),
  interests: z.array(z.string().trim().min(1)).default([]),
  skills: z.array(z.string().trim().min(1)).default([]),
  future_vision: z.string().trim().max(4000).optional().default(''),
});

export const siteSettingsSchema = z.object({
  site_title: z.string().trim().min(1).max(160),
  site_description: z.string().trim().max(300),
  contact_email: z.string().trim().email().optional().nullable(),
  reviews_require_review: z.boolean(),
  ai_zone_enabled: z.boolean(),
  maintenance_mode: z.boolean(),
});
