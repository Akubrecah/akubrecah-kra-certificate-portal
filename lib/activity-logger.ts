import prisma from './prisma';

export type ActivityType = 
  | 'auth' 
  | 'user' 
  | 'return' 
  | 'transaction' 
  | 'document' 
  | 'system';

export type ActivityStatus = 'success' | 'warning' | 'error' | 'info';

export async function logUserActivity({
  userId,
  activityType,
  description,
  status = 'success',
  metadata = {},
}: {
  userId: string;
  activityType: string;
  description?: string;
  status?: ActivityStatus;
  metadata?: any;
}) {
  try {
    return await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        description,
        status,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

export async function logSessionActivity({
  sessionId,
  activityType,
  description,
  metadata = {},
}: {
  sessionId: string;
  activityType: string;
  description?: string;
  metadata?: any;
}) {
  try {
    return await prisma.sessionActivity.create({
      data: {
        sessionId,
        activityType,
        description,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error logging session activity:', error);
  }
}
