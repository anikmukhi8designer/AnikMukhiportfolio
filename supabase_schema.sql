-- 1. CLEANUP (Be careful, this deletes existing data!)
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "experience" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "skills" CASCADE;
DROP TABLE IF EXISTS "socials" CASCADE;
DROP TABLE IF EXISTS "config" CASCADE;

-- 2. CREATE TABLES (With camelCase columns to match TS interfaces)

-- Projects Table
CREATE TABLE "public"."projects" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "client" text,
    "roles" text[] DEFAULT '{}',
    "description" text,
    "year" integer,
    "heroImage" text,
    "thumb" text,
    "tags" text[] DEFAULT '{}',
    "link" text,
    "githubRepoUrl" text,
    "published" boolean DEFAULT true,
    "images" text[] DEFAULT '{}',
    "content" jsonb DEFAULT '[]',
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Experience Table
CREATE TABLE "public"."experience" (
    "id" text PRIMARY KEY,
    "role" text NOT NULL,
    "company" text NOT NULL,
    "period" text,
    "description" text,
    "published" boolean DEFAULT true,
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clients Table
CREATE TABLE "public"."clients" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "logo" text,
    "url" text,
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Skills Table
CREATE TABLE "public"."skills" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "items" jsonb DEFAULT '[]',
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Socials Table
CREATE TABLE "public"."socials" (
    "id" text PRIMARY KEY,
    "platform" text NOT NULL,
    "url" text NOT NULL,
    "label" text,
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Config Table
CREATE TABLE "public"."config" (
    "id" integer PRIMARY KEY,
    "resumeUrl" text,
    "email" text,
    "heroHeadline" text,
    "heroSubheadline" text,
    "heroDescription" text,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experience" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "socials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "config" ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES (Public Read, Admin Write)

-- Read Policies (Open to everyone)
CREATE POLICY "Public Read Projects" ON "projects" FOR SELECT USING (true);
CREATE POLICY "Public Read Experience" ON "experience" FOR SELECT USING (true);
CREATE POLICY "Public Read Clients" ON "clients" FOR SELECT USING (true);
CREATE POLICY "Public Read Skills" ON "skills" FOR SELECT USING (true);
CREATE POLICY "Public Read Socials" ON "socials" FOR SELECT USING (true);
CREATE POLICY "Public Read Config" ON "config" FOR SELECT USING (true);

-- Write Policies (Authenticated users only)
CREATE POLICY "Admin Write Projects" ON "projects" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Experience" ON "experience" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Clients" ON "clients" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Skills" ON "skills" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Socials" ON "socials" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Config" ON "config" FOR ALL USING (auth.role() = 'authenticated');

-- 5. ENABLE REALTIME
-- This ensures the dashboard updates instantly when you edit content.
ALTER PUBLICATION supabase_realtime ADD TABLE "projects";
ALTER PUBLICATION supabase_realtime ADD TABLE "experience";
ALTER PUBLICATION supabase_realtime ADD TABLE "clients";
ALTER PUBLICATION supabase_realtime ADD TABLE "skills";
ALTER PUBLICATION supabase_realtime ADD TABLE "socials";
ALTER PUBLICATION supabase_realtime ADD TABLE "config";

-- 6. SETUP STORAGE (Optional, creates a bucket for uploads)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads'); 
CREATE POLICY "Admin Insert Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
