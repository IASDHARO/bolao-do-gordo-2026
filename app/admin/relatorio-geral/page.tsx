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
    const { data, error } = await supabase
      .rpc('relatorio_geral')

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setDados(data || [])
    setLoading(false)
  }

  function dadosFiltrados() {
    return dados.filter((item: any) => {
      const texto = `${item.nome || ''} ${item.email || ''}`.toLowerCase()
      return texto.includes(filtro.toLowerCase())
    })
  }

  function exportarCSV() {
    const linhas = [
      [
        'Participante',
        'E-mail',
        'Pontos Jogos',
        'Pontos Grupos',
        'Total Geral',
      ],
    ]

    dadosFiltrados().forEach((item: any) => {
      linhas.push([
        item.nome || '',
        item.email || '',
        String(item.pontos_jogos || 0),
        String(item.pontos_grupos || 0),
        String(item.total || 0),
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
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-left">Pontos Jogos</th>
              <th className="p-3 text-left">Pontos Grupos</th>
              <th className="p-3 text-left">Total Geral</th>
            </tr>
          </thead>

          <tbody>
            {dadosFiltrados().map((item: any) => (
              <tr key={item.user_id} className="border-b">
                <td className="p-3">
                  {item.nome || 'Participante'}
                </td>

                <td className="p-3">
                  {item.email}
                </td>

                <td className="p-3">
                  {item.pontos_jogos}
                </td>

                <td className="p-3">
                  {item.pontos_grupos}
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