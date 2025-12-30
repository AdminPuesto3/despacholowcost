import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "administracion@implowcost.com";
  const passwordPlain = "impolowcost";

  const password = await bcrypt.hash(passwordPlain, 10);

  await prisma.user.upsert({
    where: { email },
    update: { password, role: "Administrador", active: true },
    create: { email, password, role: "Administrador", active: true },
  });

  console.log("OK seed user:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
