import { z } from "zod";
import { DISTRICT_VALUES } from "./constants";

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

const optionalUploadUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    try {
      const host = new URL(value).hostname.toLowerCase();
      return host.includes("drive.google.com") || host.includes("dropbox.com");
    } catch {
      return false;
    }
  }, "upload_links must be a Google Drive or Dropbox URL");

const whatsappSchema = z
  .string()
  .trim()
  .min(8, "WhatsApp contact is required")
  .max(30, "WhatsApp contact is too long")
  .regex(/^[+0-9\s-]+$/, "WhatsApp format is invalid");

const listingTypeSchema = z.enum(["normal_listing", "launch_support"]);
const hasSongReleasedSchema = z.enum(["yes", "no"]);

export const submissionSchema = z.object({
  type: listingTypeSchema,
  has_song_released: hasSongReleasedSchema,
  upload_links: optionalUploadUrl,
  contact_whatsapp: whatsappSchema,
  name: z.string().trim().min(2).max(100),
  district: z.enum(DISTRICT_VALUES),
  genres: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(20).max(1200),
  aiSummary: z.string().trim().max(220).optional().or(z.literal("")),
  topTrackUrl: optionalUrl,
  spotifyUrl: optionalUrl,
  appleMusicUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  coverImageUrl: optionalUrl
});

export const artistUpdateSchema = z.object({
  type: z.enum(["NORMAL_LISTING", "LAUNCH_SUPPORT"]),
  hasSongReleased: z.boolean(),
  uploadLinks: optionalUploadUrl,
  contactWhatsapp: whatsappSchema,
  name: z.string().trim().min(2).max(100),
  district: z.enum(DISTRICT_VALUES),
  genres: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(20).max(1200),
  aiSummary: z.string().trim().max(220).optional().or(z.literal("")),
  topTrackUrl: optionalUrl,
  spotifyUrl: optionalUrl,
  appleMusicUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  featured: z.boolean().optional()
});

export function cleanOptional(value?: string) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export function toListingType(value: "normal_listing" | "launch_support") {
  return value === "launch_support" ? "LAUNCH_SUPPORT" : "NORMAL_LISTING";
}
