'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [posicao, setPosicao] = useState(0)
  const [pontosTotal, setPontosTotal] = useState(0)
  const [pontosJogos, setPontosJogos] = useState(0)
  const [pontosGrupos, setPontosGrupos] = useState(0)
  const [qtJogos, setQtJogos] = useState(0)
  const [qtGrupos, setQtGrupos] = useState(0)
  const [jogosAcertados, setJogosAcertados] = useState(0)
  const [jogosErrados, setJogosErrados] = useState(0)
  const [taxaAcerto, setTaxaAcerto] = useState(0)
  const [ultimosPalpites, setUltimosPalpites] = useState<any[]>([])

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: usuarioData } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.user.id)
      .single()

    setUsuario(usuarioData)

    const { data: rankingData } = await supabase
      .from('ranking')
      .select(`
        user_id,
        pontos
      `)
      .order('pontos', { ascending: false })

    const minhaPosicao =
      (rankingData || []).findIndex(
        (r: any) => r.user_id === auth.user.id
      ) + 1

    const meuRanking =
      (rankingData || []).find(
        (r: any) => r.user_id === auth.user.id
      )

    setPosicao(minhaPosicao)
    setPontosTotal(meuRanking?.pontos || 0)

    const { data: palpitesJogos } = await supabase
      .from('match_predictions')
      .select(`
        prediction,
        matches(
          match_number,
          resultado,
          encerrado,
          data_hora,
          team1:teams!matches_team1_id_fkey(nome),
          team2:teams!matches_team2_id_fkey(nome)
        )
      `)
      .eq('user_id', auth.user.id)

    const jogosEncerrados =
      palpitesJogos?.filter(
        (p: any) => p.matches?.encerrado === true
      ) || []

    const acertos =
      jogosEncerrados.filter(
        (p: any) =>
          p.prediction === p.matches?.resultado
      ).length

    const erros =
      jogosEncerrados.filter(
        (p: any) =>
          p.prediction !== p.matches?.resultado
      ).length

    const taxa =
      jogosEncerrados.length > 0
        ? Math.round((acertos / jogosEncerrados.length) * 100)
        : 0

    setPontosJogos(acertos)
    setJogosAcertados(acertos)
    setJogosErrados(erros)
    setTaxaAcerto(taxa)
    setQtJogos(palpitesJogos?.length || 0)

    const ultimos =
      (palpitesJogos || [])
        .sort((a: any, b: any) => {
          const jogoA = a.matches?.match_number || 0
          const jogoB = b.matches?.match_number || 0
          return jogoB - jogoA
        })
        .slice(0, 5)

    setUltimosPalpites(ultimos)

    const { data: palpitesGrupos } = await supabase
      .from('group_predictions')
      .select(`
        primeiro_id,
        segundo_id,
        terceiro_id,
        group_results(
          primeiro_id,
          segundo_id,
          terceiro_id
        )
      `)
      .eq('user_id', auth.user.id)

    let pontosG = 0

    palpitesGrupos?.forEach((p: any) => {
      const resultado = Array.isArray(p.group_results)
        ? p.group_results[0]
        : p.group_results

      if (!resultado) return

      if (p.primeiro_id === resultado.primeiro_id)
        pontosG++

      if (p.segundo_id === resultado.segundo_id)
        pontosG++

      if (p.terceiro_id === resultado.terceiro_id)
        pontosG++
    })

    setPontosGrupos(pontosG)
    setQtGrupos(palpitesGrupos?.length || 0)

    setLoading(false)
  }

  function traduzirPalpite(valor: string, jogo: any) {
    if (valor === 'team1') return jogo?.team1?.nome || 'Time 1'
    if (valor === 'team2') return jogo?.team2?.nome || 'Time 2'
    if (valor === 'draw') return 'Empate'
    return '-'
  }

  if (loading) {
    return (
      <main className="p-8">
        Carregando...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-8">
        👤 Meu Perfil
      </h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {usuario?.nome || 'Participante'}
        </h2>

        <p>{usuario?.email}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            🏆 Posição no Ranking
          </h3>

          <p className="text-4xl font-bold mt-2">
            {posicao || '-'}º
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            ⭐ Pontuação Total
          </h3>

          <p className="text-4xl font-bold mt-2">
            {pontosTotal}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            🎯 Taxa de Acerto
          </h3>

          <p className="text-4xl font-bold mt-2">
            {taxaAcerto}%
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            ⚽ Pontos em Jogos
          </h3>

          <p className="text-4xl font-bold mt-2">
            {pontosJogos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            🏆 Pontos em Grupos
          </h3>

          <p className="text-4xl font-bold mt-2">
            {pontosGrupos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            ✅ Jogos Acertados
          </h3>

          <p className="text-4xl font-bold mt-2">
            {jogosAcertados}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            ❌ Jogos Errados
          </h3>

          <p className="text-4xl font-bold mt-2">
            {jogosErrados}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            📝 Palpites de Jogos
          </h3>

          <p className="text-4xl font-bold mt-2">
            {qtJogos}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold">
            📊 Palpites de Grupos
          </h3>

          <p className="text-4xl font-bold mt-2">
            {qtGrupos}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          🕘 Últimos Palpites dos Jogos
        </h2>

        {ultimosPalpites.length === 0 ? (
          <p>Nenhum palpite enviado ainda.</p>
        ) : (
          <div className="grid gap-3">
            {ultimosPalpites.map((item: any, index) => (
              <div
                key={index}
                className="border rounded-lg p-3"
              >
                <p className="font-bold">
                  Jogo {item.matches?.match_number}:{' '}
                  {item.matches?.team1?.nome} x{' '}
                  {item.matches?.team2?.nome}
                </p>

                <p>
                  Seu palpite:{' '}
                  <strong>
                    {traduzirPalpite(
                      item.prediction,
                      item.matches
                    )}
                  </strong>
                </p>

                {item.matches?.encerrado ? (
                  <p>
                    Resultado:{' '}
                    <strong>
                      {traduzirPalpite(
                        item.matches?.resultado,
                        item.matches
                      )}
                    </strong>{' '}
                    {item.prediction === item.matches?.resultado
                      ? '✅ Acertou'
                      : '❌ Errou'}
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Jogo ainda não encerrado.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}