'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PRAZO_FINAL = new Date('2026-06-11T16:00:00')

export default function GruposPage() {
  const [grupos, setGrupos] = useState<any[]>([])
  const [times, setTimes] = useState<any[]>([])
  const [palpites, setPalpites] = useState<Record<string, any>>({})
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      setMensagem('Você precisa estar logado.')
      setLoading(false)
      return
    }

    const { data: gruposData } = await supabase
      .from('groups')
      .select('*')
      .order('nome')

    const { data: timesData } = await supabase
      .from('teams')
      .select('*')
      .order('nome')

    const { data: palpitesData } = await supabase
      .from('group_predictions')
      .select('*')
      .eq('user_id', auth.user.id)

    const mapa: Record<string, any> = {}

    palpitesData?.forEach((p: any) => {
      mapa[p.group_id] = p
    })

    setGrupos(gruposData || [])
    setTimes(timesData || [])
    setPalpites(mapa)
    setLoading(false)
  }

  async function salvarGrupo(groupId: string) {
    const { data: auth } = await supabase.auth.getUser()

    if (!auth.user) {
      setMensagem('Você precisa estar logado.')
      return
    }

    if (new Date() >= PRAZO_FINAL) {
      setMensagem('⛔ O prazo para envio ou alteração dos palpites terminou.')
      return
    }

    const palpite = palpites[groupId]

    if (!palpite?.primeiro_id || !palpite?.segundo_id || !palpite?.terceiro_id) {
      setMensagem('Selecione 1º, 2º e 3º colocado.')
      return
    }

    if (
  palpite.primeiro_id === palpite.segundo_id ||
  palpite.primeiro_id === palpite.terceiro_id ||
  palpite.segundo_id === palpite.terceiro_id
) {
  setMensagem(
    'Não é permitido repetir a mesma seleção nas posições do grupo.'
  )
  return
}

    const { error } = await supabase
      .from('group_predictions')
      .upsert(
        {
          user_id: auth.user.id,
          group_id: groupId,
          primeiro_id: palpite.primeiro_id,
          segundo_id: palpite.segundo_id,
          terceiro_id: palpite.terceiro_id,
        },
        { onConflict: 'user_id,group_id' }
      )

    if (error) {
      setMensagem('Erro ao salvar grupo: ' + error.message)
      return
    }
    
    setMensagem('✅ Palpite do grupo salvo com sucesso')
  }

  function atualizarPalpite(groupId: string, campo: string, valor: string) {
    setPalpites((atual) => ({
      ...atual,
      [groupId]: {
        ...atual[groupId],
        [campo]: valor,
      },
    }))
  }

  if (loading) return <main className="p-8">Carregando...</main>

  async function sair() {
  await supabase.auth.signOut()
  window.location.href = '/'
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-4">
        🏆 Palpites dos Grupos
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
        {grupos.map((grupo) => {
          const timesDoGrupo = times.filter((t) => t.grupo_id === grupo.id)
          const bloqueado = new Date() >= PRAZO_FINAL

          return (
            <div key={grupo.id} className="bg-white rounded-xl shadow p-4">
              <h2 className="font-bold text-xl mb-4">
                {grupo.nome}
              </h2>

              {['primeiro_id', 'segundo_id', 'terceiro_id'].map((campo, index) => (
                <div key={campo} className="mb-3">
                  <label className="font-bold">
                    {index + 1}º colocado
                  </label>

                  <select
                    className="w-full border rounded-lg p-2 mt-1"
                    value={palpites[grupo.id]?.[campo] || ''}
                    onChange={(e) =>
                      atualizarPalpite(grupo.id, campo, e.target.value)
                    }
                    disabled={bloqueado}
                  >
                    <option value="">Selecione</option>

                    {timesDoGrupo
  .filter((time) => {
    const palpiteAtual = palpites[grupo.id] || {}

    const selecionados = [
      palpiteAtual.primeiro_id,
      palpiteAtual.segundo_id,
      palpiteAtual.terceiro_id,
    ]

    return (
      time.id === palpiteAtual[campo] ||
      !selecionados.includes(time.id)
    )
  })
  .map((time) => (
    <option key={time.id} value={time.id}>
      {time.nome}
    </option>
  ))}
                  </select>
                </div>
              ))}

              <button
                onClick={() => salvarGrupo(grupo.id)}
                disabled={bloqueado}
                className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                Salvar palpite do grupo
              </button>
            </div>
          )
        })}
      </div>
    </main>
  )
}