-- ================================================================================
-- PRODUCTION MIGRATION - Complete Database Schema Update
-- Date: 2025-11-05
-- Description: รวม migration ทั้งหมดสำหรับ production database
-- ================================================================================
--
-- Migration Includes:
-- 1. comp_complaints - Add missing columns
-- 2. outgoing_reports - Add missing columns
-- 3. outgoing_reports2 - Add missing columns
-- 4. outgoing_reports3 - Add missing columns
-- 5. outgoing_reports4 - Add missing columns
-- 6. outgoing_reports5 - Add process_step column
--
-- ⚠️ IMPORTANT:
-- - Backup database before running!
-- - Can be run multiple times safely (idempotent)
-- - Run during maintenance window
-- ================================================================================

USE [comp_mof];
GO

SET NOCOUNT ON;
GO

PRINT '================================================================================';
PRINT 'PRODUCTION MIGRATION START';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '================================================================================';
GO

-- ================================================================================
-- TABLE: comp_complaints
-- ================================================================================
PRINT '';
PRINT '>>> Processing comp_complaints...';

-- assigned_remark
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'assigned_remark')
BEGIN
    ALTER TABLE comp_complaints ADD assigned_remark NVARCHAR(2000) NULL;
    PRINT '  ✓ Added: assigned_remark';
END
ELSE PRINT '  - Exists: assigned_remark';

-- confirm_assigned_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'confirm_assigned_date')
BEGIN
    ALTER TABLE comp_complaints ADD confirm_assigned_date DATETIME NULL;
    PRINT '  ✓ Added: confirm_assigned_date';
END
ELSE PRINT '  - Exists: confirm_assigned_date';

-- confirm_assigned_by
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'confirm_assigned_by')
BEGIN
    ALTER TABLE comp_complaints ADD confirm_assigned_by UNIQUEIDENTIFIER NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_comp_complaints_confirm_assigned_by')
        ALTER TABLE comp_complaints ADD CONSTRAINT FK_comp_complaints_confirm_assigned_by FOREIGN KEY (confirm_assigned_by) REFERENCES comp_users(id);
    PRINT '  ✓ Added: confirm_assigned_by + FK';
END
ELSE PRINT '  - Exists: confirm_assigned_by';

-- confirm_assigned_status
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'confirm_assigned_status')
BEGIN
    ALTER TABLE comp_complaints ADD confirm_assigned_status BIT NULL;
    PRINT '  ✓ Added: confirm_assigned_status';
END
ELSE PRINT '  - Exists: confirm_assigned_status';

-- confirm_assigned_remark
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'confirm_assigned_remark')
BEGIN
    ALTER TABLE comp_complaints ADD confirm_assigned_remark NVARCHAR(1000) NULL;
    PRINT '  ✓ Added: confirm_assigned_remark';
END
ELSE PRINT '  - Exists: confirm_assigned_remark';

-- director_submission_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'comp_complaints') AND name = 'director_submission_date')
BEGIN
    ALTER TABLE comp_complaints ADD director_submission_date DATETIME NULL;
    PRINT '  ✓ Added: director_submission_date';
END
ELSE PRINT '  - Exists: director_submission_date';

PRINT '  ✅ comp_complaints completed';
GO

-- ================================================================================
-- TABLE: outgoing_reports
-- ================================================================================
PRINT '';
PRINT '>>> Processing outgoing_reports...';

-- position_other_text
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports') AND name = 'position_other_text')
BEGIN
    ALTER TABLE outgoing_reports ADD position_other_text NVARCHAR(255) NULL;
    PRINT '  ✓ Added: position_other_text';
END
ELSE PRINT '  - Exists: position_other_text';

-- document_number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports') AND name = 'document_number')
BEGIN
    ALTER TABLE outgoing_reports ADD document_number NVARCHAR(100) NULL;
    UPDATE outgoing_reports SET document_number = reference_number WHERE document_number IS NULL;
    PRINT '  ✓ Added: document_number';
END
ELSE PRINT '  - Exists: document_number';

-- document_date
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports') AND name = 'document_date')
BEGIN
    ALTER TABLE outgoing_reports ADD document_date DATETIME NULL;
    UPDATE outgoing_reports SET document_date = reference_date WHERE document_date IS NULL;
    PRINT '  ✓ Added: document_date';
END
ELSE PRINT '  - Exists: document_date';

PRINT '  ✅ outgoing_reports completed';
GO

-- ================================================================================
-- TABLE: outgoing_reports2
-- ================================================================================
PRINT '';
PRINT '>>> Processing outgoing_reports2...';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports2') AND name = 'position_other_text')
BEGIN
    ALTER TABLE outgoing_reports2 ADD position_other_text NVARCHAR(255) NULL;
    PRINT '  ✓ Added: position_other_text';
END
ELSE PRINT '  - Exists: position_other_text';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports2') AND name = 'outside_department_id')
BEGIN
    ALTER TABLE outgoing_reports2 ADD outside_department_id UNIQUEIDENTIFIER NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_outgoing_reports2_outside_department')
        ALTER TABLE outgoing_reports2 ADD CONSTRAINT FK_outgoing_reports2_outside_department FOREIGN KEY (outside_department_id) REFERENCES outside_departments(id);
    PRINT '  ✓ Added: outside_department_id + FK';
END
ELSE PRINT '  - Exists: outside_department_id';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports2') AND name = 'document_number')
BEGIN
    ALTER TABLE outgoing_reports2 ADD document_number NVARCHAR(100) NULL;
    UPDATE outgoing_reports2 SET document_number = CONVERT(NVARCHAR(100), id) WHERE document_number IS NULL;
    PRINT '  ✓ Added: document_number';
END
ELSE PRINT '  - Exists: document_number';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports2') AND name = 'document_date')
BEGIN
    ALTER TABLE outgoing_reports2 ADD document_date DATETIME NULL;
    UPDATE outgoing_reports2 SET document_date = created_at WHERE document_date IS NULL;
    PRINT '  ✓ Added: document_date';
END
ELSE PRINT '  - Exists: document_date';

PRINT '  ✅ outgoing_reports2 completed';
GO

-- ================================================================================
-- TABLE: outgoing_reports3
-- ================================================================================
PRINT '';
PRINT '>>> Processing outgoing_reports3...';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports3') AND name = 'position_other_text')
BEGIN
    ALTER TABLE outgoing_reports3 ADD position_other_text NVARCHAR(255) NULL;
    PRINT '  ✓ Added: position_other_text';
END
ELSE PRINT '  - Exists: position_other_text';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports3') AND name = 'document_number')
BEGIN
    ALTER TABLE outgoing_reports3 ADD document_number NVARCHAR(100) NULL;
    UPDATE outgoing_reports3 SET document_number = CONVERT(NVARCHAR(100), id) WHERE document_number IS NULL;
    PRINT '  ✓ Added: document_number';
END
ELSE PRINT '  - Exists: document_number';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports3') AND name = 'document_date')
BEGIN
    ALTER TABLE outgoing_reports3 ADD document_date DATETIME NULL;
    UPDATE outgoing_reports3 SET document_date = created_at WHERE document_date IS NULL;
    PRINT '  ✓ Added: document_date';
END
ELSE PRINT '  - Exists: document_date';

PRINT '  ✅ outgoing_reports3 completed';
GO

-- ================================================================================
-- TABLE: outgoing_reports4
-- ================================================================================
PRINT '';
PRINT '>>> Processing outgoing_reports4...';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'position_id')
BEGIN
    ALTER TABLE outgoing_reports4 ADD position_id UNIQUEIDENTIFIER NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_outgoing_reports4_position')
        ALTER TABLE outgoing_reports4 ADD CONSTRAINT FK_outgoing_reports4_position FOREIGN KEY (position_id) REFERENCES positions(id);
    PRINT '  ✓ Added: position_id + FK';
END
ELSE PRINT '  - Exists: position_id';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'position_other_text')
BEGIN
    ALTER TABLE outgoing_reports4 ADD position_other_text NVARCHAR(255) NULL;
    PRINT '  ✓ Added: position_other_text';
END
ELSE PRINT '  - Exists: position_other_text';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'report_type')
BEGIN
    ALTER TABLE outgoing_reports4 ADD report_type NVARCHAR(50) NULL;
    PRINT '  ✓ Added: report_type';
END
ELSE PRINT '  - Exists: report_type';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'outside_department_id')
BEGIN
    ALTER TABLE outgoing_reports4 ADD outside_department_id UNIQUEIDENTIFIER NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_outgoing_reports4_outside_department')
        ALTER TABLE outgoing_reports4 ADD CONSTRAINT FK_outgoing_reports4_outside_department FOREIGN KEY (outside_department_id) REFERENCES outside_departments(id);
    PRINT '  ✓ Added: outside_department_id + FK';
END
ELSE PRINT '  - Exists: outside_department_id';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'complaint_number')
BEGIN
    ALTER TABLE outgoing_reports4 ADD complaint_number NVARCHAR(50) NULL;
    UPDATE outgoing_reports4 SET complaint_number = reference_number WHERE complaint_number IS NULL;
    PRINT '  ✓ Added: complaint_number';
END
ELSE PRINT '  - Exists: complaint_number';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'complaint_number_date')
BEGIN
    ALTER TABLE outgoing_reports4 ADD complaint_number_date DATETIME NULL;
    UPDATE outgoing_reports4 SET complaint_number_date = reference_date WHERE complaint_number_date IS NULL;
    PRINT '  ✓ Added: complaint_number_date';
END
ELSE PRINT '  - Exists: complaint_number_date';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'document_number')
BEGIN
    ALTER TABLE outgoing_reports4 ADD document_number NVARCHAR(100) NULL;
    UPDATE outgoing_reports4 SET document_number = reference_number WHERE document_number IS NULL;
    PRINT '  ✓ Added: document_number';
END
ELSE PRINT '  - Exists: document_number';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports4') AND name = 'document_date')
BEGIN
    ALTER TABLE outgoing_reports4 ADD document_date DATETIME NULL;
    UPDATE outgoing_reports4 SET document_date = reference_date WHERE document_date IS NULL;
    PRINT '  ✓ Added: document_date';
END
ELSE PRINT '  - Exists: document_date';

PRINT '  ✅ outgoing_reports4 completed';
GO

-- ================================================================================
-- TABLE: outgoing_reports5
-- ================================================================================
PRINT '';
PRINT '>>> Processing outgoing_reports5...';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'outgoing_reports5') AND name = 'process_step')
BEGIN
    ALTER TABLE outgoing_reports5 ADD process_step NVARCHAR(255) NULL;
    PRINT '  ✓ Added: process_step';
END
ELSE PRINT '  - Exists: process_step';

PRINT '  ✅ outgoing_reports5 completed';
GO

-- ================================================================================
-- FINAL SUMMARY
-- ================================================================================
PRINT '';
PRINT '================================================================================';
PRINT 'PRODUCTION MIGRATION COMPLETED SUCCESSFULLY';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '================================================================================';
PRINT '';
PRINT 'Tables Updated:';
PRINT '  1. comp_complaints (6 columns)';
PRINT '  2. outgoing_reports (3 columns)';
PRINT '  3. outgoing_reports2 (4 columns)';
PRINT '  4. outgoing_reports3 (3 columns)';
PRINT '  5. outgoing_reports4 (8 columns)';
PRINT '  6. outgoing_reports5 (1 column)';
PRINT '';
PRINT '✅ All migrations applied successfully!';
PRINT '✅ Safe to restart application';
PRINT '================================================================================';
GO
