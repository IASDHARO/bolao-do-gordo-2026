'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TrocarSenhaPage() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function salvarSenha() {
    if (!novaSenha || !confirmarSenha) {
      setMensagem('Preencha os dois campos.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem('As senhas não coincidem.')
      return
    }

    if (novaSenha.length < 6) {
      setMensagem('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { error: senhaError } =
      await supabase.auth.updateUser({
        password: novaSenha,
      })

    if (senhaError) {
      setMensagem('Erro ao alterar senha: ' + senhaError.message)
      return
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        precisa_trocar_senha: false,
      })
      .eq('id', auth.user.id)

    if (userError) {
      setMensagem('Senha alterada, mas erro ao atualizar usuário: ' + userError.message)
      return
    }

    setMensagem('✅ Senha alterada com sucesso')

    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1000)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4">
          🔒 Trocar Senha
        </h1>

        <p className="mb-6 text-gray-600">
          Para continuar, cadastre uma senha definitiva.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <button
            onClick={salvarSenha}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Salvar Nova Senha
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