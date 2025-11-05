-- Migration: Add process_step column to outgoing_reports5 table
-- Date: 2025-11-05
-- Description: เพิ่มฟิลด์ "ขั้นตอนการดำเนินการ" (process_step) ลงในตาราง outgoing_reports5

USE [comp_mof];
GO

-- ตรวจสอบว่า column ยังไม่มีอยู่ก่อนเพิ่ม
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports5]')
    AND name = 'process_step'
)
BEGIN
    -- เพิ่ม column process_step
    ALTER TABLE [dbo].[outgoing_reports5]
    ADD process_step NVARCHAR(255) NULL;

    PRINT 'Column process_step has been added to outgoing_reports5 table successfully.';
END
ELSE
BEGIN
    PRINT 'Column process_step already exists in outgoing_reports5 table.';
END
GO

-- เพิ่ม Extended Property สำหรับ documentation
IF NOT EXISTS (
    SELECT 1
    FROM sys.extended_properties
    WHERE major_id = OBJECT_ID(N'[dbo].[outgoing_reports5]')
    AND name = N'MS_Description'
    AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[outgoing_reports5]') AND name = 'process_step')
)
BEGIN
    EXEC sys.sp_addextendedproperty
        @name = N'MS_Description',
        @value = N'ขั้นตอนการดำเนินการ (รับเรื่อง, ตรวจสอบเอกสาร, ส่งต่อหน่วยงาน, ดำเนินการสอบสวน, รายงานผล, ติดตามผล, ปิดเรื่อง)',
        @level0type = N'SCHEMA', @level0name = N'dbo',
        @level1type = N'TABLE', @level1name = N'outgoing_reports5',
        @level2type = N'COLUMN', @level2name = N'process_step';

    PRINT 'Extended property added for process_step column.';
END
GO

-- แสดงข้อมูล column ที่เพิ่มเข้าไป
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports5'
AND COLUMN_NAME = 'process_step';
GO

PRINT 'Migration completed successfully!';
GO
