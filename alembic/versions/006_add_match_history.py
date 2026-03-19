"""Add match_runs and match_results tables for match history

Revision ID: 006
Revises: 005
Create Date: 2025-03-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "match_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_match_runs_id"), "match_runs", ["id"], unique=False)
    op.create_index(op.f("ix_match_runs_user_id"), "match_runs", ["user_id"], unique=False)
    op.create_index(op.f("ix_match_runs_profile_id"), "match_runs", ["profile_id"], unique=False)

    op.create_table(
        "match_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("scholarship_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("final_score", sa.Float(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("breakdown", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["match_runs.id"]),
        sa.ForeignKeyConstraint(["scholarship_id"], ["scholarships.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_match_results_id"), "match_results", ["id"], unique=False)
    op.create_index(op.f("ix_match_results_run_id"), "match_results", ["run_id"], unique=False)
    op.create_index(op.f("ix_match_results_scholarship_id"), "match_results", ["scholarship_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_match_results_scholarship_id"), table_name="match_results")
    op.drop_index(op.f("ix_match_results_run_id"), table_name="match_results")
    op.drop_index(op.f("ix_match_results_id"), table_name="match_results")
    op.drop_table("match_results")
    op.drop_index(op.f("ix_match_runs_profile_id"), table_name="match_runs")
    op.drop_index(op.f("ix_match_runs_user_id"), table_name="match_runs")
    op.drop_index(op.f("ix_match_runs_id"), table_name="match_runs")
    op.drop_table("match_runs")
