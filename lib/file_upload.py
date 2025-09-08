import os
import uuid
import aiofiles
import shutil
from fastapi import UploadFile
from datetime import datetime, timedelta
import mimetypes
from typing import Dict, Any, Optional, List
import json
import glob

# Configure logging
from lib.logger import get_logger
logger = get_logger("lib.file_upload")

# Configure upload paths
BASE_UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))  # Base directory for all uploads
MAX_FILE_SIZE = int(os.environ.get("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB default max file size
FILE_RETENTION_DAYS = int(os.environ.get("FILE_RETENTION_DAYS", 30))  # Default 30 days retention

# Storage configuration file
STORAGE_CONFIG_FILE = "storage_config.json"

# Create upload directory if it doesn't exist
try:
    os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)
    logger.info(f"Storage directory created/verified at: {BASE_UPLOAD_DIR}")
except Exception as e:
    logger.error(f"Error creating uploads directory: {str(e)}")

def get_storage_config():
    """Load storage configuration"""
    config_path = os.path.join(BASE_UPLOAD_DIR, STORAGE_CONFIG_FILE)
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error(f"Error parsing storage config. Using defaults.")
    
    # Default config if file doesn't exist or is invalid
    return {
        "base_dir": BASE_UPLOAD_DIR,
        "retention_days": FILE_RETENTION_DAYS,
        "max_file_size": MAX_FILE_SIZE
    }

def save_storage_config(config):
    """Save storage configuration"""
    config_path = os.path.join(BASE_UPLOAD_DIR, STORAGE_CONFIG_FILE)
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

def get_date_folder_path(base_folder="general", date=None):
    """
    Generate a folder path based on date: uploads/base_folder/year/month/day/
    """
    if date is None:
        date = datetime.now()
    
    year = str(date.year)
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    
    folder_path = os.path.join(BASE_UPLOAD_DIR, year, month, day, base_folder)
    os.makedirs(folder_path, exist_ok=True)
    
    return folder_path

async def save_upload_file(
    file: UploadFile,
    folder: str = "general",
    max_size: int = None,
    allowed_types: Optional[list] = None
) -> Dict[str, Any]:
    """
    Save an uploaded file to the server and return file information
    
    Parameters:
    - file: The UploadFile object from FastAPI
    - folder: Subfolder within the uploads directory (e.g., "complaints", "users")
    - max_size: Maximum file size in bytes, if None uses default
    - allowed_types: List of allowed MIME types, if None all types are allowed
    
    Returns:
    - Dict with file information: filename, file path, size, type, etc.
    """
    config = get_storage_config()
    if max_size is None:
        max_size = config["max_file_size"]
    
    try:
        # Check file size
        file_size = 0
        chunk_size = 1024
        
        # Reset file position
        await file.seek(0)
        
        # Read chunks to calculate size
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_size += len(chunk)
            
            if file_size > max_size:
                raise ValueError(f"File size exceeds maximum allowed size of {max_size/1024/1024} MB")
        
        # Reset file position again for saving
        await file.seek(0)
        
        # Check file type if specified
        content_type = file.content_type
        if allowed_types and content_type not in allowed_types:
            raise ValueError(f"File type '{content_type}' not allowed. Allowed types: {allowed_types}")
        
        # Generate a unique filename with timestamp and UUID
        timestamp = datetime.now().strftime("%H%M%S")
        original_filename = file.filename
        if original_filename:
            file_extension = os.path.splitext(original_filename)[1]
        else:
            # Try to guess extension from content type
            file_extension = mimetypes.guess_extension(content_type) or ""
        
        unique_id = str(uuid.uuid4())[:8]
        new_filename = f"{timestamp}_{unique_id}{file_extension}"
        
        # Normalize folder for outgoing reports series → unify to 'outgoing-reports'
        normalized_folder = folder
        try:
            if isinstance(folder, str):
                head, sep, tail = folder.partition("/")
                if head.startswith("outgoing-reports"):
                    # outgoing-reports, outgoing-reports2..5 → outgoing-reports
                    head = "outgoing-reports"
                    normalized_folder = head + ("/" + tail if tail else "")
        except Exception:
            normalized_folder = folder

        # Get date-based folder path
        today = datetime.now()
        year = str(today.year)
        month = str(today.month).zfill(2)
        day = str(today.day).zfill(2)
        # If this is a complaint file, expect folder to be like 'complaints/{complaint_id}'
        if normalized_folder.startswith("complaints/"):
            # Save under uploads/{year}/{month}/{day}/complaints/{complaint_id}/filename
            parts = normalized_folder.split("/", 1)
            complaint_id = parts[1] if len(parts) > 1 else "unknown"
            upload_folder = os.path.join(BASE_UPLOAD_DIR, year, month, day, "complaints", complaint_id)
            os.makedirs(upload_folder, exist_ok=True)
            relative_path = f"{year}/{month}/{day}/complaints/{complaint_id}/{new_filename}"
        elif normalized_folder.startswith("users/"):
            # Save under uploads/{year}/{month}/{day}/users/{user_id}/filename
            parts = normalized_folder.split("/", 1)
            user_id = parts[1] if len(parts) > 1 else "unknown"
            upload_folder = os.path.join(BASE_UPLOAD_DIR, year, month, day, "users", user_id)
            os.makedirs(upload_folder, exist_ok=True)
            relative_path = f"{year}/{month}/{day}/users/{user_id}/{new_filename}"
        else:
            # Default: uploads/{year}/{month}/{day}/{folder}/filename
            upload_folder = os.path.join(BASE_UPLOAD_DIR, year, month, day, normalized_folder)
            os.makedirs(upload_folder, exist_ok=True)
            relative_path = f"{year}/{month}/{day}/{normalized_folder}/{new_filename}"

        # Create full path
        file_path = os.path.join(upload_folder, new_filename)

        # Save the file
        async with aiofiles.open(file_path, "wb") as out_file:
            # Reset file position
            await file.seek(0)
            # Copy the file content
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                await out_file.write(chunk)
        
        # Create metadata file for additional info
        metadata = {
            "original_filename": original_filename,
            "content_type": content_type,
            "file_size": file_size,
            "upload_date": today.isoformat(),
            "retention_days": config["retention_days"],
            "expiry_date": (today + timedelta(days=config["retention_days"])).isoformat() if config["retention_days"] > 0 else None
        }
        
        metadata_path = f"{file_path}.meta"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"File saved: {file_path} ({file_size/1024:.2f} KB)")
        
        return {
            "filename": original_filename,
            "saved_as": new_filename,
            "file_path": file_path,
            "file_url": f"/uploads/{relative_path}",
            "file_size": file_size,
            "file_type": content_type,
            "upload_date": today.isoformat(),
            "folder": folder
        }
        
    except Exception as e:
        # If any error occurs, clean up any partial file
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            # Remove metadata file if it exists
            metadata_path = f"{file_path}.meta"
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
        
        logger.error(f"Error saving file: {str(e)}")
        raise e

def delete_upload_file(file_path: str) -> bool:
    """
    Delete an uploaded file and its metadata
    
    Parameters:
    - file_path: Path to the file to delete
    
    Returns:
    - True if file was deleted, False if file doesn't exist
    """
    # Make sure path is within uploads directory for security
    if not os.path.abspath(file_path).startswith(os.path.abspath(BASE_UPLOAD_DIR)):
        raise ValueError("Cannot delete files outside the uploads directory")
    
    result = False
    if os.path.exists(file_path):
        os.remove(file_path)
        result = True
        logger.info(f"Deleted file: {file_path}")
    
    # Delete metadata file if it exists
    metadata_path = f"{file_path}.meta"
    if os.path.exists(metadata_path):
        os.remove(metadata_path)
        logger.info(f"Deleted metadata: {metadata_path}")
    
    return result

def get_file_info(file_path: str) -> Dict[str, Any]:
    """
    Get information about an uploaded file
    
    Parameters:
    - file_path: Path to the file
    
    Returns:
    - Dict with file information
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Check for metadata file
    metadata_path = f"{file_path}.meta"
    metadata = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        except:
            logger.warning(f"Could not read metadata for {file_path}")
    
    # Get file stats
    file_stats = os.stat(file_path)
    file_size = file_stats.st_size
    modified_time = datetime.fromtimestamp(file_stats.st_mtime)
    
    # Get filename and content type
    filename = os.path.basename(file_path)
    content_type = metadata.get("content_type") or mimetypes.guess_type(file_path)[0]
    
    # Calculate relative path for URL
    rel_path = os.path.relpath(file_path, BASE_UPLOAD_DIR).replace("\\", "/")
    
    return {
        "filename": metadata.get("original_filename", filename),
        "file_path": file_path,
        "file_url": f"/uploads/{rel_path}",
        "file_size": file_size,
        "file_type": content_type or "application/octet-stream",
        "modified": modified_time.isoformat(),
        "upload_date": metadata.get("upload_date"),
        "expiry_date": metadata.get("expiry_date")
    }

def cleanup_expired_files(folder: str = None) -> Dict[str, int]:
    """
    Delete files that are past their retention period
    
    Parameters:
    - folder: Optional subfolder to clean, if None clean all folders
    
    Returns:
    - Dict with cleanup statistics
    """
    config = get_storage_config()
    base_dir = BASE_UPLOAD_DIR
    if folder:
        base_dir = os.path.join(base_dir, folder)
    
    stats = {"deleted": 0, "failed": 0, "size_cleared": 0}
    
    # Find all metadata files
    metadata_pattern = os.path.join(base_dir, "**", "*.meta")
    meta_files = glob.glob(metadata_pattern, recursive=True)
    
    now = datetime.now()
    
    for meta_file in meta_files:
        try:
            with open(meta_file, 'r') as f:
                metadata = json.load(f)
            
            # Check if file has expired
            if metadata.get("expiry_date"):
                expiry_date = datetime.fromisoformat(metadata["expiry_date"])
                if now > expiry_date:
                    # File has expired, delete it
                    file_path = meta_file[:-5]  # Remove .meta suffix
                    
                    if os.path.exists(file_path):
                        file_size = os.path.getsize(file_path)
                        stats["size_cleared"] += file_size
                        os.remove(file_path)
                        stats["deleted"] += 1
                        logger.info(f"Deleted expired file: {file_path}")
                    
                    # Delete metadata file
                    os.remove(meta_file)
        except Exception as e:
            stats["failed"] += 1
            logger.error(f"Error cleaning up file {meta_file}: {str(e)}")
    
    return stats

def list_files_by_date_range(start_date: datetime, end_date: datetime, folder: str = None) -> List[Dict[str, Any]]:
    """
    List files within a date range
    
    Parameters:
    - start_date: Start date (inclusive)
    - end_date: End date (inclusive)
    - folder: Optional folder to limit search
    
    Returns:
    - List of file information dictionaries
    """
    files = []
    current_date = start_date
    
    while current_date <= end_date:
        year = str(current_date.year)
        month = str(current_date.month).zfill(2)
        day = str(current_date.day).zfill(2)
        
        if folder:
            date_folder = os.path.join(BASE_UPLOAD_DIR, folder, year, month, day)
        else:
            # Search all folders
            for folder_name in os.listdir(BASE_UPLOAD_DIR):
                folder_path = os.path.join(BASE_UPLOAD_DIR, folder_name)
                if os.path.isdir(folder_path) and folder_name != os.path.basename(STORAGE_CONFIG_FILE):
                    date_folder = os.path.join(folder_path, year, month, day)
                    if os.path.exists(date_folder):
                        for file_name in os.listdir(date_folder):
                            file_path = os.path.join(date_folder, file_name)
                            if os.path.isfile(file_path) and not file_name.endswith('.meta'):
                                try:
                                    files.append(get_file_info(file_path))
                                except Exception as e:
                                    logger.error(f"Error getting info for {file_path}: {str(e)}")
        
        # Move to next day
        current_date += timedelta(days=1)
    
    return files

def move_storage_location(new_base_dir: str) -> Dict[str, Any]:
    """
    Move all uploaded files to a new storage location
    
    Parameters:
    - new_base_dir: New base directory path
    
    Returns:
    - Stats about the move operation
    """
    # Declare global variable first
    global BASE_UPLOAD_DIR
    
    if not os.path.isabs(new_base_dir):
        new_base_dir = os.path.abspath(new_base_dir)
    
    if not os.path.exists(new_base_dir):
        os.makedirs(new_base_dir, exist_ok=True)
    
    old_base_dir = BASE_UPLOAD_DIR
    
    # Don't proceed if paths are the same
    if os.path.normpath(old_base_dir) == os.path.normpath(new_base_dir):
        return {"status": "error", "message": "New location is same as current location"}
    
    stats = {
        "files_moved": 0,
        "bytes_moved": 0,
        "errors": 0
    }
    
    try:
        # First update the config so new uploads go to the new location
        config = get_storage_config()
        old_config = config.copy()
        config["base_dir"] = new_base_dir
        
        # Copy config to new location first
        os.makedirs(new_base_dir, exist_ok=True)
        save_storage_config(config)
        
        # Copy all files from old to new location
        for item in os.listdir(old_base_dir):
            src_path = os.path.join(old_base_dir, item)
            dst_path = os.path.join(new_base_dir, item)
            
            # Skip the config file as we've already created a new one
            if item == STORAGE_CONFIG_FILE:
                continue
                
            if os.path.isdir(src_path):
                # Copy entire directory
                shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
                
                # Count files and size
                for root, _, files in os.walk(src_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if not file.endswith('.meta'):
                            stats["files_moved"] += 1
                            stats["bytes_moved"] += os.path.getsize(file_path)
            else:
                # Copy individual file
                shutil.copy2(src_path, dst_path)
                if not item.endswith('.meta'):
                    stats["files_moved"] += 1
                    stats["bytes_moved"] += os.path.getsize(src_path)
        
        # Update the BASE_UPLOAD_DIR variable
        BASE_UPLOAD_DIR = new_base_dir
        
        logger.info(f"Storage moved from {old_base_dir} to {new_base_dir}")
        stats["status"] = "success"
        stats["old_location"] = old_base_dir
        stats["new_location"] = new_base_dir
        
        return stats
    
    except Exception as e:
        logger.error(f"Error moving storage: {str(e)}")
        # Revert config changes
        if 'old_config' in locals():
            save_storage_config(old_config)
        
        return {
            "status": "error",
            "message": str(e),
            "files_moved": stats["files_moved"],
            "bytes_moved": stats["bytes_moved"]
        }

def get_storage_usage() -> Dict[str, Any]:
    """
    Get statistics about storage usage
    
    Returns:
    - Dict with storage statistics
    """
    stats = {
        "base_dir": BASE_UPLOAD_DIR,
        "total_size_bytes": 0,
        "total_files": 0,
        "folders": {}
    }
    
    for item in os.listdir(BASE_UPLOAD_DIR):
        item_path = os.path.join(BASE_UPLOAD_DIR, item)
        
        # Skip config file
        if item == STORAGE_CONFIG_FILE:
            continue
            
        if os.path.isdir(item_path):
            folder_stats = {
                "size_bytes": 0,
                "file_count": 0,
                "years": {}
            }
            
            # Process years
            for year in os.listdir(item_path):
                year_path = os.path.join(item_path, year)
                if os.path.isdir(year_path) and year.isdigit():
                    year_stats = {"size_bytes": 0, "file_count": 0, "months": {}}
                    
                    # Process months
                    for month in os.listdir(year_path):
                        month_path = os.path.join(year_path, month)
                        if os.path.isdir(month_path) and month.isdigit():
                            month_stats = {"size_bytes": 0, "file_count": 0}
                            
                            # Process days
                            for day in os.listdir(month_path):
                                day_path = os.path.join(month_path, day)
                                if os.path.isdir(day_path) and day.isdigit():
                                    day_size = 0
                                    day_count = 0
                                    
                                    # Count files in day
                                    for file in os.listdir(day_path):
                                        file_path = os.path.join(day_path, file)
                                        if os.path.isfile(file_path) and not file.endswith('.meta'):
                                            day_size += os.path.getsize(file_path)
                                            day_count += 1
                                    
                                    month_stats["size_bytes"] += day_size
                                    month_stats["file_count"] += day_count
                            
                            year_stats["months"][month] = month_stats
                            year_stats["size_bytes"] += month_stats["size_bytes"]
                            year_stats["file_count"] += month_stats["file_count"]
                    
                    folder_stats["years"][year] = year_stats
                    folder_stats["size_bytes"] += year_stats["size_bytes"]
                    folder_stats["file_count"] += year_stats["file_count"]
            
            stats["folders"][item] = folder_stats
            stats["total_size_bytes"] += folder_stats["size_bytes"]
            stats["total_files"] += folder_stats["file_count"]
    
    # Add human-readable sizes
    stats["total_size_human"] = format_file_size(stats["total_size_bytes"])
    
    for folder, folder_stats in stats["folders"].items():
        folder_stats["size_human"] = format_file_size(folder_stats["size_bytes"])
        
        for year, year_stats in folder_stats["years"].items():
            year_stats["size_human"] = format_file_size(year_stats["size_bytes"])
            
            for month, month_stats in year_stats["months"].items():
                month_stats["size_human"] = format_file_size(month_stats["size_bytes"])
    
    return stats

def format_file_size(size_in_bytes):
    """Format file size to human-readable format"""
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes/1024:.2f} KB"
    elif size_in_bytes < 1024 * 1024 * 1024:
        return f"{size_in_bytes/(1024*1024):.2f} MB"
    else:
        return f"{size_in_bytes/(1024*1024*1024):.2f} GB"

def update_retention_policy(days: int) -> Dict[str, Any]:
    """
    Update the global file retention policy
    
    Parameters:
    - days: Number of days to keep files (0 for never expire)
    
    Returns:
    - Updated config
    """
    config = get_storage_config()
    config["retention_days"] = days
    save_storage_config(config)
    
    return config