'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([])

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

  const rankingCompleto =
    rankingData?.map((item) => ({
      ...item,
      usuario: usersData?.find(
        (u) => u.id === item.user_id
      ),
    })) || []

  setRanking(rankingCompleto)
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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3">Posição</th>
              <th className="p-3">Participante</th>
              <th className="p-3">Pontos</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3 text-center text-xl">
  {mostrarPosicao(index)}
</td>

                <td className="p-3">
                  {item.usuario?.nome}
                </td>

                <td className="p-3 text-center font-bold">
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