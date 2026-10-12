# 🛡️ GECAP - Sistema de Alerta y Seguridad Ciudadana

**GECAP** es una plataforma web progresiva diseñada para fortalecer la seguridad ciudadana y la respuesta oportuna ante emergencias, conectando a la comunidad con las autoridades (Policía Nacional).

El sistema cuenta con un flujo de registro seguro que integra validación automatizada de antecedentes judiciales en tiempo real, garantizando la confiabilidad de los usuarios dentro de la red de alerta.

---

## 🚀 Tecnologías Utilizadas

* **Frontend:** Vue 3 (Composition API / Script Setup), Vite, Tailwind CSS.
* **Gestión de Estado:** Pinia.
* **Backend as a Service (BaaS):** Supabase (Autenticación, Base de Datos PostgreSQL, RLS).
* **Validación Externa / Seguridad:** API REST de Verifik (Consulta de antecedentes judiciales).
* **Control de Versiones:** Git & GitHub.
* **Arquitectura:** Clean Architecture (Separación por Vistas, Controladores y Servicios).

---

## 🛠️ Características Principales

* 🔒 **Registro Seguro de Ciudadanos:** Verificación previa de antecedentes judiciales antes de la creación de la cuenta.
* 🔑 **Autenticación y Sesiones:** Manejo de sesiones persistentes y gestión de roles.
* 🚨 **Módulo de Incidentes (En desarrollo):** Reporte de emergencias y sistema de alertas ciudadanas.

---

## ⚙️ Configuración del Entorno Local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/alerta-ciudadana-gecap.git](https://github.com/tu-usuario/alerta-ciudadana-gecap.git)
   cd alerta-ciudadana-gecap
