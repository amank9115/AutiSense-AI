import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  ValidationException,
} from '../common/exceptions';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateChildDto } from './dto/create-child.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string; sub: string; role: Role };
}

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user's profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Update current user's profile
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateData: UpdateProfileDto,
  ) {
    if (!updateData.name && !updateData.phone) {
      throw new ValidationException('At least one field must be provided');
    }

    const updatedUser = await this.usersService.update(req.user.sub, {
      name: updateData.name,
      phone: updateData.phone,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  /**
   * Delete current user's account (soft delete with caution)
   */
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteProfile(@Request() req: RequestWithUser) {
    // In a real app, consider soft delete or async deletion with confirmation
    // For now, we'll just remove the user
    await this.usersService.delete(req.user.sub);
    return { message: 'Account deleted successfully' };
  }

  /**
   * Get user by ID (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * List all users with pagination (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Get()
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: Role,
  ) {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = parseInt(limit ?? '10', 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new ValidationException('Page and limit must be positive numbers');
    }

    return this.usersService.findMany({
      page: pageNum,
      limit: limitNum,
      role,
    });
  }

  /**
   * Update user role (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Put(':userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: UpdateRoleDto,
  ) {
    const updatedUser = await this.usersService.update(userId, {
      role: body.role,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  /**
   * Change password for current user
   */
  @UseGuards(JwtAuthGuard)
  @Put('me/change-password')
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new ValidationException('New passwords do not match');
    }

    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Add a child profile for the current user
   */
  @UseGuards(JwtAuthGuard)
  @Post('me/children')
  async addChild(
    @Request() req: RequestWithUser,
    @Body() createChildDto: CreateChildDto,
  ) {
    return this.usersService.addChild(req.user.sub, {
      name: createChildDto.name,
      dateOfBirth: new Date(createChildDto.dateOfBirth),
      gender: createChildDto.gender,
      medicalNotes: createChildDto.medicalNotes,
    });
  }

  /**
   * Get all children profiles for the current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('me/children')
  async getChildren(@Request() req: RequestWithUser) {
    return this.usersService.getChildren(req.user.sub, req.user.role);
  }
}
