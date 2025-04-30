from models.comp_provinces import Province
from seeders.base_seeder import BaseSeeder

class ProvinceSeeder(BaseSeeder):
    """Seeder for comp_provinces table"""

    def __init__(self):
        super().__init__(Province, "comp_provinces", "comp_provinces")