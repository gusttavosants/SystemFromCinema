import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { RegisterUserRequestDTO } from '@application/dtos';
import { User } from '@domain/user/entities/user.entity';
import type { IUserRepository } from '@domain/user/repositories/user.repository';
import { UserAlreadyExistsException } from '@domain/user/exceptions/user.exceptions';

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterUserRequestDTO): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new UserAlreadyExistsException(dto.email);
    }

    // Hash password
    const saltRounds = 10;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const user = new User(
      dto.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      hashedPassword,
      dto.firstName,
      dto.lastName,
    );

    // Save user
    return this.userRepository.save(user);
  }
}
