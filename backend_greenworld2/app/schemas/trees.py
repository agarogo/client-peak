# app/schemas/trees.py
from pydantic import BaseModel, conint, constr
from typing import Optional
from datetime import datetime

class TreeCreate(BaseModel):
    tree_type_id: int  # ID из каталога
    custom_name: Optional[str] = None  # Кастомное имя (опционально)

class TreeUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=100)] = None
    price: Optional[conint(ge=0)] = None

class TreeOut(BaseModel):
    id: int
    created_by: int
    tree_type_id: int
    name: str
    price: int
    lvl: conint(ge=1, le=5)
    next_upgrade_at: datetime
    created_at: datetime
    tree_type_name: str  # Добавляем имя типа дерева

    class Config:
        from_attributes = True
        
    # Добавляем кастомный метод для получения имени типа дерева
    @classmethod
    def from_orm(cls, obj):
        # Создаем словарь с данными
        data = {
            'id': obj.id,
            'created_by': obj.created_by,
            'tree_type_id': obj.tree_type_id,
            'name': obj.name,
            'price': obj.price,
            'lvl': obj.lvl,
            'next_upgrade_at': obj.next_upgrade_at,
            'created_at': obj.created_at,
            'tree_type_name': obj.tree_type.name if obj.tree_type else "Unknown"
        }
        return cls(**data)