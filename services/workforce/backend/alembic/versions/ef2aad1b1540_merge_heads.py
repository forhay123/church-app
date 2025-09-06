"""merge heads

Revision ID: ef2aad1b1540
Revises: 0ae4454aa70b, 2025_09_01_update_finances_confirmed
Create Date: 2025-09-01 10:39:30.063784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef2aad1b1540'
down_revision: Union[str, Sequence[str], None] = ('0ae4454aa70b', '2025_09_01_update_finances_confirmed')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
