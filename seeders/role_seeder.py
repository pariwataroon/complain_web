from models.role import Role
from seeders.base_seeder import BaseSeeder

class RoleSeeder(BaseSeeder):
    """Seeder for roles table"""

    def __init__(self):
        super().__init__(Role, "roles", "roles")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()
