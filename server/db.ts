import { and, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { familyMembers, familySpaces, familySyncDocuments, InsertUser, userSyncDocuments, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPersonalSyncDocument(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [document] = await db.select().from(userSyncDocuments).where(eq(userSyncDocuments.userId, userId)).limit(1);
  return document ?? { payload: "", revision: 0, updatedAt: null };
}

export async function savePersonalSyncDocument(userId: number, payload: string, expectedRevision: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = await getPersonalSyncDocument(userId);
  if (current.revision !== expectedRevision) throw new Error("SYNC_CONFLICT");
  const revision = current.revision + 1;
  if (current.revision === 0 && !current.payload) {
    await db.insert(userSyncDocuments).values({ userId, payload, revision });
  } else {
    await db.update(userSyncDocuments).set({ payload, revision }).where(eq(userSyncDocuments.userId, userId));
  }
  return { revision };
}

export async function listFamilySpaces(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ id: familySpaces.id, title: familySpaces.title, inviteCode: familySpaces.inviteCode, ownerId: familySpaces.ownerId, role: familyMembers.role, updatedAt: familySpaces.updatedAt })
    .from(familyMembers).innerJoin(familySpaces, eq(familyMembers.familyId, familySpaces.id)).where(eq(familyMembers.userId, userId));
}

export async function createFamilySpace(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const id = crypto.randomUUID();
  const inviteCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  await db.insert(familySpaces).values({ id, title, ownerId: userId, inviteCode });
  await db.insert(familyMembers).values({ familyId: id, userId, role: "owner" });
  await db.insert(familySyncDocuments).values({ familyId: id, payload: "", revision: 0 });
  return { id, title, inviteCode, role: "owner" as const };
}

export async function joinFamilySpace(userId: number, inviteCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [space] = await db.select().from(familySpaces).where(eq(familySpaces.inviteCode, inviteCode.toUpperCase())).limit(1);
  if (!space) throw new Error("INVITE_NOT_FOUND");
  const [member] = await db.select().from(familyMembers).where(and(eq(familyMembers.familyId, space.id), eq(familyMembers.userId, userId))).limit(1);
  if (!member) await db.insert(familyMembers).values({ familyId: space.id, userId, role: "member" });
  return { id: space.id, title: space.title, inviteCode: space.inviteCode, role: member?.role ?? "member" };
}

async function assertFamilyAccess(userId: number, familyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [member] = await db.select().from(familyMembers).where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId))).limit(1);
  if (!member) throw new Error("FAMILY_ACCESS_DENIED");
  return { db, role: member.role };
}

export async function getFamilySyncDocument(userId: number, familyId: string) {
  const { db, role } = await assertFamilyAccess(userId, familyId);
  const [document] = await db.select().from(familySyncDocuments).where(eq(familySyncDocuments.familyId, familyId)).limit(1);
  return { payload: document?.payload ?? "", revision: document?.revision ?? 0, role };
}

export async function saveFamilySyncDocument(userId: number, familyId: string, payload: string, expectedRevision: number) {
  const { db } = await assertFamilyAccess(userId, familyId);
  const [document] = await db.select().from(familySyncDocuments).where(eq(familySyncDocuments.familyId, familyId)).limit(1);
  const revision = document?.revision ?? 0;
  if (revision !== expectedRevision) throw new Error("SYNC_CONFLICT");
  const nextRevision = revision + 1;
  await db.update(familySyncDocuments).set({ payload, revision: nextRevision }).where(eq(familySyncDocuments.familyId, familyId));
  return { revision: nextRevision };
}

export async function listFamilyMembers(userId: number, familyId: string) {
  const { db } = await assertFamilyAccess(userId, familyId);
  return db.select({ userId: familyMembers.userId, role: familyMembers.role, name: users.name, email: users.email })
    .from(familyMembers).innerJoin(users, eq(familyMembers.userId, users.id)).where(eq(familyMembers.familyId, familyId));
}

export async function removeFamilyMember(ownerId: number, familyId: string, memberUserId: number) {
  const { db, role } = await assertFamilyAccess(ownerId, familyId);
  if (role !== "owner" || ownerId === memberUserId) throw new Error("FAMILY_MEMBER_CHANGE_DENIED");
  await db.delete(familyMembers).where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, memberUserId), ne(familyMembers.role, "owner")));
  return { success: true };
}
