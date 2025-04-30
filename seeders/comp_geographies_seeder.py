from models.comp_geographies import Geography
from seeders.base_seeder import BaseSeeder

class GeographySeeder(BaseSeeder):
    """Seeder for comp_geographies table"""

    def __init__(self):
        super().__init__(Geography, "comp_geographies", "comp_geographies")