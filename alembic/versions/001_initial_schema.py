"""Initial schema - students and scholarships tables

Revision ID: 001
Revises:
Create Date: 2025-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("education_level", sa.String(), nullable=True),
        sa.Column("current_academic_stage", sa.String(), nullable=True),
        sa.Column("target_academic_year", sa.String(), nullable=True),
        sa.Column("region", sa.String(), nullable=True),
        sa.Column("province", sa.String(), nullable=True),
        sa.Column("city_municipality", sa.String(), nullable=True),
        sa.Column("barangay", sa.String(), nullable=True),
        sa.Column("school_type", sa.String(), nullable=True),
        sa.Column("school", sa.String(), nullable=True),
        sa.Column("target_school", sa.String(), nullable=True),
        sa.Column("gwa_raw", sa.String(), nullable=True),
        sa.Column("gwa_scale", sa.String(), nullable=True),
        sa.Column("gwa_normalized", sa.Float(), nullable=True),
        sa.Column("field_of_study_broad", sa.String(), nullable=True),
        sa.Column("field_of_study_specific", sa.String(), nullable=True),
        sa.Column("extracurriculars", sa.Text(), nullable=True),
        sa.Column("awards", sa.Text(), nullable=True),
        sa.Column("household_income_annual", sa.Integer(), nullable=True),
        sa.Column("income_bracket", sa.String(), nullable=True),
        sa.Column("is_underprivileged", sa.Boolean(), nullable=True),
        sa.Column("is_pwd", sa.Boolean(), nullable=True),
        sa.Column("is_indigenous_people", sa.Boolean(), nullable=True),
        sa.Column("ip_tribe_name", sa.String(), nullable=True),
        sa.Column("is_solo_parent_dependent", sa.Boolean(), nullable=True),
        sa.Column("is_ofw_dependent", sa.Boolean(), nullable=True),
        sa.Column("ofw_parent_type", sa.String(), nullable=True),
        sa.Column("is_farmer_fisher_dependent", sa.Boolean(), nullable=True),
        sa.Column("is_4ps_listahanan", sa.Boolean(), nullable=True),
        sa.Column("parent_occupation", sa.String(), nullable=True),
        sa.Column("documents", sa.Text(), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=True),
        sa.Column("profile_completeness", sa.Float(), nullable=True),
        sa.Column("needs", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_students_id"), "students", ["id"], unique=False)
    op.create_index(op.f("ix_students_email"), "students", ["email"], unique=True)

    op.create_table(
        "scholarships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("link", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("countries", sa.String(), nullable=True),
        sa.Column("regions", sa.String(), nullable=True),
        sa.Column("eligible_levels", sa.Text(), nullable=True),
        sa.Column("eligible_regions", sa.Text(), nullable=True),
        sa.Column("eligible_cities", sa.Text(), nullable=True),
        sa.Column("residency_required", sa.Boolean(), nullable=True),
        sa.Column("eligible_school_types", sa.Text(), nullable=True),
        sa.Column("eligible_courses_psced", sa.Text(), nullable=True),
        sa.Column("eligible_courses_specific", sa.Text(), nullable=True),
        sa.Column("citizenship_required", sa.String(), nullable=True),
        sa.Column("max_income_threshold", sa.Integer(), nullable=True),
        sa.Column("min_gwa_normalized", sa.Float(), nullable=True),
        sa.Column("min_age", sa.Integer(), nullable=True),
        sa.Column("max_age", sa.Integer(), nullable=True),
        sa.Column("provider_type", sa.String(), nullable=True),
        sa.Column("scholarship_type", sa.String(), nullable=True),
        sa.Column("priority_groups", sa.Text(), nullable=True),
        sa.Column("preferred_extracurriculars", sa.Text(), nullable=True),
        sa.Column("preferred_awards", sa.Text(), nullable=True),
        sa.Column("benefit_tuition", sa.Boolean(), nullable=True),
        sa.Column("benefit_allowance_monthly", sa.Integer(), nullable=True),
        sa.Column("benefit_books", sa.Boolean(), nullable=True),
        sa.Column("benefit_miscellaneous", sa.Text(), nullable=True),
        sa.Column("benefit_total_value", sa.Integer(), nullable=True),
        sa.Column("required_documents", sa.Text(), nullable=True),
        sa.Column("has_qualifying_exam", sa.Boolean(), nullable=True),
        sa.Column("has_interview", sa.Boolean(), nullable=True),
        sa.Column("has_essay_requirement", sa.Boolean(), nullable=True),
        sa.Column("has_return_service", sa.Boolean(), nullable=True),
        sa.Column("application_deadline", sa.Date(), nullable=True),
        sa.Column("application_open_date", sa.Date(), nullable=True),
        sa.Column("academic_year_target", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("level", sa.String(), nullable=True),
        sa.Column("needs_tags", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scholarships_id"), "scholarships", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_scholarships_id"), table_name="scholarships")
    op.drop_table("scholarships")
    op.drop_index(op.f("ix_students_email"), table_name="students")
    op.drop_index(op.f("ix_students_id"), table_name="students")
    op.drop_table("students")
