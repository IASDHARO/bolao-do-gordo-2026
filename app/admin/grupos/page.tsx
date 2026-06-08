'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminGruposPage() {
  const [grupos, setGrupos] = useState<any[]>([])
  const [times, setTimes] = useState<any[]>([])
  const [resultados, setResultados] = useState<Record<string, any>>({})
  const [mensagem, setMensagem] = useState('')
  const [liberado, setLiberado] = useState(false)
  const [loading, setLoading] = useState(true)

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

    const { data: usuario, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error || !usuario?.is_admin) {
      alert('Acesso negado')
      window.location.href = '/palpites'
      return
    }

    setLiberado(true)
    carregarDados()
  }

  async function carregarDados() {
    const { data: gruposData } = await supabase
      .from('groups')
      .select('*')
      .order('nome')

    const { data: timesData } = await supabase
      .from('teams')
      .select('*')
      .order('nome')

    const { data: resultadosData } = await supabase
      .from('group_results')
      .select('*')

    const mapa: Record<string, any> = {}

    resultadosData?.forEach((r: any) => {
      mapa[r.group_id] = r
    })

    setGrupos(gruposData || [])
    setTimes(timesData || [])
    setResultados(mapa)
    setLoading(false)
  }

  async function salvarGrupo(groupId: string) {
    const resultado = resultados[groupId]

    if (
      !resultado?.primeiro_id ||
      !resultado?.segundo_id ||
      !resultado?.terceiro_id
    ) {
      setMensagem('Preencha as três posições.')
      return
    }

    const { error } = await supabase
      .from('group_results')
      .upsert(
        {
          group_id: groupId,
          primeiro_id: resultado.primeiro_id,
          segundo_id: resultado.segundo_id,
          terceiro_id: resultado.terceiro_id,
        },
        {
          onConflict: 'group_id',
        }
      )

    if (error) {
      setMensagem('Erro: ' + error.message)
      return
    }

    await supabase.rpc('atualizar_ranking')

    setMensagem('✅ Resultado do grupo salvo com sucesso')
  }

  function atualizarResultado(
    groupId: string,
    campo: string,
    valor: string
  ) {
    setResultados((atual) => ({
      ...atual,
      [groupId]: {
        ...atual[groupId],
        [campo]: valor,
      },
    }))
  }

async function limparResultadoGrupo(groupId: string) {
  setMensagem('Limpando resultado do grupo...')

  const { error } = await supabase
    .from('group_results')
    .delete()
    .eq('group_id', groupId)

  if (error) {
    setMensagem('Erro ao limpar resultado do grupo: ' + error.message)
    return
  }

  await supabase.rpc('atualizar_ranking')

  setResultados((atual) => {
    const novo = { ...atual }
    delete novo[groupId]
    return novo
  })

  setMensagem('✅ Resultado do grupo removido com sucesso')
}

  if (!liberado || loading) {
    return <main className="p-8">Carregando...</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-6">
        🏆 Resultados Oficiais dos Grupos
      </h1>

      {mensagem && (
        <div className="bg-white p-3 rounded-lg shadow mb-4">
          {mensagem}
        </div>
      )}

      <div className="grid gap-4">
        {grupos.map((grupo) => {
          const timesDoGrupo = times.filter(
            (t) => t.grupo_id === grupo.id
          )

          return (
            <div
              key={grupo.id}
              className="bg-white rounded-xl shadow p-4"
            >
              <h2 className="font-bold text-xl mb-4">
                {grupo.nome}
              </h2>

              {[
                'primeiro_id',
                'segundo_id',
                'terceiro_id',
              ].map((campo, index) => (
                <div key={campo} className="mb-3">
                  <label className="font-bold">
                    {index + 1}º colocado
                  </label>

                  <select
                    className="w-full border rounded-lg p-2 mt-1"
                    value={resultados[grupo.id]?.[campo] || ''}
                    onChange={(e) =>
                      atualizarResultado(
                        grupo.id,
                        campo,
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecione
                    </option>

                    {timesDoGrupo.map((time) => (
                      <option
                        key={time.id}
                        value={time.id}
                      >
                        {time.nome}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                onClick={() =>
                  salvarGrupo(grupo.id)
                }
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Salvar resultado oficial
              </button>
              {resultados[grupo.id]?.id && (
  <button
    onClick={() => limparResultadoGrupo(grupo.id)}
    className="bg-red-600 text-white px-4 py-2 rounded-lg ml-2"
  >
    ❌ Limpar resultado oficial
  </button>
)}
            </div>
          )
        })}
      </div>
    </main>
  )
}