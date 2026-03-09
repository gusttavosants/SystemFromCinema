import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { LoginUserRequestDTO, AuthResponseDTO } from '@application/dtos';
import type { IUserRepository } from '@domain/user/repositories/user.repository';
import { InvalidCredentialsException } from '@domain/user/exceptions/user.exceptions';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginUserRequestDTO): Promise<AuthResponseDTO> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new InvalidCredentialsException();
    }

    // Verify password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.getPassword(),
    );
    if (!isPasswordValid) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new InvalidCredentialsException();
    }

    // Generate JWT token
    const payload = { sub: user.getId(), email: user.getEmail() };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: 86400, // 24 hours
      tokenType: 'Bearer',
      user: {
        id: user.getId(),
        email: user.getEmail(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
      },
    };
  }
}
