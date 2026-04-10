"""add avatar_url to users

Revision ID: d1e2f3a4b5c6
Revises: 375a51747a52
Create Date: 2026-04-09 19:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = '375a51747a52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'avatar_url')