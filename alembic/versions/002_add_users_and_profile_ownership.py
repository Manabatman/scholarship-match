"""Add users table and user_id to students

Revision ID: 002
Revises: 001
Create Date: 2025-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.add_column("students", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_students_user_id",
        "students",
        "users",
        ["user_id"],
        ["id"],
    )
    op.create_index(op.f("ix_students_user_id"), "students", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_students_user_id"), table_name="students")
    op.drop_constraint("fk_students_user_id", "students", type_="foreignkey")
    op.drop_column("students", "user_id")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
