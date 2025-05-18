from models.comp_complaint_types import ComplaintChannel
from seeders.base_seeder import BaseSeeder

class ComplaintChannelSeeder(BaseSeeder):
    """Seeder for comp_complaint_channels table"""

    def __init__(self):
        super().__init__(ComplaintChannel, "comp_complaint_channels", "comp_complaint_channels")