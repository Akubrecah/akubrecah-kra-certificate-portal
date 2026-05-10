import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * The context parameter for these route handlers is typed in an unusual way
 * to match the expectation from the build error log. The error indicates
 * that this specific version of Next.js expects `context.params` to be a
 * Promise. This is not standard and is likely due to an experimental or
 * unstable version of the framework.
 */
interface RouteContext {
  params: Promise<{ id: string }>
}

// GET a single job position
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params; // Await the promise to get params

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
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await context.params; // Await the promise
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
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await context.params; // Await the promise

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