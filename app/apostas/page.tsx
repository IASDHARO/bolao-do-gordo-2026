'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

export default function ApostasPage() {
  const [loading, setLoading] = useState(true)
  const [carregandoApostas, setCarregandoApostas] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [apostas, setApostas] = useState<any[]>([])
  const [jogosFiltro, setJogosFiltro] = useState<any[]>([])
  const [participantesFiltro, setParticipantesFiltro] = useState<any[]>([])
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

    const { data: jogosFiltroData } = await supabase
      .from('matches')
      .select(`
        id,
        match_number,
        team1:teams!matches_team1_id_fkey(nome),
        team2:teams!matches_team2_id_fkey(nome)
      `)
      .order('match_number')

    const { data: participantesData } = await supabase
      .from('users')
      .select('nome,email')
      .order('nome')

    setJogosFiltro(jogosFiltroData || [])
    setParticipantesFiltro(participantesData || [])
    setLoading(false)
  }

  async function carregarPorJogo(matchNumber: string) {
    if (!matchNumber) return

    setCarregandoApostas(true)
    setMensagem('')

    const { data, error } = await supabase
      .rpc('apostas_por_jogo', {
        p_match_number: Number(matchNumber),
      })

    if (error) {
      setMensagem('Erro ao carregar apostas do jogo: ' + error.message)
      setCarregandoApostas(false)
      return
    }

    setApostas(data || [])
    setCarregandoApostas(false)
  }

  async function carregarPorParticipante(email: string) {
    if (!email) return

    setCarregandoApostas(true)
    setMensagem('')

    const { data, error } = await supabase
      .rpc('apostas_por_participante', {
        p_email: email,
      })

    if (error) {
      setMensagem('Erro ao carregar apostas do participante: ' + error.message)
      setCarregandoApostas(false)
      return
    }

    setApostas(data || [])
    setCarregandoApostas(false)
  }

  function podeVer() {
    return isAdmin || new Date() >= PRAZO_FINAL
  }

  function traduzirPalpite(prediction: string, item: any) {
    if (prediction === 'team1') return item.team1_nome || 'Time 1'
    if (prediction === 'team2') return item.team2_nome || 'Time 2'
    if (prediction === 'draw') return 'Empate'

    return 'Não fez palpite'
  }

  function limparFiltros() {
    setFiltroParticipante('')
    setFiltroJogo('')
    setApostas([])
    setMensagem('')
  }

  function percentual(valor: number, total: number) {
    if (!total) return 0
    return Math.round((valor / total) * 100)
  }

  function estatisticasJogo() {
    const votosValidos = apostas.filter(
      (item: any) =>
        item.prediction === 'team1' ||
        item.prediction === 'team2' ||
        item.prediction === 'draw'
    )

    const total = votosValidos.length

    const totalTeam1 = votosValidos.filter(
      (item: any) => item.prediction === 'team1'
    ).length

    const totalDraw = votosValidos.filter(
      (item: any) => item.prediction === 'draw'
    ).length

    const totalTeam2 = votosValidos.filter(
      (item: any) => item.prediction === 'team2'
    ).length

    const jogo = apostas[0]

    return {
      total,
      totalTeam1,
      totalDraw,
      totalTeam2,
      team1Nome: jogo?.team1_nome || 'Time 1',
      team2Nome: jogo?.team2_nome || 'Time 2',
    }
  }

  function BarraEstatistica({
    nome,
    total,
    percentualValor,
  }: {
    nome: string
    total: number
    percentualValor: number
  }) {
    return (
      <div>
        <div className="flex justify-between mb-1">
          <strong translate="no">{nome}</strong>
          <span>
            {total} apostas — {percentualValor}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full"
            style={{ width: `${percentualValor}%` }}
          />
        </div>
      </div>
    )
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
            Esta página será liberada para os participantes em
            11/06/2026 às 16:00.
          </p>
        </div>
      </main>
    )
  }

  const estatisticas = estatisticasJogo()

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

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          🔎 Filtros
        </h2>

        <div className="grid md:grid-cols-3 gap-3">
          <select
            value={filtroJogo}
            onChange={(e) => {
              const valor = e.target.value
              setFiltroJogo(valor)
              setFiltroParticipante('')
              setApostas([])

              if (valor) {
                carregarPorJogo(valor)
              }
            }}
            className="border p-3 rounded-lg bg-white"
          >
            <option value="">
              Selecione um jogo para visualizar as apostas
            </option>

            {jogosFiltro.map((jogo: any) => (
              <option
                key={jogo.id}
                value={String(jogo.match_number)}
              >
                Jogo {jogo.match_number}: {jogo.team1?.nome} x {jogo.team2?.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroParticipante}
            onChange={(e) => {
              const valor = e.target.value
              setFiltroParticipante(valor)
              setFiltroJogo('')
              setApostas([])

              if (valor) {
                carregarPorParticipante(valor)
              }
            }}
            className="border p-3 rounded-lg bg-white"
          >
            <option value="">
              Selecione um participante para visualizar as apostas
            </option>

            {participantesFiltro.map((p: any) => (
              <option
                key={p.email}
                value={p.email}
              >
                {p.nome || p.email}
              </option>
            ))}
          </select>

          <button
            onClick={limparFiltros}
            className="bg-gray-700 text-white p-3 rounded-lg"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {filtroJogo && !carregandoApostas && apostas.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            📊 Estatísticas do Jogo
          </h2>

          <p className="font-bold mb-4" translate="no">
            Jogo {apostas[0]?.match_number}: {estatisticas.team1Nome} x{' '}
            {estatisticas.team2Nome}
          </p>

          <div className="grid gap-4">
            <BarraEstatistica
              nome={estatisticas.team1Nome}
              total={estatisticas.totalTeam1}
              percentualValor={percentual(
                estatisticas.totalTeam1,
                estatisticas.total
              )}
            />

            <BarraEstatistica
              nome="Empate"
              total={estatisticas.totalDraw}
              percentualValor={percentual(
                estatisticas.totalDraw,
                estatisticas.total
              )}
            />

            <BarraEstatistica
              nome={estatisticas.team2Nome}
              total={estatisticas.totalTeam2}
              percentualValor={percentual(
                estatisticas.totalTeam2,
                estatisticas.total
              )}
            />
          </div>

          <p className="mt-4 font-bold">
            Total de palpites: {estatisticas.total}
          </p>
        </div>
      )}

      {carregandoApostas && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          Carregando apostas...
        </div>
      )}

      {!carregandoApostas && apostas.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <p>
            Selecione um jogo ou um participante para visualizar as apostas.
          </p>
        </div>
      )}

      {!carregandoApostas && apostas.length > 0 && (
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
              {apostas.map((item: any, index) => (
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
                    {traduzirPalpite(item.prediction, item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}