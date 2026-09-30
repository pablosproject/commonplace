CREATE TABLE "video_recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"schema_version" text NOT NULL,
	"recap_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_video_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"channel" text,
	"duration_seconds" integer,
	"duration_formatted" text,
	"abstract" text NOT NULL,
	"main_takeaway" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_youtube_video_id_unique" UNIQUE("youtube_video_id")
);
--> statement-breakpoint
ALTER TABLE "video_recaps" ADD CONSTRAINT "video_recaps_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "videos_title_idx" ON "videos" USING btree ("title");--> statement-breakpoint
CREATE INDEX "videos_channel_idx" ON "videos" USING btree ("channel");