'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
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
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!liberado) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 via-yellow-100 to-blue-200 p-8">
      <h1 className="text-4xl font-bold mb-8">
        🇧🇷 Painel Administrativo
      </h1>

      <button
        onClick={sair}
        className="bg-red-600 text-white px-4 py-2 rounded-lg mb-6"
      >
        Sair
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/resultados" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">🏆 Resultados dos Jogos</h2>
          <p>Lançar resultados oficiais dos jogos.</p>
        </Link>

        <Link href="/admin/grupos" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">📊 Resultados dos Grupos</h2>
          <p>Definir os 3 classificados oficiais de cada grupo.</p>
        </Link>

        <Link href="/jogos" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">⚽ Jogos</h2>
          <p>Visualizar todos os jogos cadastrados.</p>
        </Link>

        <Link href="/palpites" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">📝 Palpites</h2>
          <p>Acompanhar tela de palpites dos participantes.</p>
        </Link>

        <Link href="/grupos" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">🏅 Palpites dos Grupos</h2>
          <p>Conferir classificação prevista dos grupos.</p>
        </Link>

        <Link href="/ranking" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">
          <h2 className="text-xl font-bold mb-2">🥇 Ranking</h2>
          <p>Visualizar classificação geral do bolão.</p>
        </Link>

        <Link
  href="/admin/relatorios"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    📊 Relatório dos Jogos
  </h2>

  <p>
    Visualizar e exportar os palpites dos jogos.
  </p>
</Link>

<Link
  href="/admin/relatorios-grupos"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    🏆 Relatório dos Grupos
  </h2>

  <p>
    Visualizar acertos e exportar os palpites dos grupos.
  </p>
</Link>
<Link
  href="/dashboard"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    📊 Dashboard
  </h2>

  <p>
    Acompanhar estatísticas e Top 10 do bolão.
  </p>
</Link>

<Link
  href="/admin/relatorio-geral"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    📋 Relatório Geral
  </h2>

  <p>
    Ver pontos dos jogos, pontos dos grupos e total geral.
  </p>
</Link>

<Link
  href="/admin/exportacoes"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    📥 Exportações
  </h2>

  <p>
    Baixar participantes, ranking e palpites em CSV.
  </p>
</Link>

<Link
  href="/admin/participantes"
  className="bg-white p-6 rounded-xl shadow hover:shadow-lg"
>
  <h2 className="text-xl font-bold mb-2">
    👥 Participantes
  </h2>

  <p>
    Editar nomes e permissões dos participantes.
  </p>
</Link>
      </div>
    </main>
  )
}