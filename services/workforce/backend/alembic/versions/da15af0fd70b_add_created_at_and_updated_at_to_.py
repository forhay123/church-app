"""Add created_at and updated_at to finances

Revision ID: da15af0fd70b
Revises: ef2aad1b1540
Create Date: 2025-09-01 11:15:30.029100
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = 'da15af0fd70b'
down_revision = 'ef2aad1b1540'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'finances',
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
    op.add_column(
        'finances',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('finances', 'created_at')
    op.drop_column('finances', 'updated_at')
