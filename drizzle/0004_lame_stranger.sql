CREATE TABLE "shopping_entries" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"house_id" uuid NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"quantity" integer NOT NULL,
	"expiry_date" date,
	CONSTRAINT "shopping_quantity_check" CHECK ("shopping_entries"."quantity" > 0 AND "shopping_entries"."quantity" <= 999999)
);
--> statement-breakpoint
CREATE TABLE "shopping_receipts" (
	"house_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_receipts_house_id_request_id_pk" PRIMARY KEY("house_id","request_id")
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "shopping_entries" ADD CONSTRAINT "shopping_entries_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_entries" ADD CONSTRAINT "shopping_entries_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_receipts" ADD CONSTRAINT "shopping_receipts_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shopping_house_idx" ON "shopping_entries" USING btree ("house_id");