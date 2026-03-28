from dataclasses import dataclass, field


@dataclass
class User:
    user_id: str = ""
    username: str = ""
    ak: str = ""
    authed_models: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "userId": self.user_id,
            "username": self.username,
            "ak": self.ak,
            "authedmodels": self.authed_models,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(
            user_id=data.get("userId", ""),
            username=data.get("username", ""),
            ak=data.get("ak", ""),
            authed_models=data.get("authedmodels", {}),
        )
