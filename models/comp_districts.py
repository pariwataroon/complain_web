from sqlalchemy import Column, Integer, NVARCHAR, VARCHAR, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class District(Base):
    __tablename__ = "comp_districts"
    

    id = Column(VARCHAR(6), primary_key=True)
    zip_code = Column(Integer, nullable=False)
    name_th = Column(NVARCHAR(150), nullable=False)
    name_en = Column(NVARCHAR(150), nullable=False)
    amphure_id = Column(Integer, ForeignKey("comp_amphures.id"), nullable=False, default=0)

    amphure = relationship("Amphure", back_populates="districts")