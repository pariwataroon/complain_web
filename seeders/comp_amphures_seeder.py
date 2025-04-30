from models.comp_amphures import Amphure
from seeders.base_seeder import BaseSeeder

class AmphureSeeder(BaseSeeder):
    """Seeder for comp_amphures table"""

    def __init__(self):
        super().__init__(Amphure, "comp_amphures", "comp_amphures")