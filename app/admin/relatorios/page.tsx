'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function RelatoriosPage() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarRelatorio()
  }, [])

  async function carregarRelatorio() {
    const { data, error } = await supabase
      .from('match_predictions')
      .select(`
        prediction,
        users(nome,email),
        matches(
          match_number,
          resultado,
          team1:teams!matches_team1_id_fkey(nome),
          team2:teams!matches_team2_id_fkey(nome)
        )
      `)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setDados(data || [])
    setLoading(false)
  }

  function traduzirResultado(valor: string) {
    if (valor === 'team1') return 'Time 1'
    if (valor === 'team2') return 'Time 2'
    if (valor === 'draw') return 'Empate'
    return '-'
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        📊 Relatório de Palpites dos Jogos
      </h1>

      <div className="overflow-auto bg-white rounded-xl shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="p-3 text-left">Participante</th>
              <th className="p-3 text-left">Jogo</th>
              <th className="p-3 text-left">Palpite</th>
              <th className="p-3 text-left">Resultado</th>
              <th className="p-3 text-left">Acertou?</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item: any, index) => {
              const acertou =
                item.prediction === item.matches?.resultado

              return (
                <tr
                  key={index}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.users?.nome ||
                      item.users?.email}
                  </td>

                  <td className="p-3">
                    Jogo {item.matches?.match_number}
                    <br />
                    {item.matches?.team1?.nome} x{' '}
                    {item.matches?.team2?.nome}
                  </td>

                  <td className="p-3">
                    {traduzirResultado(
                      item.prediction
                    )}
                  </td>

                  <td className="p-3">
                    {traduzirResultado(
                      item.matches?.resultado
                    )}
                  </td>

                  <td className="p-3">
                    {item.matches?.resultado
                      ? acertou
                        ? '✅'
                        : '❌'
                      : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}