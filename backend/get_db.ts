import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const locations = await prisma.qrLocation.findMany();
  const arContents = await prisma.arContent.findMany();
  const mediaFiles = await prisma.mediaFile.findMany();
  const textContents = await prisma.textContent.findMany();
  const transforms = await prisma.arTransform.findMany();
  const likes = await prisma.contentLike.findMany();
  const comments = await prisma.contentComment.findMany();
  const shares = await prisma.contentShare.findMany();
  const settings = await prisma.settings.findMany();

  console.log("=== 1. USERS ===");
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== 2. QR LOCATIONS ===");
  console.log(JSON.stringify(locations, null, 2));

  console.log("\n=== 3. AR CONTENTS ===");
  console.log(JSON.stringify(arContents, null, 2));
  
  console.log("\n=== 4. MEDIA FILES ===");
  console.log(JSON.stringify(mediaFiles, null, 2));

  console.log("\n=== 5. TEXT CONTENTS ===");
  console.log(JSON.stringify(textContents, null, 2));

  console.log("\n=== 6. AR TRANSFORMS ===");
  console.log(JSON.stringify(transforms, null, 2));

  console.log("\n=== 7. CONTENT LIKES ===");
  console.log(JSON.stringify(likes, null, 2));

  console.log("\n=== 8. CONTENT COMMENTS ===");
  console.log(JSON.stringify(comments, null, 2));

  console.log("\n=== 9. CONTENT SHARES ===");
  console.log(JSON.stringify(shares, null, 2));

  console.log("\n=== 10. SETTINGS ===");
  console.log(JSON.stringify(settings, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
