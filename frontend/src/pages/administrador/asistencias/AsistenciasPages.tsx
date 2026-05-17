export default function AsistenciasPage() {
  const personal = [
    { id: 1, nombre: 'Carlos Ramírez', rol: 'MESERO', asistencia: true },
    { id: 2, nombre: 'Lucía Torres', rol: 'COCINERO', asistencia: false },
    { id: 3, nombre: 'Andrés López', rol: 'ADMIN', asistencia: true },
    { id: 4, nombre: 'María Fernández', rol: 'MESERO', asistencia: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Asistencias</h1>
        <p className="text-sm text-text-muted mt-1">
          Entrada 10:00 AM
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                  Rol
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-text">
                  Asistencia
                </th>
              </tr>
            </thead>

            <tbody>
              {personal.map((empleado) => (
                <tr
                  key={empleado.id}
                  className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-text font-medium">
                    {empleado.nombre}
                  </td>

                  <td className="px-6 py-4 text-sm text-text-muted">
                    {empleado.rol}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      defaultChecked={empleado.asistencia}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
