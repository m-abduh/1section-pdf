-- Drop unused column: niche "featured" is no longer used by the storefront.
ALTER TABLE "niches" DROP COLUMN "featured";
