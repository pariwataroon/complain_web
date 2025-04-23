from models.department_groups import DepartmentGroup
from seeders.base_seeder import BaseSeeder

class DepartmentGroupSeeder(BaseSeeder):
    """Seeder for department_groups table"""

    def __init__(self):
        super().__init__(DepartmentGroup, "department_groups", "department_groups")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()