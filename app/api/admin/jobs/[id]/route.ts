import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.jobPosition.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return new NextResponse('Job not found', { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!isAdminUser(user)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    
    const job = await prisma.jobPosition.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!isAdminUser(user)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.jobPosition.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
