import { db } from '@/db'
import { getSession } from './auth'
import { eq } from 'drizzle-orm'
import { issues, users } from '@/db/schema'
import { mockDelay } from './utils'
import { cacheTag } from 'next/dist/server/use-cache/cache-tag'
import { cache } from 'react'

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    return user
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session) return null
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
    return user[0]
  } catch (error) {
    console.error(error)
    return null
  }
})

export async function getIssues() {
  'use cache'
  cacheTag('issues')
  try {
    const result = await db.query.issues.findMany({
      with: {
        user: true,
      },
      orderBy: (issues, { desc }) => [desc(issues.createdAt)],
    })
    return result
  } catch (error) {
    console.error('Error fetching issues:', error)
    throw new Error('Failed to fetch issues')
  }
}

export async function getIssue(id: number) {
  try {
    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, id),
      with: {
        user: true,
      },
    })
    return issue
  } catch (error) {
    console.error('Error fetching issue:', error)
    throw new Error('Failed to fetch issue')
  }
}
