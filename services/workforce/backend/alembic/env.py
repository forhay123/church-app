import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend/ to sys.path so "app" can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Alembic config
config = context.config

# overwrite sqlalchemy.url with env var
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import models' metadata
from app.db.base import Base  # Base that imports all models
target_metadata = Base.metadata


# 🚫 Prevent dropping existing tables
def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in {
        "messages",
        "message_recipients",
        "message_responses",
        "permissions",
        "portal_pictures",
    }:
        # skip these completely (no drops/changes)
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,  # ✅ add here too
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True,
            include_object=include_object,  # ✅ add here
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
