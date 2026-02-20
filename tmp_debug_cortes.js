const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cortes = await prisma.corte.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(cortes, null, 2));
  await prisma.$disconnect();
}

main();
