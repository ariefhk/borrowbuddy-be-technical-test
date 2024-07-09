import { PrismaClient } from "@prisma/client";
import { logger } from "../application/logging.js";

export const db = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

db.$on("error", (e) => {
  logger.error(e);
});

db.$on("warn", (e) => {
  logger.warn(e);
});

db.$on("info", (e) => {
  logger.info(e);
});

db.$on("query", (e) => {
  logger.info(e);
});
