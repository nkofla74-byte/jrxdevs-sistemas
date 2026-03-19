'use client'

export default function RouteFilter({
  routes,
  currentRoute,
  basePath,
}: {
  routes: { id: string; name: string }[]
  currentRoute?: string
  basePath: string
}) {
  return (
    <select
      defaultValue={currentRoute ?? ''}
      onChange={(e) => {
        window.location.href = e.target.value
          ? `${basePath}?ruta=${e.target.value}`
          : basePath
      }}
      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Todas las rutas</option>
      {routes.map((route) => (
        <option key={route.id} value={route.id}>
          {route.name}
        </option>
      ))}
    </select>
  )
}