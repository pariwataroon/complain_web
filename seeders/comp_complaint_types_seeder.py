from models.comp_complaint_types import ComplaintType
from seeders.base_seeder import BaseSeeder

class ComplaintTypeSeeder(BaseSeeder):
    """Seeder for comp_complaint_types table"""

    def __init__(self):
        super().__init__(ComplaintType, "comp_complaint_types", "comp_complaint_types")