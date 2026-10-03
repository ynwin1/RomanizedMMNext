import mongoose from "mongoose";
import { logger } from "@/infrastructure/logging/logger";

interface ConnectOptions {
    retries?: number;
    delay?: number;
}

const connectDB = async ({retries = 5, delay = 2000}: ConnectOptions = {}): Promise<void> => {
  try {
    if (mongoose.connection.readyState) {
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection failed", err, { retriesRemaining: retries });
    if (retries === 0) {
      logger.error("MongoDB connection retries exhausted");
      throw new Error("Failed to connect to MongoDB");
    } else {
      logger.warn("Retrying MongoDB connection", { retriesRemaining: retries - 1 });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB({ retries: retries - 1, delay: delay});
    }
  }
};

export default connectDB;
