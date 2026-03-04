import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("Upstash Redis not configured");
    redis = new Redis({ url, token });
  }
  return redis;
}

const ENV = process.env.NODE_ENV === "production" ? "prod" : "dev";

export function key(name: string): string {
  return `${ENV}:${name}`;
}
