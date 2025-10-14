"""Add name/price/next_upgrade_at to trees and lvl check 1..5

Revision ID: 20251014_add_tree_fields_and_check
Revises: 
Create Date: 2025-10-14
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251014_add_tree_fields_and_check"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table("trees", recreate="auto") as b:
        try:
            b.add_column(sa.Column("name", sa.String(length=100), nullable=False, server_default="Tree"))
        except Exception:
            pass
        try:
            b.add_column(sa.Column("price", sa.Integer(), nullable=False, server_default="0"))
        except Exception:
            pass
        try:
            b.add_column(sa.Column("next_upgrade_at", sa.DateTime(timezone=True), nullable=True))
        except Exception:
            pass
        try:
            b.create_check_constraint("chk_tree_lvl_1_5", "lvl BETWEEN 1 AND 5")
        except Exception:
            pass

def downgrade():
    with op.batch_alter_table("trees", recreate="auto") as b:
        try:
            b.drop_constraint("chk_tree_lvl_1_5", type_="check")
        except Exception:
            pass
        for col in ["next_upgrade_at","price","name"]:
            try:
                b.drop_column(col)
            except Exception:
                pass
