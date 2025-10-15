from pydantic import BaseModel

class TreeCatalogBase(BaseModel):
    name: str
    price: int
    description: str | None = None
    image_url: str | None = None

class TreeCatalogCreate(TreeCatalogBase):
    pass

class TreeCatalogOut(TreeCatalogBase):
    id: int

    class Config:
        from_attributes = True