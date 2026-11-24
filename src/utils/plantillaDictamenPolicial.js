function extraerHoraDesdeFecha(fechaStr) {
    if (!fechaStr) return ''
    const fecha = new Date(fechaStr)
    if (isNaN(fecha.getTime())) return ''
    return fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  export function construirTextoDictamenPolicial({
    alerta = {},
    operador = {},
    cuadranteNombre = '',
    baseNombre = '',
    datosAdicionales = {}
  } = {}) {
    const ahora = new Date()
    const fechaHoy =
      datosAdicionales.fecha ||
      ahora.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
  
    const horaLlegadaReporte = extraerHoraDesdeFecha(alerta.created_at || alerta.fecha)
    const horaInicio = datosAdicionales.horaInicio || horaLlegadaReporte || '[HH:MM]'
    const horaFinalizacion =
      datosAdicionales.horaFinalizacion ||
      ahora.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
  
    const unidadTexto =
      datosAdicionales.unidadTexto ||
      [baseNombre, cuadranteNombre].filter(Boolean).join(' / ') ||
      alerta.unidad_cuadrante ||
      '[Nombre o número de la unidad]'
  
    const radicado =
      datosAdicionales.numeroRadicado ||
      alerta.codigo_seguimiento ||
      alerta.id ||
      '[Número de caso / Radicado / Incidente (NUC / SECAD / 123)]'
  
    const ubicacionTexto =
      datosAdicionales.direccionExacta ||
      (alerta.latitud != null && alerta.longitud != null
        ? `Coordenadas ${alerta.latitud}, ${alerta.longitud} — [Calle, carrera, número, barrio, punto de referencia]`
        : '[Calle, carrera, número, barrio, punto de referencia]')
  
    const jefePatrulla =
      datosAdicionales.jefePatrulla ||
      (operador?.nombre_completo
        ? `${operador.rango ? `${operador.rango} ` : ''}${operador.nombre_completo} – Placa / ID: ${operador.placa_identificacion || '[Número]'}`
        : '[Grado y nombre completo] – Placa / ID: [Número]')
  
    const acompanante =
      datosAdicionales.acompanante || '[Grado y nombre completo] – Placa / ID: [Número]'
  
    const medioTransporte =
      datosAdicionales.medioTransporte || '[Ej. Panel, motocicleta, a pie]'
  
    const origenRequerimiento =
      datosAdicionales.origenRequerimiento ||
      '[Línea 123 / Central de radio / Solicitud directa de ciudadano / Patrullaje]'
  
    const motivoInicial =
      datosAdicionales.motivoInicial ||
      alerta.tipo_alerta ||
      '[Ej. Riña en vía pública, ruido excesivo, hurto, violencia intrafamiliar, accidente de tránsito, etc.]'
  
    const calidadPersona = datosAdicionales.calidadPersona || 'Requirente'
    const nombrePersona =
      datosAdicionales.nombrePersona ||
      alerta.nombre_ciudadano ||
      '[Nombre completo]'
    const documentoPersona =
      datosAdicionales.documentoPersona ||
      alerta.ciudadano_documento ||
      '[C.C. / C.E. / T.I. / Pasaporte - Número]'
    const edadPersona = datosAdicionales.edadPersona || '[Edad]'
    const direccionPersona =
      datosAdicionales.direccionPersona || '[Dirección y barrio]'
    const telefonoPersona =
      datosAdicionales.telefonoPersona || '[Número celular o fijo]'
  
    const llegadaLugar =
      datosAdicionales.llegadaLugar ||
      `Siendo las ${horaInicio} horas, la patrulla arriba al lugar indicado tras el reporte de la central. Al llegar, se observa [describir el escenario inicial: estado de las personas, entorno, daños visibles, etc.].`
  
    const desarrolloIntervencion =
      datosAdicionales.desarrolloIntervencion ||
      `Se procede a entrevistar a las partes involucradas. El ciudadano ${nombrePersona} manifiesta que ${alerta.descripcion ? `"${alerta.descripcion}"` : '[resumen breve de la versión]'}. Por su parte, [Nombre de la contraparte, si aplica] indica que [resumen breve de su versión].`
  
    const actuacionesMedidas =
      datosAdicionales.actuacionesMedidas ||
      `- [Ej. Se realiza mediación policial logrando acuerdo entre las partes].
  - [Ej. Se impone orden de comparendo N.° ____ por infracción al Código Nacional de Seguridad y Convivencia Ciudadana (Ley 1801 de 2016), artículo ___, numeral ___].
  - [Ej. Se realiza captura en flagrancia por el presunto delito de ____, dando a conocer los derechos del capturado].
  - [Ej. Se solicita apoyo de ambulancia / bomberos / comisaría de familia].`
  
    const elementosIncautados =
      datosAdicionales.elementosIncautados ||
      '[Descripción detallada: marca, color, serial, estado, placa de vehículo, etc., o indicar "No aplica"]'
  
    const estadoCaso =
      datosAdicionales.estadoCaso ||
      '[Solucionado mediante mediación / Trasladado a URI o Fiscalía / Comparendo impuesto / Sin novedad al llegar al sitio / Caso cerrado]'
  
    const novedadesProcedimiento =
      datosAdicionales.novedadesProcedimiento ||
      '[Indicar si hubo lesionados, daños a bienes públicos/privados, uso legítimo de la fuerza, o escribir "Sin novedad"]'
  
    const firma1Nombre =
      datosAdicionales.firma1Nombre ||
      (operador?.nombre_completo
        ? `${operador.rango ? `${operador.rango} ` : ''}${operador.nombre_completo}`
        : '[Grado y Nombre del Funcionario 1]')
    const firma1Id =
      datosAdicionales.firma1Id ||
      (operador?.placa_identificacion
        ? `Placa / C.C. N.° ${operador.placa_identificacion}`
        : 'Placa / C.C. N.° [Número]')
    const firma1Cargo =
      datosAdicionales.firma1Cargo ||
      [operador?.rol, unidadTexto].filter(Boolean).join(' / ') ||
      'Cargo / Unidad'
  
    const firma2Nombre =
      datosAdicionales.firma2Nombre || '[Grado y Nombre del Funcionario 2]'
    const firma2Id = datosAdicionales.firma2Id || 'Placa / C.C. N.° [Número]'
    const firma2Cargo = datosAdicionales.firma2Cargo || 'Cargo / Unidad'
  
    return `INFORME DE POLICÍA – FINALIZACIÓN DE PROCEDIMIENTO
  
  1. DATOS DE IDENTIFICACIÓN Y UBICACIÓN
  
  - Ciudad / Municipio y Departamento: ${datosAdicionales.ciudadMunicipio || 'Guadalajara de Buga, Valle del Cauca'}
  - Fecha: ${fechaHoy}
  - Hora de inicio del llamado: ${horaInicio}
  - Hora de finalización del procedimiento: ${horaFinalizacion}
  - Unidad / Estación / CAI / Cuadrante: ${unidadTexto}
  - Número de caso / Radicado / Incidente (NUC / SECAD / 123): ${radicado}
  - Dirección exacta del procedimiento: ${ubicacionTexto}
  
  2. FUNCIONARIOS QUE ATIENDEN EL PROCEDIMIENTO
  
  - Grado, Nombres y Apellidos (Jefe de patrulla): ${jefePatrulla}
  - Grado, Nombres y Apellidos (Acompañante): ${acompanante}
  - Sigla del vehículo / Medio de transporte: ${medioTransporte}
  
  3. MOTIVO DEL LLAMADO
  
  - Origen del requerimiento: ${origenRequerimiento}
  - Motivo reportado inicialmente: ${motivoInicial}
  
  4. PERSONAS INVOLUCRADAS
  (Duplicar este bloque según la cantidad de personas vinculadas)
  - Calidad en el procedimiento: ${calidadPersona}
  - Nombres y apellidos completos: ${nombrePersona}
  - Tipo y número de documento: ${documentoPersona}
  - Edad / Fecha de nacimiento: ${edadPersona}
  - Dirección de residencia: ${direccionPersona}
  - Teléfono de contacto: ${telefonoPersona}
  
  5. RELATO DE LOS HECHOS Y ACTUACIONES REALIZADAS
  
  - Llegada al lugar: ${llegadaLugar}
  - Desarrollo de la intervención: ${desarrolloIntervencion}
  - Actuaciones y medidas aplicadas:
  ${actuacionesMedidas}
  - Elementos incautados, recuperados o inmovilizados (si aplica): ${elementosIncautados}
  
  6. RESULTADO Y ESTADO DE FINALIZACIÓN
  
  - Estado en que queda el caso: ${estadoCaso}
  - Novedades durante el procedimiento: ${novedadesProcedimiento}
  
  7. FIRMAS Y CONSTANCIA
  
  ${firma1Nombre}
  ${firma1Id}
  ${firma1Cargo}
  
  ${firma2Nombre}
  ${firma2Id}
  ${firma2Cargo}`
  }