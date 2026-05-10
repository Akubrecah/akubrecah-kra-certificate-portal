import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/admin-config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.jobPosition.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const {
      title,
      location,
      type,
      department,
      jobNumber,
      worksite,
      travel,
      roleType,
      profession,
      discipline,
      employmentType,
      datePosted,
      description,
      overview,
      responsibilities,
      requiredQualifications,
      preferredQualifications,
      additionalRequirements,
      compensation,
    } = body;

    if (!title || !jobNumber) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const job = await prisma.jobPosition.create({
      data: {
        title,
        location,
        type,
        department,
        jobNumber,
        worksite,
        travel,
        roleType,
        profession,
        discipline,
        employmentType,
        datePosted,
        description,
        overview,
        responsibilities,
        requiredQualifications,
        preferredQualifications,
        additionalRequirements,
        compensation,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
