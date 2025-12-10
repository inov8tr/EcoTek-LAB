import { PrismaClient, RequirementComparison, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdminUser() {
  const adminEmail = process.env.ECOTEK_ADMIN_EMAIL ?? "admin@ecotek.com";
  const adminPassword = process.env.ECOTEK_ADMIN_PASSWORD ?? "ChangeMeNow!2024";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "EcoTek Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: adminEmail,
      name: "EcoTek Admin",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  console.log(`Seeded admin user (${adminEmail}) with password "${adminPassword}".`);
}

async function seedStandards() {
  await prisma.fileAttachment.deleteMany();
  await prisma.deletionRequest.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.formulation.deleteMany();
  await prisma.standardRequirement.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.market.deleteMany();

  const market = await prisma.market.create({
    data: { code: "KR", name: "Korea" },
  });

  const standard = await prisma.standard.create({
    data: {
      code: "KR_PG82_22",
      name: "Korean PMA PG82-22",
      description: "Baseline Elastic Recovery / MSCR requirements for KR market.",
      marketId: market.id,
    },
  });

  await prisma.standardRequirement.createMany({
    data: [
      {
        standardId: standard.id,
        metric: "storabilityPct",
        comparison: RequirementComparison.LTE,
        thresholdMax: 5,
        unit: "%",
        notes: "Storability separation at 24h <= 5%.",
      },
      {
        standardId: standard.id,
        metric: "elasticRecoveryPct",
        comparison: RequirementComparison.GTE,
        thresholdMin: 80,
        unit: "%",
      },
      {
        standardId: standard.id,
        metric: "jnr_3_2",
        comparison: RequirementComparison.LTE,
        thresholdMax: 4,
        unit: "kPa⁻¹",
      },
      {
        standardId: standard.id,
        metric: "softeningPointC",
        comparison: RequirementComparison.GTE,
        thresholdMin: 65,
        unit: "°C",
      },
      {
        standardId: standard.id,
        metric: "ductilityCm",
        comparison: RequirementComparison.GTE,
        thresholdMin: 35,
        unit: "cm",
      },
      {
        standardId: standard.id,
        metric: "viscosity155c",
        comparison: RequirementComparison.LTE,
        thresholdMax: 300,
        unit: "Pa·s",
      },
    ],
  });
}

async function main() {
  await seedAdminUser();
  await seedStandards();
  console.log("Baseline standards ready. No sample data inserted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
