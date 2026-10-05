import { supabase } from './supabase'

export type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export async function signUp(email: string, password: string, fullName: string, phone: string = '') {
  // Check if phone number already exists
  if (phone) {
    const { data: existingPhoneUser, error: phoneCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (phoneCheckError) {
      console.warn('Phone check error:', phoneCheckError.message)
    }

    if (existingPhoneUser) {
      throw new Error('This phone number is already registered. Please use a different one.')
    }
  }

  if (process.env.NEXT_PUBLIC_AUTH_DEV_AUTO_CONFIRM === 'true') {
    const res = await fetch('/api/auth/dev-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, phone }),
    })
    if (!res.ok) {
      let errorMsg = 'Failed to create account'
      try {
        const err = await res.json()
        errorMsg = err.error || err.message || errorMsg
      } catch (e) {
        // Fallback if not JSON
        errorMsg = `Server error: ${res.status} ${res.statusText}`
      }
      throw new Error(errorMsg)
    }
    return await res.json()
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  })

  if (error) throw error

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        phone: phone,
      },
    ])

    // If the profile table doesn't exist or insert is blocked, do not fail sign up
    // Users can still sign in; profile creation can be retried later server-side
    if (profileError) {
      // optional: log to console for debugging
      // console.warn('Profile insert failed:', profileError.message)
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) return null

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError
  }

  return {
    ...user,
    profile,
  }
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single()

  if (error) throw error

  return data
}

export async function sendResetPasswordOTP(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
  return data
}

export async function verifyOTPAndSetPassword(email: string, token: string, newPassword: string) {
  // First verify the OTP
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })
  if (verifyError) throw verifyError

  // Then update the password
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (updateError) throw updateError

  return { verifyData, updateData }
}
