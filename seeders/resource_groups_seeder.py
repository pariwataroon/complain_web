from models.resource_groups import ResourceGroup
from seeders.base_seeder import BaseSeeder

class ResourceGroupSeeder(BaseSeeder):
    """Seeder for resource_groups table"""

    def __init__(self):
        super().__init__(ResourceGroup, "resource_groups", "resource_groups")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()