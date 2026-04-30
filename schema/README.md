# Kreavia.ai — Production Database Schema

## Overview
18-table PostgreSQL schema hosted on Supabase.
Run `schema.sql` in your Supabase SQL Editor to create all tables, indexes, triggers, and RLS policies.

## Tables

| Table | Description |
|---|---|
| `users` | Creator accounts, plan, credits |
| `projects` | One creator → many brand projects |
| `brand_kits` | AI-generated brand identity per project |
| `logos` | Multiple logo variations per brand kit |
| `color_palettes` | Named palette groups per brand kit |
| `colors` | Individual color swatches per palette |
| `templates` | Social media canvas templates |
| `template_elements` | Layers/objects inside each template canvas |
| `ai_generations` | Full history of AI outputs |
| `ai_usage` | Credit deduction tracking (abuse prevention) |
| `content_ideas` | AI-generated post ideas |
| `captions` | AI-generated captions with tone |
| `hashtags` | AI-generated hashtag sets with reach estimates |
| `analytics` | Creator performance metrics |
| `exports` | Download tracking (file URL → R2/S3) |
| `subscriptions` | Stripe/Razorpay billing records |
| `notifications` | In-app notification feed |

## Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project

### 2. Run the schema
Open **SQL Editor** in your Supabase dashboard and paste the entire contents of `schema.sql`, then run it.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.

### 4. Install the Supabase client
```bash
npm install @supabase/supabase-js
```

## Architecture

```
users
 ├── projects
 │     ├── brand_kits
 │     │     ├── logos
 │     │     └── color_palettes → colors
 │     ├── templates → template_elements
 │     ├── content_ideas
 │     ├── captions
 │     ├── hashtags
 │     └── analytics
 ├── ai_generations
 ├── ai_usage
 ├── exports
 ├── subscriptions
 └── notifications
```

## Scaling Notes
- **File storage**: Images/exports stored in Cloudflare R2 or S3. Only URLs are in DB.
- **AI caching**: Use Redis for repeated prompts to avoid double charging users.
- **Indexes**: All FK columns indexed. Metric names + creation dates indexed for fast analytics queries.
- **RLS**: All tables protected with Row Level Security. Each user can only access their own data.

## Credit System
- Free: 3 credits/month
- Creator: 50 credits/month
- Pro: Unlimited
- Each AI generation deducts from `users.credits` and logs to `ai_usage`
