// app/api/hello/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello, World!' })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json(body)
}
