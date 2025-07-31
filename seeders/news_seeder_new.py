from models.news import News
from seeders.base_seeder import BaseSeeder

class NewsSeeder(BaseSeeder):
    """Seeder for news table"""

    def __init__(self):
        super().__init__(News, "news", "news")
