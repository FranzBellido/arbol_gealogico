import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ─── System admin actions ──────────────────────────────────

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isApproved: true,
        systemRole: true,
        is_admin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApproval(userId: string, isApproved: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { isApproved } });
  }

  // ─── Tree access management ────────────────────────────────

  /**
   * Solo el administrador del sistema (is_admin) puede gestionar accesos.
   */
  private async assertSystemAdmin(currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
    if (!user?.is_admin) {
      throw new ForbiddenException('Solo el administrador puede gestionar permisos de árbol');
    }
  }

  /** Lista todos los usuarios con acceso a un árbol */
  async getTreeUsers(currentUserId: string, treeId: string) {
    await this.assertSystemAdmin(currentUserId);

    return this.prisma.treeUser.findMany({
      where: { id_tree: treeId },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true, is_admin: true } },
      },
    });
  }

  /** Otorga acceso a un usuario sobre un árbol */
  async grantAccess(currentUserId: string, treeId: string, targetEmail: string) {
    await this.assertSystemAdmin(currentUserId);

    const targetUser = await this.prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) throw new NotFoundException('Usuario con ese correo no encontrado');

    // Upsert: si ya existe no falla
    return this.prisma.treeUser.upsert({
      where: { id_tree_id_user: { id_tree: treeId, id_user: targetUser.id } },
      update: {},
      create: { id_tree: treeId, id_user: targetUser.id },
    });
  }

  /** Revoca el acceso de un usuario a un árbol */
  async revokeAccess(currentUserId: string, treeId: string, targetUserId: string) {
    await this.assertSystemAdmin(currentUserId);

    return this.prisma.treeUser.delete({
      where: { id_tree_id_user: { id_tree: treeId, id_user: targetUserId } },
    });
  }
}
