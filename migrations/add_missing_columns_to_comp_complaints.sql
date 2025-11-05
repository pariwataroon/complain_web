-- Migration: Add missing columns to comp_complaints table
-- Date: 2025-11-05
-- Description: เพิ่มฟิลด์ที่ขาดหายในตาราง comp_complaints

USE [comp_mof];
GO

PRINT 'Starting migration: Add missing columns to comp_complaints table';
GO

-- 1. assigned_remark
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'assigned_remark'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD assigned_remark NVARCHAR(2000) NULL;

    PRINT '✓ Column assigned_remark added successfully.';
END
ELSE
BEGIN
    PRINT '- Column assigned_remark already exists.';
END
GO

-- 2. confirm_assigned_date
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'confirm_assigned_date'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD confirm_assigned_date DATETIME NULL;

    PRINT '✓ Column confirm_assigned_date added successfully.';
END
ELSE
BEGIN
    PRINT '- Column confirm_assigned_date already exists.';
END
GO

-- 3. confirm_assigned_by
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'confirm_assigned_by'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD confirm_assigned_by UNIQUEIDENTIFIER NULL;

    -- เพิ่ม Foreign Key constraint
    ALTER TABLE [dbo].[comp_complaints]
    ADD CONSTRAINT FK_comp_complaints_confirm_assigned_by
    FOREIGN KEY (confirm_assigned_by) REFERENCES [dbo].[comp_users](id);

    PRINT '✓ Column confirm_assigned_by added with Foreign Key successfully.';
END
ELSE
BEGIN
    PRINT '- Column confirm_assigned_by already exists.';
END
GO

-- 4. confirm_assigned_status
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'confirm_assigned_status'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD confirm_assigned_status BIT NULL;

    PRINT '✓ Column confirm_assigned_status added successfully.';
END
ELSE
BEGIN
    PRINT '- Column confirm_assigned_status already exists.';
END
GO

-- 5. confirm_assigned_remark
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'confirm_assigned_remark'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD confirm_assigned_remark NVARCHAR(1000) NULL;

    PRINT '✓ Column confirm_assigned_remark added successfully.';
END
ELSE
BEGIN
    PRINT '- Column confirm_assigned_remark already exists.';
END
GO

-- 6. director_submission_date
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]')
    AND name = 'director_submission_date'
)
BEGIN
    ALTER TABLE [dbo].[comp_complaints]
    ADD director_submission_date DATETIME NULL;

    PRINT '✓ Column director_submission_date added successfully.';
END
ELSE
BEGIN
    PRINT '- Column director_submission_date already exists.';
END
GO

-- Add Extended Properties for documentation
DECLARE @columns TABLE (col_name NVARCHAR(100), description NVARCHAR(500))

INSERT INTO @columns VALUES
('assigned_remark', N'หมายเหตุการมอบหมาย/ข้อความส่งต่อ'),
('confirm_assigned_date', N'วันที่เจ้าหน้าที่ยืนยันรับงาน'),
('confirm_assigned_by', N'เจ้าหน้าที่ที่ยืนยันรับงาน'),
('confirm_assigned_status', N'สถานะการยืนยันรับงาน: 1=ยืนยัน, 0=ปฏิเสธ, NULL=รอการตอบรับ'),
('confirm_assigned_remark', N'หมายเหตุการยืนยัน/ปฏิเสธรับงาน'),
('director_submission_date', N'วันที่เสนอผู้อำนวยการ')

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
        WHERE major_id = OBJECT_ID(N'[dbo].[comp_complaints]')
        AND name = N'MS_Description'
        AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[comp_complaints]') AND name = @col_name)
    )
    BEGIN
        EXEC sys.sp_addextendedproperty
            @name = N'MS_Description',
            @value = @description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = N'comp_complaints',
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
WHERE TABLE_NAME = 'comp_complaints'
AND COLUMN_NAME IN (
    'assigned_remark',
    'confirm_assigned_date',
    'confirm_assigned_by',
    'confirm_assigned_status',
    'confirm_assigned_remark',
    'director_submission_date'
)
ORDER BY COLUMN_NAME;
GO

PRINT '';
PRINT '✅ Migration completed successfully!';
GO
