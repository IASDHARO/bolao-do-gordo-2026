import { supabase } from '../../lib/supabase'

export default async function JogosPage() {
  const { data: jogos, error } = await supabase
    .from('matches')
    .select(`
      id,
      data_hora,
      encerrado,
      match_number,
      rodada,
      local,
      team1:teams!matches_team1_id_fkey(nome),
      team2:teams!matches_team2_id_fkey(nome)
    `)
    .order('match_number', { ascending: true })

  if (error) return <main className="p-8">Erro: {error.message}</main>

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-8">⚽ Jogos da Copa 2026</h1>

      <div className="grid gap-4">
        {jogos?.map((jogo: any) => (
          <div key={jogo.id} className="bg-white rounded-xl shadow p-4">
            <div className="font-bold text-lg">
              Jogo {jogo.match_number}: {jogo.team1?.nome} x {jogo.team2?.nome}
            </div>

            <div className="text-gray-600">
              Rodada {jogo.rodada} • {new Date(jogo.data_hora).toLocaleString('pt-BR')}
            </div>

            <div className="text-gray-600">{jogo.local}</div>

            <div className="mt-2 text-green-600 font-bold">
              {jogo.encerrado ? 'Encerrado' : 'Aberto para palpites'}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}