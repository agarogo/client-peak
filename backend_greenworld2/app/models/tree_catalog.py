from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base

class TreeCatalog(Base):
    __tablename__ = "tree_catalog"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    price = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)