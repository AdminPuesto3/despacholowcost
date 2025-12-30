-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pendiente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notasRaw" TEXT NOT NULL,
    "notasHash" TEXT NOT NULL,
    "notas" JSONB NOT NULL,
    "bultos" INTEGER NOT NULL,
    "operador" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "finalizadoAt" DATETIME,
    "positionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pendiente_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pendiente" ("bultos", "cliente", "createdAt", "finalizadoAt", "id", "notas", "notasHash", "notasRaw", "operador", "positionId", "updatedAt") SELECT "bultos", "cliente", "createdAt", "finalizadoAt", "id", "notas", "notasHash", "notasRaw", "operador", "positionId", "updatedAt" FROM "Pendiente";
DROP TABLE "Pendiente";
ALTER TABLE "new_Pendiente" RENAME TO "Pendiente";
CREATE UNIQUE INDEX "Pendiente_notasHash_key" ON "Pendiente"("notasHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
