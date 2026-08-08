CREATE TABLE "email_send_limits" (
	"ip_hash" text PRIMARY KEY NOT NULL,
	"last_request_at" timestamp with time zone NOT NULL
);
