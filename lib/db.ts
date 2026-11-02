import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { emptyProfile, type Profile } from "./types";

// Storage: Upstash Redis on Vercel (add the "Upstash for Redis" integration,
// which sets KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN), and a
// local JSON file for `next dev` when those aren't set.

interface Store {
  getProfile(phone: string): Promise<Profile | null>;
  saveProfile(p: Profile): Promise<void>;
  deleteProfile(phone: string): Promise<void>;
  listProfiles(): Promise<Profile[]>;
  listAdmins(): Promise<string[]>;
  addAdmin(phone: string): Promise<void>;
  removeAdmin(phone: string): Promise<void>;
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function redisStore(redis: Redis): Store {
  const P = "cd2:";
  return {
    async getProfile(phone) {
      return (await redis.get<Profile>(`${P}user:${phone}`)) ?? null;
    },
    async saveProfile(p) {
      await redis.set(`${P}user:${p.phone}`, p);
      await redis.sadd(`${P}users`, p.phone);
    },
    async deleteProfile(phone) {
      await redis.del(`${P}user:${phone}`);
      await redis.srem(`${P}users`, phone);
    },
    async listProfiles() {
      const phones = await redis.smembers(`${P}users`);
      if (!phones.length) return [];
      const rows = await redis.mget<(Profile | null)[]>(...phones.map((ph) => `${P}user:${ph}`));
      return rows.filter((r): r is Profile => !!r);
    },
    async listAdmins() {
      return redis.smembers(`${P}admins`);
    },
    async addAdmin(phone) {
      await redis.sadd(`${P}admins`, phone);
    },
    async removeAdmin(phone) {
      await redis.srem(`${P}admins`, phone);
    },
  };
}

interface FileShape {
  users: Record<string, Profile>;
  admins: string[];
}

function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "db.json");
  async function read(): Promise<FileShape> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return { users: {}, admins: [] };
    }
  }
  async function write(d: FileShape) {
    if (process.env.VERCEL) throw new Error("No Redis configured. Add the Upstash for Redis integration in Vercel's Storage tab, then redeploy.");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(d, null, 2));
  }
  return {
    async getProfile(phone) {
      return (await read()).users[phone] ?? null;
    },
    async saveProfile(p) {
      const d = await read();
      d.users[p.phone] = p;
      await write(d);
    },
    async deleteProfile(phone) {
      const d = await read();
      delete d.users[phone];
      await write(d);
    },
    async listProfiles() {
      return Object.values((await read()).users);
    },
    async listAdmins() {
      return (await read()).admins;
    },
    async addAdmin(phone) {
      const d = await read();
      if (!d.admins.includes(phone)) d.admins.push(phone);
      await write(d);
    },
    async removeAdmin(phone) {
      const d = await read();
      d.admins = d.admins.filter((a) => a !== phone);
      await write(d);
    },
  };
}

if (!url && process.env.VERCEL) {
  console.warn("No Redis configured: data will not persist on Vercel. Add the Upstash for Redis integration.");
}

const raw: Store = url && token ? redisStore(new Redis({ url, token })) : fileStore();

// Profiles saved by older versions of the form lack newer fields; fill them in.
const fill = (p: Profile): Profile => ({ ...emptyProfile(p.phone), ...p });
export const db: Store = {
  ...raw,
  async getProfile(phone) {
    const p = await raw.getProfile(phone);
    return p && fill(p);
  },
  async listProfiles() {
    return (await raw.listProfiles()).map(fill);
  },
};

export async function getOrCreateProfile(phone: string): Promise<Profile> {
  const existing = await db.getProfile(phone);
  if (existing) return { ...emptyProfile(phone), ...existing };
  const p = emptyProfile(phone);
  await db.saveProfile(p);
  return p;
}

// Owners come from the OWNER_PHONES env var (comma separated) and can never be
// removed from the app. Everyone else is promoted from the admin dashboard.
export function ownerPhones(): string[] {
  return (process.env.OWNER_PHONES || "")
    .split(",")
    .map((s) => normalizePhone(s.trim()))
    .filter((s): s is string => !!s);
}

export async function isAdmin(phone: string): Promise<boolean> {
  if (ownerPhones().includes(phone)) return true;
  return (await db.listAdmins()).includes(phone);
}

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    const d = digits.slice(1).replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  }
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}
