from models.resource import Resource
from seeders.base_seeder import BaseSeeder

class ResourceSeeder(BaseSeeder):
    """Seeder for resources table"""

    def __init__(self):
        super().__init__(Resource, "resources", "resources")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()
