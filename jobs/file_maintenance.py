import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from lib.file_upload import cleanup_expired_files, get_storage_usage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_file_cleanup():
    """Run daily file cleanup job"""
    logger.info("Running daily file cleanup job")
    stats = cleanup_expired_files()
    logger.info(f"Cleanup completed: {stats['deleted']} files deleted, {stats['failed']} errors")
    logger.info(f"Freed up {stats['size_cleared']/1024/1024:.2f} MB of space")

def run_storage_report():
    """Generate storage usage report"""
    logger.info("Generating storage usage report")
    stats = get_storage_usage()
    logger.info(f"Total storage used: {stats['total_size_human']}, {stats['total_files']} files")
    
    # Log details for large folders
    for folder, folder_stats in stats["folders"].items():
        if folder_stats["size_bytes"] > 100 * 1024 * 1024:  # Folders over 100MB
            logger.info(f"Large folder: {folder} - {folder_stats['size_human']}")

def setup_file_maintenance_jobs():
    """Set up scheduled file maintenance jobs"""
    scheduler = AsyncIOScheduler()
    
    # Run file cleanup at 3 AM every day
    scheduler.add_job(run_file_cleanup, 'cron', hour=3, minute=0)
    
    # Generate storage report weekly on Sunday at 4 AM
    scheduler.add_job(run_storage_report, 'cron', day_of_week='sun', hour=4, minute=0)
    
    scheduler.start()
    logger.info("File maintenance jobs scheduled")
    
    return scheduler