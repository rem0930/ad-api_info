import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  googleAdsReleaseNotes: defineTable({
    title: v.string(),
    link: v.string(),
    pubDate: v.string(),
    lastSeen: v.string(), // ISO日付文字列
  }),
});
