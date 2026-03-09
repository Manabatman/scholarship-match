"""Add preferred_courses to students

Revision ID: 003
Revises: 002
Create Date: 2025-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("preferred_courses", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("students", "preferred_courses")
