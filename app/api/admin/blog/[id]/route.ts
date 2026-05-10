import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { sessionClaims } = await auth()
    
    // Check for admin role in session metadata
    if ((sessionClaims?.metadata as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title,
        date: body.date,
        excerpt: body.excerpt,
        content: body.content,
        image: body.image
      }
    })
    return NextResponse.json(post)
  } catch (error) {
    console.error('[BLOG_PUT]', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { sessionClaims } = await auth()
    
    // Check for admin role in session metadata
    if ((sessionClaims?.metadata as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.blogPost.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BLOG_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
