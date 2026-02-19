const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Storage Upload Limits...");

  try {
    // Set 2GB limit for raw_videos (2 * 1024 * 1024 * 1024 = 2147483648 bytes)
    // Or set to null for unlimited (up to global project limit)
    // Let's set a high limit first.

    const res1 = await prisma.$executeRawUnsafe(`
      update storage.buckets
      set file_size_limit = null 
      where id = 'raw_videos';
    `);
    console.log(
      `✅ Updated raw_videos limit to UNLIMITED. Affected rows: ${res1}`,
    );

    const res2 = await prisma.$executeRawUnsafe(`
        update storage.buckets
        set file_size_limit = null 
        where id = 'processed_cuts';
      `);
    console.log(
      `✅ Updated processed_cuts limit to UNLIMITED. Affected rows: ${res2}`,
    );
  } catch (error) {
    console.error("❌ Error updating limits:", error);
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
