CREATE TABLE "item_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"expiry_date" date,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_batches_quantity_check" CHECK ("item_batches"."quantity" >= 0 AND "item_batches"."quantity" <= 999999)
);
--> statement-breakpoint
ALTER TABLE "item_batches" ADD CONSTRAINT "item_batches_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_batches_item_idx" ON "item_batches" USING btree ("item_id");
--> statement-breakpoint
INSERT INTO "item_batches" ("item_id", "quantity", "expiry_date", "received_at")
SELECT "id", "quantity", "expiry_date", "created_at" FROM "items" WHERE "quantity" > 0;
--> statement-breakpoint
UPDATE "items" SET "expiry_date" = NULL WHERE "quantity" = 0;
