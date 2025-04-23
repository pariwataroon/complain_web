from models.position import Position
from seeders.base_seeder import BaseSeeder

class PositionSeeder(BaseSeeder):
    """Seeder for position table"""

    def __init__(self):
        super().__init__(Position, "positions", "positions")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()
