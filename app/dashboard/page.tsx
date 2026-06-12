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
  const [meusPalpitesJogos, setMeusPalpitesJogos] = useState(0)
  const [meusPalpitesGrupos, setMeusPalpitesGrupos] = useState(0)
  const [totalJogosSistema, setTotalJogosSistema] = useState(0)
  const [totalGruposSistema, setTotalGruposSistema] = useState(0)
  const [minhaPosicao, setMinhaPosicao] = useState(0)
  const [meusPontos, setMeusPontos] = useState(0)
  const [taxaPaga, setTaxaPaga] = useState(false)
  const [tempoRestante, setTempoRestante] = useState('')

  useEffect(() => {
    carregarDashboard()
  }, [])

  useEffect(() => {
  atualizarContador()

  const intervalo = setInterval(() => {
    atualizarContador()
  }, 60000)

  return () => clearInterval(intervalo)
}, [])

  async function carregarDashboard() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: usuario } = await supabase
      .from('users')
      .select('is_admin,taxa_paga')
      .eq('id', auth.user.id)
      .single()

    const admin = !!usuario?.is_admin
    setIsAdmin(admin)
    setTaxaPaga(!!usuario?.taxa_paga)

    const { count: totalUsuarios } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalJogosCadastrados } = await supabase
  .from('matches')
  .select('*', { count: 'exact', head: true })

    const { count: totalGruposCadastrados } = await supabase
  .from('groups')
  .select('*', { count: 'exact', head: true })

    const { count: meusJogos } = await supabase
  .from('match_predictions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', auth.user.id)

    const { count: meusGrupos } = await supabase
  .from('group_predictions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', auth.user.id)

    const { data: rankingCompleto } = await supabase
  .from('ranking')
  .select('user_id,pontos')
  .order('pontos', { ascending: false }) 

    const posicao =
  (rankingCompleto || []).findIndex(
    (item: any) => item.user_id === auth.user.id
  ) + 1

    const meuRanking =
  (rankingCompleto || []).find(
    (item: any) => item.user_id === auth.user.id
  )

setTotalJogosSistema(totalJogosCadastrados || 0)
setTotalGruposSistema(totalGruposCadastrados || 0)
setMeusPalpitesJogos(meusJogos || 0)
setMeusPalpitesGrupos(meusGrupos || 0)
setMinhaPosicao(posicao)
setMeusPontos(meuRanking?.pontos || 0)

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

    const { data: resumoData } = await supabase
  .rpc('resumo_palpites_jogos')

const resumo = (resumoData || []).map((jogo: any) => {
  const totalPalpites =
    jogo.total_team1 +
    jogo.total_draw +
    jogo.total_team2

  return {
    id: jogo.match_id,
    match_number: jogo.match_number,
    data_hora: jogo.data_hora,
    team1: { nome: jogo.team1_nome },
    team2: { nome: jogo.team2_nome },
    totalTeam1: jogo.total_team1,
    totalDraw: jogo.total_draw,
    totalTeam2: jogo.total_team2,
    percentualTeam1: totalPalpites
      ? Math.round((jogo.total_team1 / totalPalpites) * 100)
      : 0,
    percentualDraw: totalPalpites
      ? Math.round((jogo.total_draw / totalPalpites) * 100)
      : 0,
    percentualTeam2: totalPalpites
      ? Math.round((jogo.total_team2 / totalPalpites) * 100)
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

  function atualizarContador() {
  const agora = new Date()
  const diferenca = PRAZO_FINAL.getTime() - agora.getTime()

  if (diferenca <= 0) {
    setTempoRestante('🔒 Palpites encerrados')
    return
  }

  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24))
  const horas = Math.floor(
    (diferenca / (1000 * 60 * 60)) % 24
  )
  const minutos = Math.floor(
    (diferenca / (1000 * 60)) % 60
  )

  setTempoRestante(
    `${dias} dias, ${horas} horas e ${minutos} minutos`
  )
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
  String(jogo.match_number) === filtroJogo

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
      <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">

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
  
  <Link
  href="/apostas-grupos"
  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
>
  <h2 className="text-xl font-bold mb-2">
    🏆 Apostas dos Grupos
  </h2>

  <p>
    Veja os palpites dos grupos de todos os participantes.
  </p>
</Link>

<Link
  href="/financeiro"
  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
>
  <h2 className="text-xl font-bold mb-2">
    💰 Premiação / Financeiro
  </h2>

  <p>
    Consulte pagamentos, arrecadação e premiação.
  </p>
</Link>

</div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
  <h2 className="text-2xl font-bold mb-3">
    ⏳ Encerramento dos Palpites
  </h2>

  <p className="text-3xl font-bold text-green-700">
    {tempoRestante}
  </p>

  <p className="text-sm text-gray-600 mt-2">
    Prazo final: 11/06/2026 às 16:00
  </p>
</div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
  <h2 className="text-2xl font-bold mb-4">
    📊 Minha Situação
  </h2>

  <div className="grid md:grid-cols-5 gap-4">

    <div className="bg-blue-50 rounded-lg p-4">
      <strong>Jogos</strong>
      <p className="text-xl font-bold">
        {meusPalpitesJogos}/{totalJogosSistema}
      </p>

      <p>
        {meusPalpitesJogos === totalJogosSistema
          ? '✅ Completo'
          : '⚠️ Pendente'}
      </p>
    </div>

    <div className="bg-yellow-50 rounded-lg p-4">
      <strong>Grupos</strong>
      <p className="text-xl font-bold">
        {meusPalpitesGrupos}/{totalGruposSistema}
      </p>

      <p>
        {meusPalpitesGrupos === totalGruposSistema
          ? '✅ Completo'
          : '⚠️ Pendente'}
      </p>
    </div>

    <div className="bg-green-50 rounded-lg p-4">
      <strong>Taxa</strong>
      <p className="text-xl font-bold">
        {taxaPaga ? '✅ Pago' : '❌ Pendente'}
      </p>
    </div>

    <div className="bg-purple-50 rounded-lg p-4">
      <strong>Posição</strong>
      <p className="text-2xl font-bold">
        {minhaPosicao || '-'}º
      </p>
    </div>

    <div className="bg-orange-50 rounded-lg p-4">
      <strong>Pontos</strong>
      <p className="text-2xl font-bold">
        {meusPontos}
      </p>
    </div>

  </div>
</div>

    {(
  meusPalpitesJogos < totalJogosSistema ||
  meusPalpitesGrupos < totalGruposSistema
) && (
  <div className="bg-red-50 border border-red-300 rounded-xl p-6 mb-8">
    <h2 className="text-2xl font-bold text-red-700 mb-3">
      ⚠️ Você ainda não concluiu seus palpites
    </h2>

    <div className="mb-4">
      <p>
        Jogos:
        <strong>
          {' '}
          {meusPalpitesJogos}/{totalJogosSistema}
        </strong>
      </p>

      <p>
        Grupos:
        <strong>
          {' '}
          {meusPalpitesGrupos}/{totalGruposSistema}
        </strong>
      </p>
    </div>

    <div className="flex gap-3 flex-wrap">
      {meusPalpitesJogos < totalJogosSistema && (
        <Link
          href="/palpites"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          ⚽ Completar Jogos
        </Link>
      )}

      {meusPalpitesGrupos < totalGruposSistema && (
        <Link
          href="/grupos"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg"
        >
          🏆 Completar Grupos
        </Link>
      )}
    </div>
  </div>
)}

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

            <select
  value={filtroJogo}
  onChange={(e) => setFiltroJogo(e.target.value)}
  className="border p-2 rounded-lg bg-white"
>
  <option value="">Todos os jogos</option>

  {resumoJogos.map((jogo: any) => (
    <option
      key={jogo.id}
      value={String(jogo.match_number)}
    >
      Jogo {jogo.match_number}: {jogo.team1?.nome} x {jogo.team2?.nome}
    </option>
  ))}
</select>
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