from sqlalchemy import Column, Integer, NVARCHAR, VARCHAR, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Amphure(Base):
    __tablename__ = "comp_amphures"
    __table_args__ = {"schema": "dbo"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(VARCHAR(4), nullable=False)
    name_th = Column(NVARCHAR(150), nullable=False)
    name_en = Column(NVARCHAR(150), nullable=False)
    province_id = Column(Integer, ForeignKey("dbo.comp_provinces.id"), nullable=False, default=0)

    province = relationship("Province", back_populates="amphures")
    districts = relationship("District", back_populates="amphure")