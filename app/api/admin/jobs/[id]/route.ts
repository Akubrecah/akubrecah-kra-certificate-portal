import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET a single job position
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params; 

    const job = await prisma.jobPosition.findUnique({
      where: { id },
    })

    if (!job) {
      return new NextResponse(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('[JOB_GET]', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// UPDATE a job position
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionClaims } = await auth()
    
    // Check for admin role in session metadata
    if ((sessionClaims?.metadata as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params;
    const body = await req.json()

    const updatedJob = await prisma.jobPosition.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error('[JOB_PUT]', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// DELETE a job position
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionClaims } = await auth()
    
    // Check for admin role in session metadata
    if ((sessionClaims?.metadata as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params;

    await prisma.jobPosition.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[JOB_DELETE]', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}