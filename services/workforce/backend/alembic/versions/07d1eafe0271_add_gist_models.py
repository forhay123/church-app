"""add gist models

Revision ID: 07d1eafe0271
Revises: 714dd6cf4c47
Create Date: 2025-08-30 19:49:12.182879
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '07d1eafe0271'
down_revision: Union[str, Sequence[str], None] = '714dd6cf4c47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ✅ Only add gist_center_id to users
    op.add_column("users", sa.Column("gist_center_id", sa.Integer, nullable=True))
    op.create_foreign_key(
        "fk_users_gist_center",
        "users", "gist_centers",
        ["gist_center_id"], ["id"]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_users_gist_center", "users", type_="foreignkey")
    op.drop_column("users", "gist_center_id")
