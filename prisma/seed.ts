import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Admin Account
  const adminEmail = "admin@editorial.edu";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash("adminPass123", 10);
    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "admin",
        branch: "Kalkalji",
        batch: "2026",
        avatar: "scholar",
        isActive: true,
      },
    });
    console.log(`Admin account seeded successfully: ${admin.email}`);
  } else {
    console.log(`Admin account (${adminEmail}) already exists, skipping.`);
  }

  // Seed Faculty Account
  const facultyEmail = "faculty@editorial.edu";
  const existingFaculty = await prisma.user.findUnique({
    where: { email: facultyEmail },
  });

  if (!existingFaculty) {
    const facultyPasswordHash = await bcrypt.hash("facultyPass123", 10);
    const faculty = await prisma.user.create({
      data: {
        name: "Faculty Member",
        email: facultyEmail,
        passwordHash: facultyPasswordHash,
        role: "faculty",
        branch: "Kalkalji",
        batch: "2026",
        avatar: "scholar",
        isActive: true,
      },
    });
    console.log(`Faculty account seeded successfully: ${faculty.email}`);
  } else {
    console.log(`Faculty account (${facultyEmail}) already exists, skipping.`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
