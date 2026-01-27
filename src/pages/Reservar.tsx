import React, { useState } from 'react';
import '../styles/Menu.css';
import { toast } from 'react-toastify';
import cafeApi from '../api/cafeApi';
import { Box, Typography } from '@mui/material';



interface ReservaDatos {
  nombre: string;
  telefono: string;
  fecha: string;
  hora: string;
  personas: number;
  comentarios:string;
  pago?:number;
  mesa?: string;
}

//const minFecha = new Date().toISOString().split('T')[0];
const hoy = new Date();           // fecha y hora local actual
hoy.setHours(0, 0, 0, 0);        // lleva la hora a medianoche local
const minFecha = hoy.toISOString().split('T')[0]; // sigue usando el mismo minFecha

const maxFecha = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().split('T')[0];
})();


const generarOpcionesHora = (): string[] => {
  const opciones: string[] = [];
  const pad = (n: number) => n.toString().padStart(2, '0');

  for (let h = 12; h <= 15; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 15 && m > 0) continue;
      opciones.push(`${pad(h)}:${pad(m)}`);
    }
  }
  for (let h = 18; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 18 && m < 30) continue;
      if (h === 22 && m > 30) continue;
      opciones.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return opciones;
};

const validarHora = (horaStr: string) => {
  if (!horaStr) return false;
  const [hh, mm] = horaStr.split(':').map(Number);
  const minutosTotales = hh * 60 + mm;
  const rango1Inicio = 12 * 60;
  const rango1Fin = 15 * 60;
  const rango2Inicio = 18 * 60 + 30;
  const rango2Fin = 22 * 60 + 30;
  return (
    (minutosTotales >= rango1Inicio && minutosTotales <= rango1Fin) ||
    (minutosTotales >= rango2Inicio && minutosTotales <= rango2Fin)
  );
};

const Reservar = () => {
  const newRequestId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const [errorHora, setErrorHora] = useState<string | null>(null);
  const [reservaDatos, setReservaDatos] = useState<ReservaDatos>({
    nombre: '',
    telefono: '',
    fecha: '',
    hora: '',
    personas: 1,
    comentarios:'',
    pago:0,
    mesa: ''
  });

  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string>(() => newRequestId());

  // ✅ Mesa sin datos (solo se habilita si telefono === "0000")
  const [sinDatos, setSinDatos] = useState(false);
  const esTelefonoMesa = reservaDatos.telefono.trim() === "0000";

   const handleReservaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setReservaDatos((prev) => ({
      ...prev,
      [name]: name === 'personas' ? Number(value) : value,
    }));

    // ✅ si el teléfono deja de ser 0000, apagamos el checkbox automáticamente
    if (name === 'telefono') {
      const limpio = String(value).trim();
      if (limpio !== "0000" && sinDatos) {
        setSinDatos(false);
      }
    }

    if (name === 'hora') {
      if (validarHora(value)) {
        setErrorHora(null);
      } else {
        setErrorHora('La hora debe estar entre 12:00-15:00 o 18:30-22:30');
      }
    }
  };

  const handleReservaSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // ✅ anti doble submit inmediato
  if (loading) return;

  if (errorHora) {
    alert('Corrige el error en la hora antes de enviar');
    return;
  }

    if (!reservaDatos.fecha || !reservaDatos.hora) {
      alert('Por favor, ingresa fecha y hora válidas');
      return;
    }

    const [hh, mm] = reservaDatos.hora.split(':').map(Number);  
    const [year, month, day] = reservaDatos.fecha.split('-').map(Number);
    const fechaHora = new Date(year, month - 1, day, hh, mm, 0, 0);
    //const fechaHora = new Date(reservaDatos.fecha);
    fechaHora.setHours(hh, mm, 0, 0);

    /*const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaMax = new Date(hoy);
    fechaMax.setMonth(fechaMax.getMonth() + 2);*/
    const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const fechaMax = new Date(hoy);
fechaMax.setMonth(fechaMax.getMonth() + 2);
const minFecha = hoy.toISOString().split('T')[0];
const maxFecha = fechaMax.toISOString().split('T')[0];


    if (fechaHora < hoy) {
      alert('La fecha y hora no pueden ser en el pasado');
      return;
    }

    if (fechaHora > fechaMax) {
      alert('La fecha máxima permitida es 2 meses desde hoy');
      return;
    }

    try {
      setLoading(true);
    // ✅ si ponen 0000, obligar a confirmar checkbox (evita errores humanos)
    if (esTelefonoMesa && !sinDatos) {
      alert('Si el teléfono es 0000, marca "Reserva sin WhatsApp (mesa sin datos)" para confirmar.');
      return;
    }

    const telefonoPayload = esTelefonoMesa
      ? "0000"
      : (reservaDatos.telefono.startsWith("+")
          ? reservaDatos.telefono
          : `+591${String(reservaDatos.telefono).replace(/\D/g, "")}`);

    await cafeApi.post('/reservas', {
      nombre: reservaDatos.nombre,
      telefono: telefonoPayload,
      fecha: fechaHora.toISOString(),
      cantidad: reservaDatos.personas,
      comentarios: reservaDatos.comentarios,
      pago: reservaDatos.pago,
      mesa: (reservaDatos.mesa || "").trim() || undefined,
      // ✅ idempotencia (anti duplicados)
      requestId,

      // ✅ opcional: para identificar que fue creado por admin
      canal: null,

      // ✅ regla explícita para backend (solo true si telefono=0000 y checkbox marcado)
      sinWhatsApp: esTelefonoMesa && sinDatos,
    });

  toast.success(`Reserva creada con éxito para ${reservaDatos.nombre}`);

// ✅ nuevo requestId para la siguiente reserva
setRequestId(newRequestId());

setReservaDatos({
  nombre: '',
  telefono: '',
  fecha: '',
  hora: '',
  personas: 1,
  comentarios: '',
  pago: 0,
  mesa: ''
});
    } catch (error: any) {
      toast.error('Error al enviar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
    maxWidth: 420,
    margin: '0.20rem auto',   // centrado horizontal y un pequeño margen arriba
    bgcolor: '#ffffff',
    p: 3,
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    boxSizing: 'border-box',
      }}
    >
      <Typography
        variant="h6"
        fontWeight={500}
        textAlign="center"
        mb={2}
      >
        Reserva tu mesa
      </Typography>

      <form
        onSubmit={handleReservaSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
      

 {['nombre', 'telefono', 'fecha'].map((field) => {
  const esTel = field === 'telefono';

  return (
    <label key={field} style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
      {field.charAt(0).toUpperCase() + field.slice(1)}

      <input
        type={field === 'fecha' ? 'date' : esTel ? 'tel' : 'text'}
        name={field}
        value={(reservaDatos as any)[field]}
        onChange={handleReservaChange}

        // ✅ Teléfono: requerido siempre (pero permitimos 0000 como caso especial)
        required={true}

        placeholder={
          field === 'nombre'
            ? 'Nombre Completo'
            : esTel
              ? 'Ej. 71234567'
              : undefined
        }

        min={field === 'fecha' ? minFecha : undefined}
        max={field === 'fecha' ? maxFecha : undefined}

        // ✅ Si NO es 0000, valida dígitos. Si es 0000, no fuerces el pattern.
        pattern={esTel && !esTelefonoMesa ? '^\\d{8}$' : undefined}
        title={esTel && !esTelefonoMesa ? 'Teléfono: 8 dígitos (Ej. 71234567). Para mesa sin datos usa 0000.' : undefined}

        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          boxSizing: 'border-box',
          textAlign: field === 'fecha' ? 'left' : 'inherit',
          WebkitAppearance: field === 'fecha' ? 'textfield' : undefined,
          MozAppearance: field === 'fecha' ? 'textfield' : undefined,
          appearance: field === 'fecha' ? 'textfield' : undefined,
        }}
      />
    </label>
  );
})}


        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
          Hora
          <select
            name="hora"
            value={reservaDatos.hora}
            onChange={handleReservaChange}
            required
            style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: errorHora ? '2px solid red' : '1px solid #ccc',
                boxSizing: 'border-box',
                minHeight: '2.5rem', // asegura altura mínima en móvil
                appearance: 'menulist', // mantiene estilo nativo
            }}
          >
            <option value="">Selecciona una hora</option>
            {generarOpcionesHora().map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
        </label>
        {errorHora && <p style={{ color: 'red', fontSize: '0.85rem', margin: 0 }}>{errorHora}</p>}

        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
          Personas
          <select
            name="personas"
            value={reservaDatos.personas}
            onChange={handleReservaChange}
            required
            style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: errorHora ? '2px solid red' : '1px solid #ccc',
                boxSizing: 'border-box',
                minHeight: '2.5rem', // asegura altura mínima en móvil
                appearance: 'menulist', // mantiene estilo nativo
            }}
          >
            {[...Array(40)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>

        <label key={'comentarios'} style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
            {'comentarios'.charAt(0).toUpperCase() + 'comentarios'.slice(1)}
            <input
              type={ 'text'}
              name={'comentarios'}
              value={(reservaDatos as any)['comentarios']}
              onChange={handleReservaChange}
              placeholder={ undefined}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: errorHora ? '2px solid red' : '1px solid #ccc',
                boxSizing: 'border-box',
                minHeight: '2.5rem', // asegura altura mínima en móvil
                appearance: 'menulist', // mantiene estilo nativo
              }}
            />
          </label>

          <label key={'pago'} style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
            {'pago'.charAt(0).toUpperCase() + 'pago'.slice(1)}
            <input
              type={ 'number'}
              name={'pago'}
              value={(reservaDatos as any)['pago']}
              onChange={handleReservaChange}
              placeholder={ undefined}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: errorHora ? '2px solid red' : '1px solid #ccc',
                boxSizing: 'border-box',
                minHeight: '2.5rem', // asegura altura mínima en móvil
                appearance: 'menulist', // mantiene estilo nativo
              }}
            />
          </label>

<label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500 }}>
  Mesa
  <input
    type="text"
    name="mesa"
    value={reservaDatos.mesa || ''}
    onChange={handleReservaChange}
    //placeholder="Ej. 18"
    style={{
      width: '100%',
      padding: '0.5rem 0.75rem',
      fontSize: '1rem',
      borderRadius: '6px',
      border: '1px solid #ccc',
      boxSizing: 'border-box',
      minHeight: '2.5rem',
    }}
  />
</label>

{esTelefonoMesa && (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
    <input
      type="checkbox"
      checked={sinDatos}
      onChange={(e) => setSinDatos(e.target.checked)}
    />
    Reserva (mesa sin datos)
  </label>
)}
        <button
          type="submit"
          disabled={!!errorHora || loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'rgb(225,63,68)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxSizing: 'border-box',
          }}
        >
          {loading ? 'Enviando...' : 'Enviar Reserva'}
        </button>
      </form>
    </Box>
  );
};

export default Reservar;


