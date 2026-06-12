'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

export default function ApostasGruposPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [apostas, setApostas] = useState<any[]>([])
  const [filtroParticipante, setFiltroParticipante] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
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

    const { data, error } = await supabase
      .rpc('apostas_grupos_participantes')

    if (error) {
      setMensagem(
        'Erro ao carregar apostas dos grupos: ' + error.message
      )
      setLoading(false)
      return
    }

    setApostas(data || [])
    setLoading(false)
  }

  function podeVer() {
    return isAdmin || new Date() >= PRAZO_FINAL
  }

  function apostasFiltradas() {
    return apostas.filter((item: any) => {
      const passaParticipante =
        !filtroParticipante ||
        item.participante_email === filtroParticipante

      const passaGrupo =
        !filtroGrupo ||
        item.grupo_nome === filtroGrupo

      return passaParticipante && passaGrupo
    })
  }

  function percentual(valor: number, total: number) {
    if (!total) return 0
    return Math.round((valor / total) * 100)
  }

  function contarPorCampo(dados: any[], campo: string) {
    const mapa: Record<string, number> = {}

    dados.forEach((item: any) => {
      const nome = item[campo]

      if (!nome) return

      mapa[nome] = (mapa[nome] || 0) + 1
    })

    return Object.entries(mapa)
      .map(([nome, total]) => ({
        nome,
        total,
      }))
      .sort((a, b) => b.total - a.total)
  }

  function estatisticasGrupo() {
    if (!filtroGrupo) return null

    const dadosGrupo = apostas.filter(
      (item: any) => item.grupo_nome === filtroGrupo
    )

    return {
      grupo: filtroGrupo,
      totalParticipantes: dadosGrupo.length,
      primeiro: contarPorCampo(dadosGrupo, 'primeiro_nome'),
      segundo: contarPorCampo(dadosGrupo, 'segundo_nome'),
      terceiro: contarPorCampo(dadosGrupo, 'terceiro_nome'),
    }
  }

  function BarraEstatistica({
    nome,
    total,
    totalBase,
  }: {
    nome: string
    total: number
    totalBase: number
  }) {
    const perc = percentual(total, totalBase)

    return (
      <div>
        <div className="flex justify-between mb-1">
          <strong translate="no">{nome}</strong>

          <span>
            {total} apostas — {perc}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full"
            style={{ width: `${perc}%` }}
          />
        </div>
      </div>
    )
  }

  function BlocoEstatistica({
    titulo,
    dados,
    totalBase,
  }: {
    titulo: string
    dados: any[]
    totalBase: number
  }) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold mb-4">
          {titulo}
        </h3>

        {dados.length === 0 ? (
          <p>Nenhum palpite encontrado.</p>
        ) : (
          <div className="grid gap-4">
            {dados.map((item: any) => (
              <BarraEstatistica
                key={item.nome}
                nome={item.nome}
                total={item.total}
                totalBase={totalBase}
              />
            ))}
          </div>
        )}
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
            🔒 Apostas dos Grupos
          </h1>

          <p>
            Esta página será liberada para os participantes em
            11/06/2026 às 16:00.
          </p>
        </div>
      </main>
    )
  }

  const estatisticas = estatisticasGrupo()

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        🏆 Apostas dos Grupos
      </h1>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <select
          value={filtroParticipante}
          onChange={(e) => setFiltroParticipante(e.target.value)}
          className="border p-3 rounded-lg bg-white"
        >
          <option value="">Todos os participantes</option>

          {Array.from(
            new Map(
              apostas.map((item: any) => [
                item.participante_email,
                item.participante_nome || item.participante_email,
              ])
            )
          )
            .sort((a: any, b: any) =>
              String(a[1]).localeCompare(String(b[1]))
            )
            .map(([email, nome]: any) => (
              <option key={email} value={email}>
                {nome}
              </option>
            ))}
        </select>

        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          className="border p-3 rounded-lg bg-white"
        >
          <option value="">Todos os grupos</option>

          {Array.from(
            new Set(apostas.map((item: any) => item.grupo_nome))
          )
            .filter(Boolean)
            .sort()
            .map((grupo: any) => (
              <option key={grupo} value={grupo}>
                {grupo}
              </option>
            ))}
        </select>

        <button
          onClick={() => {
            setFiltroParticipante('')
            setFiltroGrupo('')
          }}
          className="bg-gray-700 text-white p-3 rounded-lg"
        >
          Limpar filtros
        </button>
      </div>

      {estatisticas && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow p-6 mb-4">
            <h2 className="text-2xl font-bold mb-2">
              📊 Estatísticas do {estatisticas.grupo}
            </h2>

            <p>
              Total de participantes analisados:{' '}
              <strong>{estatisticas.totalParticipantes}</strong>
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <BlocoEstatistica
              titulo="🥇 Escolhas para 1º Lugar"
              dados={estatisticas.primeiro}
              totalBase={estatisticas.totalParticipantes}
            />

            <BlocoEstatistica
              titulo="🥈 Escolhas para 2º Lugar"
              dados={estatisticas.segundo}
              totalBase={estatisticas.totalParticipantes}
            />

            <BlocoEstatistica
              titulo="🥉 Escolhas para 3º Lugar"
              dados={estatisticas.terceiro}
              totalBase={estatisticas.totalParticipantes}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3">Participante</th>
              <th className="p-3">Grupo</th>
              <th className="p-3">1º</th>
              <th className="p-3">2º</th>
              <th className="p-3">3º</th>
            </tr>
          </thead>

          <tbody>
            {apostasFiltradas().map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">
                  {item.participante_nome ||
                    item.participante_email}
                </td>

                <td className="p-3 font-bold">
                  {item.grupo_nome}
                </td>

                <td className="p-3" translate="no">
                  {item.primeiro_nome || '-'}
                </td>

                <td className="p-3" translate="no">
                  {item.segundo_nome || '-'}
                </td>

                <td className="p-3" translate="no">
                  {item.terceiro_nome || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}