class BusinessException(Exception):
    """Base exception for business logic errors."""
    def __init__(self, message: str, code: str = "BUSINESS_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundException(BusinessException):
    """Resource not found exception."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND")


class ValidationException(BusinessException):
    """Validation error exception."""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, code="VALIDATION_ERROR")


class DatabaseUnavailableException(BusinessException):
    """Database unavailable exception."""
    def __init__(self, message: str = "Database is unavailable"):
        super().__init__(message, code="DATABASE_UNAVAILABLE")
