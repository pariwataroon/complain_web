from models.time_setting import TimeSetting
from seeders.base_seeder import BaseSeeder

class TimeSettingSeeder(BaseSeeder):
    """Seeder for time_settings table"""

    def __init__(self):
        super().__init__(TimeSetting, "time_settings", "time_setting")