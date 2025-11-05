-- ================================================================================
-- QUICK FIX FOR PRODUCTION - Add process_step column
-- Date: 2025-11-05
-- ================================================================================
-- This is a QUICK FIX to add only the missing process_step column
-- For complete migration, use PRODUCTION_MIGRATION_COMPLETE.sql
-- ================================================================================

USE [comp_mof];
GO

PRINT '========================================';
PRINT 'QUICK FIX: Adding process_step column';
PRINT '========================================';
GO

-- Add process_step to outgoing_reports5
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'outgoing_reports5')
    AND name = 'process_step'
)
BEGIN
    ALTER TABLE outgoing_reports5
    ADD process_step NVARCHAR(255) NULL;

    PRINT '✓ Column process_step added to outgoing_reports5';
END
ELSE
BEGIN
    PRINT '- Column process_step already exists in outgoing_reports5';
END
GO

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'outgoing_reports5'
AND COLUMN_NAME = 'process_step';
GO

PRINT '';
PRINT '✅ Quick fix completed!';
PRINT '⚠️  Remember to restart the application!';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Restart FastAPI application';
PRINT '  2. Test the API';
PRINT '  3. Run PRODUCTION_MIGRATION_COMPLETE.sql for all other columns';
GO
