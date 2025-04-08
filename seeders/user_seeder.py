from models.user import User
from seeders.base_seeder import BaseSeeder

class UserSeeder(BaseSeeder):
    """Seeder for users table"""
    
    def __init__(self):
        super().__init__(User, "users", "user")
