# Specification Document: GeneaTree App

## 1. Overview
A web-based interactive family tree application that allows users to build, view, and manage family trees with rich biographical data, photos, living status, and custom permissions.

---

## 2. Technical Stack

* **Backend Framework:** NestJS (TypeScript, Node.js)
* **ORM & Database:** Prisma ORM, PostgreSQL
* **Frontend Framework:** Nuxt 3 (Vue 3, TypeScript)
* **UI Library:** Nuxt UI (`@nuxt/ui`, Tailwind CSS)
* **Authentication:** Passport.js (Google OAuth 2.0, Facebook OAuth), JWT
* **Interactive Tree Render:** `@vue-flow/core`
* **File Storage:** Cloudinary or AWS S3 (handling avatars & biographical photos)

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SystemRole {
  ADMIN
  USER
}

enum TreePermission {
  READ
  WRITE
  ADMIN
}

enum AuthProvider {
  GOOGLE
  FACEBOOK
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

model User {
  id           String       @id @default(uuid())
  email        String       @unique
  name         String?
  avatar       String?
  provider     AuthProvider
  providerId   String       @unique
  systemRole   SystemRole   @default(USER)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  ownedPersons Person[]     @relation("UserTree")
  treeAccesses TreeAccess[] @relation("GrantedUser")
}

model TreeAccess {
  id         String         @id @default(uuid())
  userId     String
  user       User           @relation("GrantedUser", fields: [userId], references: [id], onDelete: Cascade)
  ownerId    String
  permission TreePermission @default(READ)
  createdAt  DateTime       @default(now())

  @@unique([userId, ownerId])
}

model Person {
  id          String    @id @default(uuid())
  firstName   String
  lastName    String
  maidenName  String?
  gender      Gender
  isLiving    Boolean   @default(true)
  birthDate   DateTime?
  birthPlace  String?
  deathDate   DateTime?
  deathPlace  String?
  biography   String?   @db.Text
  avatarUrl   String?

  userId      String
  user        User      @relation("UserTree", fields: [userId], references: [id], onDelete: Cascade)

  // Parent relations
  fatherId    String?
  father      Person?   @relation("FatherRelation", fields: [fatherId], references: [id])
  fatherOf    Person[]  @relation("FatherRelation")

  motherId    String?
  mother      Person?   @relation("MotherRelation", fields: [motherId], references: [id])
  motherOf    Person[]  @relation("MotherRelation")

  // Unions / Marriages
  unionsAsPartner1 Union[] @relation("Partner1")
  unionsAsPartner2 Union[] @relation("Partner2")

  photos      Photo[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Union {
  id           String    @id @default(uuid())
  partner1Id   String
  partner1     Person    @relation("Partner1", fields: [partner1Id], references: [id], onDelete: Cascade)
  partner2Id   String
  partner2     Person    @relation("Partner2", fields: [partner2Id], references: [id], onDelete: Cascade)
  marriageDate DateTime?
  divorceDate  DateTime?
  isCurrent    Boolean   @default(true)

  createdAt    DateTime  @default(now())
}

model Photo {
  id          String   @id @default(uuid())
  url         String
  caption     String?
  isMain      Boolean  @default(false)
  personId    String
  person      Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}