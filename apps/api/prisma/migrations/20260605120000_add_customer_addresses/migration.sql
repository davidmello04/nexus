-- AlterTable
ALTER TABLE `customers`
  ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `source` VARCHAR(191) NULL,
  ADD COLUMN `sourceOther` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `addresses` (
  `id` VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NOT NULL,
  `type` ENUM('MAIN', 'DELIVERY', 'BILLING') NOT NULL DEFAULT 'MAIN',
  `zipCode` VARCHAR(191) NULL,
  `street` VARCHAR(191) NULL,
  `number` VARCHAR(191) NULL,
  `neighborhood` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `state` VARCHAR(191) NULL,
  `complement` VARCHAR(191) NULL,
  `reference` VARCHAR(191) NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
