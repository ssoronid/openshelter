CREATE TABLE IF NOT EXISTS "shelter_pagopar_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"shelter_id" text NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"commerce_name" text,
	"webhook_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shelter_pagopar_credentials_shelter_id_unique" UNIQUE("shelter_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shelter_pagopar_credentials" ADD CONSTRAINT "shelter_pagopar_credentials_shelter_id_shelters_id_fk" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
