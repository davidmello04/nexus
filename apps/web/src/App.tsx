function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
            Nexus
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sistema de controle de pedidos
          </h1>

          <p className="mt-5 text-lg text-slate-300">
            Clientes, produtos, variações, preços personalizados e pedidos em
            um só lugar.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <strong>Clientes</strong>
              <p className="mt-2 text-sm text-slate-400">
                Cadastro e controle de terceirizados.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <strong>Produtos</strong>
              <p className="mt-2 text-sm text-slate-400">
                Preços, imagens e variações.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <strong>Pedidos</strong>
              <p className="mt-2 text-sm text-slate-400">
                Totais calculados automaticamente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App