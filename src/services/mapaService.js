import { supabase } from './supabase'
import L from 'leaflet'

export const mapaService = {
  async obtenerBasesPoliciales() {
    try {
      const { data, error } = await supabase
        .from('bases_policiales')
        .select('id, nombre, tipo, latitud, longitud, telefono, direccion')

      if (error) {
        console.error('Error Supabase al consultar bases policiales:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error inesperado al obtener bases policiales:', err)
      return []
    }
  },

  async obtenerBarriosConCuadrante(idCuadrante = null) {
    try {
      if (!idCuadrante) {
        return []
      }

      const { data, error } = await supabase
        .from('barrios_wikimapia_tulua')
        .select(`
          id,
          wikimapia_id,
          nombre_barrio,
          descripcion,
          comuna_o_zona,
          cuadrante_id,
          poligono_geojson,
          coordenadas_cardinales,
          cuadrantes:cuadrante_id (
            id,
            numero_zona,
            nombre,
            telefono_contacto,
            color_hex,
            descripcion_geografica
          )
        `)
        .eq('cuadrante_id', idCuadrante)
        .not('poligono_geojson', 'is', null)

      if (error) {
        console.error('Error Supabase al consultar barrios del cuadrante:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error inesperado al obtener barrios del cuadrante:', err)
      return []
    }
  },

  obtenerColorCuadrante(barrio) {
    const cuadrante = Array.isArray(barrio?.cuadrantes)
      ? barrio.cuadrantes[0]
      : barrio?.cuadrantes

    if (cuadrante?.color_hex) {
      return cuadrante.color_hex
    }

    const coloresPorZona = {
      1: '#E11D48',
      2: '#2563EB',
      3: '#16A34A',
      4: '#D97706',
      5: '#7C3AED',
      6: '#0891B2',
      7: '#DB2777',
      8: '#4F46E5',
      9: '#059669',
      10: '#EA580C',
      11: '#9333EA',
      12: '#0284C7',
      13: '#65A30D',
      14: '#DC2626',
      15: '#0D9488',
      16: '#CA8A04',
      17: '#C026D3',
      18: '#475569'
    }

    return coloresPorZona[cuadrante?.numero_zona] || '#153E9E'
  },

  crearEstiloPoligonoBarrio(barrio) {
    const color = this.obtenerColorCuadrante(barrio)
    return {
      color,
      weight: 2.5,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.28
    }
  },

  crearPopupBarrio(barrio) {
    const cuadrante = Array.isArray(barrio?.cuadrantes)
      ? barrio.cuadrantes[0]
      : barrio?.cuadrantes
    const color = this.obtenerColorCuadrante(barrio)

    const popupContent = document.createElement('div')
    popupContent.className = 'font-sans p-1 min-w-[180px]'
    popupContent.innerHTML = `
      <div class="flex items-center gap-1.5 mb-1">
        <span class="inline-block w-3 h-3 rounded-full shrink-0 border border-slate-300" style="background-color: ${color};"></span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          ${cuadrante?.nombre || (cuadrante?.numero_zona ? `Cuadrante / Zona ${cuadrante.numero_zona}` : 'Sin cuadrante')}
        </span>
      </div>
      <h4 class="text-xs font-black text-slate-800 uppercase leading-tight">
        ${barrio?.nombre_barrio || 'Barrio'}
      </h4>
      ${cuadrante?.telefono_contacto ? `
        <p class="text-[11px] text-slate-600 mt-1 font-medium">
          Tel. cuadrante: <span class="font-bold">${cuadrante.telefono_contacto}</span>
        </p>` : ''}
      ${barrio?.descripcion ? `
        <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
          ${barrio.descripcion}
        </p>` : ''}
    `
    return popupContent
  },

  // Generador de iconos SVG para Leaflet
  crearIconoBase(tipo) {
    const esCAI = tipo?.toUpperCase().includes('CAI')
    const colorBg = esCAI ? 'bg-red-600' : 'bg-gecap-darkblue'
    const iconoTexto = esCAI ? 'CAI' : 'POL'

    return L.divIcon({
      className: 'custom-police-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="${colorBg} text-white font-black text-[10px] px-2 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1 min-w-[36px] justify-center tracking-wider">
            <span>${iconoTexto}</span>
          </div>
          <div class="absolute -bottom-1.5 w-2 h-2 ${colorBg} rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [40, 30],
      iconAnchor: [20, 30],
      popupAnchor: [0, -28]
    })
  },

  // Generador del contenido HTML del Popup
  crearContenidoPopup(base) {
    const popupContent = document.createElement('div')
    popupContent.className = 'font-sans p-1 min-w-[160px]'
    popupContent.innerHTML = `
      <h4 class="text-xs font-black text-slate-800 uppercase leading-tight">${base.nombre || 'Estación'}</h4>
      
      ${base.direccion ? `
        <p class="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span>${base.direccion}</span>
        </p>` : ''}
        
      ${base.telefono ? `
        <p class="text-[11px] text-slate-600 mt-0.5 font-medium flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          <span>${base.telefono}</span>
        </p>` : ''}
    `
    return popupContent
  }
}