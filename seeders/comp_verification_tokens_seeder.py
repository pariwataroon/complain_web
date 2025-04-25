from models.verification_token import VerificationToken
from seeders.base_seeder import BaseSeeder

class VerificationTokenSeeder(BaseSeeder):
    """Seeder for verification token seeder table"""

    def __init__(self):
        super().__init__(VerificationToken, "verification_tokens", "verification_tokens")

    # สามารถ override วิธีการ seed เฉพาะของตารางนี้ได้ถ้าต้องการ logic พิเศษ
    # def seed(self):
    #     # Custom seeding logic here
    #     return super().seed()

