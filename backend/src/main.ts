import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('SpatialOS-Bootstrap');
  
  const certPath = join(__dirname, '..', '..', 'ssl', 'cert.pem');
  const keyPath = join(__dirname, '..', '..', 'ssl', 'key.pem');
  let httpsOptions: any = null;

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    logger.log(`🔒 SSL/TLS Development Certificates loaded from /ssl! Enabling Secure HTTPS Server.`);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { 
    cors: true,
    ...(httpsOptions ? { httpsOptions } : {}),
  });

  // Rule 18 & 45: Enforce HTTP security headers and limit payload sizes to prevent memory DOS
  app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enforce correlation ID (X-Request-ID) for distributed logging & request traceability
  app.use((req: any, res: any, next: any) => {
    const correlationId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    req.headers['x-request-id'] = correlationId;
    res.setHeader('X-Request-ID', correlationId);
    next();
  });

  // Ensure laptop storage directory exists for testing photos & videos locally
  const storageDir = join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    logger.log(`📁 Local media storage directory created at: ${storageDir}`);
  }

  // Enable CORS first so static asset requests receive Access-Control-Allow-Origin headers
  app.enableCors({
    origin: true, // Reflects the origin dynamically, required when credentials: true
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Static assets exposing removed for security. Media is now served securely via /v1/admin/content/stream/:id

  // Bind Global Standardized Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Bind Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // OpenAPI Swagger Documentation Configuration (Rule in 02_BACKEND_ARCHITECTURE)
  const config = new DocumentBuilder()
    .setTitle('SpatialOS AR Engine API Server')
    .setDescription('Complete enterprise backend system powered by NestJS, Prisma ORM, and PostgreSQL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const protocol = httpsOptions ? 'https' : 'http';
  // Bind to 0.0.0.0 so mobile phones on local Wi-Fi / Hotspot can connect to Laptop IP directly
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SpatialOS Production Backend active on ${protocol}://0.0.0.0:${port} (Accessible via Laptop Wi-Fi IP)`);

  logger.log(`📚 OpenAPI Swagger Docs active on ${protocol}://localhost:${port}/api/docs`);
}
bootstrap();
