from collections import defaultdict
from typing import List, Dict

_store: Dict[str, List[Dict]] = defaultdict(list)

MAX_TURNS = 6


def get_history(session_id: str) -> List[Dict]:
    """Returns the last MAX_TURNS turns (each turn = 1 user + 1 assistant message)."""
    messages = _store[session_id]
    return messages[-(MAX_TURNS * 2):]


def add_turn(session_id: str, user_message: str, assistant_message: str):
    """Appends one full turn (user + assistant) to the session history."""
    _store[session_id].append({"role": "user", "content": user_message})
    _store[session_id].append({"role": "assistant", "content": assistant_message})


def clear_history(session_id: str):
    """Clears all history for a session."""
    _store[session_id] = []


def get_all_messages(session_id: str) -> List[Dict]:
    """Returns the raw message list for the history endpoint."""
    return _store.get(session_id, [])