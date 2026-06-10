'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarRanking()
  }, [])

  async function carregarRanking() {
    const { data: rankingData } = await supabase
      .from('ranking')
      .select('*')
      .order('pontos', { ascending: false })

    const { data: usersData } = await supabase
      .from('users')
      .select('*')

    const { data: historicoData } = await supabase
      .from('ranking_historico')
      .select('*')
      .order('criado_em', { ascending: false })

    const snapshots = Array.from(
      new Set(
        (historicoData || []).map(
          (h: any) => h.snapshot_id
        )
      )
    )

    const snapshotAtual = snapshots[0]
    const snapshotAnterior = snapshots[1]

    const historicoAtual =
      historicoData?.filter(
        (h: any) => h.snapshot_id === snapshotAtual
      ) || []

    const historicoAnterior =
      historicoData?.filter(
        (h: any) => h.snapshot_id === snapshotAnterior
      ) || []

    const rankingCompleto =
      rankingData?.map((item) => {
        const usuario = usersData?.find(
          (u) => u.id === item.user_id
        )

        const atual = historicoAtual.find(
          (h: any) => h.user_id === item.user_id
        )

        const anterior = historicoAnterior.find(
          (h: any) => h.user_id === item.user_id
        )

        const posicaoAtual = atual?.posicao || 0
        const posicaoAnterior = anterior?.posicao || posicaoAtual
        const movimento =
          posicaoAnterior - posicaoAtual

        return {
          ...item,
          usuario,
          posicaoAtual,
          posicaoAnterior,
          movimento,
        }
      }) || []

    setRanking(rankingCompleto)
    setLoading(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function mostrarPosicao(index: number) {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'

    return `${index + 1}º`
  }

  function classeLinha(index: number) {
    if (index === 0) return 'bg-yellow-100 font-bold'
    if (index === 1) return 'bg-gray-100 font-bold'
    if (index === 2) return 'bg-orange-100 font-bold'

    return 'bg-white'
  }

  function mostrarMovimento(movimento: number) {
    if (movimento > 0) {
      return `⬆️ +${movimento}`
    }

    if (movimento < 0) {
      return `⬇️ ${movimento}`
    }

    return '➡️ 0'
  }

  function classeMovimento(movimento: number) {
    if (movimento > 0) return 'text-green-700 font-bold'
    if (movimento < 0) return 'text-red-700 font-bold'

    return 'text-gray-600 font-bold'
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  const top3 = ranking.slice(0, 3)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        🏆 Ranking do Bolão
      </h1>

      <button
        onClick={sair}
        className="bg-red-600 text-white px-4 py-2 rounded-lg mb-6"
      >
        Sair
      </button>

      {top3.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {top3.map((item, index) => (
            <div
              key={item.user_id}
              className={`rounded-xl shadow p-6 text-center ${classeLinha(index)}`}
            >
              <div className="text-5xl mb-3">
                {mostrarPosicao(index)}
              </div>

              <h2 className="text-xl font-bold mb-2">
                {item.usuario?.nome ||
                  item.usuario?.email ||
                  'Participante'}
              </h2>

              <p className="text-3xl font-bold">
                {item.pontos} pts
              </p>

              <p
                className={`mt-2 ${classeMovimento(
                  item.movimento
                )}`}
              >
                {mostrarMovimento(item.movimento)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3">Posição</th>
              <th className="p-3">Participante</th>
              <th className="p-3">Pontos</th>
              <th className="p-3">Movimento</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((item, index) => (
              <tr
                key={item.user_id}
                className={`border-b ${classeLinha(index)}`}
              >
                <td className="p-3 text-center text-2xl">
                  {mostrarPosicao(index)}
                </td>

                <td className="p-3">
                  {item.usuario?.nome ||
                    item.usuario?.email ||
                    'Participante'}
                </td>

                <td className="p-3 text-center font-bold">
                  {item.pontos}
                </td>

                <td
                  className={`p-3 text-center ${classeMovimento(
                    item.movimento
                  )}`}
                >
                  {mostrarMovimento(item.movimento)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}