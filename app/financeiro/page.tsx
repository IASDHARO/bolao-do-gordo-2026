'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const VALOR_TAXA = 50

export default function FinanceiroPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [competicaoFinalizada, setCompeticaoFinalizada] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: usuarioLogado } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', auth.user.id)
      .single()

    setIsAdmin(!!usuarioLogado?.is_admin)

    const { data: usuariosData } = await supabase
      .from('users')
      .select('id,nome,email,taxa_paga')
      .order('nome')

    const { data: rankingData } = await supabase
      .from('ranking')
      .select('user_id,pontos')
      .order('pontos', { ascending: false })

    const { count: totalJogos } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    const { count: jogosEncerrados } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('encerrado', true)

    const { count: totalGrupos } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })

    const { count: gruposFinalizados } = await supabase
      .from('group_results')
      .select('*', { count: 'exact', head: true })

    const { data: statusPalpitesData } = await supabase
  .rpc('status_palpites_participantes')

    const usuariosComStatus =
      (usuariosData || []).map((usuario: any) => {
        const status = statusPalpitesData?.find(
  (s: any) => s.user_id === usuario.id
)

const totalPalpitesJogos = status?.palpites_jogos || 0
const totalPalpitesGrupos = status?.palpites_grupos || 0

        return {
          ...usuario,
          palpitesJogosCompletos:
            (totalJogos || 0) > 0 &&
totalPalpitesJogos === (totalJogos || 0),
          palpitesGruposCompletos:
            (totalGrupos || 0) > 0 &&
totalPalpitesGrupos === (totalGrupos || 0),
          totalPalpitesJogos,
          totalPalpitesGrupos,
        }
      })

    setUsuarios(usuariosComStatus)
    setRanking(rankingData || [])

    setCompeticaoFinalizada(
      !!totalJogos &&
        !!totalGrupos &&
        totalJogos === jogosEncerrados &&
        totalGrupos === gruposFinalizados
    )

    setLoading(false)
  }

  async function alterarPagamento(userId: string, pago: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ taxa_paga: pago })
      .eq('id', userId)

    if (error) {
      setMensagem('Erro ao atualizar pagamento: ' + error.message)
      return
    }

    setMensagem('✅ Pagamento atualizado')
    carregarDados()
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const totalParticipantes = usuarios.length
  const totalArrecadado = totalParticipantes * VALOR_TAXA

  const premioPrimeiro = totalArrecadado * 0.6
  const premioSegundo = totalArrecadado * 0.25
  const premioTerceiro = totalArrecadado * 0.15

  function calcularPremiacaoFinal() {
    if (!competicaoFinalizada) return []

    const rankingComUsuarios = ranking.map((r: any) => ({
      ...r,
      usuario: usuarios.find((u: any) => u.id === r.user_id),
    }))

    const pontosUnicos = Array.from(
      new Set(rankingComUsuarios.map((r: any) => r.pontos))
    ).sort((a: any, b: any) => b - a)

    const premiosPorColocacao = [
      premioPrimeiro,
      premioSegundo,
      premioTerceiro,
    ]

    let colocacaoAtual = 0
    const vencedores: any[] = []

    for (const pontos of pontosUnicos) {
      const empatados = rankingComUsuarios.filter(
        (r: any) => r.pontos === pontos
      )

      const inicio = colocacaoAtual
      const fim = colocacaoAtual + empatados.length

      const premioTotal = premiosPorColocacao
        .slice(inicio, fim)
        .reduce((soma, valor) => soma + valor, 0)

      if (premioTotal > 0) {
        const premioIndividual = premioTotal / empatados.length

        empatados.forEach((item: any) => {
          vencedores.push({
            nome: item.usuario?.nome || item.usuario?.email,
            pontos: item.pontos,
            premio: premioIndividual,
          })
        })
      }

      colocacaoAtual += empatados.length

      if (colocacaoAtual >= 3) break
    }

    return vencedores
  }

  if (loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        💰 Premiação / Financeiro
      </h1>

      {mensagem && (
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">👥 Participantes</h2>
          <p className="text-3xl font-bold mt-2">
            {totalParticipantes}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">💵 Taxa</h2>
          <p className="text-3xl font-bold mt-2">
            {formatarMoeda(VALOR_TAXA)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">🏦 Total Arrecadado</h2>
          <p className="text-3xl font-bold mt-2">
            {formatarMoeda(totalArrecadado)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold">📌 Status</h2>
          <p className="text-xl font-bold mt-2">
            {competicaoFinalizada ? 'Finalizada' : 'Em andamento'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          🏆 Distribuição da Premiação
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-yellow-100 rounded-lg p-4">
            <strong>🥇 1º Colocado — 60%</strong>
            <p>{formatarMoeda(premioPrimeiro)}</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <strong>🥈 2º Colocado — 25%</strong>
            <p>{formatarMoeda(premioSegundo)}</p>
          </div>

          <div className="bg-orange-100 rounded-lg p-4">
            <strong>🥉 3º Colocado — 15%</strong>
            <p>{formatarMoeda(premioTerceiro)}</p>
          </div>
        </div>
      </div>

      {competicaoFinalizada && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            🎉 Vencedores e Prêmios
          </h2>

          <div className="grid gap-3">
            {calcularPremiacaoFinal().map((vencedor, index) => (
              <div
                key={index}
                className="border rounded-lg p-3"
              >
                <strong>{vencedor.nome}</strong>
                <p>Pontos: {vencedor.pontos}</p>
                <p>Prêmio: {formatarMoeda(vencedor.premio)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Participante</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-center">Palpites Jogos</th>
              <th className="p-3 text-center">Palpites Grupos</th>
              <th className="p-3 text-center">Taxa paga?</th>
              {isAdmin && (
                <th className="p-3 text-center">Ações</th>
              )}
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario: any) => (
              <tr key={usuario.id} className="border-b">
                <td className="p-3">
                  {usuario.nome || 'Participante'}
                </td>

                <td className="p-3">
                  {usuario.email}
                </td>

                <td className="p-3 text-center font-bold">
                  {usuario.palpitesJogosCompletos
                    ? '✅ Completo'
                    : `❌ ${usuario.totalPalpitesJogos}`}
                </td>

                <td className="p-3 text-center font-bold">
                  {usuario.palpitesGruposCompletos
                    ? '✅ Completo'
                    : `❌ ${usuario.totalPalpitesGrupos}`}
                </td>

                <td className="p-3 text-center font-bold">
                  {usuario.taxa_paga ? '✅ Pago' : '❌ Pendente'}
                </td>

                {isAdmin && (
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        alterarPagamento(
                          usuario.id,
                          !usuario.taxa_paga
                        )
                      }
                      className={
                        usuario.taxa_paga
                          ? 'bg-red-600 text-white px-3 py-2 rounded-lg'
                          : 'bg-green-600 text-white px-3 py-2 rounded-lg'
                      }
                    >
                      {usuario.taxa_paga
                        ? 'Marcar pendente'
                        : 'Marcar pago'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}