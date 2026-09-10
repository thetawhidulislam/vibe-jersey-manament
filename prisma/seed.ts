import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function upsertMember(name: string, email: string, password: string, role: "ADMIN" | "MEMBER") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`↷ ${email} already exists, skipping sign-up (making sure role = ${role})`);
    await prisma.user.update({ where: { email }, data: { role } });
    return;
  }

  await auth.api.signUpEmail({
    body: { name, email, password },
  });

  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`✓ Created ${role} user: ${name} <${email}>`);
}

async function main() {
  const adminName = process.env.ADMIN_NAME || "Admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@vibeathletics.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  await upsertMember(adminName, adminEmail, adminPassword, "ADMIN");

  // The three team members from the spec — edit emails/passwords as needed
  await upsertMember("Tawhid", "tawhid@vibeathletics.com", "Tawhid123!", "MEMBER");
  await upsertMember("Ovi", "ovi@vibeathletics.com", "Ovi123!", "MEMBER");
  await upsertMember("Rabbi", "rabbi@vibeathletics.com", "Rabbi123!", "MEMBER");

  console.log("\nSeed complete. Login with the admin email/password above.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
