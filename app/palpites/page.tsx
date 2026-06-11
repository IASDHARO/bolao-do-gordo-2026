'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PalpitesPage() {
  const [jogos, setJogos] = useState<any[]>([])
  const [palpites, setPalpites] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      setMensagem('Você precisa estar logado para fazer palpites.')
      setLoading(false)
      return
    }

    const { data: jogosData, error: jogosError } = await supabase
      .from('matches')
      .select(`
        id,
        match_number,
        data_hora,
        local,
        encerrado,
        team1_id,
        team2_id
      `)
      .order('match_number')

    if (jogosError) {
      setMensagem('Erro ao carregar jogos: ' + jogosError.message)
      setLoading(false)
      return
    }

    const { data: timesData, error: timesError } = await supabase
      .from('teams')
      .select('id,nome')

    if (timesError) {
      setMensagem('Erro ao carregar seleções: ' + timesError.message)
      setLoading(false)
      return
    }

    const jogosComTimes =
      (jogosData || []).map((jogo: any) => {
        const time1 = timesData?.find(
          (time: any) => time.id === jogo.team1_id
        )

        const time2 = timesData?.find(
          (time: any) => time.id === jogo.team2_id
        )

        return {
          ...jogo,
          team1: time1 || null,
          team2: time2 || null,
        }
      })

    const { data: palpitesData } = await supabase
      .from('match_predictions')
      .select('match_id, prediction')
      .eq('user_id', auth.user.id)

    const mapa: Record<string, string> = {}

    palpitesData?.forEach((p: any) => {
      mapa[p.match_id] = p.prediction
    })

    setJogos(jogosComTimes)
    setPalpites(mapa)
    setLoading(false)
  }

  async function salvarPalpite(matchId: string, prediction: string) {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      setMensagem('Você precisa estar logado.')
      return
    }

    if (new Date() >= PRAZO_FINAL) {
      setMensagem('⛔ O prazo para envio ou alteração dos palpites terminou.')
      return
    }

    setPalpites((atual) => ({
      ...atual,
      [matchId]: prediction,
    }))

    const { error } = await supabase
      .from('match_predictions')
      .upsert(
        {
          user_id: auth.user.id,
          match_id: matchId,
          prediction,
        },
        {
          onConflict: 'user_id,match_id',
        }
      )

    if (error) {
      setMensagem('Erro ao salvar palpite: ' + error.message)
      return
    }

    setMensagem('✅ Palpite salvo com sucesso')
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-4">
        📝 Faça seus Palpites
      </h1>

      <button
        onClick={sair}
        className="bg-red-600 text-white px-4 py-2 rounded-lg mb-6"
      >
        Sair
      </button>

      {mensagem && (
        <div className="bg-white p-3 rounded-lg shadow mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid gap-4">
        {jogos.map((jogo: any) => (
          <div key={jogo.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-lg">
              Jogo {jogo.match_number}
            </h2>

            <p className="mb-2 font-semibold" translate="no">
  {jogo.team1?.nome || 'Seleção 1 não carregada'} x{' '}
  {jogo.team2?.nome || 'Seleção 2 não carregada'}
</p>

            <p className="text-sm text-gray-600 mb-4">
              {new Date(jogo.data_hora).toLocaleString('pt-BR')}
            </p>

            <div className="flex flex-col gap-2">
  <label translate="no">
    <input
      type="radio"
      checked={palpites[jogo.id] === 'team1'}
      onChange={() => salvarPalpite(jogo.id, 'team1')}
      disabled={new Date() >= PRAZO_FINAL}
    />{' '}
    Vitória {jogo.team1?.nome || 'Seleção 1'}
  </label>

  <label translate="no">
    <input
      type="radio"
      checked={palpites[jogo.id] === 'draw'}
      onChange={() => salvarPalpite(jogo.id, 'draw')}
      disabled={new Date() >= PRAZO_FINAL}
    />{' '}
    Empate
  </label>

  <label translate="no">
    <input
      type="radio"
      checked={palpites[jogo.id] === 'team2'}
      onChange={() => salvarPalpite(jogo.id, 'team2')}
      disabled={new Date() >= PRAZO_FINAL}
    />{' '}
    Vitória {jogo.team2?.nome || 'Seleção 2'}
  </label>
</div>
          </div>
        ))}
      </div>
    </main>
  )
}