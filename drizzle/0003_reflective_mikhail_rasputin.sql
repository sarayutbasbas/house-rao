CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "categories_house_name_idx";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_house_name_idx" ON "rooms" USING btree ("house_id","name");--> statement-breakpoint
CREATE INDEX "rooms_house_idx" ON "rooms" USING btree ("house_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_room_name_idx" ON "categories" USING btree ("house_id","room_id","name");--> statement-breakpoint
CREATE INDEX "items_room_idx" ON "items" USING btree ("house_id","room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_house_name_idx" ON "categories" USING btree ("house_id","name") WHERE "categories"."room_id" IS NULL;