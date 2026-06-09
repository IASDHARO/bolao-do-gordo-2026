'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        👥 Participantes
      </h1>

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}