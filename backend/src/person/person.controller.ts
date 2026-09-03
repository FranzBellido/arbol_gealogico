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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { PersonService } from "./person.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApprovedGuard } from "../auth/approved.guard";
import { Gender } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { extname } from "path";
import { memoryStorage } from "multer";
const sharp = require("sharp");
import { createClient } from "@supabase/supabase-js";
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

  // ─── Upload ─────────────────────────────────────────────────

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new HttpException(
              "Sólo se permiten imágenes (JPG, PNG, WebP)",
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException(
        "No se proporcionó ningún archivo",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 1. Procesar imagen con Sharp (Redimensionar y convertir a WebP)
      const compressedBuffer = await sharp(file.buffer)
        .resize(800, 800, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Configurar cliente Supabase
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      const supabaseBucket = process.env.SUPABASE_BUCKET || "uploads";

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "Las credenciales de Supabase no están configuradas en el .env",
        );
      }

      console.log(
        "URL",
        supabaseUrl,
        "KEY",
        supabaseKey,
        "BUCKET",
        supabaseBucket,
      );
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 3. Generar nombre de archivo único
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;

      // 4. Subir a Supabase
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(filename, compressedBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Error de subida a Supabase:", error);
        throw new HttpException(
          "Error al subir la imagen al servidor",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 5. Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(filename);

      return { url: publicUrlData.publicUrl };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        err.message || "Error al procesar la imagen",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
