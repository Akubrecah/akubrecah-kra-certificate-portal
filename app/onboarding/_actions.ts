'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'No signed-in user' }
  }

  const client = await clerkClient()

  const applicationName = formData.get('applicationName') as string
  const applicationType = formData.get('applicationType') as string

  try {
    const res = await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        applicationName,
        applicationType,
      },
    })
    return { message: res.publicMetadata }
  } catch (err) {
    console.error('Error updating user metadata:', err)
    return { error: 'There was an error updating the user metadata.' }
  }
}
