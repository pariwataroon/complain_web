from models.chat_bot import ChatBot
from seeders.base_seeder import BaseSeeder

class ChatBotSeeder(BaseSeeder):
    """Seeder for chat_bot table"""

    def __init__(self):
        super().__init__(ChatBot, "chat_bot", "chat_bot")