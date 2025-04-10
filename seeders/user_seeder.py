from models.user import User
from seeders.base_seeder import BaseSeeder

class UserSeeder(BaseSeeder):
    """Seeder for users table"""

    def __init__(self):
        super().__init__(User,  "comp_users", "users")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()

