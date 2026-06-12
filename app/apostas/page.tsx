'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

export default function ApostasPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [apostas, setApostas] = useState<any[]>([])
  const [filtroParticipante, setFiltroParticipante] = useState('')
  const [filtroJogo, setFiltroJogo] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: usuario } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', auth.user.id)
      .single()

    setIsAdmin(!!usuario?.is_admin)

    const { data: apostasData, error: apostasError } = await supabase
      .rpc('apostas_dos_participantes')

    if (apostasError) {
      setMensagem(
        'Erro ao carregar apostas: ' + apostasError.message
      )
      setLoading(false)
      return
    }

    setApostas(apostasData || [])
    setLoading(false)
  }

  function podeVer() {
    return isAdmin || new Date() >= PRAZO_FINAL
  }

  function traduzirPalpite(prediction: string, item: any) {
    if (prediction === 'team1') return item.team1_nome || 'Time 1'
    if (prediction === 'team2') return item.team2_nome || 'Time 2'
    if (prediction === 'draw') return 'Empate'

    return '-'
  }

  function apostasFiltradas() {
    return apostas.filter((item: any) => {
      const participante =
        `
          ${item.participante_nome || ''}
          ${item.participante_email || ''}
        `.toLowerCase()

      const jogo =
        `
          ${item.match_number}
          ${item.team1_nome || ''}
          ${item.team2_nome || ''}
        `.toLowerCase()

      const passaParticipante =
        !filtroParticipante ||
        participante.includes(
          filtroParticipante.toLowerCase()
        )

      const passaJogo =
        !filtroJogo ||
        jogo.includes(filtroJogo.toLowerCase())

      return passaParticipante && passaJogo
    })
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  if (!podeVer()) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-3xl font-bold mb-4">
            🔒 Apostas dos Participantes
          </h1>

          <p>
            Esta página será liberada para os
            participantes em 11/06/2026 às 16:00.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        👀 Apostas dos Participantes
      </h1>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <input
          type="text"
          placeholder="Filtrar participante..."
          value={filtroParticipante}
          onChange={(e) =>
            setFiltroParticipante(e.target.value)
          }
          className="border p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="Filtrar jogo..."
          value={filtroJogo}
          onChange={(e) =>
            setFiltroJogo(e.target.value)
          }
          className="border p-3 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3">Participante</th>
              <th className="p-3">Jogo</th>
              <th className="p-3">Palpite</th>
            </tr>
          </thead>

          <tbody>
            {apostasFiltradas().map(
              (item: any, index) => (
                <tr
                  key={index}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.participante_nome ||
                      item.participante_email}
                  </td>

                  <td className="p-3" translate="no">
                    Jogo {item.match_number}:{' '}
                    {item.team1_nome || 'Time 1'} x{' '}
                    {item.team2_nome || 'Time 2'}
                  </td>

                  <td className="p-3 font-bold" translate="no">
                    {traduzirPalpite(
                      item.prediction,
                      item
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}