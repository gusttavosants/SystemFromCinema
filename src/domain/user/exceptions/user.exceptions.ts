import { CinemaException } from '@shared/exceptions/cinema.exception';

export class UserNotFoundException extends CinemaException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class UserAlreadyExistsException extends CinemaException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS', 409);
  }
}

export class InvalidCredentialsException extends CinemaException {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
}

export class UnauthorizedException extends CinemaException {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
