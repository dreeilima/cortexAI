const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Storage Buckets Config...");

  try {
    const buckets = await prisma.$queryRaw`
      select id, name, public, file_size_limit, allowed_mime_types 
      from storage.buckets
    `;
    console.table(buckets);
  } catch (error) {
    console.error("❌ Error checking buckets:", error);
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
