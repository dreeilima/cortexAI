const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Storage Buckets...");

  try {
    // 1. Create raw_videos bucket
    await prisma.$executeRawUnsafe(`
      insert into storage.buckets (id, name, public) 
      values ('raw_videos', 'raw_videos', true)
      on conflict (id) do nothing;
    `);
    console.log("✅ Bucket raw_videos verified.");

    // 2. Create processed_cuts bucket
    await prisma.$executeRawUnsafe(`
      insert into storage.buckets (id, name, public) 
      values ('processed_cuts', 'processed_cuts', true)
      on conflict (id) do nothing;
    `);
    console.log("✅ Bucket processed_cuts verified.");

    // 3. Create Policy for Upload (raw_videos)
    // Note: Policies needs to be dropped first to avoid "policy already exists" error, or we catch the error
    // We try to create, if it fails we assume it exists or ignore.
    try {
      await prisma.$executeRawUnsafe(`
            create policy "Authenticated users can upload" on storage.objects for insert with check (
                bucket_id = 'raw_videos' and auth.role() = 'authenticated'
            );
        `);
      console.log("✅ Upload policy created.");
    } catch (e) {
      console.log(
        "ℹ️ Upload policy might already exist:",
        e.message.split("\n")[0],
      );
    }

    try {
      await prisma.$executeRawUnsafe(`
            create policy "Authenticated users can select" on storage.objects for select using (
                bucket_id = 'raw_videos' and auth.role() = 'authenticated'
            );
        `);
      console.log("✅ Select policy created.");
    } catch (e) {
      console.log(
        "ℹ️ Select policy might already exist:",
        e.message.split("\n")[0],
      );
    }
  } catch (error) {
    console.error("❌ Error creating buckets:", error);
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
