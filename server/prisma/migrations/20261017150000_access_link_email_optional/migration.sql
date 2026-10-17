-- Access links are created at checkout (email may be unknown yet) and sent by
-- email once payment completes, so the email column becomes optional.
ALTER TABLE "access_links" ALTER COLUMN "email" DROP NOT NULL;
