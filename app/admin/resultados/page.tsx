'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const ADMIN_EMAIL = 'iasdharo@hotmail.com'

export default function ResultadosPage() {
  const [jogos, setJogos] = useState<any[]>([])
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    verificarAdmin()
  }, [])

  async function verificarAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/'
      return
    }

    if (user.email !== ADMIN_EMAIL) {
      alert('Acesso negado')
      window.location.href = '/palpites'
      return
    }

    setLiberado(true)
    carregarJogos()
  }

  async function carregarJogos() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_number,
        data_hora,
        resultado,
        encerrado,
        team1:teams!matches_team1_id_fkey(nome),
        team2:teams!matches_team2_id_fkey(nome)
      `)
      .order('match_number')

    if (error) {
      setMensagem('Erro ao carregar jogos: ' + error.message)
    } else {
      setJogos(data || [])
    }

    setLoading(false)
  }

  async function salvarResultado(matchId: string, resultado: string) {
    setMensagem('Salvando resultado...')

    const { error } = await supabase
      .from('matches')
      .update({
        resultado,
        encerrado: true,
      })
      .eq('id', matchId)

    if (error) {
      setMensagem('Erro ao salvar resultado: ' + error.message)
      return
    }

    await supabase.rpc('atualizar_ranking')

    setMensagem('✅ Resultado salvo com sucesso')
    carregarJogos()
  }

  if (!liberado || loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-4">
        🏆 Lançar Resultados
      </h1>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid gap-4">
        {jogos.map((jogo: any) => (
          <div key={jogo.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-lg">
              Jogo {jogo.match_number}: {jogo.team1?.nome} x {jogo.team2?.nome}
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              {new Date(jogo.data_hora).toLocaleString('pt-BR')}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => salvarResultado(jogo.id, 'team1')}
                className="bg-green-600 text-white p-2 rounded-lg"
              >
                Vitória {jogo.team1?.nome}
              </button>

              <button
                onClick={() => salvarResultado(jogo.id, 'draw')}
                className="bg-yellow-500 text-white p-2 rounded-lg"
              >
                Empate
              </button>

              <button
                onClick={() => salvarResultado(jogo.id, 'team2')}
                className="bg-blue-600 text-white p-2 rounded-lg"
              >
                Vitória {jogo.team2?.nome}
              </button>
            </div>

            {jogo.resultado && (
              <p className="mt-3 font-bold">
                Resultado salvo: {jogo.resultado}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}