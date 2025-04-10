from models.title import Title
from seeders.base_seeder import BaseSeeder

class TitleSeeder(BaseSeeder):
    """Seeder for titles table"""

    def __init__(self):
        super().__init__(Title,  "comp_titles", "titles")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()
