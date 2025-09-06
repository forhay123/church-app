"""Add new roles to role enum

Revision ID: abc123def456
Revises: 899f06f400a2
Create Date: 2025-08-27
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "abc123def456"
down_revision = "899f06f400a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new enum values
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'LEAD_PASTOR';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'ASSOCIATE_PASTOR';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'ACADEMY_HEAD';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'GIST_HEAD';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'TEENS_HEAD';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'GLOBAL_LEADS';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'HEAD_A';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'HEAD_B';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'HEAD_C';")
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'HEAD_D';")


def downgrade() -> None:
    # ⚠️ Postgres does not support removing enum values easily.
    # You'd have to create a new enum type without the values and migrate.
    # So we leave this as a no-op.
    pass
