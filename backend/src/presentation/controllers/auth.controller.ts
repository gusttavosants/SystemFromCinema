import { Body, Controller, Post, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import {
  RegisterUserRequestDTO,
  LoginUserRequestDTO,
  AuthResponseDTO,
} from '@application/dtos';
import { RegisterUserUseCase, LoginUserUseCase } from '@application/use-cases';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @Version('1')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with the provided information',
  })
  @ApiBody({
    type: RegisterUserRequestDTO,
    description: 'User registration data',
    examples: {
      example: {
        summary: 'Register new user',
        value: {
          email: 'user@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-123' },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        createdAt: { type: 'string', example: '2024-01-15T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterUserRequestDTO) {
    const user = await this.registerUserUseCase.execute(registerDto);
    return {
      id: user.getId(),
      email: user.getEmail(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      createdAt: user.createdAt,
    };
  }

  @Post('login')
  @Version('1')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT access token',
  })
  @ApiBody({
    type: LoginUserRequestDTO,
    description: 'User login credentials',
    examples: {
      example: {
        summary: 'User login',
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async login(@Body() loginDto: LoginUserRequestDTO): Promise<AuthResponseDTO> {
    return this.loginUserUseCase.execute(loginDto);
  }
}
