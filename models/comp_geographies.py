from sqlalchemy import Column, Integer, NVARCHAR, VARCHAR, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Geography(Base):
    __tablename__ = "comp_geographies"
    

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(NVARCHAR(255), nullable=False)

    provinces = relationship("Province", back_populates="geography")