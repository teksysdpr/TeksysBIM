import { PrismaClient } from "@prisma/client";
import { appConfig } from "../config/env.js";

let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (!appConfig.databaseUrl) return null;
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
