/**
 * Seed script: creates the first admin user.
 * Run once with:  npm run db:seed
 *
 * Admin login:
 *   Email:    rmselect@richeymay.com
 *   Password: R1ch3yM4y!
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("R1ch3yM4y!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "rmselect@richeymay.com" },
    update: {},
    create: {
      email: "rmselect@richeymay.com",
      password: hash,
      isAdmin: true,
    },
  });

  console.log("✅  Admin user ready:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
