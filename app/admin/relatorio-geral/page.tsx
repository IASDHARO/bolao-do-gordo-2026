'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function RelatorioGeralPage() {
  const [dados, setDados] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarRelatorio()
  }, [])

  async function carregarRelatorio() {
    const { data: usersData } = await supabase
      .from('users')
      .select('id,nome,email')

    const { data: matchPredictions } = await supabase
      .from('match_predictions')
      .select(`
        user_id,
        prediction,
        matches(resultado, encerrado)
      `)

    const { data: groupPredictions } = await supabase
      .from('group_predictions')
      .select(`
        user_id,
        primeiro_id,
        segundo_id,
        terceiro_id,
        group_results(
          primeiro_id,
          segundo_id,
          terceiro_id
        )
      `)

    const relatorio = (usersData || []).map((usuario: any) => {
      const pontosJogos =
        matchPredictions
          ?.filter((p: any) => p.user_id === usuario.id)
          .filter(
            (p: any) =>
              p.matches?.encerrado === true &&
              p.prediction === p.matches?.resultado
          ).length || 0

      const pontosGrupos =
        groupPredictions
          ?.filter((p: any) => p.user_id === usuario.id)
          .reduce((total: number, p: any) => {
            const resultado = Array.isArray(p.group_results)
              ? p.group_results[0]
              : p.group_results

            if (!resultado) return total

            let pontos = 0

            if (p.primeiro_id === resultado.primeiro_id) pontos++
            if (p.segundo_id === resultado.segundo_id) pontos++
            if (p.terceiro_id === resultado.terceiro_id) pontos++

            return total + pontos
          }, 0) || 0

      return {
        usuario,
        pontosJogos,
        pontosGrupos,
        total: pontosJogos + pontosGrupos,
      }
    })

    const ordenado = relatorio.sort(
      (a: any, b: any) => b.total - a.total
    )

    setDados(ordenado)
    setLoading(false)
  }

  function dadosFiltrados() {
    return dados.filter((item: any) =>
      (item.usuario?.email || '')
        .toLowerCase()
        .includes(filtro.toLowerCase())
    )
  }

  function exportarCSV() {
    const linhas = [
      [
        'Participante',
        'Pontos Jogos',
        'Pontos Grupos',
        'Total Geral',
      ],
    ]

    dadosFiltrados().forEach((item: any) => {
      linhas.push([
        item.usuario?.email || '',
        String(item.pontosJogos),
        String(item.pontosGrupos),
        String(item.total),
      ])
    })

    const csv = linhas
      .map((linha) => linha.join(';'))
      .join('\n')

    const csvComBOM = '\uFEFF' + csv

    const blob = new Blob([csvComBOM], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-geral.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        📋 Relatório Geral
      </h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar participante..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border p-2 rounded-lg w-full"
        />

        <button
          onClick={exportarCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg whitespace-nowrap"
        >
          📥 Exportar CSV
        </button>
      </div>

      <div className="overflow-auto bg-white rounded-xl shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="p-3 text-left">Participante</th>
              <th className="p-3 text-left">Pontos Jogos</th>
              <th className="p-3 text-left">Pontos Grupos</th>
              <th className="p-3 text-left">Total Geral</th>
            </tr>
          </thead>

          <tbody>
            {dadosFiltrados().map((item: any, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">
                  {item.usuario?.nome || item.usuario?.email}
                </td>

                <td className="p-3">
                  {item.pontosJogos}
                </td>

                <td className="p-3">
                  {item.pontosGrupos}
                </td>

                <td className="p-3 font-bold">
                  {item.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}