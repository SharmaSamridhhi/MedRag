from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Float
from sqlalchemy.dialects.postgresql import ARRAY

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)  # foreign key optional for now
    content = Column(Text)
    embedding = Column(ARRAY(Float))  # pgvector can store as array of floats