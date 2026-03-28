from src.entities.user import User
from src.exceptions.business_exception import NotFoundException
from src.repositories.user_repository import UserRepository
from src.schema.user_schema import AuthenticationRequest, AuthenticationResponse


class UserService:

    @staticmethod
    def authenticate(request: AuthenticationRequest) -> AuthenticationResponse:
        user: User | None = UserRepository.find_by_user_id(request.user_id)
        if not user:
            raise NotFoundException(f"User '{request.user_id}' not found")
        return AuthenticationResponse(ak=user.ak, authed_models=user.authed_models)
