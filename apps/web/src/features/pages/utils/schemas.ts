import { z } from "zod";

// Helper for array of strings (mapped to objects for useFieldArray)
export const stringArraySchema = z.array(z.object({ value: z.string() }));

export const heroSchema = z.object({
  badge: z.string(),
  title: z.string(),
  highlight: z.string(),
  description: z.string(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  flavor: z.string(),
  tone: z.string(),
  emoji: z.string(),
});

export const oemMediaSchema = z.object({
  type: z.string(), // "video" | "image"
  title: z.string(),
  source: z.string(),
});

export const oemSchema = z.object({
  title: z.string(),
  description: z.string(),
  features: stringArraySchema,
  media: z.array(oemMediaSchema),
});

export const aboutStatsSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const aboutSchema = z.object({
  title: z.string(),
  content: stringArraySchema,
  stats: z.array(aboutStatsSchema),
});

export const consultSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  channels: stringArraySchema,
});

export const siteJsonFormSchema = z.object({
  brand: z.string(),
  tagline: z.string(),
  hero: heroSchema,
  products: z.array(productSchema),
  oem: oemSchema,
  about: aboutSchema,
  consult: consultSchema,
});

// Main Page Form Schema
export const pageFormSchema = z.object({
  slug: z.string().trim().min(1, "请输入 Slug"),
  title: z.string().trim().min(1, "请输入标题"),
  siteJson: siteJsonFormSchema,
  metaTitle: z.string().trim(),
  metaDescription: z.string().trim(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;

// Backend Schemas (for Action)
export const pageActionSchema = z.object({
  slug: z.string().trim().min(1, "请输入 Slug"),
  title: z.string().trim().min(1, "请输入标题"),
  content: z.string().trim(),
  metaTitle: z.string().trim(),
  metaDescription: z.string().trim(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const pageCreateSchema = pageActionSchema.extend({
  intent: z.literal("create"),
});

export const pageUpdateSchema = pageActionSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

export const pageDeleteSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});
