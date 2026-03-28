import json
import os
from typing import Optional

from src.entities.user import User

_USER_AUTH_PATH = os.path.join(os.path.dirname(__file__), "../../config/user_auth.json")


class UserRepository:

    @staticmethod
    def _query_from_db(user_id: str) -> Optional[User]:
        """Query user from database by userId. TODO: implement when DB is connected."""
        return None

    @staticmethod
    def _query_from_db_by_ak(ak: str) -> Optional[User]:
        """Query user from database by ak. TODO: implement when DB is connected."""
        return None

    @staticmethod
    def _load_json() -> list[dict]:
        try:
            with open(_USER_AUTH_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def find_by_user_id(user_id: str) -> Optional[User]:
        """Find user by userId. Falls back to local JSON if DB is unavailable."""
        db_user = UserRepository._query_from_db(user_id)
        if db_user:
            return db_user

        for item in UserRepository._load_json():
            if item.get("userId") == user_id:
                return User.from_dict(item)
        return None

    @staticmethod
    def find_by_ak(ak: str) -> Optional[User]:
        """Find user by ak (access key). Falls back to local JSON if DB is unavailable."""
        db_user = UserRepository._query_from_db_by_ak(ak)
        if db_user:
            return db_user

        for item in UserRepository._load_json():
            if item.get("ak") == ak:
                return User.from_dict(item)
        return None
