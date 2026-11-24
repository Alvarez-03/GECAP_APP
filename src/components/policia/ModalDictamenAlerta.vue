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

const operadorLocal = obtenerOperadorGuardado()

const form = ref({
  operadorDocumento: operadorLocal?.placa_identificacion || '',
  patrullaResponsable: props.alerta?.unidad_cuadrante || props.cuadranteNombre || '',
  codigoPolicia: '',
  ciudadMunicipio: 'Guadalajara de Buga, Valle del Cauca',
  fecha: new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }),
  horaInicio: formatearHoraReporte(props.alerta),
  horaFinalizacion: new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }),
  unidadTexto: props.cuadranteNombre || props.alerta?.unidad_cuadrante || '',
  numeroRadicado: props.alerta?.codigo_seguimiento || '',
  direccionExacta:
    props.alerta?.latitud != null && props.alerta?.longitud != null
      ? `Lat: ${props.alerta.latitud}, Lng: ${props.alerta.longitud}`
      : '',
  jefePatrulla: operadorLocal?.nombre_completo
    ? `${operadorLocal.rango ? `${operadorLocal.rango} ` : ''}${operadorLocal.nombre_completo} – Placa / ID: ${operadorLocal.placa_identificacion || ''}`
    : '',
  acompanante: '',
  medioTransporte: '',
  origenRequerimiento: 'Línea 123 / GECAP',
  motivoInicial: props.alerta?.tipo_alerta || '',
  calidadPersona: 'Requirente',
  nombrePersona: props.alerta?.nombre_ciudadano || '',
  documentoPersona: props.alerta?.ciudadano_documento || '',
  edadPersona: '',
  direccionPersona: '',
  telefonoPersona: '',
  llegadaLugar: '',
  desarrolloIntervencion: '',
  actuacionesMedidas: '',
  elementosIncautados: 'No aplica',
  estadoCaso: 'Caso cerrado',
  novedadesProcedimiento: 'Sin novedad',
  firma1Nombre: operadorLocal?.nombre_completo
    ? `${operadorLocal.rango ? `${operadorLocal.rango} ` : ''}${operadorLocal.nombre_completo}`
    : '',
  firma1Id: operadorLocal?.placa_identificacion
    ? `Placa / C.C. N.° ${operadorLocal.placa_identificacion}`
    : '',
  firma1Cargo: operadorLocal?.rol || 'Operador GECAP',
  firma2Nombre: '',
  firma2Id: '',
  firma2Cargo: ''
})

const detallesProcedimiento = ref('')

const regenerarPlantilla = () => {
  detallesProcedimiento.value = construirTextoDictamenPolicial({
    alerta: props.alerta,
    operador: operadorLocal,
    cuadranteNombre: props.cuadranteNombre,
    datosAdicionales: form.value
  })
}

watch(
  () => props.alerta,
  async (nueva) => {
    if (!nueva) return
    const operadorActual = obtenerOperadorGuardado()
    form.value.operadorDocumento = operadorActual?.placa_identificacion || ''
    form.value.horaInicio = formatearHoraReporte(nueva)
    form.value.patrullaResponsable = nueva.unidad_cuadrante || props.cuadranteNombre || ''
    form.value.unidadTexto = props.cuadranteNombre || nueva.unidad_cuadrante || ''
    form.value.numeroRadicado = nueva.codigo_seguimiento || ''
    form.value.direccionExacta =
      nueva.latitud != null && nueva.longitud != null
        ? `Lat: ${nueva.latitud}, Lng: ${nueva.longitud}`
        : ''
    form.value.motivoInicial = nueva.tipo_alerta || ''
    form.value.nombrePersona = nueva.nombre_ciudadano || ''
    form.value.documentoPersona = nueva.ciudadano_documento || ''

    regenerarPlantilla()

    cargandoExistente.value = true
    const { data } = await reportesService.obtenerDictamenPorAlerta(nueva.id)
    if (data) {
      form.value.operadorDocumento =
        data.operador_documento || form.value.operadorDocumento
      form.value.patrullaResponsable =
        data.patrulla_responsable || form.value.patrullaResponsable
      form.value.codigoPolicia = data.codigo_policia || ''
      detallesProcedimiento.value =
        data.detalles_procedimiento || detallesProcedimiento.value
    }
    cargandoExistente.value = false
  },
  { immediate: true }
)

onMounted(() => {
  if (!detallesProcedimiento.value) {
    regenerarPlantilla()
  }
})

const handleDescargarPdf = () => {
  if (!detallesProcedimiento.value.trim()) {
    toast.warning('El texto del dictamen está vacío; complétalo antes de exportar el PDF.')
    return
  }

  try {
    exportarDictamenPolicialPdf({
      alerta: props.alerta,
      operadorDocumento: form.value.operadorDocumento.trim(),
      patrullaResponsable: form.value.patrullaResponsable.trim(),
      codigoPolicia: form.value.codigoPolicia.trim(),
      detallesProcedimiento: detallesProcedimiento.value.trim()
    })
    toast.success('PDF del dictamen descargado correctamente.')
  } catch (err) {
    console.error('Error al generar PDF del dictamen:', err)
    toast.error('No se pudo generar el PDF del dictamen.')
  }
}

const handleGuardar = async () => {
  if (!form.value.operadorDocumento.trim()) {
    toast.warning('Ingresa el número de identificación del operador.')
    return
  }
  if (!form.value.patrullaResponsable.trim()) {
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
      operadorDocumento: form.value.operadorDocumento.trim(),
      patrullaResponsable: form.value.patrullaResponsable.trim(),
      detallesProcedimiento: detallesProcedimiento.value.trim(),
      codigoPolicia: form.value.codigoPolicia.trim() || null
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
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
      
      <!-- ENCABEZADO -->
      <div class="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <FileCheck2 class="w-5 h-5 text-emerald-400" />
          <div>
            <h2 class="text-sm font-black uppercase tracking-wider">
              Generar Informe de Finalización de Procedimiento
            </h2>
            <p class="text-[11px] text-slate-400">
              Radicado #{{ alerta.codigo_seguimiento || alerta.id }} • {{ alerta.estado_actual }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('cerrar')"
          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- CUERPO DEL FORMULARIO -->
      <div class="p-5 overflow-y-auto space-y-5 text-xs">
        <div v-if="cargandoExistente" class="flex items-center gap-2 text-slate-500 font-semibold">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Verificando dictamen previo...</span>
        </div>

        <!-- CAMPOS PRINCIPALES DE REGISTRO -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Número de Identificación del Operador *</label>
            <input
              v-model="form.operadorDocumento"
              type="text"
              placeholder="Placa / Identificación"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Patrulla Responsable *</label>
            <input
              v-model="form.patrullaResponsable"
              type="text"
              placeholder="Ej. Patrulla Cuadrante 01"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Código Policía / Ley 1801</label>
            <input
              v-model="form.codigoPolicia"
              type="text"
              placeholder="Ej. Ley 1801 Art. 27 Num. 1"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <!-- 1. IDENTIFICACIÓN Y UBICACIÓN -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3.5">
          <h3 class="font-black uppercase text-slate-800">1. Datos de Identificación y Ubicación</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Ciudad / Municipio y Depto.</label>
              <input v-model="form.ciudadMunicipio" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Hora inicio (llegada reporte)</label>
              <input v-model="form.horaInicio" type="text" placeholder="HH:MM" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Hora finalización</label>
              <input v-model="form.horaFinalizacion" type="text" placeholder="HH:MM" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Unidad / Estación / CAI / Cuadrante</label>
              <input v-model="form.unidadTexto" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">N.° caso / Radicado / SECAD / 123</label>
              <input v-model="form.numeroRadicado" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Dirección exacta</label>
              <input v-model="form.direccionExacta" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
          </div>
        </div>

        <!-- 2 Y 3. FUNCIONARIOS Y MOTIVO -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3.5">
          <h3 class="font-black uppercase text-slate-800">2 y 3. Funcionarios y Motivo del Llamado</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Jefe de patrulla (Grado, Nombre, Placa)</label>
              <input v-model="form.jefePatrulla" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Acompañante (Grado, Nombre, Placa)</label>
              <input v-model="form.acompanante" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Sigla vehículo / Medio transporte</label>
              <input v-model="form.medioTransporte" type="text" placeholder="Ej. Motocicleta, Panel, A pie" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Origen del requerimiento</label>
              <input v-model="form.origenRequerimiento" type="text" placeholder="Línea 123 / Central de radio..." class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
          </div>
        </div>

        <!-- 4. PERSONAS INVOLUCRADAS -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3.5">
          <h3 class="font-black uppercase text-slate-800">4. Persona Involucrada Principal</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Calidad en el procedimiento</label>
              <input v-model="form.calidadPersona" type="text" placeholder="Requirente / Afectado / Testigo..." class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Nombres y apellidos</label>
              <input v-model="form.nombrePersona" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tipo y número de documento</label>
              <input v-model="form.documentoPersona" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Edad / Fecha nacimiento</label>
              <input v-model="form.edadPersona" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Dirección de residencia</label>
              <input v-model="form.direccionPersona" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Teléfono de contacto</label>
              <input v-model="form.telefonoPersona" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
            </div>
          </div>
        </div>

        <!-- 5 Y 6. RELATO Y RESULTADO -->
        <div class="space-y-2.5 border border-slate-200 rounded-xl p-3.5">
          <h3 class="font-black uppercase text-slate-800">5 y 6. Relato, Actuaciones y Resultado</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Llegada al lugar</label>
              <textarea v-model="form.llegadaLugar" rows="2" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Desarrollo de la intervención</label>
              <textarea v-model="form.desarrolloIntervencion" rows="2" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Actuaciones y medidas aplicadas</label>
              <textarea v-model="form.actuacionesMedidas" rows="3" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5"></textarea>
            </div>
            <div class="space-y-2">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Elementos incautados / recuperados</label>
                <input v-model="form.elementosIncautados" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Estado final del caso</label>
                <input v-model="form.estadoCaso" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
              </div>
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Novedades durante el procedimiento</label>
            <input v-model="form.novedadesProcedimiento" type="text" class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5" />
          </div>
        </div>

        <!-- BOTÓN PARA VOLCAR CAMPOS AL TEXTO COMPLETO -->
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-700 uppercase">
            Informe Final Completo (se guardará en alerta_dictamenes.detalles_procedimiento) *
          </span>
          <button
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
          rows="14"
          class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-800 focus:outline-none focus:border-slate-900"
        ></textarea>
      </div>

      <!-- PIE DEL MODAL -->
      <div class="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
        <button
          type="button"
          @click="handleDescargarPdf"
          class="px-4 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 text-white flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <FileDown class="w-4 h-4" />
          <span>Descargar PDF</span>
        </button>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="$emit('cerrar')"
            :disabled="guardando"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleGuardar"
            :disabled="guardando"
            class="px-4 py-2 rounded-xl text-xs font-black bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-2 transition cursor-pointer"
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