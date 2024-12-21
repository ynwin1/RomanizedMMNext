import mongoose from "mongoose";

interface ConnectOptions {
    retries?: number;
    delay?: number;
}

const connectDB = async ({retries = 5, delay = 2000}: ConnectOptions = {}): Promise<void> => {
  try {
    if (mongoose.connection.readyState) {
      console.log("MongoDB is already connected.");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error(`MongoDB connection error: ${(err as Error).message}`);
    if (retries === 0) {
      console.log("Failed to connect to MongoDB after multiple attempts.");
      throw new Error("Failed to connect to MongoDB");
    } else {
      console.log(`Retrying to connect to MongoDB (${retries - 1} retries left)...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB({ retries: retries - 1, delay: delay});
    }
  }
};

export default connectDB;