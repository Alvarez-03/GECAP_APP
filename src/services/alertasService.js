import { supabase } from './supabase'
import { toast } from 'vue3-toastify'

const CUADRANTE_1_FALLBACK_ID = 'c3856b28-10cd-443e-9126-f53299de8f5d'
const UMBRAL_BORDE_METROS = 150

function normalizarGeometriaGeoJSON(rawGeojson) {
  if (!rawGeojson) return null
  try {
    return typeof rawGeojson === 'string' ? JSON.parse(rawGeojson) : rawGeojson
  } catch (err) {
    console.error('Error al parsear poligono_geojson:', err)
    return null
  }
}

function extraerPoligonosEnCoordenadas(geometria) {
  if (!geometria) return []

  if (geometria.type === 'Feature') {
    return extraerPoligonosEnCoordenadas(geometria.geometry)
  }

  if (geometria.type === 'FeatureCollection' && Array.isArray(geometria.features)) {
    return geometria.features.flatMap((f) => extraerPoligonosEnCoordenadas(f.geometry))
  }

  if (!geometria.type || !geometria.coordinates) return []

  if (geometria.type === 'Polygon') {
    return [geometria.coordinates]
  }

  if (geometria.type === 'MultiPolygon') {
    return geometria.coordinates
  }

  return []
}

// Ray-casting sobre anillo [lng, lat]
function puntoEnAnillo(lng, lat, anillo) {
  if (!Array.isArray(anillo) || anillo.length < 3) return false

  let dentro = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const xi = Number(anillo[i]?.[0])
    const yi = Number(anillo[i]?.[1])
    const xj = Number(anillo[j]?.[0])
    const yj = Number(anillo[j]?.[1])

    if ([xi, yi, xj, yj].some(Number.isNaN)) continue

    const denom = yj - yi
    const intersecta =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (denom === 0 ? 1e-15 : denom) + xi

    if (intersecta) dentro = !dentro
  }

  return dentro
}

function puntoDentroDePoligono(lng, lat, poligono) {
  if (!Array.isArray(poligono) || poligono.length === 0) return false

  const anilloExterior = poligono[0]
  if (!puntoEnAnillo(lng, lat, anilloExterior)) return false

  for (let i = 1; i < poligono.length; i++) {
    if (puntoEnAnillo(lng, lat, poligono[i])) {
      return false
    }
  }

  return true
}

function areaAproximadaPoligono(poligono) {
  const anillo = poligono?.[0]
  if (!Array.isArray(anillo) || anillo.length < 3) return Infinity

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const pt of anillo) {
    const x = Number(pt?.[0])
    const y = Number(pt?.[1])
    if ([x, y].some(Number.isNaN)) continue
    if (x < minLng) minLng = x
    if (x > maxLng) maxLng = x
    if (y < minLat) minLat = y
    if (y > maxLat) maxLat = y
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return Infinity
  return (maxLng - minLng) * (maxLat - minLat)
}

function esPoligonoGeneral(barrio) {
  const nombre = (barrio?.nombre_barrio || '').trim().toLowerCase()
  return (
    nombre === 'tuluá' ||
    nombre === 'tulua' ||
    nombre.includes('polígono general') ||
    nombre.includes('poligono general')
  )
}

function distanciaMetros(lng1, lat1, lng2, lat2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function distanciaPuntoASegmentoMetros(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return distanciaMetros(px, py, ax, ay)
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const projX = ax + t * dx
  const projY = ay + t * dy
  return distanciaMetros(px, py, projX, projY)
}

function distanciaMinimaAPoligonoMetros(lng, lat, poligono) {
  let minDist = Infinity
  for (const anillo of poligono) {
    if (!Array.isArray(anillo) || anillo.length < 2) continue
    for (let i = 0; i < anillo.length - 1; i++) {
      const ax = Number(anillo[i]?.[0])
      const ay = Number(anillo[i]?.[1])
      const bx = Number(anillo[i + 1]?.[0])
      const by = Number(anillo[i + 1]?.[1])
      if ([ax, ay, bx, by].some(Number.isNaN)) continue
      const d = distanciaPuntoASegmentoMetros(lng, lat, ax, ay, bx, by)
      if (d < minDist) minDist = d
    }
  }
  return minDist
}

async function obtenerDetalleCuadrante(idCuadrante) {
  if (!idCuadrante) return null

  const { data, error } = await supabase
    .from('cuadrantes')
    .select('id, nombre, numero_zona')
    .eq('id', idCuadrante)
    .maybeSingle()

  if (error) {
    console.warn('No se pudo leer detalle del cuadrante:', error.message)
    return null
  }

  return data
}

async function obtenerCuadranteUno() {
  const { data, error } = await supabase
    .from('cuadrantes')
    .select('id, nombre, numero_zona')
    .eq('numero_zona', 1)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error al consultar Cuadrante 1:', error.message)
  }

  return data || {
    id: CUADRANTE_1_FALLBACK_ID,
    nombre: 'Cuadrante 1',
    numero_zona: 1
  }
}

async function resolverCuadrantePorCoordenadas(latitud, longitud) {
  const lat = Number(latitud)
  const lng = Number(longitud)
  const cuadranteUno = await obtenerCuadranteUno()

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn('[alertasService] Coordenadas inválidas, asignando Cuadrante 1:', {
      latitud,
      longitud
    })
    return cuadranteUno
  }

  const { data: barrios, error } = await supabase
    .from('barrios_wikimapia_tulua')
    .select('id, nombre_barrio, cuadrante_id, poligono_geojson')
    .not('poligono_geojson', 'is', null)
    .not('cuadrante_id', 'is', null)

  if (error || !barrios || barrios.length === 0) {
    console.warn('[alertasService] Sin barrios disponibles o error al consultar:', error?.message)
    return cuadranteUno
  }

  const candidatos = barrios
    .map((barrio) => {
      const geom = normalizarGeometriaGeoJSON(barrio.poligono_geojson)
      const poligonos = extraerPoligonosEnCoordenadas(geom)
      const menorArea = poligonos.reduce(
        (min, p) => Math.min(min, areaAproximadaPoligono(p)),
        Infinity
      )
      return {
        barrio,
        poligonos,
        menorArea,
        esGeneral: esPoligonoGeneral(barrio)
      }
    })
    .filter((item) => item.poligonos.length > 0)
    .sort((a, b) => {
      if (a.esGeneral !== b.esGeneral) return a.esGeneral ? 1 : -1
      return a.menorArea - b.menorArea
    })

  // 1. Buscar el polígono más específico (menor área) que contenga el punto
  for (const item of candidatos) {
    for (const poligono of item.poligonos) {
      if (puntoDentroDePoligono(lng, lat, poligono)) {
        const detalle = await obtenerDetalleCuadrante(item.barrio.cuadrante_id)
        const resultado = {
          id: item.barrio.cuadrante_id,
          nombre:
            detalle?.nombre ||
            (detalle?.numero_zona ? `Cuadrante ${detalle.numero_zona}` : 'Cuadrante asignado'),
          numero_zona: detalle?.numero_zona ?? null,
          barrio_detectado: item.barrio.nombre_barrio
        }
        console.info('[alertasService] Coordenada dentro de barrio:', {
          lat,
          lng,
          area: item.menorArea,
          ...resultado
        })
        return resultado
      }
    }
  }

  // 2. Si toca el borde / está en límite próximo, asignar el borde más cercano
  let mejorDistancia = Infinity
  let barrioMasCercano = null

  for (const item of candidatos) {
    for (const poligono of item.poligonos) {
      const dist = distanciaMinimaAPoligonoMetros(lng, lat, poligono)
      if (dist < mejorDistancia) {
        mejorDistancia = dist
        barrioMasCercano = item.barrio
      }
    }
  }

  if (barrioMasCercano && mejorDistancia <= UMBRAL_BORDE_METROS) {
    const detalle = await obtenerDetalleCuadrante(barrioMasCercano.cuadrante_id)
    const resultado = {
      id: barrioMasCercano.cuadrante_id,
      nombre:
        detalle?.nombre ||
        (detalle?.numero_zona ? `Cuadrante ${detalle.numero_zona}` : 'Cuadrante asignado'),
      numero_zona: detalle?.numero_zona ?? null,
      barrio_detectado: barrioMasCercano.nombre_barrio
    }
    console.info('[alertasService] Coordenada cerca del borde:', {
      lat,
      lng,
      distanciaMetros: Math.round(mejorDistancia),
      ...resultado
    })
    return resultado
  }

  // 3. Si está por fuera de los polígonos, asignar Cuadrante 1
  console.info('[alertasService] Coordenada fuera de polígonos, asignando Cuadrante 1:', {
    lat,
    lng,
    distanciaMasCercanaMetros: Number.isFinite(mejorDistancia) ? Math.round(mejorDistancia) : null
  })
  return {
    ...cuadranteUno,
    barrio_detectado: null
  }
}

export const alertasService = {
  async crearAlerta(payload) {
    const codigoSeguimiento = 'CAD-' + Math.floor(100 + Math.random() * 900)
    const lat = Number(payload.latitud)
    const lng = Number(payload.longitud)

    // 1. Crear la alerta principal mediante RPC
    const { data, error } = await supabase.rpc('crear_alerta_segura', {
      p_codigo_seguimiento: codigoSeguimiento,
      p_ciudadano_documento: payload.ciudadano_documento || null,
      p_tipo_alerta: payload.tipo_alerta || null,
      p_descripcion: payload.descripcion || null,
      p_latitud: lat,
      p_longitud: lng,
      p_nombre_ciudadano: payload.nombre_ciudadano
    })

    if (error) {
      toast.error('Error al registrar la alerta: ' + error.message)
      throw error
    }

    // 2. Obtener el UUID real consultando la tabla 'alertas'
    let query = supabase
      .from('alertas')
      .select('id, codigo_seguimiento')
      .eq('latitud', lat)
      .eq('longitud', lng)
      .order('created_at', { ascending: false })
      .limit(1)

    if (payload.ciudadano_documento) {
      query = query.eq('ciudadano_documento', payload.ciudadano_documento)
    }

    const { data: alertaEncontrada, error: errorBusqueda } = await query.single()

    if (errorBusqueda || !alertaEncontrada) {
      toast.error('No se pudo recuperar el identificador único de la alerta.')
      throw new Error('No se pudo recuperar el identificador único (UUID) de la alerta.')
    }

    const alertaId = alertaEncontrada.id

    // 3. Resolver y asignar dinámicamente el id_cuadrante según las coordenadas
    const cuadranteAsignado = await resolverCuadrantePorCoordenadas(lat, lng)
    const idCuadranteAsignado = cuadranteAsignado.id

    const { error: errorCuadrante } = await supabase
      .from('alertas')
      .update({ id_cuadrante: idCuadranteAsignado })
      .eq('id', alertaId)

    if (errorCuadrante) {
      console.error('Error al asignar el id_cuadrante:', errorCuadrante.message)
    }

    // 4. Subir archivos al Storage y relacionarlos en 'alerta_fotos'
    if (payload.archivos && payload.archivos.length > 0 && alertaId) {
      for (const archivo of payload.archivos) {
        const fileName = `${alertaId}/${Date.now()}_${archivo.name.replace(/\s+/g, '_')}`

        const { error: uploadError } = await supabase.storage
          .from('evidencia-reportes')
          .upload(fileName, archivo)

        if (uploadError) {
          toast.error(`Error al subir la imagen ${archivo.name}: ${uploadError.message}`)
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('evidencia-reportes')
          .getPublicUrl(fileName)

        const urlFoto = publicUrlData.publicUrl

        const { error: insertFotoError } = await supabase
          .from('alerta_fotos')
          .insert([
            {
              alerta_id: alertaId,
              url_foto: urlFoto
            }
          ])

        if (insertFotoError) {
          toast.error('Error al guardar la relación de la foto: ' + insertFotoError.message)
        }
      }
    }

    return {
      ...alertaEncontrada,
      id_cuadrante: idCuadranteAsignado,
      cuadrante_nombre: cuadranteAsignado.nombre,
      cuadrante_numero_zona: cuadranteAsignado.numero_zona,
      barrio_detectado: cuadranteAsignado.barrio_detectado || null
    }
  }
}