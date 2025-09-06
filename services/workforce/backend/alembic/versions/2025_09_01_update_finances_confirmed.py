"""Update finances table to match models (confirmed fields + nullable extra_details)"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = "2025_09_01_update_finances_confirmed"
down_revision = "e3f16aa7ff38"
branch_labels = None
depends_on = None


def upgrade():
    # Allow NULL on extra_details
    op.alter_column("finances", "extra_details",
                    existing_type=sa.dialects.postgresql.JSONB(),
                    nullable=True)

    # Add confirmed field if missing
    op.add_column("finances", sa.Column("confirmed", sa.Boolean(), server_default=sa.text("false")))

    # Add confirmed_by_id
    op.add_column("finances", sa.Column("confirmed_by_id", sa.Integer(), nullable=True))

    # Add confirmed_at timestamp
    op.add_column("finances", sa.Column("confirmed_at", sa.DateTime(), nullable=True))

    # Add foreign key to users
    op.create_foreign_key(
        "finances_confirmed_by_fkey",
        "finances",
        "users",
        ["confirmed_by_id"],
        ["id"],
    )


def downgrade():
    # Drop foreign key
    op.drop_constraint("finances_confirmed_by_fkey", "finances", type_="foreignkey")

    # Drop columns
    op.drop_column("finances", "confirmed_at")
    op.drop_column("finances", "confirmed_by_id")
    op.drop_column("finances", "confirmed")

    # Revert extra_details to NOT NULL
    op.alter_column("finances", "extra_details",
                    existing_type=sa.dialects.postgresql.JSONB(),
                    nullable=False)
