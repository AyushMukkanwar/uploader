// src/database/repositories/user.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Prisma } from 'generated/prisma';
import { BaseRepository } from './base.repository';

export interface IUserRepository
  extends BaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereInput,
    Prisma.UserOrderByWithRelationInput
  > {
  findByEmail(email: string): Promise<User | null>;
  findWithSocialAccounts(id: string): Promise<User | null>;
  findWithRecentPosts(id: string, limit?: number): Promise<User | null>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findWithSocialAccounts(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        socialAccounts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findWithRecentPosts(id: string, limit = 5): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { socialAccount: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params || {};
    return await this.prisma.user.findMany({ skip, take, where, orderBy });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return await this.prisma.user.delete({ where: { id } });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return await this.prisma.user.count({ where });
  }
}
