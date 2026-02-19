const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, "..", "supabase_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split commands by semicolon to execute them individually
  // Note: This is a simple split and might break on semicolons inside strings/functions
  // But for this specific file structure it should be fine enough for simple tables/buckets
  // For functions ($$), we need to be careful.
  // Actually, let's try to run the whole block or split by standard SQL delimiters if possible.
  // Prisma $executeRawUnsafe can run multiple statements in some drivers, but postgres usually requires 1 statement.
  // However, PG driver often supports multi-statement strings. Let's try running all at once first.

  console.log("Executing SQL from supabase_setup.sql...");

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("Successfully executed SQL setup.");
  } catch (error) {
    console.warn(
      "Error running full block (might be due to multi-statement or existing objects).",
    );
    console.warn("Attempting to split and run...");

    const commands = sql
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    for (const cmd of commands) {
      try {
        if (cmd.startsWith("--")) continue;
        await prisma.$executeRawUnsafe(cmd);
      } catch (e) {
        console.log(`Failed CMD: ${cmd.substring(0, 50)}... -> ${e.message}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
