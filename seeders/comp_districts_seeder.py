from models.comp_districts import District
from seeders.base_seeder import BaseSeeder

class DistrictSeeder(BaseSeeder):
    """Seeder for comp_districts table"""

    def __init__(self):
        super().__init__(District, "comp_districts", "comp_districts")