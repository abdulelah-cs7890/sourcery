import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ──────────────────────────────────────────────────────────────────────────
// Auth.js v5 standard tables (Drizzle adapter expects these names + columns)
// ──────────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // Sourcery-specific
  plan: text("plan").notNull().default("free"), // 'free' | 'pro' | 'pro_plus' | 'early_access'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// ──────────────────────────────────────────────────────────────────────────
// Sourcery domain tables
// ──────────────────────────────────────────────────────────────────────────

export const lookups = pgTable(
  "lookups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tiktokUrl: text("tiktok_url"),
    caption: text("caption"),
    status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    frameUrls: text("frame_urls").array(),
  },
  (table) => [
    index("lookups_user_created_idx").on(table.userId, table.createdAt),
    index("lookups_created_idx").on(table.createdAt),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    lookupId: text("lookup_id")
      .notNull()
      .references(() => lookups.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // 'aliexpress' | 'cj'
    productUrl: text("product_url").notNull(),
    productKey: text("product_key").notNull(), // canonical key for trending aggregation
    title: text("title"),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents"),
    currency: text("currency").default("USD"),
    confidence: integer("confidence").notNull(), // 0–100
    rankedIndex: integer("ranked_index").notNull(), // 0-based rank within lookup
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("matches_lookup_idx").on(table.lookupId),
    index("matches_product_key_idx").on(table.productKey),
  ],
);

export const trendingAgg = pgTable(
  "trending_agg",
  {
    productKey: text("product_key").primaryKey(),
    source: text("source").notNull(),
    productUrl: text("product_url").notNull(),
    title: text("title"),
    imageUrl: text("image_url"),
    lookupCount: integer("lookup_count").notNull().default(0),
    uniqueUserCount: integer("unique_user_count").notNull().default(0),
    firstSeen: timestamp("first_seen").defaultNow().notNull(),
    lastSeen: timestamp("last_seen").defaultNow().notNull(),
  },
  (table) => [
    index("trending_lookup_count_idx").on(table.lookupCount),
    index("trending_last_seen_idx").on(table.lastSeen),
  ],
);
