'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function fazerLogin() {
    setMensagem('Entrando...')

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

    if (error) {
      setMensagem('Erro: ' + error.message)
      return
    }

    const authUser = data.user

    if (!authUser) {
      setMensagem('Erro: usuário não encontrado')
      return
    }

    const { data: usuarioData, error: usuarioError } =
      await supabase
        .from('users')
        .select('is_admin, precisa_trocar_senha')
        .eq('id', authUser.id)
        .single()

    if (usuarioError) {
      setMensagem('Erro ao verificar usuário: ' + usuarioError.message)
      return
    }

    setMensagem('✅ Login realizado com sucesso')

    if (usuarioData?.is_admin) {
      window.location.href = '/admin'
      return
    }

    if (usuarioData?.precisa_trocar_senha) {
      window.location.href = '/trocar-senha'
      return
    }

    window.location.href = '/dashboard'
  }

  async function esqueciSenha() {
  if (!email) {
    setMensagem('Informe seu e-mail primeiro.')
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })

  if (error) {
    setMensagem('Erro ao enviar recuperação: ' + error.message)
    return
  }

  setMensagem('✅ Enviamos um link de recuperação para seu e-mail.')
}

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="https://flagcdn.com/w160/br.png"
            alt="Bandeira do Brasil"
            className="mx-auto mb-4 w-24 rounded shadow"
          />

          <h1 className="text-3xl font-bold">
            Bolão do Gordo
          </h1>

          <p className="text-gray-600 mt-2">
            Copa do Mundo 2026
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full border rounded-lg p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full border rounded-lg p-3"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            onClick={fazerLogin}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Entrar
          </button>

          <button
  onClick={esqueciSenha}
  className="w-full text-sm text-blue-600 underline"
>
  Esqueci minha senha
</button>

          {mensagem && (
            <div className="text-center text-sm">
              {mensagem}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}