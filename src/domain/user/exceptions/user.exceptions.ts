import { CinemaException } from '@shared/exceptions/cinema.exception';

export class UserNotFoundException extends CinemaException {
  constructor(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(`User with ID ${userId} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class UserAlreadyExistsException extends CinemaException {
  constructor(email: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(
      `User with email ${email} already exists`,
      'USER_ALREADY_EXISTS',
      409,
    );
  }
}

export class InvalidCredentialsException extends CinemaException {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }
}

export class UnauthorizedException extends CinemaException {
  constructor(message = 'Unauthorized access') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(message, 'UNAUTHORIZED', 401);
  }
}
