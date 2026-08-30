const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
(async () => {
  const url = 'http://localhost:3001/placements/preview?qrCode=LOC-a414d977-7b41-4cd4-82c7-d0ae63649e5a'; 
  console.log(url); 
  const fetch = require('node-fetch'); 
  const res = await fetch(url); 
  console.log(JSON.stringify(await res.json(), null, 2)); 
  await prisma.$disconnect();
})();
