-- Migration: Add missing columns to outgoing_reports tables (2, 3, 4)
-- Date: 2025-11-05
-- Description: เพิ่มฟิลด์ที่ขาดหายในตาราง outgoing_reports2, outgoing_reports3, outgoing_reports4

USE [comp_mof];
GO

PRINT '========================================';
PRINT 'Starting comprehensive migration for outgoing_reports tables';
PRINT '========================================';
GO

-- ================================================================================
-- TABLE: outgoing_reports2
-- ================================================================================
PRINT '';
PRINT '--- Processing outgoing_reports2 ---';
GO

-- 1. position_other_text
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports2]') AND name = 'position_other_text')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports2] ADD position_other_text NVARCHAR(255) NULL;
    PRINT '✓ outgoing_reports2: Added position_other_text';
END
ELSE PRINT '- outgoing_reports2: position_other_text already exists';
GO

-- 2. outside_department_id
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports2]') AND name = 'outside_department_id')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports2] ADD outside_department_id UNIQUEIDENTIFIER NULL;
    ALTER TABLE [dbo].[outgoing_reports2] ADD CONSTRAINT FK_outgoing_reports2_outside_department FOREIGN KEY (outside_department_id) REFERENCES [dbo].[outside_departments](id);
    PRINT '✓ outgoing_reports2: Added outside_department_id with FK';
END
ELSE PRINT '- outgoing_reports2: outside_department_id already exists';
GO

-- 3. document_number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports2]') AND name = 'document_number')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports2] ADD document_number NVARCHAR(100) NULL;
    PRINT '✓ outgoing_reports2: Added document_number';
END
ELSE PRINT '- outgoing_reports2: document_number already exists';
GO

-- 4. document_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports2]') AND name = 'document_date')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports2] ADD document_date DATETIME NULL;
    PRINT '✓ outgoing_reports2: Added document_date';
END
ELSE PRINT '- outgoing_reports2: document_date already exists';
GO

-- Update existing rows with default values
UPDATE [dbo].[outgoing_reports2]
SET document_number = COALESCE(document_number, CONVERT(NVARCHAR(100), id)),
    document_date = COALESCE(document_date, created_at)
WHERE document_number IS NULL OR document_date IS NULL;
PRINT '✓ outgoing_reports2: Updated existing rows';
GO

-- ================================================================================
-- TABLE: outgoing_reports3
-- ================================================================================
PRINT '';
PRINT '--- Processing outgoing_reports3 ---';
GO

-- 1. position_other_text
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports3]') AND name = 'position_other_text')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports3] ADD position_other_text NVARCHAR(255) NULL;
    PRINT '✓ outgoing_reports3: Added position_other_text';
END
ELSE PRINT '- outgoing_reports3: position_other_text already exists';
GO

-- 2. document_number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports3]') AND name = 'document_number')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports3] ADD document_number NVARCHAR(100) NULL;
    PRINT '✓ outgoing_reports3: Added document_number';
END
ELSE PRINT '- outgoing_reports3: document_number already exists';
GO

-- 3. document_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports3]') AND name = 'document_date')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports3] ADD document_date DATETIME NULL;
    PRINT '✓ outgoing_reports3: Added document_date';
END
ELSE PRINT '- outgoing_reports3: document_date already exists';
GO

-- Update existing rows
UPDATE [dbo].[outgoing_reports3]
SET document_number = COALESCE(document_number, CONVERT(NVARCHAR(100), id)),
    document_date = COALESCE(document_date, created_at)
WHERE document_number IS NULL OR document_date IS NULL;
PRINT '✓ outgoing_reports3: Updated existing rows';
GO

-- ================================================================================
-- TABLE: outgoing_reports4
-- ================================================================================
PRINT '';
PRINT '--- Processing outgoing_reports4 ---';
GO

-- 1. position_id
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'position_id')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD position_id UNIQUEIDENTIFIER NULL;
    ALTER TABLE [dbo].[outgoing_reports4] ADD CONSTRAINT FK_outgoing_reports4_position FOREIGN KEY (position_id) REFERENCES [dbo].[positions](id);
    PRINT '✓ outgoing_reports4: Added position_id with FK';
END
ELSE PRINT '- outgoing_reports4: position_id already exists';
GO

-- 2. position_other_text
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'position_other_text')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD position_other_text NVARCHAR(255) NULL;
    PRINT '✓ outgoing_reports4: Added position_other_text';
END
ELSE PRINT '- outgoing_reports4: position_other_text already exists';
GO

-- 3. report_type
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'report_type')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD report_type NVARCHAR(50) NULL;
    PRINT '✓ outgoing_reports4: Added report_type';
END
ELSE PRINT '- outgoing_reports4: report_type already exists';
GO

-- 4. outside_department_id
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'outside_department_id')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD outside_department_id UNIQUEIDENTIFIER NULL;
    ALTER TABLE [dbo].[outgoing_reports4] ADD CONSTRAINT FK_outgoing_reports4_outside_department FOREIGN KEY (outside_department_id) REFERENCES [dbo].[outside_departments](id);
    PRINT '✓ outgoing_reports4: Added outside_department_id with FK';
END
ELSE PRINT '- outgoing_reports4: outside_department_id already exists';
GO

-- 5. complaint_number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'complaint_number')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD complaint_number NVARCHAR(50) NULL;
    PRINT '✓ outgoing_reports4: Added complaint_number';
END
ELSE PRINT '- outgoing_reports4: complaint_number already exists';
GO

-- 6. complaint_number_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports4]') AND name = 'complaint_number_date')
BEGIN
    ALTER TABLE [dbo].[outgoing_reports4] ADD complaint_number_date DATETIME NULL;
    PRINT '✓ outgoing_reports4: Added complaint_number_date';
END
ELSE PRINT '- outgoing_reports4: complaint_number_date already exists';
GO

-- Update existing rows for outgoing_reports4
UPDATE [dbo].[outgoing_reports4]
SET
    complaint_number = COALESCE(complaint_number, reference_number),
    complaint_number_date = COALESCE(complaint_number_date, reference_date)
WHERE complaint_number IS NULL OR complaint_number_date IS NULL;
PRINT '✓ outgoing_reports4: Updated existing rows';
GO

-- ================================================================================
-- Add Extended Properties
-- ================================================================================
PRINT '';
PRINT '--- Adding Extended Properties ---';
GO

-- outgoing_reports2
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ข้อความตำแหน่งอื่นๆ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports2', @level2type=N'COLUMN',@level2name=N'position_other_text';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'หน่วยงานภายนอก' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports2', @level2type=N'COLUMN',@level2name=N'outside_department_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'เลขที่เอกสาร' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports2', @level2type=N'COLUMN',@level2name=N'document_number';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'วันที่เอกสาร' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports2', @level2type=N'COLUMN',@level2name=N'document_date';

-- outgoing_reports3
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ข้อความตำแหน่งอื่นๆ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports3', @level2type=N'COLUMN',@level2name=N'position_other_text';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'เลขที่เอกสาร' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports3', @level2type=N'COLUMN',@level2name=N'document_number';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'วันที่เอกสาร' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports3', @level2type=N'COLUMN',@level2name=N'document_date';

-- outgoing_reports4
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ตำแหน่ง' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'position_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ข้อความตำแหน่งอื่นๆ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'position_other_text';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ประเภท tab ของ front-end' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'report_type';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'หน่วยงานภายนอก' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'outside_department_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'เลขที่ร้องเรียน' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'complaint_number';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'วันที่ร้องเรียน' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'outgoing_reports4', @level2type=N'COLUMN',@level2name=N'complaint_number_date';

PRINT '✓ Extended properties added';
GO

-- ================================================================================
-- Verification
-- ================================================================================
PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION SUMMARY';
PRINT '========================================';
GO

PRINT '';
PRINT 'outgoing_reports2 columns:';
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports2'
AND COLUMN_NAME IN ('position_other_text', 'outside_department_id', 'document_number', 'document_date')
ORDER BY COLUMN_NAME;
GO

PRINT '';
PRINT 'outgoing_reports3 columns:';
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports3'
AND COLUMN_NAME IN ('position_other_text', 'document_number', 'document_date')
ORDER BY COLUMN_NAME;
GO

PRINT '';
PRINT 'outgoing_reports4 columns:';
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports4'
AND COLUMN_NAME IN ('position_id', 'position_other_text', 'report_type', 'outside_department_id', 'complaint_number', 'complaint_number_date')
ORDER BY COLUMN_NAME;
GO

PRINT '';
PRINT '========================================';
PRINT '✅ Migration completed successfully!';
PRINT '========================================';
GO
