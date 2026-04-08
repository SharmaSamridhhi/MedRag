from database import SessionLocal
from models import ChatSession, ChatMessage
from datetime import datetime, timezone

MAX_TURNS = 6


def _ensure_session(db, session_id: str, user_id: int = None, first_message: str = None):
    """Create session row if it doesn't exist yet."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        title = (first_message[:60] + "…") if first_message and len(first_message) > 60 else first_message
        session = ChatSession(
            id=session_id,
            user_id=user_id or 0,
            title=title or "New conversation",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(session)
        db.commit()
    return session


def get_history(session_id: str) -> list:
    """Returns last MAX_TURNS turns as a list of {role, content} dicts for LLM context."""
    db = SessionLocal()
    try:
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.id.asc())
            .all()
        )
        # Return last MAX_TURNS * 2 messages (each turn = user + assistant)
        recent = messages[-(MAX_TURNS * 2):]
        return [{"role": m.role, "content": m.content} for m in recent]
    finally:
        db.close()


def add_turn(session_id: str, user_message: str, assistant_message: str, user_id: int = None):
    """Persist one full turn (user + assistant) to the database."""
    db = SessionLocal()
    try:
        _ensure_session(db, session_id, user_id=user_id, first_message=user_message)

        db.add(ChatMessage(session_id=session_id, role="user", content=user_message))
        db.add(ChatMessage(session_id=session_id, role="assistant", content=assistant_message))

        # Update session timestamp
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.updated_at = datetime.now(timezone.utc)

        db.commit()
    finally:
        db.close()


def clear_history(session_id: str):
    """Delete all messages for a session (keeps the session row)."""
    db = SessionLocal()
    try:
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        db.commit()
    finally:
        db.close()


def get_all_messages(session_id: str) -> list:
    """Returns all messages for the history endpoint."""
    db = SessionLocal()
    try:
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.id.asc())
            .all()
        )
        return [{"role": m.role, "content": m.content} for m in messages]
    finally:
        db.close()


def get_user_sessions(user_id: int) -> list:
    """Returns all sessions for a user, newest first."""
    db = SessionLocal()
    try:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )
        return [
            {
                "sessionId": s.id,
                "title": s.title or "Untitled conversation",
                "createdAt": s.created_at.isoformat(),
                "updatedAt": s.updated_at.isoformat(),
            }
            for s in sessions
        ]
    finally:
        db.close()