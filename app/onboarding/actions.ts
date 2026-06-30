"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function completeOnboardingAction() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
    },
  });

  return { success: true };
}
