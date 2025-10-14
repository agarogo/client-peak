"""add check for trees.lvl 1..5

Revision ID: 20251014_0001
Revises: 
Create Date: 2025-10-14

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "20251014_0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add check constraint; ignore if already exists
    conn = op.get_bind()
    try:
        op.create_check_constraint(
            "chk_tree_lvl_1_5",
            "trees",
            "lvl BETWEEN 1 AND 5"
        )
    except Exception:
        pass

def downgrade():
    try:
        op.drop_constraint("chk_tree_lvl_1_5", "trees", type_="check")
    except Exception:
        pass
