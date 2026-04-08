"""merge heads

Revision ID: b679fc0af518
Revises: 3855dd7608dd, b1c2d3e4f5a6
Create Date: 2026-04-08 10:47:34.706179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b679fc0af518'
down_revision: Union[str, Sequence[str], None] = ('3855dd7608dd', 'b1c2d3e4f5a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
