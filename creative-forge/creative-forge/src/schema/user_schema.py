from pydantic import BaseModel, Field


class AuthenticationRequest(BaseModel):
    user_id: str = Field(..., alias="userId")

    model_config = {"populate_by_name": True}


class AuthenticationResponse(BaseModel):
    ak: str
    authed_models: dict = Field(..., alias="authedModels", serialization_alias="authedModels")

    model_config = {"populate_by_name": True}
