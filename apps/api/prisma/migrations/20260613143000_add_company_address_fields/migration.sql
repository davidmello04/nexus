ALTER TABLE `company_settings`
  ADD COLUMN `addressZipCode` VARCHAR(191) NULL,
  ADD COLUMN `addressStreet` VARCHAR(191) NULL,
  ADD COLUMN `addressNumber` VARCHAR(191) NULL,
  ADD COLUMN `addressComplement` VARCHAR(191) NULL,
  ADD COLUMN `addressNeighborhood` VARCHAR(191) NULL,
  ADD COLUMN `addressCity` VARCHAR(191) NULL,
  ADD COLUMN `addressState` VARCHAR(191) NULL;
