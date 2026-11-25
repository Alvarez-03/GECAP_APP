<script setup>
import { ref, watch, onMounted } from 'vue'
import { X, FileCheck2, Save, RotateCcw, Loader2, FileDown } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { reportesService } from '../../services/reportesService'
import { construirTextoDictamenPolicial } from '../../utils/plantillaDictamenPolicial'
import { exportarDictamenPolicialPdf } from '../../utils/exportarDictamenPdf'

const props = defineProps({
  alerta: {
    type: Object,
    required: true
  },
  cuadranteNombre: {
    type: String,
    default: ''
  },
  soloLectura: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cerrar', 'guardado'])

const guardando = ref(false)
const cargandoExistente = ref(false)

const obtenerOperadorGuardado = () => {
  try {
    const raw = localStorage.getItem('operador_gecap')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const formatearHoraReporte = (alertaObj) => {
  const rawFecha = alertaObj?.created_at || alertaObj?.fecha
  if (!rawFecha) return ''
  const fecha = new Date(rawFecha)
  if (isNaN(fecha.getTime())) return ''
  return fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const crearFormularioBase = (alertaObj = props.alerta, operadorObj = obtenerOperadorGuardado()) => {
  const ahora = new Date()
  return {
    operadorDocumento: operadorObj?.placa_identificacion || '',
    patrullaResponsable: alertaObj?.unidad_cuadrante || props.cuadranteNombre || '',
    codigoPolicia: '',
    ciudadMunicipio: 'Guadalajara de Buga, Valle del Cauca',
    fecha: ahora.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    horaInicio: formatearHoraReporte(alertaObj),
    horaFinalizacion: ahora.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    unidadTexto: props.cuadranteNombre || alertaObj?.unidad_cuadrante || '',
    numeroRadicado: alertaObj?.codigo_seguimiento || '',
    direccionExacta:
      alertaObj?.latitud != null && alertaObj?.longitud != null
        ? `Lat: ${alertaObj.latitud}, Lng: ${alertaObj.longitud}`
        : '',
    jefePatrulla: operadorObj?.nombre_completo
      ? `${operadorObj.rango ? `${operadorObj.rango} ` : ''}${operadorObj.nombre_completo} – Placa / ID: ${operadorObj.placa_identificacion || ''}`
      : '',
    acompanante: '',
    medioTransporte: '',
    origenRequerimiento: 'Línea 123 / GECAP',
    motivoInicial: alertaObj?.tipo_alerta || '',
    calidadPersona: 'Requirente',
    nombrePersona: alertaObj?.nombre_ciudadano || '',
    documentoPersona: alertaObj?.ciudadano_documento || '',
    edadPersona: '',
    direccionPersona: '',
    telefonoPersona: '',
    llegadaLugar: '',
    desarrolloIntervencion: '',
    actuacionesMedidas: '',
    elementosIncautados: 'No aplica',
    estadoCaso: 'Caso cerrado',
    novedadesProcedimiento: 'Sin novedad',
    firma1Nombre: operadorObj?.nombre_completo
      ? `${operadorObj.rango ? `${operadorObj.rango} ` : ''}${operadorObj.nombre_completo}`
      : '',
    firma1Id: operadorObj?.placa_identificacion
      ? `Placa / C.C. N.° ${operadorObj.placa_identificacion}`
      : '',
    firma1Cargo: operadorObj?.rol || 'Operador GECAP',
    firma2Nombre: '',
    firma2Id: '',
    firma2Cargo: ''
  }
}

const form = ref(crearFormularioBase())
const detallesProcedimiento = ref('')

const regenerarPlantilla = () => {
  if (props.soloLectura) return
  const operadorActual = obtenerOperadorGuardado()
  const datosCompletos = {
    ...crearFormularioBase(props.alerta, operadorActual),
    ...form.value
  }
  detallesProcedimiento.value = construirTextoDictamenPolicial({
    alerta: props.alerta,
    operador: operadorActual,
    cuadranteNombre: props.cuadranteNombre,
    datosAdicionales: datosCompletos
  })
}

watch(
  () => props.alerta,
  async (nueva) => {
    if (!nueva) return
    const operadorActual = obtenerOperadorGuardado()
    form.value = crearFormularioBase(nueva, operadorActual)

    if (!props.soloLectura) {
      regenerarPlantilla()
    } else {
      detallesProcedimiento.value = ''
    }

    cargandoExistente.value = true
    const { data } = await reportesService.obtenerDictamenPorAlerta(nueva.id)
    if (data) {
      form.value = {
        ...form.value,
        operadorDocumento: data.operador_documento ?? form.value.operadorDocumento,
        patrullaResponsable: data.patrulla_responsable ?? form.value.patrullaResponsable,
        codigoPolicia: data.codigo_policia ?? '',
        ciudadMunicipio: data.ciudad_municipio ?? form.value.ciudadMunicipio,
        fecha: data.fecha_reporte ?? form.value.fecha,
        horaInicio: data.hora_inicio ?? form.value.horaInicio,
        horaFinalizacion: data.hora_finalizacion ?? form.value.horaFinalizacion,
        unidadTexto: data.unidad_texto ?? form.value.unidadTexto,
        numeroRadicado: data.numero_radicado ?? form.value.numeroRadicado,
        direccionExacta: data.direccion_exacta ?? form.value.direccionExacta,
        jefePatrulla: data.jefe_patrulla ?? form.value.jefePatrulla,
        acompanante: data.acompanante ?? '',
        medioTransporte: data.medio_transporte ?? '',
        origenRequerimiento: data.origen_requerimiento ?? form.value.origenRequerimiento,
        motivoInicial: data.motivo_inicial ?? form.value.motivoInicial,
        calidadPersona: data.calidad_persona ?? form.value.calidadPersona,
        nombrePersona: data.nombre_persona ?? form.value.nombrePersona,
        documentoPersona: data.documento_persona ?? form.value.documentoPersona,
        edadPersona: data.edad_persona ?? '',
        direccionPersona: data.direccion_persona ?? '',
        telefonoPersona: data.telefono_persona ?? '',
        llegadaLugar: data.llegada_lugar ?? '',
        desarrolloIntervencion: data.desarrollo_intervencion ?? '',
        actuacionesMedidas: data.actuaciones_medidas ?? '',
        elementosIncautados: data.elementos_incautados ?? form.value.elementosIncautados,
        estadoCaso: data.estado_caso ?? form.value.estadoCaso,
        novedadesProcedimiento: data.novedades_procedimiento ?? form.value.novedadesProcedimiento,
        firma1Nombre: data.firma1_nombre ?? form.value.firma1Nombre,
        firma1Id: data.firma1_id ?? form.value.firma1Id,
        firma1Cargo: data.firma1_cargo ?? form.value.firma1Cargo,
        firma2Nombre: data.firma2_nombre ?? '',
        firma2Id: data.firma2_id ?? '',
        firma2Cargo: data.firma2_cargo ?? ''
      }

      detallesProcedimiento.value = data.detalles_procedimiento || detallesProcedimiento.value
    }
    cargandoExistente.value = false
  },
  { immediate: true }
)

onMounted(() => {
  if (!props.soloLectura && !detallesProcedimiento.value) {
    regenerarPlantilla()
  }
})

const handleDescargarPdf = () => {
  try {
    const datosCompletos = {
      ...crearFormularioBase(props.alerta),
      ...form.value
    }
    exportarDictamenPolicialPdf({
      alerta: props.alerta,
      operadorDocumento: datosCompletos.operadorDocumento.trim(),
      patrullaResponsable: datosCompletos.patrullaResponsable.trim(),
      codigoPolicia: datosCompletos.codigoPolicia.trim(),
      cuadranteNombre: props.cuadranteNombre,
      form: datosCompletos,
      detallesProcedimiento: detallesProcedimiento.value.trim()
    })
    toast.success('PDF del dictamen descargado correctamente.')
  } catch (err) {
    console.error('Error al generar PDF del dictamen:', err)
    toast.error('No se pudo generar el PDF del dictamen.')
  }
}

const handleGuardar = async () => {
  if (props.soloLectura) return

  const datosCompletos = {
    ...crearFormularioBase(props.alerta),
    ...form.value
  }

  if (!datosCompletos.operadorDocumento.trim()) {
    toast.warning('Ingresa el número de identificación del operador.')
    return
  }
  if (!datosCompletos.patrullaResponsable.trim()) {
    toast.warning('Ingresa la patrulla responsable.')
    return
  }
  if (!detallesProcedimiento.value.trim()) {
    toast.warning('El texto del dictamen no puede estar vacío.')
    return
  }

  try {
    guardando.value = true
    const dictamen = await reportesService.guardarDictamenAlerta({
      alertaId: props.alerta.id,
      operadorDocumento: datosCompletos.operadorDocumento.trim(),
      patrullaResponsable: datosCompletos.patrullaResponsable.trim(),
      detallesProcedimiento: detallesProcedimiento.value.trim(),
      codigoPolicia: datosCompletos.codigoPolicia?.trim() || null,
      datosFormulario: datosCompletos
    })
    toast.success('Informe de finalización guardado en alerta_dictamenes.')
    emit('guardado', dictamen)
    emit('cerrar')
  } catch (err) {
    toast.error(err?.message || 'Error al guardar el informe final.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
    <div class="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90dvh] sm:max-h-[92vh]">

      <!-- ENCABEZADO -->
      <div class="bg-slate-900 text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <FileCheck2 class="w-5 h-5 text-emerald-400 shrink-0" />
          <div class="min-w-0">
            <h2 class="text-xs sm:text-sm font-black uppercase tracking-wider truncate">
              {{ soloLectura ? 'Informe de Finalización (Solo Lectura)' : 'Generar Informe de Finalización de Procedimiento' }}
            </h2>
            <p class="text-[11px] text-slate-400 truncate">
              Radicado #{{ alerta.codigo_seguimiento || alerta.id }} • {{ alerta.estado_actual }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('cerrar')"
          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- CUERPO DEL FORMULARIO -->
      <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
        <div v-if="cargandoExistente" class="flex items-center gap-2 text-slate-500 font-semibold">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Cargando dictamen registrado...</span>
        </div>

        <!-- CAMPOS PRINCIPALES DE REGISTRO -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Número de Identificación del Operador *</label>
            <input
              v-model="form.operadorDocumento"
              type="text"
              :disabled="soloLectura"
              placeholder="Placa / Identificación"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Patrulla Responsable *</label>
            <input
              v-model="form.patrullaResponsable"
              type="text"
              :disabled="soloLectura"
              placeholder="Ej. Patrulla Cuadrante 01"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Código Policía / Ley 1801</label>
            <input
              v-model="form.codigoPolicia"
              type="text"
              :disabled="soloLectura"
              placeholder="Ej. Ley 1801 Art. 27 Num. 1"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <!-- 1. IDENTIFICACIÓN Y UBICACIÓN -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3 sm:p-3.5">
          <h3 class="font-black uppercase text-slate-800">1. Datos de Identificación y Ubicación</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Ciudad / Municipio y Depto.</label>
              <input v-model="form.ciudadMunicipio" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Hora inicio (llegada reporte)</label>
              <input v-model="form.horaInicio" type="text" :disabled="soloLectura" placeholder="HH:MM" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Hora finalización</label>
              <input v-model="form.horaFinalizacion" type="text" :disabled="soloLectura" placeholder="HH:MM" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Unidad / Estación / CAI / Cuadrante</label>
              <input v-model="form.unidadTexto" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">N.° caso / Radicado / SECAD / 123</label>
              <input v-model="form.numeroRadicado" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Dirección exacta</label>
              <input v-model="form.direccionExacta" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
          </div>
        </div>

        <!-- 2 Y 3. FUNCIONARIOS Y MOTIVO -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3 sm:p-3.5">
          <h3 class="font-black uppercase text-slate-800">2 y 3. Funcionarios y Motivo del Llamado</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Jefe de patrulla (Grado, Nombre, Placa)</label>
              <input v-model="form.jefePatrulla" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Acompañante (Grado, Nombre, Placa)</label>
              <input v-model="form.acompanante" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Sigla vehículo / Medio transporte</label>
              <input v-model="form.medioTransporte" type="text" :disabled="soloLectura" placeholder="Ej. Motocicleta, Panel, A pie" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Origen del requerimiento</label>
              <input v-model="form.origenRequerimiento" type="text" :disabled="soloLectura" placeholder="Línea 123 / Central de radio..." class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
          </div>
        </div>

        <!-- 4. PERSONAS INVOLUCRADAS -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3 sm:p-3.5">
          <h3 class="font-black uppercase text-slate-800">4. Persona Involucrada Principal</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Calidad en el procedimiento</label>
              <input v-model="form.calidadPersona" type="text" :disabled="soloLectura" placeholder="Requirente / Afectado / Testigo..." class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Nombres y apellidos</label>
              <input v-model="form.nombrePersona" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tipo y número de documento</label>
              <input v-model="form.documentoPersona" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Edad / Fecha nacimiento</label>
              <input v-model="form.edadPersona" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Dirección de residencia</label>
              <input v-model="form.direccionPersona" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Teléfono de contacto</label>
              <input v-model="form.telefonoPersona" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
            </div>
          </div>
        </div>

        <!-- 5 Y 6. RELATO Y RESULTADO -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3 sm:p-3.5">
          <h3 class="font-black uppercase text-slate-800">5 y 6. Relato, Actuaciones y Resultado</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Llegada al lugar</label>
              <textarea v-model="form.llegadaLugar" rows="2" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Desarrollo de la intervención</label>
              <textarea v-model="form.desarrolloIntervencion" rows="2" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Actuaciones y medidas aplicadas</label>
              <textarea v-model="form.actuacionesMedidas" rows="3" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600"></textarea>
            </div>
            <div class="space-y-2">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Elementos incautados / recuperados</label>
                <input v-model="form.elementosIncautados" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Estado final del caso</label>
                <input v-model="form.estadoCaso" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
              </div>
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Novedades durante el procedimiento</label>
            <input v-model="form.novedadesProcedimiento" type="text" :disabled="soloLectura" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:bg-slate-100 disabled:text-slate-600" />
          </div>
        </div>

        <!-- BOTÓN PARA VOLCAR CAMPOS AL TEXTO COMPLETO -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold text-slate-700 uppercase">
            Informe Final Completo (alerta_dictamenes.detalles_procedimiento)
          </span>
          <button
            v-if="!soloLectura"
            type="button"
            @click="regenerarPlantilla"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Actualizar texto con campos</span>
          </button>
        </div>

        <textarea
          v-model="detallesProcedimiento"
          rows="12"
          :readonly="soloLectura"
          class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-800 read-only:bg-slate-100 read-only:text-slate-700 focus:outline-none focus:border-slate-900"
        ></textarea>
      </div>

      <!-- PIE DEL MODAL -->
      <div class="bg-slate-100 px-4 sm:px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          @click="handleDescargarPdf"
          class="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 text-white flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <FileDown class="w-4 h-4 shrink-0" />
          <span>Descargar PDF</span>
        </button>

        <div class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            @click="$emit('cerrar')"
            :disabled="guardando"
            class="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            {{ soloLectura ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button
            v-if="!soloLectura"
            type="button"
            @click="handleGuardar"
            :disabled="guardando"
            class="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-2 transition cursor-pointer"
          >
            <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ guardando ? 'Guardando...' : 'Guardar Dictamen' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>