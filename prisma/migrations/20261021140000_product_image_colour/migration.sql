-- AlterTable
ALTER TABLE "product_images" ADD COLUMN "colour" TEXT;

-- CreateIndex
CREATE INDEX "product_images_product_id_colour_idx" ON "product_images"("product_id", "colour");
