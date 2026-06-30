"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function updateProfileDetails(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();

  // 1. Update standard fields on Clerk User if provided
  if (data.firstName !== undefined || data.lastName !== undefined) {
    await client.users.updateUser(userId, {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
    });
  }

  // 2. Update publicMetadata for the other fields
  const metadataUpdate: Record<string, any> = {};
  if (data.phone !== undefined) metadataUpdate.phoneNumber = data.phone;
  if (data.dob !== undefined) metadataUpdate.dob = data.dob;
  if (data.gender !== undefined) metadataUpdate.gender = data.gender;
  if (data.nationality !== undefined) metadataUpdate.nationality = data.nationality;

  if (Object.keys(metadataUpdate).length > 0) {
    // Fetch existing metadata to merge
    const user = await client.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};
    
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingMetadata,
        ...metadataUpdate,
      },
    });
  }

  return { success: true };
}
