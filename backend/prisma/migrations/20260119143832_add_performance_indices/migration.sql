-- CreateIndex
CREATE INDEX `Client_email_idx` ON `Client`(`email`);

-- CreateIndex
CREATE INDEX `Client_name_idx` ON `Client`(`name`);

-- CreateIndex
CREATE INDEX `ConsumerUnit_code_idx` ON `ConsumerUnit`(`code`);

-- CreateIndex
CREATE INDEX `Project_status_idx` ON `Project`(`status`);

-- CreateIndex
CREATE INDEX `Project_pipeline_idx` ON `Project`(`pipeline`);

-- RenameIndex
ALTER TABLE `ConsumerUnit` RENAME INDEX `ConsumerUnit_projectId_fkey` TO `ConsumerUnit_projectId_idx`;

-- RenameIndex
ALTER TABLE `Project` RENAME INDEX `Project_clientId_fkey` TO `Project_clientId_idx`;
