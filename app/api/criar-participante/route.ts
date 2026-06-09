import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { nome, email, senha } = await req.json()

    const { data, error } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const userId = data.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não criado' },
        { status: 400 }
      )
    }

    const { error: insertError } =
      await adminSupabase
        .from('users')
        .insert({
          id: userId,
          nome,
          email,
          is_admin: false,
        })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}