#!/usr/bin/env node
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.ECOTEK_ADMIN_EMAIL;
const password = process.env.ECOTEK_ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  console.error("Missing environment variable: DATABASE_URL. Please configure it before seeding.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing ECOTEK_ADMIN_EMAIL or ECOTEK_ADMIN_PASSWORD. Set both before running the seed script.");
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      passwordHash,
      name: "EcoTek Admin",
      displayName: "EcoTek Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Admin account ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
