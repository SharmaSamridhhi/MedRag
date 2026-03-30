"""remove content and embedding from documents

Revision ID: 20da38ca9acf
Revises: a8acc4ce066d
Create Date: 2026-03-29 18:41:14.547514

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector 
from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = '20da38ca9acf'
down_revision: Union[str, Sequence[str], None] = 'a8acc4ce066d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('documents', 'content')
    op.drop_column('documents', 'embedding')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('documents', sa.Column('content', sa.Text(), nullable=True))
    op.add_column('documents', sa.Column('embedding', Vector(1536), nullable=True))
