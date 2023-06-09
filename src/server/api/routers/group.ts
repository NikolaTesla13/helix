import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  getPopularGroups: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const groups = await ctx.prisma.group.findMany({
        select: { name: true, id: true },
        take: input.limit,
        orderBy: { posts: { _count: "desc" } },
      });
      return groups;
    }),
  getGroup: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.group.findUnique({
        where: { name: input.name },
        include: {
          author: true,
          posts: {
            include: { author: true, group: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        rules: z.array(z.string()),
        private: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.group.create({
        data: {
          name: input.name,
          description: input.description,
          authorId: ctx.session.user.id,
          rules: input.rules,
          private: input.private,
        },
      });
    }),
  updateGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        rules: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.group.update({
        where: { name: input.name },
        data: { description: input.description, rules: input.rules },
      });
    }),
});
