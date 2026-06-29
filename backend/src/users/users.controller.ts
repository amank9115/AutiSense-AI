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
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import {
  NotFoundException,
  ValidationException,
  ForbiddenException,
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
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

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
    // Only persist fields that were actually provided.
    const allowed = [
      'name',
      'phone',
      'licenseNumber',
      'specialization',
      'hospital',
      'yearsExperience',
    ] as const;
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) data[key] = updateData[key];
    }
    if (Object.keys(data).length === 0) {
      throw new ValidationException('At least one field must be provided');
    }

    const updatedUser = await this.usersService.update(req.user.sub, data);

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
   * List all doctors/clinicians (for parents to select when sharing reports)
   */
  @UseGuards(JwtAuthGuard)
  @Get('doctors')
  async listDoctors() {
    return this.usersService.findDoctors();
  }

  /**
   * Get user by ID (super admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.super_admin)
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
   * List all users with pagination (super admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.super_admin)
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
   * Update user role (super admin only)
   *
   * Hardened after security audit (finding C1): the previous `@Roles(Role.doctor)`
   * gate let any doctor promote any account — including their own — to
   * super_admin. Now restricted to super_admin, self-changes are blocked, and
   * every role change is written to the audit log.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.super_admin)
  @Put(':userId/role')
  async updateUserRole(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Body() body: UpdateRoleDto,
  ) {
    const actorId = req.user.sub;

    // Prevent a super admin from changing their own role (e.g. self-demotion
    // that could orphan the last admin, or accidental privilege loss).
    if (userId === actorId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.usersService.findById(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const previousRole = target.role;
    const updatedUser = await this.usersService.update(userId, {
      role: body.role,
    });

    await this.auditService.log({
      actorId,
      actorType: 'user',
      action: 'user.role.updated',
      resourceType: 'user',
      resourceId: userId,
      changes: { from: previousRole, to: body.role },
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
