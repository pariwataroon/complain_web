from typing import List, Optional
from pydantic import BaseModel, field_validator


class GeographyBase(BaseModel):
    name: str


class GeographyCreate(GeographyBase):
    pass


class GeographyUpdate(GeographyBase):
    name: Optional[str] = None


class Geography(GeographyBase):
    id: int

    class Config:
        from_attributes = True


class ProvinceBase(BaseModel):
    code: str
    name_th: str
    name_en: str
    geography_id: int


class ProvinceCreate(ProvinceBase):
    pass


class ProvinceUpdate(ProvinceBase):
    code: Optional[str] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    geography_id: Optional[int] = None


class Province(ProvinceBase):
    id: int

    class Config:
        from_attributes = True


class AmphureBase(BaseModel):
    code: str
    name_th: str
    name_en: str
    province_id: int


class AmphureCreate(AmphureBase):
    pass


class AmphureUpdate(AmphureBase):
    code: Optional[str] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    province_id: Optional[int] = None


class Amphure(AmphureBase):
    id: int

    class Config:
        from_attributes = True


class DistrictBase(BaseModel):
    id: str
    zip_code: int
    name_th: str
    name_en: str
    amphure_id: int


class DistrictCreate(DistrictBase):
    pass


class DistrictUpdate(DistrictBase):
    zip_code: Optional[int] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    amphure_id: Optional[int] = None


class District(DistrictBase):
    class Config:
        from_attributes = True


class GeographyWithProvince(Geography):
    provinces: List[Province] = []


class ProvinceWithAmphures(Province):
    amphures: List[Amphure] = []


class AmphureWithDistricts(Amphure):
    districts: List[District] = []


class FullProvince(Province):
    amphures: List[AmphureWithDistricts] = []


class FullGeography(Geography):
    provinces: List[FullProvince] = []