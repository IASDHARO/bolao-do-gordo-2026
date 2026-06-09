'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

export default function DashboardPage() {
  const [participantes, setParticipantes] = useState(0)
  const [palpitesJogos, setPalpitesJogos] = useState(0)
  const [palpitesGrupos, setPalpitesGrupos] = useState(0)
  const [ranking, setRanking] = useState<any[]>([])
  const [resumoJogos, setResumoJogos] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [filtroData, setFiltroData] = useState('')
  const [filtroJogo, setFiltroJogo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
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

    const admin = !!usuario?.is_admin
    setIsAdmin(admin)

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

    const { data: jogosData } = await supabase
      .from('matches')
      .select(`
        id,
        match_number,
        data_hora,
        team1:teams!matches_team1_id_fkey(nome),
        team2:teams!matches_team2_id_fkey(nome)
      `)
      .order('match_number')

    const { data: palpitesData } = await supabase
      .from('match_predictions')
      .select('match_id, prediction')

    const resumo = (jogosData || []).map((jogo: any) => {
      const palpitesDoJogo =
        palpitesData?.filter((p: any) => p.match_id === jogo.id) || []

      const totalTeam1 = palpitesDoJogo.filter(
        (p: any) => p.prediction === 'team1'
      ).length

      const totalDraw = palpitesDoJogo.filter(
        (p: any) => p.prediction === 'draw'
      ).length

      const totalTeam2 = palpitesDoJogo.filter(
        (p: any) => p.prediction === 'team2'
      ).length

      const totalPalpites = totalTeam1 + totalDraw + totalTeam2

      return {
        ...jogo,
        totalTeam1,
        totalDraw,
        totalTeam2,
        percentualTeam1: totalPalpites
          ? Math.round((totalTeam1 / totalPalpites) * 100)
          : 0,
        percentualDraw: totalPalpites
          ? Math.round((totalDraw / totalPalpites) * 100)
          : 0,
        percentualTeam2: totalPalpites
          ? Math.round((totalTeam2 / totalPalpites) * 100)
          : 0,
      }
    })

    setParticipantes(totalUsuarios || 0)
    setPalpitesJogos(totalJogos || 0)
    setPalpitesGrupos(totalGrupos || 0)
    setRanking(rankingData || [])
    setResumoJogos(resumo)
    setLoading(false)
  }

async function sair() {
  await supabase.auth.signOut()
  window.location.href = '/'
}

  function podeVerResumo() {
    return isAdmin || new Date() >= PRAZO_FINAL
  }

  function jogosFiltrados() {
    return resumoJogos.filter((jogo: any) => {
      const dataJogo = jogo.data_hora
        ? new Date(jogo.data_hora).toISOString().slice(0, 10)
        : ''

      const textoJogo = `
        ${jogo.match_number}
        ${jogo.team1?.nome || ''}
        ${jogo.team2?.nome || ''}
      `.toLowerCase()

      const passaData = !filtroData || dataJogo === filtroData
      const passaJogo =
        !filtroJogo ||
        textoJogo.includes(filtroJogo.toLowerCase())

      return passaData && passaJogo
    })
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold">
    📊 Dashboard do Bolão
  </h1>

  <button
    onClick={sair}
    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
  >
    Sair
  </button>
</div>
      <div className="grid md:grid-cols-5 gap-4 mb-8">

  <Link
    href="/perfil"
    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
  >
    <h2 className="text-xl font-bold mb-2">
      👤 Meu Perfil
    </h2>

    <p>
      Veja sua posição, pontos e estatísticas.
    </p>
  </Link>

  <Link
    href="/ranking"
    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
  >
    <h2 className="text-xl font-bold mb-2">
      🥇 Ranking
    </h2>

    <p>
      Consulte a classificação geral do bolão.
    </p>
  </Link>

  <Link
    href="/palpites"
    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
  >
    <h2 className="text-xl font-bold mb-2">
      ⚽ Palpites
    </h2>

    <p>
      Envie e acompanhe seus palpites dos jogos.
    </p>
  </Link>

  <Link
    href="/grupos"
    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
  >
    <h2 className="text-xl font-bold mb-2">
      🏆 Grupos
    </h2>

    <p>
      Defina e acompanhe os classificados dos grupos.
    </p>
  </Link>

  <Link
  href="/apostas"
  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
>
  <h2 className="text-xl font-bold mb-2">
    👀 Apostas dos Participantes
  </h2>

  <p>
    Veja os palpites de todos após a liberação.
  </p>
</Link>

</div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">👥 Participantes</h2>
          <p className="text-4xl font-bold mt-2">{participantes}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">⚽ Palpites dos Jogos</h2>
          <p className="text-4xl font-bold mt-2">{palpitesJogos}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold">🏆 Palpites dos Grupos</h2>
          <p className="text-4xl font-bold mt-2">{palpitesGrupos}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
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
                <td className="p-2">{index + 1}º</td>

                <td className="p-2">
                  {item.users?.nome || item.users?.email}
                </td>

                <td className="p-2 font-bold">{item.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {podeVerResumo() ? (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            📋 Resumo dos Palpites por Jogo
          </h2>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="border p-2 rounded-lg"
            />

            <input
              type="text"
              placeholder="Filtrar por jogo ou seleção..."
              value={filtroJogo}
              onChange={(e) => setFiltroJogo(e.target.value)}
              className="border p-2 rounded-lg"
            />
          </div>

          <div className="grid gap-4">
            {jogosFiltrados().map((jogo: any) => (
              <div
                key={jogo.id}
                className="border rounded-xl p-4"
              >
                <h3 className="font-bold text-lg mb-2">
                  Jogo {jogo.match_number}: {jogo.team1?.nome} x {jogo.team2?.nome}
                </h3>

                <p className="text-sm text-gray-600 mb-3">
                  {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                </p>

                <div className="grid md:grid-cols-3 gap-2">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <strong>{jogo.team1?.nome}</strong>
                    <br />
                    {jogo.totalTeam1} apostas ({jogo.percentualTeam1}%)
                  </div>

                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <strong>Empate</strong>
                    <br />
                    {jogo.totalDraw} apostas ({jogo.percentualDraw}%)
                  </div>

                  <div className="bg-blue-100 p-3 rounded-lg">
                    <strong>{jogo.team2?.nome}</strong>
                    <br />
                    {jogo.totalTeam2} apostas ({jogo.percentualTeam2}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-2">
            📋 Resumo dos Palpites por Jogo
          </h2>

          <p>
            Este resumo ficará disponível para os participantes a partir de
            11/06/2026 às 16:00.
          </p>
        </div>
      )}
    </main>
  )
}