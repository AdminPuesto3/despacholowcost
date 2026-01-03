import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.log("Uso: node scripts/check-user.mjs administracion@implowcost.com");
  process.exit(1);
}

try {
  const u = await prisma.user.findUnique({ where: { email } });

  if (!u) {
    console.log("NO EXISTE user con email:", email);
    process.exit(0);
  }

  const keys = Object.keys(u);
  console.log("USER ENCONTRADO. Campos:", keys);

  const safe = {};
  for (const k of keys) {
    if (String(k).toLowerCase().includes("pass")) {
      const v = u[k];
      safe[k] = typeof v === "string" ? `string(len=${v.length})` : v;
    } else {
      safe[k] = u[k];
    }
  }

  console.log("DATA (safe):", safe);
} catch (e) {
  console.log("ERROR:", String(e?.message || e));
} finally {
  await prisma.$disconnect();
}
