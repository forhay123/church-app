"""add portal_uploads table

Revision ID: 714dd6cf4c47
Revises: 5b0978632990
Create Date: 2025-08-30 05:00:36.814100
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "714dd6cf4c47"
down_revision: Union[str, Sequence[str], None] = "5b0978632990"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add portal_pictures table."""
    op.create_table(
        "portal_pictures",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("filename", sa.String, nullable=False),
        sa.Column("file_url", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("uploaded_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("uploaded_by_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("department_id", sa.Integer, sa.ForeignKey("departments.id")),
        sa.Column("church_id", sa.Integer, sa.ForeignKey("churches.id")),
    )


def downgrade() -> None:
    """Downgrade schema: drop portal_pictures table only."""
    op.drop_table("portal_pictures")
