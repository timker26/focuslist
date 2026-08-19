import { COOKIE_NAME } from "../shared/const.js";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const syncPayload = z.object({ payload: z.string().max(500000), revision: z.number().int().nonnegative() });

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  sync: router({
    personal: router({
      load: protectedProcedure.query(({ ctx }) => db.getPersonalSyncDocument(ctx.user.id)),
      save: protectedProcedure.input(syncPayload).mutation(({ ctx, input }) => db.savePersonalSyncDocument(ctx.user.id, input.payload, input.revision)),
    }),
    families: router({
      list: protectedProcedure.query(({ ctx }) => db.listFamilySpaces(ctx.user.id)),
      create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(120) })).mutation(({ ctx, input }) => db.createFamilySpace(ctx.user.id, input.title)),
      join: protectedProcedure.input(z.object({ inviteCode: z.string().trim().min(8).max(16) })).mutation(({ ctx, input }) => db.joinFamilySpace(ctx.user.id, input.inviteCode)),
      members: protectedProcedure.input(z.object({ familyId: z.string().uuid() })).query(({ ctx, input }) => db.listFamilyMembers(ctx.user.id, input.familyId)),
      removeMember: protectedProcedure.input(z.object({ familyId: z.string().uuid(), userId: z.number().int().positive() })).mutation(({ ctx, input }) => db.removeFamilyMember(ctx.user.id, input.familyId, input.userId)),
      load: protectedProcedure.input(z.object({ familyId: z.string().uuid() })).query(({ ctx, input }) => db.getFamilySyncDocument(ctx.user.id, input.familyId)),
      save: protectedProcedure.input(z.object({ familyId: z.string().uuid(), ...syncPayload.shape })).mutation(({ ctx, input }) => db.saveFamilySyncDocument(ctx.user.id, input.familyId, input.payload, input.revision)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
