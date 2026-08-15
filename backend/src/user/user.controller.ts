import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ─── System admin endpoints ────────────────────────────────

  @Get()
  @UseGuards(AdminGuard)
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Patch(':id/approve')
  @UseGuards(AdminGuard)
  async updateApproval(
    @Param('id') userId: string,
    @Body() body: { isApproved: boolean },
  ) {
    return this.userService.updateApproval(userId, body.isApproved);
  }

  // ─── Tree access management (solo admin del sistema) ───────

  /**
   * GET /users/tree-access?treeId=xxx
   * Lista usuarios con acceso al árbol.
   */
  @Get('tree-access')
  @UseGuards(ApprovedGuard)
  async getTreeUsers(
    @Request() req,
    @Query('treeId') treeId: string,
  ) {
    return this.userService.getTreeUsers(req.user.id, treeId);
  }

  /**
   * POST /users/tree-access
   * Otorga acceso a un usuario sobre un árbol.
   * Solo administradores del sistema (is_admin).
   */
  @Post('tree-access')
  @UseGuards(ApprovedGuard)
  async grantAccess(
    @Request() req,
    @Body() body: { treeId: string; email: string },
  ) {
    return this.userService.grantAccess(req.user.id, body.treeId, body.email);
  }

  /**
   * DELETE /users/tree-access/:userId?treeId=xxx
   * Revoca el acceso de un usuario.
   */
  @Delete('tree-access/:userId')
  @UseGuards(ApprovedGuard)
  async revokeAccess(
    @Request() req,
    @Param('userId') userId: string,
    @Query('treeId') treeId: string,
  ) {
    return this.userService.revokeAccess(req.user.id, treeId, userId);
  }
}
