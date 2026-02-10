import { Prisma } from "@prisma/client";

// 1. Define the shape of a Confession with its relations included
// This matches the `include` in our Prisma queries
export type ConfessionWithUser = Prisma.ConfessionGetPayload<{
  include: {
    sender: { select: { username: true; image: true } };
    receiver: { select: { username: true } };
  }
}>;

// 2. Define a simpler User type if needed for props
export interface SafeUser {
  id: string;
  username: string;
  image?: string | null;
  role?: string;
}
