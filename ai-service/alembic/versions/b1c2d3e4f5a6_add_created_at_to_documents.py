"""add created_at to documents

Revision ID: b1c2d3e4f5a6
Revises: a8acc4ce066d
Create Date: 2026-04-08 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a8acc4ce066d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'documents',
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        )
    )


def downgrade() -> None:
    op.drop_column('documents', 'created_at')
