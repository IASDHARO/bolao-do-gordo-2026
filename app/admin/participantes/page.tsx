'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
const [novoEmail, setNovoEmail] = useState('')
const [novaSenha, setNovaSenha] = useState('')

  useEffect(() => {
    carregarParticipantes()
  }, [])

  async function carregarParticipantes() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('email')

    if (error) {
      setMensagem('Erro ao carregar participantes: ' + error.message)
      setLoading(false)
      return
    }

    setParticipantes(data || [])
    setLoading(false)
  }

  function participantesFiltrados() {
    return participantes.filter((p: any) => {
      const texto = `${p.nome || ''} ${p.email || ''}`.toLowerCase()
      return texto.includes(filtro.toLowerCase())
    })
  }

  async function atualizarNome(id: string, nome: string) {
    const { error } = await supabase
      .from('users')
      .update({ nome })
      .eq('id', id)

    if (error) {
      setMensagem('Erro ao atualizar nome: ' + error.message)
      return
    }

    setMensagem('✅ Nome atualizado')
    carregarParticipantes()
  }

  async function alterarAdmin(id: string, isAdmin: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', id)

    if (error) {
      setMensagem('Erro ao alterar administrador: ' + error.message)
      return
    }

    setMensagem('✅ Permissão atualizada')
    carregarParticipantes()
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  async function copiarConvite(email: string, nome: string) {
  const linkBolao = window.location.origin

  const texto = `Olá, ${nome || ''}!

Você foi convidado para participar do Bolão do Gordo - Copa do Mundo 2026.

Acesse:
${linkBolao}

E-mail:
${email}

Use a senha provisória informada pelo administrador.

Boa sorte! ⚽🏆`

  await navigator.clipboard.writeText(texto)

  setMensagem('✅ Convite copiado para a área de transferência')
}

  async function criarParticipante() {
  setMensagem('Criando participante...')

  const response = await fetch(
    '/api/criar-participante',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: novoNome,
        email: novoEmail,
        senha: novaSenha,
      }),
    }
  )

  const resultado = await response.json()

  if (!response.ok) {
    setMensagem(
      'Erro ao criar participante: ' +
        resultado.error
    )
    return
  }

  setMensagem(
    '✅ Participante criado com sucesso'
  )

  setNovoNome('')
  setNovoEmail('')
  setNovaSenha('')

  carregarParticipantes()
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        👥 Participantes
      </h1>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
  <h2 className="text-2xl font-bold mb-4">
    ➕ Novo Participante
  </h2>

  <div className="grid md:grid-cols-3 gap-3">
    <input
      type="text"
      placeholder="Nome"
      value={novoNome}
      onChange={(e) =>
        setNovoNome(e.target.value)
      }
      className="border rounded-lg p-3"
    />

    <input
      type="email"
      placeholder="E-mail"
      value={novoEmail}
      onChange={(e) =>
        setNovoEmail(e.target.value)
      }
      className="border rounded-lg p-3"
    />

    <input
      type="password"
      placeholder="Senha provisória"
      value={novaSenha}
      onChange={(e) =>
        setNovaSenha(e.target.value)
      }
      className="border rounded-lg p-3"
    />
  </div>

  <button
    onClick={criarParticipante}
    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
  >
    Criar Participante
  </button>
</div>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar participante..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full border rounded-lg p-3 mb-4"
      />

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-center">Admin</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {participantesFiltrados().map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">
                  <input
                    type="text"
                    defaultValue={p.nome || ''}
                    className="border rounded-lg p-2 w-full"
                    onBlur={(e) =>
                      atualizarNome(p.id, e.target.value)
                    }
                  />
                </td>

                <td className="p-3">
                  {p.email}
                </td>

                <td className="p-3 text-center">
                  {p.is_admin ? '✅' : '❌'}
                </td>

                <td className="p-3 text-center">
                  <div className="flex gap-2 justify-center">
  <button
    onClick={() =>
      alterarAdmin(p.id, !p.is_admin)
    }
    className={
      p.is_admin
        ? 'bg-red-600 text-white px-3 py-2 rounded-lg'
        : 'bg-blue-600 text-white px-3 py-2 rounded-lg'
    }
  >
    {p.is_admin
      ? 'Remover Admin'
      : 'Tornar Admin'}
  </button>

  <button
    onClick={() =>
      copiarConvite(p.email, p.nome)
    }
    className="bg-green-600 text-white px-3 py-2 rounded-lg"
  >
    📱 Copiar Convite
  </button>
</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}