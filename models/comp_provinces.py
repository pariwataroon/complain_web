from sqlalchemy import Column, Integer, NVARCHAR, VARCHAR, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Province(Base):
    __tablename__ = "comp_provinces"
    

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(VARCHAR(2), nullable=False)
    name_th = Column(NVARCHAR(150), nullable=False)
    name_en = Column(NVARCHAR(150), nullable=False)
    geography_id = Column(Integer, ForeignKey("comp_geographies.id"), nullable=False, default=0)

    geography = relationship("Geography", back_populates="provinces")
    amphures = relationship("Amphure", back_populates="province")