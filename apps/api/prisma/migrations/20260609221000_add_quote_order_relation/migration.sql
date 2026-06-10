ALTER TABLE `orders` ADD COLUMN `quoteId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `orders_quoteId_key` ON `orders`(`quoteId`);

ALTER TABLE `orders` ADD CONSTRAINT `orders_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
