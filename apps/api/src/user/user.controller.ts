import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Prisma } from '../../generated/prisma';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  GetUsersQueryDto,
  UserEntity,
} from './dto';
import { User } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ResourceOwnerGuard } from 'src/auth/guards/resource-owner.guard';

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserEntity],
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'name', 'email'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<User[]> {
    const { skip, take, search, sortBy, sortOrder } = query;

    const params: {
      skip?: number;
      take?: number;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    } = {};

    if (skip !== undefined) params.skip = skip;
    if (take !== undefined) params.take = take;

    if (search) {
      params.where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (sortBy) {
      params.orderBy = { [sortBy]: sortOrder || 'asc' };
    }

    return this.userService.getUsers(params);
  }

  @Get('count')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @ApiOperation({ summary: 'Get total count of users' })
  @ApiResponse({
    status: 200,
    description: 'User count retrieved successfully',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  async getUserCount(
    @Query('search') search?: string
  ): Promise<{ count: number }> {
    let where: Prisma.UserWhereInput | undefined;
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const count = await this.userService.getUserCount(where);
    return { count };
  }

  @Get(':id')
  @UseGuards(ResourceOwnerGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Get(':id/social-accounts')
  @UseGuards(ResourceOwnerGuard)
  @ApiOperation({ summary: 'Get user with social accounts' })
  @ApiResponse({
    status: 200,
    description: 'User with social accounts retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async getUserWithSocialAccounts(@Param('id') id: string): Promise<User> {
    return this.userService.getUserWithSocialAccounts(id);
  }

  @Get(':id/recent-posts')
  @UseGuards(ResourceOwnerGuard)
  @ApiOperation({ summary: 'Get user with recent posts' })
  @ApiResponse({
    status: 200,
    description: 'User with recent posts retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent posts to include',
    example: 10,
  })
  async getUserWithRecentPosts(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<User> {
    return this.userService.getUserWithRecentPosts(id, limit);
  }

  @Get('email/:email')
  @UseGuards(ResourceOwnerGuard)
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'email', type: 'string', description: 'User email' })
  async getUserByEmail(@Param('email') email: string): Promise<User | null> {
    console.log('[Controller] GET /users/email/:email called');
    console.log('[Controller] Email param received:', email);

    try {
      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        console.warn('[Controller] No user found for email:', email);
        return null; // or throw new NotFoundException('User not found');
      }

      console.log('[Controller] User found:', user.id); // or log more fields if safe
      return user;
    } catch (error) {
      console.error('[Controller] Error in getUserByEmail:', error);
      throw error; // or wrap in InternalServerErrorException if not already handled
    }
  }

  @Put(':id')
  @UseGuards(ResourceOwnerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(ResourceOwnerGuard)
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.userService.deleteUser(id);
  }
}
