# app/models/trees.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tree(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tree_type_id = Column(Integer, ForeignKey("tree_catalog.id"), nullable=False)  # Ссылка на каталог
    
    name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False, default=0)
    lvl = Column(Integer, nullable=False, default=1)
    next_upgrade_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", lazy="joined")
    tree_type = relationship("TreeCatalog", lazy="joined")  # Связь с каталогом

    __table_args__ = (CheckConstraint("lvl BETWEEN 1 AND 5", name="chk_tree_lvl_1_5"),)