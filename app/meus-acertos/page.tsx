'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function MeusAcertosPage() {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<any[]>([])
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

    const { data, error } = await supabase
      .rpc('meus_acertos')

    if (error) {
      setMensagem('Erro ao carregar acertos: ' + error.message)
      setLoading(false)
      return
    }

    setDados(data || [])
    setLoading(false)
  }

  function traduzir(valor: string, item: any) {
    if (valor === 'team1') return item.team1_nome || 'Time 1'
    if (valor === 'team2') return item.team2_nome || 'Time 2'
    if (valor === 'draw') return 'Empate'
    return '-'
  }

  const acertos = dados.filter((item) => item.acertou).length
  const erros = dados.filter((item) => !item.acertou).length
  const total = dados.length
  const aproveitamento =
    total > 0 ? Math.round((acertos / total) * 100) : 0

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        🎯 Meus Acertos
      </h1>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">✅ Acertos</h2>
          <p className="text-4xl font-bold mt-2">
            {acertos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">❌ Erros</h2>
          <p className="text-4xl font-bold mt-2">
            {erros}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">📊 Aproveitamento</h2>
          <p className="text-4xl font-bold mt-2">
            {aproveitamento}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">⚽ Jogos Encerrados</h2>
          <p className="text-4xl font-bold mt-2">
            {total}
          </p>
        </div>
      </div>

      {dados.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6">
          Nenhum jogo encerrado ainda.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="p-3">Jogo</th>
                <th className="p-3">Seu Palpite</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {dados.map((item) => (
                <tr key={item.match_id} className="border-b">
                  <td className="p-3" translate="no">
                    Jogo {item.match_number}:{' '}
                    {item.team1_nome} x {item.team2_nome}
                  </td>

                  <td className="p-3 font-bold" translate="no">
                    {traduzir(item.prediction, item)}
                  </td>

                  <td className="p-3 font-bold" translate="no">
                    {traduzir(item.resultado, item)}
                  </td>

                  <td className="p-3 font-bold">
                    {item.acertou ? '✅ Acertou' : '❌ Errou'}
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