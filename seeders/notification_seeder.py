from models.notification import Notification
from seeders.base_seeder import BaseSeeder

class NotificationSeeder(BaseSeeder):
    """Seeder for notification table"""

    def __init__(self):
        super().__init__(Notification, "notifications", "notification")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()
