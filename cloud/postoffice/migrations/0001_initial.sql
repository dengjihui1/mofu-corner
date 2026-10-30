CREATE TABLE `blocks` (
	`owner` text NOT NULL,
	`target` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`owner`, `target`),
	FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`a` text NOT NULL,
	`b` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`a`, `b`),
	FOREIGN KEY (`a`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`b`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`client_id` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`sender`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_client` ON `messages` (`sender`,`client_id`);--> statement-breakpoint
CREATE INDEX `message_pair` ON `messages` (`sender`,`recipient`,`id`);--> statement-breakpoint
CREATE TABLE `reads` (
	`owner` text NOT NULL,
	`peer` text NOT NULL,
	`message_id` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`owner`, `peer`),
	FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peer`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `relationship_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`a` text NOT NULL,
	`b` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`kind` text NOT NULL,
	`a_role` text,
	`created` integer NOT NULL,
	FOREIGN KEY (`a`,`b`) REFERENCES `friendships`(`a`,`b`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `relationship_pending_pair` ON `relationship_requests` (`a`,`b`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text NOT NULL,
	`a` text NOT NULL,
	`b` text NOT NULL,
	`kind` text NOT NULL,
	`a_role` text,
	`created` integer NOT NULL,
	PRIMARY KEY(`a`, `b`),
	FOREIGN KEY (`a`,`b`) REFERENCES `friendships`(`a`,`b`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `relationships_id_unique` ON `relationships` (`id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter` text,
	`target` text,
	`message_id` integer,
	`reason` text NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`reporter`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`sender`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_pair` ON `requests` (`sender`,`recipient`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`csrf` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`email` text,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`password` text NOT NULL,
	`recovery_hash` text,
	`verified` integer DEFAULT 0 NOT NULL,
	`discoverable` integer DEFAULT 1 NOT NULL,
	`banned` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`seen` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);