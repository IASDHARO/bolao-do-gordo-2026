'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function RelatoriosGruposPage() {
  const [dados, setDados] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarRelatorio()
  }, [])

  async function carregarRelatorio() {
    const { data: palpitesData, error } = await supabase
      .from('group_predictions')
      .select(`
        group_id,
        primeiro_id,
        segundo_id,
        terceiro_id,
        users(nome,email),
        groups(nome),
        primeiro:teams!group_predictions_primeiro_id_fkey(nome),
        segundo:teams!group_predictions_segundo_id_fkey(nome),
        terceiro:teams!group_predictions_terceiro_id_fkey(nome)
      `)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const { data: resultadosData } = await supabase
      .from('group_results')
      .select(`
        group_id,
        primeiro_id,
        segundo_id,
        terceiro_id
      `)

    const mapaResultados: Record<string, any> = {}

    resultadosData?.forEach((r: any) => {
      mapaResultados[r.group_id] = r
    })

    const tratado = (palpitesData || []).map((item: any) => {
      const resultado = mapaResultados[item.group_id]

      let pontos = 0
      let temResultado = false

      if (resultado) {
        temResultado = true

        if (item.primeiro_id === resultado.primeiro_id) pontos++
        if (item.segundo_id === resultado.segundo_id) pontos++
        if (item.terceiro_id === resultado.terceiro_id) pontos++
      }

      return {
        ...item,
        pontos,
        temResultado,
      }
    })

    const ordenado = tratado.sort((a: any, b: any) => {
      const usuarioA = a.users?.email || ''
      const usuarioB = b.users?.email || ''

      if (usuarioA < usuarioB) return -1
      if (usuarioA > usuarioB) return 1

      const grupoA = a.groups?.nome || ''
      const grupoB = b.groups?.nome || ''

      return grupoA.localeCompare(grupoB)
    })

    setDados(ordenado)
    setLoading(false)
  }

  function dadosFiltrados() {
    return dados.filter((item: any) =>
      (item.users?.email || '')
        .toLowerCase()
        .includes(filtro.toLowerCase())
    )
  }

  function exportarCSV() {
    const linhas = [
      [
        'Participante',
        'Grupo',
        'Primeiro',
        'Segundo',
        'Terceiro',
        'Acertos',
      ],
    ]

    dadosFiltrados().forEach((item: any) => {
      linhas.push([
        item.users?.email || '',
        item.groups?.nome || '',
        item.primeiro?.nome || '',
        item.segundo?.nome || '',
        item.terceiro?.nome || '',
        item.temResultado ? `${item.pontos}/3` : '-',
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
    link.download = 'relatorio-grupos.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        🏆 Relatório dos Grupos
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          📥 Exportar CSV
        </button>
      </div>

      <div className="overflow-auto bg-white rounded-xl shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="p-3 text-left">Participante</th>
              <th className="p-3 text-left">Grupo</th>
              <th className="p-3 text-left">1º</th>
              <th className="p-3 text-left">2º</th>
              <th className="p-3 text-left">3º</th>
              <th className="p-3 text-left">Acertos</th>
            </tr>
          </thead>

          <tbody>
            {dadosFiltrados().map((item: any, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">
                  {item.users?.nome || item.users?.email}
                </td>

                <td className="p-3">
                  {item.groups?.nome}
                </td>

                <td className="p-3">
                  {item.primeiro?.nome}
                </td>

                <td className="p-3">
                  {item.segundo?.nome}
                </td>

                <td className="p-3">
                  {item.terceiro?.nome}
                </td>

                <td className="p-3 font-bold">
                  {item.temResultado ? `${item.pontos}/3` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}