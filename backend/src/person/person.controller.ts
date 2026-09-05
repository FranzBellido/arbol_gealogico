import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PersonService } from "./person.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApprovedGuard } from "../auth/approved.guard";
import { Gender } from "@prisma/client";
import { HttpException, HttpStatus } from "@nestjs/common";

@UseGuards(JwtAuthGuard, ApprovedGuard)
@Controller("tree")
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  // ─── Trees ──────────────────────────────────────────────────

  /** Lista todos los árboles accesibles por el usuario autenticado */
  @Get("list")
  async listTrees(@Request() req) {
    return this.personService.getAccessibleTrees(req.user.id);
  }

  /** POST /tree/create — Crea un nuevo árbol genealógico */
  @Post("create")
  async createTree(@Request() req, @Body() body: { name: string }) {
    return this.personService.createTree(req.user.id, body.name);
  }

  // ─── Persons & Unions ───────────────────────────────────────

  /**
   * GET /tree?treeId=xxx
   * Retorna las personas, uniones y el permiso del usuario sobre ese árbol
   */
  @Get()
  async getTree(@Request() req, @Query("treeId") treeId: string) {
    return this.personService.getTree(req.user.id, treeId);
  }

  @Post("person")
  async createPerson(
    @Request() req,
    @Body()
    body: {
      treeId: string;
      firstName: string;
      lastName: string;
      lastName2?: string;
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
    return this.personService.createPerson(req.user.id, body.treeId, body);
  }

  @Put("person/:id")
  async updatePerson(
    @Request() req,
    @Param("id") id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      lastName2?: string;
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
    return this.personService.updatePerson(req.user.id, id, body);
  }

  @Delete("person/:id")
  async deletePerson(@Request() req, @Param("id") id: string) {
    return this.personService.deletePerson(req.user.id, id);
  }

  /** PATCH /tree/person/:id/lock — Bloquear registro (solo admin del árbol) */
  @Patch("person/:id/lock")
  async lockPerson(
    @Request() req,
    @Param("id") id: string,
    @Body() body: { locked: boolean },
  ) {
    return this.personService.lockPerson(req.user.id, id, body.locked);
  }

  // ─── Unions ─────────────────────────────────────────────────

  @Post("union")
  async createUnion(
    @Request() req,
    @Body()
    body: {
      partner1Id: string;
      partner2Id: string;
      marriageDate?: string;
      divorceDate?: string;
      isCurrent?: boolean;
    },
  ) {
    return this.personService.createUnion(req.user.id, body);
  }

  @Put("union/:id")
  async updateUnion(
    @Request() req,
    @Param("id") id: string,
    @Body()
    body: {
      marriageDate?: string;
      divorceDate?: string;
      isCurrent?: boolean;
    },
  ) {
    return this.personService.updateUnion(req.user.id, id, body);
  }

  @Delete("union/:id")
  async deleteUnion(@Request() req, @Param("id") id: string) {
    return this.personService.deleteUnion(req.user.id, id);
  }


}
