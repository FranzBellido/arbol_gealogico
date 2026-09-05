import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Gender } from "@prisma/client";

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // Permission helpers
  // ─────────────────────────────────────────────

  private async resolveAccess(currentUserId: string, treeId: string) {
    const [tree, user, membership] = await Promise.all([
      this.prisma.tree.findUnique({ where: { id: treeId } }),
      this.prisma.user.findUnique({ where: { id: currentUserId } }),
      this.prisma.treeUser.findUnique({
        where: { id_tree_id_user: { id_tree: treeId, id_user: currentUserId } },
      }),
    ]);

    if (!tree) throw new NotFoundException("Árbol no encontrado");
    if (!user) throw new NotFoundException("Usuario no encontrado");

    const isSystemAdmin = user.is_admin === true;
    const isMember = isSystemAdmin || membership !== null;

    return { isMember, isSystemAdmin, tree, user };
  }

  private async requireMembership(currentUserId: string, treeId: string) {
    const { isMember } = await this.resolveAccess(currentUserId, treeId);
    if (!isMember)
      throw new ForbiddenException("No tienes acceso a este árbol");
  }

  private async requireAdmin(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user?.is_admin)
      throw new ForbiddenException(
        "Solo el administrador puede realizar esta acción",
      );
  }

  // ─────────────────────────────────────────────
  // Tree management
  // ─────────────────────────────────────────────

  async getAccessibleTrees(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (user?.is_admin) {
      const trees = await this.prisma.tree.findMany({
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
      });
      return trees.map((t) => ({ ...t, role: "ADMIN" }));
    }

    const memberships = await this.prisma.treeUser.findMany({
      where: { id_user: currentUserId },
      include: {
        tree: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({ ...m.tree, role: "MEMBER" }));
  }

  async createTree(creatorId: string, name: string) {
    const { randomUUID } = await import("crypto");
    const newTree = await this.prisma.tree.create({
      data: { id: randomUUID(), name },
    });
    // Agregar al creador como miembro
    await this.prisma.treeUser.create({
      data: { id_tree: newTree.id, id_user: creatorId },
    });
    return newTree;
  }

  // ─────────────────────────────────────────────
  // Tree persons & unions
  // ─────────────────────────────────────────────

  async getTree(currentUserId: string, treeId: string) {
    const { isMember, isSystemAdmin } = await this.resolveAccess(
      currentUserId,
      treeId,
    );
    if (!isMember)
      throw new ForbiddenException("No tienes acceso a este árbol");

    const persons = await this.prisma.person.findMany({
      where: { tree_id: treeId },
      include: { photos: true },
    });

    const personIds = persons.map((p) => p.id);

    const unions =
      personIds.length > 0
        ? await this.prisma.union.findMany({
            where: {
              OR: [
                { partner1Id: { in: personIds } },
                { partner2Id: { in: personIds } },
              ],
            },
          })
        : [];

    return {
      persons,
      unions,
      permission: { canWrite: true, isAdmin: isSystemAdmin },
    };
  }

  // ─────────────────────────────────────────────
  // Person CRUD
  // ─────────────────────────────────────────────

  async createPerson(
    currentUserId: string,
    treeId: string,
    data: {
      firstName: string;
      lastName: string;
      lastName2?: string;
      email?: string;
      phone?: string;
      address?: string;
      maidenName?: string;
      gender: Gender;
      isLiving?: boolean;
      birthDate?: string;
      birthPlace?: string;
      deathDate?: string;
      deathPlace?: string;
      biography?: string;
      avatarUrl?: string;
      fatherId?: string;
      motherId?: string;
    },
  ) {
    await this.requireMembership(currentUserId, treeId);

    return this.prisma.person.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        lastName2: data.lastName2 ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        maidenName: data.maidenName ?? null,
        gender: data.gender,
        isLiving: data.isLiving ?? true,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace ?? null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        deathPlace: data.deathPlace ?? null,
        biography: data.biography ?? null,
        avatarUrl: data.avatarUrl ?? null,
        userId: currentUserId,
        tree_id: treeId,
        fatherId: data.fatherId || null,
        motherId: data.motherId || null,
      },
    });
  }

  async updatePerson(
    currentUserId: string,
    personId: string,
    data: {
      firstName?: string;
      lastName?: string;
      lastName2?: string;
      email?: string;
      phone?: string;
      address?: string;
      maidenName?: string;
      gender?: Gender;
      isLiving?: boolean;
      birthDate?: string;
      birthPlace?: string;
      deathDate?: string;
      deathPlace?: string;
      biography?: string;
      avatarUrl?: string;
      fatherId?: string;
      motherId?: string;
    },
  ) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });
    if (!person) throw new NotFoundException("Person not found");

    if (person.is_locked) {
      throw new ForbiddenException(
        "Este registro está bloqueado y no puede editarse",
      );
    }

    //await this.requireMembership(currentUserId, person.tree_id);

    return this.prisma.person.update({
      where: { id: personId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        lastName2: data.lastName2,
        email: data.email,
        phone: data.phone,
        address: data.address,
        maidenName: data.maidenName,
        gender: data.gender,
        isLiving: data.isLiving,
        birthPlace: data.birthPlace,
        deathPlace: data.deathPlace,
        biography: data.biography,
        avatarUrl: data.avatarUrl,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        fatherId: data.fatherId === "" || !data.fatherId ? null : data.fatherId,
        motherId: data.motherId === "" || !data.motherId ? null : data.motherId,
      },
    });
  }

  async deletePerson(currentUserId: string, personId: string) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });
    if (!person) throw new NotFoundException("Person not found");

    if (person.is_locked) {
      throw new ForbiddenException(
        "Este registro está bloqueado y no puede eliminarse",
      );
    }

    await this.requireMembership(currentUserId, person.tree_id);
    return this.prisma.person.delete({ where: { id: personId } });
  }

  async lockPerson(currentUserId: string, personId: string, locked: boolean) {
    const [person, user] = await Promise.all([
      this.prisma.person.findUnique({ where: { id: personId } }),
      this.prisma.user.findUnique({ where: { id: currentUserId } }),
    ]);
    if (!person) throw new NotFoundException("Person not found");
    if (!user?.is_admin)
      throw new ForbiddenException(
        "Solo el administrador puede realizar esta acción",
      );

    return this.prisma.person.update({
      where: { id: personId },
      data: { is_locked: locked },
    });
  }

  // ─────────────────────────────────────────────
  // Union CRUD
  // ─────────────────────────────────────────────

  async createUnion(
    currentUserId: string,
    data: {
      partner1Id: string;
      partner2Id: string;
      marriageDate?: string;
      divorceDate?: string;
      isCurrent?: boolean;
    },
  ) {
    const [person1, person2] = await Promise.all([
      this.prisma.person.findUnique({ where: { id: data.partner1Id } }),
      this.prisma.person.findUnique({ where: { id: data.partner2Id } }),
    ]);

    if (!person1 || !person2)
      throw new NotFoundException("Partner person(s) not found");
    await this.requireMembership(currentUserId, person1.tree_id);

    return this.prisma.union.create({
      data: {
        id: crypto.randomUUID(),
        partner1Id: data.partner1Id,
        partner2Id: data.partner2Id,
        marriageDate: data.marriageDate ? new Date(data.marriageDate) : null,
        divorceDate: data.divorceDate ? new Date(data.divorceDate) : null,
        isCurrent: data.isCurrent ?? true,
      },
    });
  }

  async updateUnion(
    currentUserId: string,
    unionId: string,
    data: {
      marriageDate?: string;
      divorceDate?: string;
      isCurrent?: boolean;
    },
  ) {
    const union = await this.prisma.union.findUnique({
      where: { id: unionId },
      include: { partner1: { select: { tree_id: true } } },
    });

    if (!union) throw new NotFoundException("Union not found");
    if (!union.partner1)
      throw new NotFoundException("Partner person not found");

    await this.requireMembership(currentUserId, union.partner1.tree_id);

    return this.prisma.union.update({
      where: { id: unionId },
      data: {
        marriageDate: data.marriageDate
          ? new Date(data.marriageDate)
          : undefined,
        divorceDate: data.divorceDate ? new Date(data.divorceDate) : undefined,
        isCurrent: data.isCurrent,
      },
    });
  }

  async deleteUnion(currentUserId: string, unionId: string) {
    const union = await this.prisma.union.findUnique({
      where: { id: unionId },
      include: { partner1: { select: { tree_id: true } } },
    });

    if (!union) throw new NotFoundException("Union not found");
    if (!union.partner1)
      throw new NotFoundException("Partner person not found");

    await this.requireMembership(currentUserId, union.partner1.tree_id);

    return this.prisma.union.delete({ where: { id: unionId } });
  }
}
