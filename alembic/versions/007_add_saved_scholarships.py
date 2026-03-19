"""Add saved_scholarships table for user bookmarks

Revision ID: 007
Revises: 006
Create Date: 2025-03-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_scholarships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("scholarship_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["scholarship_id"], ["scholarships.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "scholarship_id", name="uq_saved_scholarships_user_scholarship"),
    )
    op.create_index(op.f("ix_saved_scholarships_id"), "saved_scholarships", ["id"], unique=False)
    op.create_index(op.f("ix_saved_scholarships_user_id"), "saved_scholarships", ["user_id"], unique=False)
    op.create_index(op.f("ix_saved_scholarships_scholarship_id"), "saved_scholarships", ["scholarship_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_saved_scholarships_scholarship_id"), table_name="saved_scholarships")
    op.drop_index(op.f("ix_saved_scholarships_user_id"), table_name="saved_scholarships")
    op.drop_index(op.f("ix_saved_scholarships_id"), table_name="saved_scholarships")
    op.drop_table("saved_scholarships")
