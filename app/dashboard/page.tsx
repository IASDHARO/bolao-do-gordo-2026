'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const [participantes, setParticipantes] = useState(0)
  const [palpitesJogos, setPalpitesJogos] = useState(0)
  const [palpitesGrupos, setPalpitesGrupos] = useState(0)
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
    const { count: totalUsuarios } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalJogos } = await supabase
      .from('match_predictions')
      .select('*', { count: 'exact', head: true })

    const { count: totalGrupos } = await supabase
      .from('group_predictions')
      .select('*', { count: 'exact', head: true })

    const { data: rankingData } = await supabase
      .from('ranking')
      .select(`
        pontos,
        users(nome,email)
      `)
      .order('pontos', { ascending: false })
      .limit(10)

    setParticipantes(totalUsuarios || 0)
    setPalpitesJogos(totalJogos || 0)
    setPalpitesGrupos(totalGrupos || 0)
    setRanking(rankingData || [])

    setLoading(false)
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-8">
        📊 Dashboard do Bolão
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">
            👥 Participantes
          </h2>
          <p className="text-4xl font-bold mt-2">
            {participantes}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">
            ⚽ Palpites dos Jogos
          </h2>
          <p className="text-4xl font-bold mt-2">
            {palpitesJogos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">
            🏆 Palpites dos Grupos
          </h2>
          <p className="text-4xl font-bold mt-2">
            {palpitesGrupos}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          🥇 Top 10 Ranking
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Posição</th>
              <th className="text-left p-2">Participante</th>
              <th className="text-left p-2">Pontos</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((item: any, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">
                  {index + 1}º
                </td>

                <td className="p-2">
                  {item.users?.nome ||
                    item.users?.email}
                </td>

                <td className="p-2 font-bold">
                  {item.pontos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}