import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as os from 'os';

const logger = new Logger('ServerMonitor');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clearScreen = () => {
  console.clear();
};

const showHeader = () => {
  logger.log('======================================================');
  logger.log('       SPATIALOS SERVER MONITORING DASHBOARD');
  logger.log('======================================================');
  logger.log(`Host: ${os.hostname()} | OS: ${os.platform()} | Uptime: ${(os.uptime() / 3600).toFixed(1)} hrs`);
};

const showMenu = () => {
  console.log('\nSelect an option to monitor:');
  console.log('  1. View Database Values (Core Entities)');
  console.log('  2. View Storage Engine Status (Disk Usage)');
  console.log('  3. View Recent Activity & Logs');
  console.log('  4. View System Health (API Ping)');
  console.log('  5. Exit\n');
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getFolderSize = (dirPath: string): { size: number, count: number } => {
  let size = 0;
  let count = 0;
  if (!fs.existsSync(dirPath)) return { size, count };
  
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i]);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      size += stats.size;
      count++;
    }
  }
  return { size, count };
};

const handleDbStats = async () => {
  clearScreen();
  showHeader();
  console.log('[*] Fetching Database Statistics...\n');
  try {
    const [users, orgs, places, experiences, instances, content] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.place.count(),
      prisma.experience.count(),
      prisma.serviceInstance.count(),
      prisma.contentAsset.count(),
    ]);

    console.log(`Total Organizations:    ${orgs}`);
    console.log(`Total Users:            ${users}`);
    console.log(`Total Physical Places:  ${places}`);
    console.log(`Total AR Experiences:   ${experiences}`);
    console.log(`Active AR Services:     ${instances}`);
    console.log(`Stored Content Assets:  ${content}`);
  } catch (error: any) {
    console.log('Error fetching DB stats:', error.message);
  }
  promptContinue();
};

const handleStorageStats = () => {
  clearScreen();
  showHeader();
  console.log('[*] Scanning Storage Engine...\n');
  try {
    const storagePath = path.join(process.cwd(), 'storage');
    const { size, count } = getFolderSize(storagePath);
    
    console.log(`Storage Directory:      ${storagePath}`);
    console.log(`Total Stored Files:     ${count}`);
    console.log(`Total Disk Usage:       ${formatBytes(size)}`);
    console.log(`\nNote: This reflects physical files, excluding DB metadata.`);
  } catch (error: any) {
    console.log('Error scanning storage:', error.message);
  }
  promptContinue();
};

const handleActivityLogs = async () => {
  clearScreen();
  showHeader();
  console.log('[*] Fetching Recent System Activity...\n');
  try {
    const recentUsers = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 3,
      select: { email: true, role: true }
    });

    const recentExperiences = await prisma.experience.findMany({
      orderBy: { version: 'desc' },
      take: 3,
      select: { name: true, status: true, version: true }
    });

    const recentContent = await prisma.contentAsset.findMany({
      orderBy: { id: 'desc' },
      take: 3,
      select: { assetType: true, url: true }
    });

    console.log('--- RECENT USERS ---');
    recentUsers.forEach(u => console.log(` * ${u.email} (${u.role})`));
    
    console.log('\n--- RECENT EXPERIENCES ---');
    recentExperiences.forEach(e => console.log(` * ${e.name} (v${e.version}) - [${e.status}]`));

    console.log('\n--- RECENT CONTENT UPLOADS ---');
    recentContent.forEach(c => console.log(` * [${c.assetType}] ${c.url}`));
    
    console.log('\n(Audit Table currently tracks standard CRUD via standard API endpoints)');
  } catch (error: any) {
    console.log('Error fetching activity:', error.message);
  }
  promptContinue();
};

const handleSystemHealth = async () => {
  clearScreen();
  showHeader();
  console.log('[*] Pinging Local API Engine...\n');
  try {
    const port = process.env.PORT || 3001; // Backend defaults to 3001
    const res = await fetch(`http://127.0.0.1:${port}/health/live`);
    const status = res.status;
    const body = await res.text();
    
    if (res.ok) {
      console.log(`API Status:      ONLINE (HTTP ${status})`);
      console.log(`Response:        ${body}`);
      console.log(`Server is running healthily on port ${port}.`);
    } else {
      console.log(`API Status:      WARNING (HTTP ${status})`);
      console.log(`Response:        ${body}`);
    }
  } catch (error: any) {
    console.log(`API Status:      OFFLINE`);
    console.log(`Error connecting to local server: ${error.message}`);
    console.log('Did you forget to run "npm run start:dev"?');
  }
  promptContinue();
};

const promptContinue = () => {
  console.log('\n------------------------------------------------------');
  rl.question('Press ENTER to return to the main menu...', () => {
    mainLoop();
  });
};

const mainLoop = () => {
  clearScreen();
  showHeader();
  showMenu();
  rl.question('Enter your choice (1-5): ', (answer) => {
    switch (answer.trim()) {
      case '1':
        handleDbStats();
        break;
      case '2':
        handleStorageStats();
        break;
      case '3':
        handleActivityLogs();
        break;
      case '4':
        handleSystemHealth();
        break;
      case '5':
        console.log('\nExiting SpatialOS Monitor. Goodbye!');
        prisma.$disconnect();
        process.exit(0);
      default:
        console.log('\nInvalid choice. Please enter 1-5.');
        setTimeout(mainLoop, 1000);
        break;
    }
  });
};

// Start the CLI
mainLoop();
