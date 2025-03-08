'use server'

import { z } from 'zod'
import {
  verifyPassword,
  createSession,
  createUser,
  deleteSession,
} from '@/lib/auth'
import { getUserByEmail } from '@/lib/dal'
import { mockDelay } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { create } from 'domain'

// Define Zod schema for signin validation
const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Define Zod schema for signup validation
const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}

export const signIn = async (formData: FormData): Promise<ActionResponse> => {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const validationResult = SignInSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid form data',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }
    const user = await getUserByEmail(data.email)
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: { email: ['Invalid email or password'] },
      }
    }

    const isPasswordValid = await verifyPassword(data.password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: { email: ['Invalid email or password'] },
      }
    }

    await createSession(user.id)

    return { success: true, message: 'Signed in successfully' }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || 'An error occurred',
      message: (error as Error).message || 'An error occurred',
    }
  }
}

export const signUp = async (formData: FormData): Promise<ActionResponse> => {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validationResult = SignUpSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid form data',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    const user = await getUserByEmail(data.email)
    if (user) {
      return {
        success: false,
        message: 'Email already in use',
        errors: { email: ['Email already in use'] },
      }
    }

    await createUser(data.email, data.password)

    return { success: true, message: 'Account created successfully' }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || 'An error occurred',
      message: (error as Error).message || 'An error occurred',
    }
  }
}

export async function signOut(): Promise<void> {
  try {
    await mockDelay(300)
    await deleteSession()
  } catch (error) {
    console.error('Sign out error:', error)
    throw new Error('Failed to sign out')
  } finally {
    redirect('/signin')
  }
}
