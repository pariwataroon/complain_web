-- Migration: Add missing columns to outgoing_reports table
-- Date: 2025-11-05
-- Description: เพิ่มฟิลด์ที่ขาดหายในตาราง outgoing_reports

USE [comp_mof];
GO

PRINT 'Starting migration: Add missing columns to outgoing_reports table';
GO

-- 1. position_other_text
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports]')
    AND name = 'position_other_text'
)
BEGIN
    ALTER TABLE [dbo].[outgoing_reports]
    ADD position_other_text NVARCHAR(255) NULL;

    PRINT '✓ Column position_other_text added successfully.';
END
ELSE
BEGIN
    PRINT '- Column position_other_text already exists.';
END
GO

-- 2. document_number
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports]')
    AND name = 'document_number'
)
BEGIN
    ALTER TABLE [dbo].[outgoing_reports]
    ADD document_number NVARCHAR(100) NULL;

    PRINT '✓ Column document_number added successfully.';

    -- หมายเหตุ: ใน model กำหนดเป็น NOT NULL แต่เราเพิ่มเป็น NULL ก่อน
    -- เพื่อให้ข้อมูลเก่าไม่ error จากนั้นค่อยอัพเดทข้อมูล
END
ELSE
BEGIN
    PRINT '- Column document_number already exists.';
END
GO

-- 3. document_date
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports]')
    AND name = 'document_date'
)
BEGIN
    ALTER TABLE [dbo].[outgoing_reports]
    ADD document_date DATETIME NULL;

    PRINT '✓ Column document_date added successfully.';

    -- หมายเหตุ: ใน model กำหนดเป็น NOT NULL แต่เราเพิ่มเป็น NULL ก่อน
END
ELSE
BEGIN
    PRINT '- Column document_date already exists.';
END
GO

-- Update existing rows with default values if needed
-- สำหรับ document_number และ document_date ที่ NULL
UPDATE [dbo].[outgoing_reports]
SET
    document_number = COALESCE(document_number, reference_number),
    document_date = COALESCE(document_date, reference_date)
WHERE document_number IS NULL OR document_date IS NULL;
GO

PRINT '✓ Updated existing rows with default values.';
GO

-- Add Extended Properties for documentation
DECLARE @columns TABLE (col_name NVARCHAR(100), description NVARCHAR(500))

INSERT INTO @columns VALUES
('position_other_text', N'ข้อความตำแหน่งอื่นๆ (กรณีเลือกตำแหน่ง "อื่นๆ")'),
('document_number', N'เลขที่เอกสาร'),
('document_date', N'วันที่เอกสาร')

DECLARE @col_name NVARCHAR(100), @description NVARCHAR(500)

DECLARE col_cursor CURSOR FOR
SELECT col_name, description FROM @columns

OPEN col_cursor
FETCH NEXT FROM col_cursor INTO @col_name, @description

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.extended_properties
        WHERE major_id = OBJECT_ID(N'[dbo].[outgoing_reports]')
        AND name = N'MS_Description'
        AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports]') AND name = @col_name)
    )
    BEGIN
        EXEC sys.sp_addextendedproperty
            @name = N'MS_Description',
            @value = @description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = N'outgoing_reports',
            @level2type = N'COLUMN', @level2name = @col_name;

        PRINT '✓ Extended property added for ' + @col_name;
    END

    FETCH NEXT FROM col_cursor INTO @col_name, @description
END

CLOSE col_cursor
DEALLOCATE col_cursor
GO

-- Verify the columns were added
PRINT '';
PRINT 'Verifying columns:';
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports'
AND COLUMN_NAME IN (
    'position_other_text',
    'document_number',
    'document_date'
)
ORDER BY COLUMN_NAME;
GO

PRINT '';
PRINT '✅ Migration completed successfully!';
GO
