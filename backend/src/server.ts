import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

const port = env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✔ Connected to the SQLite database successfully.");

    app.listen(port, () => {
      console.log(`🚀 Server is listening at http://localhost:${port}`);
      console.log(`👉 Accepting requests from frontend: ${env.FRONTEND_URL}`);
    });
  } catch (err) {
    console.error("❌ Failed to bootstrap the server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
