import { db } from '@/db'
import { getSession } from './auth'
import { eq } from 'drizzle-orm'
import { cache } from 'react'
import { issues, users } from '@/db/schema'
import { mockDelay } from './utils'

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

export const getCurrentUser = async () => {
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
}

export async function getIssues() {
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
