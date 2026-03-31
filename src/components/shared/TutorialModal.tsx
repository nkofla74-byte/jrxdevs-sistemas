'use client'

import { useState } from 'react'

const steps = {
  cobrador: [
    {
      label: 'Inicio',
      title: 'Tu pantalla principal',
      desc: 'Cuando entras a la app ves 4 números clave: cuánto llevas cobrado, cuánto falta por cobrar, cuánto has prestado hoy y cuánto has gastado. Nada más — sin confusión.',
      tip: 'La app necesita tu GPS activado para funcionar. Si lo apagas, la app se bloquea automáticamente.',
      mockup: 'dashboard-cobrador',
    },
    {
      label: 'Lista clientes',
      title: 'Lista de clientes del día',
      desc: 'Ves todos tus clientes en orden de visita. El número de la izquierda es su posición en tu ruta. El punto de color dice cómo va el crédito: verde = al día, amarillo = 2-3 días sin pagar, naranja = 4-5 días, rojo = 6+ días urgente. Los que ya pagaron hoy aparecen con fondo verde.',
      tip: 'Solo ves los clientes ACTIVOS (con crédito vigente) en la lista principal. Los inactivos aparecen abajo separados.',
      mockup: 'lista-clientes',
    },
    {
      label: 'Detalle cliente',
      title: 'Ficha del cliente',
      desc: 'Al tocar un cliente ves toda su información: nombre, documento, teléfono y dirección. Desde aquí puedes escribirle por WhatsApp con un solo toque, o abrir Google Maps para ver exactamente dónde vive. También ves todos sus créditos activos.',
      tip: 'El botón de WhatsApp abre la conversación directamente sin necesidad de guardar el número en tu celular.',
      mockup: 'detalle-cliente',
    },
    {
      label: 'Registrar pago',
      title: 'Cobrar una cuota',
      desc: 'En la ficha del cliente toca el crédito activo y verás el numpad de pagos. Hay botones rápidos para ½ cuota, 1 cuota o 2 cuotas. Escribe el monto en el teclado grande y toca confirmar. Solo puedes registrar un pago por cliente por día.',
      warn: 'Si te equivocas con el monto, puedes corregirlo el mismo día. Al día siguiente ya no se puede modificar.',
      mockup: 'pago',
    },
    {
      label: 'Crear cliente',
      title: 'Registrar un cliente nuevo',
      desc: 'Para agregar un cliente nuevo hay 3 pasos: primero sus datos personales (nombre, documento, teléfono, dirección), luego 3 fotos obligatorias (documento por delante, por detrás y foto del negocio o casa), y por último el sistema guarda su ubicación GPS automáticamente.',
      warn: 'Las 3 fotos son obligatorias. Sin ellas no se puede guardar el cliente.',
      mockup: 'nuevo-cliente',
    },
    {
      label: 'Crear crédito',
      title: 'Crear un crédito',
      desc: 'Desde la ficha del cliente tocas "+ Nuevo crédito". Defines el capital, el porcentaje de interés, el número de cuotas y la frecuencia (diario, semanal o mensual). El sistema calcula automáticamente la cuota y el total a pagar.',
      tip: 'Un cliente puede tener varios créditos activos al mismo tiempo. No hay límite.',
      mockup: 'nuevo-credito',
    },
    {
      label: 'Consultas',
      title: 'Buscar un cliente',
      desc: 'En el menú de consultas puedes buscar cualquier cliente por nombre o número de documento. Te aparece su ficha completa con todos sus créditos e historial, aunque no haya cobro programado para hoy.',
      tip: 'Puedes buscar clientes de cualquier estado: activos, inactivos, incluso los marcados como incobrables.',
      mockup: 'consultas',
    },
    {
      label: 'Gastos',
      title: 'Registrar un gasto',
      desc: 'Durante el día puedes tener gastos: transporte, papelería, refrigerio. Toca el botón Gastos en el menú, describe en qué gastaste y el monto. Ese valor se descuenta automáticamente de tu caja cuando hagas el cierre.',
      tip: 'Registra los gastos en el momento en que ocurren, no al final del día. Así no se te olvida ninguno.',
      mockup: 'gasto',
    },
    {
      label: 'Enrutar',
      title: 'Reordenar tu ruta',
      desc: 'Puedes cambiar el orden en que visitas a los clientes. Entra a Enrutar desde el menú. Usa las flechas ↑↓ para mover un cliente arriba o abajo, o escribe directamente el número de posición que quieres. Al terminar toca Guardar orden.',
      tip: 'Organiza la ruta para minimizar el recorrido. Empieza por los más cercanos.',
      mockup: 'enrutar',
    },
    {
      label: 'Informes',
      title: 'Ver tus informes',
      desc: 'En Informes puedes ver el resumen financiero del día o del mes completo: cuánto cobraste, cuánto prestaste, tus gastos totales y cuánto ganó la ruta en intereses.',
      tip: 'Los informes del mes te muestran el acumulado desde el día 1 hasta hoy.',
      mockup: 'informes',
    },
    {
      label: 'Cierre de caja',
      title: 'Cierre de caja diario',
      desc: 'Al terminar el día DEBES hacer el cierre antes de apagar el celular. El sistema calcula: base entregada + cobrado − prestado − gastos = efectivo a entregar. Confirma y queda registrado para el administrador.',
      warn: 'Haz el cierre siempre el mismo día. Al día siguiente no puedes modificarlo.',
      mockup: 'cierre',
    },
  ],
  admin: [
    {
      label: 'Dashboard',
      title: 'Tu panel de control',
      desc: 'Al entrar ves el estado global de toda tu oficina: dinero en la calle (prestado activo), cobrado hoy entre todas las rutas, acumulado del mes y clientes activos. Si hay créditos en estado crítico (6+ días sin pagar) aparece una alerta roja arriba.',
      tip: 'El dinero "en calle" es el capital prestado actualmente que aún no se ha recuperado.',
      mockup: 'dashboard-admin',
    },
    {
      label: 'Rutas',
      title: 'Ver y gestionar rutas',
      desc: 'Desde el dashboard ves todas tus rutas activas con el capital inyectado. Toca una ruta para ver su detalle completo: cobros del día, clientes, historial y la ubicación en tiempo real del cobrador.',
      tip: 'Solo el Super Admin puede crear o eliminar rutas. Tú como Admin gestionas las que ya existen.',
      mockup: 'rutas-admin',
    },
    {
      label: 'Clientes',
      title: 'Gestión de clientes',
      desc: 'Ves todos los clientes de tu oficina con su estado. Puedes crear nuevos clientes, editar su información, ver su historial completo de créditos y pagos, y eliminarlos si es necesario.',
      warn: 'Solo el Administrador puede eliminar clientes. Los cobradores no tienen ese permiso. Los datos eliminados se conservan pero quedan invisibles.',
      mockup: 'clientes-admin',
    },
    {
      label: 'Créditos',
      title: 'Semáforo de créditos',
      desc: 'Aquí ves todos los créditos con su estado. El semáforo se actualiza automáticamente cada mañana a las 6am: verde (al día), amarillo (2-3 días), naranja (4-5 días), rojo crítico (6+ días). Puedes ver capital, interés, cuotas pagadas y saldo pendiente.',
      tip: 'El semáforo solo cuenta días de Lunes a Sábado. Los domingos no cuentan para la mora.',
      mockup: 'creditos-admin',
    },
    {
      label: 'Capital',
      title: 'Mover capital entre rutas',
      desc: 'Puedes inyectar dinero a una ruta (darle más plata para prestar), retirar dinero, o transferir entre dos rutas. Cada movimiento queda registrado con fecha, hora y monto.',
      tip: 'Cuando el cobrador presta dinero nuevo, el capital disponible baja automáticamente. Cuando cobra, sube.',
      mockup: 'capital-admin',
    },
    {
      label: 'Cierres',
      title: 'Historial de cierres de caja',
      desc: 'Aquí ves todos los cierres de caja de los cobradores. Para cada cierre: fecha, cobrador, cuánto cobró, cuánto prestó, gastos y el efectivo total que debía entregar.',
      tip: 'Si un cobrador no hizo cierre un día, ese día aparece en blanco en el historial.',
      mockup: 'cierres-admin',
    },
    {
      label: 'Ubicación GPS',
      title: 'Ver cobrador en tiempo real',
      desc: 'Entra a una ruta y toca el botón "Ver ubicación del cobrador". Muestra las coordenadas exactas y cuándo fue la última actualización. Toca "Abrir en Google Maps" para ver el punto exacto. La ubicación se actualiza cada 30 segundos.',
      tip: 'Si el cobrador apagó el GPS o cerró la app, verás la última ubicación registrada con su hora.',
      mockup: 'gps-admin',
    },
    {
      label: 'Autorizar dispositivo',
      title: 'Autorizar un dispositivo nuevo',
      desc: 'Si un cobrador cambia de celular o tiene problemas para entrar, entra a su ruta y toca el botón amarillo "Autorizar inicio desde nuevo dispositivo". El bloqueo se elimina y el cobrador puede entrar desde su celular nuevo.',
      warn: 'Úsalo SOLO cuando el cobrador realmente cambió de celular. Es una medida de seguridad para evitar accesos no autorizados.',
      mockup: 'dispositivo-admin',
    },
    {
      label: 'Configuración',
      title: 'Configuración de la oficina',
      desc: 'Defines el horario de operación: desde qué hora hasta qué hora pueden los cobradores registrar pagos. Fuera de ese horario la app queda en modo solo lectura. Esta validación se hace en el servidor, no solo en el celular.',
      tip: 'Configura el horario con margen. Si tus cobradores terminan a las 7pm, pon el cierre a las 8pm.',
      mockup: 'config-admin',
    },
  ],
}

const mockupStyles = `
  .tut-mk { background: rgba(139,92,246,0.05); border-radius: 16px; border: 1px solid rgba(139,92,246,0.15); padding: 14px; margin-bottom: 14px; }
  .tut-mk-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .tut-mk-ttl { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .tut-badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; }
  .tut-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 10px; margin-bottom: 6px; }
  .tut-card-hl { background: rgba(139,92,246,0.08); border: 1.5px solid rgba(139,92,246,0.4); border-radius: 12px; padding: 10px; margin-bottom: 6px; }
  .tut-card-green { background: rgba(16,185,129,0.08); border: 1.5px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 10px; margin-bottom: 6px; }
  .tut-card-red { background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 10px; margin-bottom: 6px; }
  .tut-card-yellow { background: rgba(245,158,11,0.08); border: 1.5px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 10px; margin-bottom: 6px; }
  .tut-lbl { font-size: 10px; color: var(--text-muted); margin-bottom: 2px; }
  .tut-val { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .tut-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; }
  .tut-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 6px; }
  .tut-stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 9px; }
  .tut-btn { width: 100%; padding: 10px; border-radius: 12px; border: none; font-size: 12px; font-weight: 600; margin-top: 6px; text-align: center; cursor: pointer; }
  .tut-li { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 4px; }
  .tut-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .tut-numpad { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; margin-top: 6px; }
  .tut-key { padding: 9px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); font-size: 12px; text-align: center; color: var(--text-primary); }
  .tut-sep { height: 1px; background: var(--border); margin: 8px 0; }
`

const mockups: Record<string, React.ReactNode> = {
  'dashboard-cobrador': (
    <div>
      <div className="tut-mk-hdr"><span className="tut-mk-ttl">Ruta Centro — Hoy</span><span className="tut-badge" style={{background:'rgba(16,185,129,0.15)',color:'var(--success)'}}>GPS activo</span></div>
      <div className="tut-row2">
        <div className="tut-stat"><div className="tut-lbl">Cobrado hoy</div><div className="tut-val" style={{color:'var(--success)',fontSize:15}}>$320.000</div></div>
        <div className="tut-stat"><div className="tut-lbl">Por cobrar</div><div className="tut-val" style={{color:'var(--neon-bright)',fontSize:15}}>$530.000</div></div>
      </div>
      <div className="tut-row2">
        <div className="tut-stat"><div className="tut-lbl">Prestado hoy</div><div className="tut-val">$150.000</div></div>
        <div className="tut-stat"><div className="tut-lbl">Gastos del día</div><div className="tut-val" style={{color:'var(--warning)'}}>$12.000</div></div>
      </div>
      <div className="tut-row3" style={{marginTop:8}}>
        <div className="tut-card" style={{textAlign:'center',padding:8}}><div style={{fontSize:16}}>👥</div><div className="tut-lbl" style={{marginTop:3}}>Clientes</div></div>
        <div className="tut-card" style={{textAlign:'center',padding:8}}><div style={{fontSize:16}}>🔍</div><div className="tut-lbl" style={{marginTop:3}}>Consultas</div></div>
        <div className="tut-card-hl" style={{textAlign:'center',padding:8}}><div style={{fontSize:16}}>💸</div><div className="tut-lbl" style={{marginTop:3,color:'var(--neon-primary)'}}>Gastos</div></div>
      </div>
    </div>
  ),
  'lista-clientes': (
    <div>
      <div className="tut-row3" style={{marginBottom:10}}>
        <div className="tut-stat" style={{textAlign:'center'}}><div className="tut-val" style={{fontSize:18}}>18</div><div className="tut-lbl">Total</div></div>
        <div className="tut-stat" style={{textAlign:'center'}}><div className="tut-val" style={{fontSize:18,color:'var(--success)'}}>11</div><div className="tut-lbl">Pagaron</div></div>
        <div className="tut-stat" style={{textAlign:'center'}}><div className="tut-val" style={{fontSize:18,color:'var(--warning)'}}>7</div><div className="tut-lbl">Pendientes</div></div>
      </div>
      <div className="tut-card-green"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:24,height:24,borderRadius:6,background:'rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'var(--success)'}}>1</div><div className="tut-dot" style={{background:'#10b981'}}></div><span style={{fontSize:12,color:'var(--success)',fontWeight:500}}>María González</span></div><div style={{textAlign:'right'}}><div style={{fontSize:10,color:'var(--success)',fontWeight:600}}>✓ Pagado</div><div style={{fontSize:12,color:'var(--success)',fontWeight:600}}>$15.000</div></div></div></div>
      <div className="tut-card"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:24,height:24,borderRadius:6,background:'var(--bg-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'var(--text-muted)'}}>2</div><div className="tut-dot" style={{background:'#f59e0b'}}></div><span style={{fontSize:12,fontWeight:500}}>Carlos Ruiz</span></div><div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:600,color:'var(--neon-bright)'}}>$20.000</div><div style={{fontSize:10,color:'var(--text-muted)'}}>por cobrar</div></div></div></div>
      <div className="tut-card"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:24,height:24,borderRadius:6,background:'var(--bg-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'var(--text-muted)'}}>3</div><div className="tut-dot" style={{background:'#ef4444'}}></div><span style={{fontSize:12,fontWeight:500}}>Ana Torres</span></div><div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:600,color:'var(--danger)'}}>$25.000</div><div style={{fontSize:10,color:'var(--danger)'}}>6 días</div></div></div></div>
    </div>
  ),
  'pago': (
    <div>
      <div className="tut-card-hl"><div className="tut-lbl">Monto ingresado</div><div className="tut-val" style={{fontSize:24,fontFamily:'DM Mono',color:'var(--neon-bright)'}}>20.000</div><div className="tut-lbl" style={{marginTop:4}}>Cuota: $20.000 · Cuotas: 8/24</div></div>
      <div className="tut-row3" style={{marginBottom:6}}>
        <div className="tut-card" style={{textAlign:'center',padding:6}}><div style={{fontSize:10,color:'var(--neon-primary)',fontWeight:500}}>½ cuota</div><div style={{fontSize:11,color:'var(--neon-primary)'}}>$10.000</div></div>
        <div className="tut-card-hl" style={{textAlign:'center',padding:6}}><div style={{fontSize:10,fontWeight:500}}>1 cuota</div><div style={{fontSize:11}}>$20.000</div></div>
        <div className="tut-card" style={{textAlign:'center',padding:6}}><div style={{fontSize:10,color:'var(--neon-primary)',fontWeight:500}}>2 cuotas</div><div style={{fontSize:11,color:'var(--neon-primary)'}}>$40.000</div></div>
      </div>
      <div className="tut-numpad">{['1','2','3','4','5','6','7','8','9','000','0','⌫'].map(k=><div key={k} className="tut-key" style={k==='⌫'?{background:'rgba(239,68,68,0.1)',borderColor:'rgba(239,68,68,0.3)',color:'var(--danger)'}:{}}>{k}</div>)}</div>
      <div className="tut-btn" style={{background:'var(--success)',color:'white',marginTop:8}}>✓ Confirmar pago</div>
    </div>
  ),
  'cierre': (
    <div>
      <div className="tut-card"><div style={{display:'flex',justifyContent:'space-between'}}><span className="tut-lbl">Base entregada</span><span className="tut-val">$500.000</span></div></div>
      <div className="tut-card"><div style={{display:'flex',justifyContent:'space-between'}}><span className="tut-lbl">+ Cobrado hoy</span><span className="tut-val" style={{color:'var(--success)'}}>+$320.000</span></div></div>
      <div className="tut-card"><div style={{display:'flex',justifyContent:'space-between'}}><span className="tut-lbl">− Prestado hoy</span><span className="tut-val" style={{color:'var(--danger)'}}>−$150.000</span></div></div>
      <div className="tut-card"><div style={{display:'flex',justifyContent:'space-between'}}><span className="tut-lbl">− Gastos del día</span><span className="tut-val" style={{color:'var(--warning)'}}>−$12.000</span></div></div>
      <div className="tut-sep"></div>
      <div className="tut-card-green"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:13,fontWeight:600,color:'var(--success)'}}>Total a entregar</span><span style={{fontSize:18,fontWeight:700,color:'var(--success)',fontFamily:'DM Mono'}}>$658.000</span></div></div>
      <div className="tut-btn" style={{background:'var(--success)',color:'white'}}>Confirmar cierre de caja</div>
    </div>
  ),
  'dashboard-admin': (
    <div>
      <div className="tut-card-red" style={{marginBottom:8}}><div style={{display:'flex',alignItems:'center',gap:8}}><div className="tut-dot" style={{background:'var(--danger)'}}></div><div><div style={{fontSize:12,fontWeight:600,color:'var(--danger)'}}>3 créditos en estado crítico</div><div style={{fontSize:10,color:'var(--danger)'}}>6+ días sin pagar</div></div></div></div>
      <div className="tut-row2">
        <div className="tut-stat"><div className="tut-lbl">Dinero en calle</div><div className="tut-val" style={{fontSize:13,color:'var(--neon-bright)'}}>$8.400.000</div></div>
        <div className="tut-stat"><div className="tut-lbl">Cobrado hoy</div><div className="tut-val" style={{fontSize:13,color:'var(--success)'}}>$850.000</div></div>
      </div>
      <div className="tut-row2" style={{marginTop:6}}>
        <div className="tut-stat"><div className="tut-lbl">Cobrado este mes</div><div className="tut-val" style={{fontSize:12}}>$14.200.000</div></div>
        <div className="tut-stat"><div className="tut-lbl">Clientes activos</div><div className="tut-val" style={{fontSize:18,color:'var(--warning)'}}>127</div></div>
      </div>
    </div>
  ),
}

const defaultMockup = (label: string) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,color:'var(--text-muted)',fontSize:13}}>
    Vista de {label}
  </div>
)

export default function TutorialModal({ role }: { role: 'cobrador' | 'admin' }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const list = steps[role]
  const current = list[step]
  const pct = ((step + 1) / list.length) * 100

  function close() { setOpen(false); setStep(0) }

  return (
    <>
      <style>{mockupStyles}</style>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 12, padding: '8px 14px',
          color: 'var(--neon-primary)', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        📖 Tutorial
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', padding: '0 0 0 0',
          }}
          onClick={close}
        >
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border)',
              borderRadius: '24px 24px 0 0',
              padding: 24, maxHeight: '92vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>📖</span>
                <div>
                  <p style={{fontFamily:'Syne',fontWeight:700,fontSize:15,color:'var(--text-primary)'}}>Tutorial</p>
                  <p style={{fontSize:11,color:'var(--text-muted)'}}>
                    {role === 'cobrador' ? 'Panel del cobrador' : 'Panel del administrador'}
                  </p>
                </div>
              </div>
              <button onClick={close} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:'6px 10px',color:'var(--text-muted)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                Cerrar ✕
              </button>
            </div>

            {/* Mini nav */}
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:14}}>
              {list.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    fontSize:10,padding:'3px 8px',borderRadius:99,
                    border:'1px solid',cursor:'pointer',
                    borderColor: i === step ? 'var(--neon-primary)' : 'var(--border)',
                    background: i === step ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)',
                    color: i === step ? 'var(--neon-bright)' : 'var(--text-muted)',
                    fontWeight: i === step ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{height:3,background:'var(--border)',borderRadius:4,marginBottom:16,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:'var(--gradient-primary)',borderRadius:4,transition:'width .3s'}}></div>
            </div>

            {/* Step info */}
            <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>
              Paso {step + 1} de {list.length} — {current.label}
            </p>
            <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:18,color:'var(--text-primary)',marginBottom:8,lineHeight:1.3}}>
              {current.title}
            </h2>
            <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7,marginBottom:14}}>
              {current.desc}
            </p>

            {/* Mockup */}
            <div className="tut-mk">
              {mockups[current.mockup] ?? defaultMockup(current.label)}
            </div>

            {/* Tip */}
            {current.tip && (
              <div style={{background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:12,color:'var(--neon-bright)',lineHeight:1.6}}>
                💡 {current.tip}
              </div>
            )}

            {/* Warn */}
            {current.warn && (
              <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:12,color:'var(--warning)',lineHeight:1.6}}>
                ⚠️ {current.warn}
              </div>
            )}

            {/* Nav buttons */}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                style={{
                  flex:1,padding:'12px 0',borderRadius:14,
                  border:'1px solid var(--border)',
                  background:'var(--bg-card)',
                  color:'var(--text-muted)',fontSize:13,
                  fontWeight:600,cursor:'pointer',
                  visibility: step === 0 ? 'hidden' : 'visible',
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={() => {
                  if (step < list.length - 1) setStep(s => s + 1)
                  else close()
                }}
                style={{
                  flex:2,padding:'12px 0',borderRadius:14,
                  border:'none',background:'var(--gradient-primary)',
                  color:'white',fontSize:13,fontWeight:700,cursor:'pointer',
                }}
              >
                {step < list.length - 1 ? 'Siguiente →' : '✓ Finalizar tutorial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
