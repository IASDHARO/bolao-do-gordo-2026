'use client'

import { supabase } from '../../../lib/supabase'

export default function ExportacoesPage() {
  function baixarCSV(nomeArquivo: string, linhas: string[][]) {
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
    link.download = nomeArquivo
    link.click()

    URL.revokeObjectURL(url)
  }

  async function exportarParticipantes() {
    const { data } = await supabase
      .from('users')
      .select('nome,email,is_admin,criado_em')
      .order('email')

    const linhas = [
      ['Nome', 'Email', 'Admin', 'Criado em'],
      ...(data || []).map((u: any) => [
        u.nome || '',
        u.email || '',
        u.is_admin ? 'SIM' : 'NAO',
        u.criado_em || '',
      ]),
    ]

    baixarCSV('participantes.csv', linhas)
  }

  async function exportarRanking() {
    const { data } = await supabase
      .from('ranking')
      .select(`
        pontos,
        atualizado_em,
        users(nome,email)
      `)
      .order('pontos', { ascending: false })

    const linhas = [
      ['Participante', 'Pontos', 'Atualizado em'],
      ...(data || []).map((r: any) => [
        r.users?.nome || r.users?.email || '',
        String(r.pontos || 0),
        r.atualizado_em || '',
      ]),
    ]

    baixarCSV('ranking.csv', linhas)
  }

  async function exportarPalpitesJogos() {
    const { data } = await supabase
      .from('match_predictions')
      .select(`
        prediction,
        users(nome,email),
        matches(
          match_number,
          data_hora,
          resultado,
          team1:teams!matches_team1_id_fkey(nome),
          team2:teams!matches_team2_id_fkey(nome)
        )
      `)

    const linhas = [
      [
        'Participante',
        'Jogo',
        'Data',
        'Confronto',
        'Palpite',
        'Resultado',
      ],
      ...(data || []).map((p: any) => [
        p.users?.nome || p.users?.email || '',
        `Jogo ${p.matches?.match_number || ''}`,
        p.matches?.data_hora || '',
        `${p.matches?.team1?.nome || ''} x ${p.matches?.team2?.nome || ''}`,
        p.prediction || '',
        p.matches?.resultado || '',
      ]),
    ]

    baixarCSV('palpites-jogos.csv', linhas)
  }

  async function exportarPalpitesGrupos() {
    const { data } = await supabase
      .from('group_predictions')
      .select(`
        users(nome,email),
        groups(nome),
        primeiro:teams!group_predictions_primeiro_id_fkey(nome),
        segundo:teams!group_predictions_segundo_id_fkey(nome),
        terceiro:teams!group_predictions_terceiro_id_fkey(nome)
      `)

    const linhas = [
      ['Participante', 'Grupo', 'Primeiro', 'Segundo', 'Terceiro'],
      ...(data || []).map((p: any) => [
        p.users?.nome || p.users?.email || '',
        p.groups?.nome || '',
        p.primeiro?.nome || '',
        p.segundo?.nome || '',
        p.terceiro?.nome || '',
      ]),
    ]

    baixarCSV('palpites-grupos.csv', linhas)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        📥 Exportações
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={exportarParticipantes}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-left"
        >
          <h2 className="text-xl font-bold mb-2">
            👥 Participantes
          </h2>
          <p>Exportar lista de participantes.</p>
        </button>

        <button
          onClick={exportarRanking}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-left"
        >
          <h2 className="text-xl font-bold mb-2">
            🥇 Ranking
          </h2>
          <p>Exportar classificação geral.</p>
        </button>

        <button
          onClick={exportarPalpitesJogos}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-left"
        >
          <h2 className="text-xl font-bold mb-2">
            ⚽ Palpites dos Jogos
          </h2>
          <p>Exportar todos os palpites dos jogos.</p>
        </button>

        <button
          onClick={exportarPalpitesGrupos}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg text-left"
        >
          <h2 className="text-xl font-bold mb-2">
            🏆 Palpites dos Grupos
          </h2>
          <p>Exportar todos os palpites dos grupos.</p>
        </button>
      </div>
    </main>
  )
}