


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."business_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "driver_id" "uuid",
    "driver_slug" "text",
    "business_slug" "text",
    "category" "text",
    "action_type" "text" NOT NULL,
    "page_path" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_name" "text"
);


ALTER TABLE "public"."business_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_impressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "driver_id" "uuid",
    "driver_slug" "text",
    "business_slug" "text",
    "category" "text",
    "page_path" "text",
    "recommendation_score" numeric(6,4),
    "algorithm_version" "text" DEFAULT 'rider-local-guide-v1'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_impressions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_intake_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_name" "text" NOT NULL,
    "owner_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "category" "text" NOT NULL,
    "business_description" "text",
    "website" "text",
    "address_or_service_area" "text",
    "offer" "text",
    "preferred_cta" "text",
    "logo_or_image_url" "text",
    "notes" "text",
    "consent_to_feature" boolean DEFAULT false NOT NULL,
    "source" "text" DEFAULT 'business_pilot_page'::"text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_intake_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."driver_earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_id" "uuid",
    "business_id" "uuid",
    "driver_slug" "text",
    "business_slug" "text",
    "event_type" "text" NOT NULL,
    "event_id" "uuid",
    "revenue_cents" integer DEFAULT 0 NOT NULL,
    "driver_share_cents" integer DEFAULT 0 NOT NULL,
    "payout_status" "text" DEFAULT 'estimated'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."driver_earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_slug" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "email" "text",
    "city" "text" DEFAULT 'Miami'::"text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_discovery_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "driver_slug" "text",
    "business_slug" "text",
    "business_name" "text",
    "category" "text",
    "page_path" "text",
    "referrer" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "city" "text",
    "neighborhood" "text",
    "click_target_href" "text",
    "click_target_label" "text",
    "click_target_text" "text",
    "click_target_type" "text",
    "click_target_business" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_content" "text",
    "utm_term" "text",
    "visitor_session_id" "text"
);


ALTER TABLE "public"."local_discovery_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "driver_slug" "text",
    "business_slug" "text",
    "category" "text",
    "neighborhood" "text",
    "page_path" "text",
    "referrer" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pilot_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rlg_businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "business_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "address" "text",
    "neighborhood" "text",
    "city" "text" DEFAULT 'Miami'::"text",
    "state" "text" DEFAULT 'FL'::"text",
    "latitude" double precision,
    "longitude" double precision,
    "phone" "text",
    "website" "text",
    "image_url" "text",
    "logo_url" "text",
    "rating" numeric(3,2),
    "price_tier" "text",
    "business_type" "text" DEFAULT 'independent'::"text" NOT NULL,
    "participation_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "localness_score" numeric(4,3) DEFAULT 0.850 NOT NULL,
    "quality_score" numeric(4,3) DEFAULT 0.750 NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "daily_exposure_cap" integer DEFAULT 200,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rlg_businesses" OWNER TO "postgres";


ALTER TABLE ONLY "public"."business_actions"
    ADD CONSTRAINT "business_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_impressions"
    ADD CONSTRAINT "business_impressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_intake_leads"
    ADD CONSTRAINT "business_intake_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_earnings"
    ADD CONSTRAINT "driver_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_driver_slug_key" UNIQUE ("driver_slug");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_discovery_events"
    ADD CONSTRAINT "local_discovery_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_events"
    ADD CONSTRAINT "pilot_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rlg_businesses"
    ADD CONSTRAINT "rlg_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rlg_businesses"
    ADD CONSTRAINT "rlg_businesses_slug_key" UNIQUE ("slug");



CREATE INDEX "business_actions_action_type_idx" ON "public"."business_actions" USING "btree" ("action_type");



CREATE INDEX "business_actions_business_slug_idx" ON "public"."business_actions" USING "btree" ("business_slug");



CREATE INDEX "business_actions_created_at_idx" ON "public"."business_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "business_actions_driver_slug_idx" ON "public"."business_actions" USING "btree" ("driver_slug");



CREATE INDEX "business_impressions_business_slug_idx" ON "public"."business_impressions" USING "btree" ("business_slug");



CREATE INDEX "business_impressions_created_at_idx" ON "public"."business_impressions" USING "btree" ("created_at" DESC);



CREATE INDEX "business_impressions_driver_slug_idx" ON "public"."business_impressions" USING "btree" ("driver_slug");



CREATE INDEX "driver_earnings_created_at_idx" ON "public"."driver_earnings" USING "btree" ("created_at" DESC);



CREATE INDEX "driver_earnings_driver_slug_idx" ON "public"."driver_earnings" USING "btree" ("driver_slug");



CREATE INDEX "drivers_driver_slug_idx" ON "public"."drivers" USING "btree" ("driver_slug");



CREATE INDEX "local_discovery_events_business_slug_idx" ON "public"."local_discovery_events" USING "btree" ("business_slug");



CREATE INDEX "local_discovery_events_city_idx" ON "public"."local_discovery_events" USING "btree" ("city");



CREATE INDEX "local_discovery_events_click_target_href_idx" ON "public"."local_discovery_events" USING "btree" ("click_target_href");



CREATE INDEX "local_discovery_events_created_at_idx" ON "public"."local_discovery_events" USING "btree" ("created_at" DESC);



CREATE INDEX "local_discovery_events_driver_slug_idx" ON "public"."local_discovery_events" USING "btree" ("driver_slug");



CREATE INDEX "local_discovery_events_event_type_idx" ON "public"."local_discovery_events" USING "btree" ("event_type");



CREATE INDEX "local_discovery_events_neighborhood_idx" ON "public"."local_discovery_events" USING "btree" ("neighborhood");



CREATE INDEX "local_discovery_events_utm_campaign_idx" ON "public"."local_discovery_events" USING "btree" ("utm_campaign");



CREATE INDEX "local_discovery_events_utm_source_idx" ON "public"."local_discovery_events" USING "btree" ("utm_source");



CREATE INDEX "local_discovery_events_visitor_session_id_idx" ON "public"."local_discovery_events" USING "btree" ("visitor_session_id");



CREATE INDEX "pilot_events_business_slug_idx" ON "public"."pilot_events" USING "btree" ("business_slug");



CREATE INDEX "pilot_events_created_at_idx" ON "public"."pilot_events" USING "btree" ("created_at" DESC);



CREATE INDEX "pilot_events_driver_slug_idx" ON "public"."pilot_events" USING "btree" ("driver_slug");



CREATE INDEX "pilot_events_event_type_idx" ON "public"."pilot_events" USING "btree" ("event_type");



CREATE INDEX "rlg_businesses_active_idx" ON "public"."rlg_businesses" USING "btree" ("is_active");



CREATE INDEX "rlg_businesses_category_idx" ON "public"."rlg_businesses" USING "btree" ("category");



CREATE INDEX "rlg_businesses_city_idx" ON "public"."rlg_businesses" USING "btree" ("city");



CREATE INDEX "rlg_businesses_slug_idx" ON "public"."rlg_businesses" USING "btree" ("slug");



CREATE INDEX "rlg_businesses_tier_idx" ON "public"."rlg_businesses" USING "btree" ("participation_tier");



ALTER TABLE ONLY "public"."business_actions"
    ADD CONSTRAINT "business_actions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rlg_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_actions"
    ADD CONSTRAINT "business_actions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_impressions"
    ADD CONSTRAINT "business_impressions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rlg_businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_impressions"
    ADD CONSTRAINT "business_impressions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."driver_earnings"
    ADD CONSTRAINT "driver_earnings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."rlg_businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."driver_earnings"
    ADD CONSTRAINT "driver_earnings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE;



ALTER TABLE "public"."business_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_impressions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_intake_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."driver_earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."local_discovery_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilot_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rlg_businesses" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."business_actions" TO "anon";
GRANT ALL ON TABLE "public"."business_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."business_actions" TO "service_role";



GRANT ALL ON TABLE "public"."business_impressions" TO "anon";
GRANT ALL ON TABLE "public"."business_impressions" TO "authenticated";
GRANT ALL ON TABLE "public"."business_impressions" TO "service_role";



GRANT ALL ON TABLE "public"."business_intake_leads" TO "anon";
GRANT ALL ON TABLE "public"."business_intake_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."business_intake_leads" TO "service_role";



GRANT ALL ON TABLE "public"."driver_earnings" TO "anon";
GRANT ALL ON TABLE "public"."driver_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."local_discovery_events" TO "anon";
GRANT ALL ON TABLE "public"."local_discovery_events" TO "authenticated";
GRANT ALL ON TABLE "public"."local_discovery_events" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_events" TO "anon";
GRANT ALL ON TABLE "public"."pilot_events" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_events" TO "service_role";



GRANT ALL ON TABLE "public"."rlg_businesses" TO "anon";
GRANT ALL ON TABLE "public"."rlg_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."rlg_businesses" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
