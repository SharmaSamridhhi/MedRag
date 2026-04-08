"""merge heads

Revision ID: 375a51747a52
Revises: b679fc0af518, c2d3e4f5a6b7
Create Date: 2026-04-08 18:55:07.059580

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '375a51747a52'
down_revision: Union[str, Sequence[str], None] = ('b679fc0af518', 'c2d3e4f5a6b7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
