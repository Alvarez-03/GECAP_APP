// src/utils/speechHelper.js
export function setupSpeech({ descripcionAudio, actualizarParametrosURL, grabandoVozRef, toast }) {
    let recognition = null
  
    const iniciarReconocimientoVoz = (onResultCallback) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        toast.warning('Tu navegador no soporta transcripción por voz.')
        return null
      }
  
      try {
        recognition = new SpeechRecognition()
        recognition.lang = 'es-CO'
        recognition.continuous = false
        recognition.interimResults = false
  
        recognition.onresult = (event) => {
          const textoTranscrito = event.results[0][0].transcript
          const nuevoTexto = descripcionAudio.value 
            ? descripcionAudio.value + ' ' + textoTranscrito 
            : textoTranscrito
          
          descripcionAudio.value = nuevoTexto
          if (onResultCallback) onResultCallback(nuevoTexto)
          grabandoVozRef.value = false
          toast.success('¡Voz transcrita con éxito!')
        }
  
        recognition.onerror = (event) => {
          console.warn('Aviso de reconocimiento de voz:', event.error)
          grabandoVozRef.value = false
          if (event.error === 'network') {
            toast.info('El servicio de voz requiere conexión externa.')
          } else {
            toast.error('No se pudo capturar la voz.')
          }
        }
  
        recognition.onend = () => {
          grabandoVozRef.value = false
        }
      } catch (e) {
        console.error(e)
      }
  
      return recognition
    }
  
    const leerTextoEnVozAlta = (texto) => {
      if (!('speechSynthesis' in window)) {
        toast.error('Tu navegador no soporta reproducción de voz.')
        return
      }
  
      window.speechSynthesis.cancel()
  
      if (!texto || texto.trim() === '') {
        toast.warning('No hay texto para leer.')
        return
      }
  
      const utterance = new SpeechSynthesisUtterance(texto)
      utterance.lang = 'es-CO'
      utterance.rate = 1.7
      utterance.pitch = 0.3
  
      const voces = window.speechSynthesis.getVoices()
      const vozEspanol = voces.find(v => v.lang.startsWith('es'))
      if (vozEspanol) utterance.voice = vozEspanol
  
      window.speechSynthesis.speak(utterance)
    }
  
    return {
      iniciarReconocimientoVoz,
      leerTextoEnVozAlta
    }
  }