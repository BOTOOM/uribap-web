# language: es
# Flujos verificados en navegador real (Chrome) contra el stack local completo
# (Next.js :3000 + FastAPI :8010 + Postgres + ZITADEL :8080 + Mailpit :8025).
# Cada escenario fue ejecutado y observado el 2026-09-22.

Característica: Recorrido de producto verificado en local

  Escenario: Registro y onboarding de un hogar nuevo
    Dado que no tengo cuenta en ZITADEL local
    Cuando me registro en la UI de ZITADEL con email y contraseña
    Y vuelvo a la app por el flujo OIDC
    Entonces aterrizo en "/onboarding"
    Cuando completo nombre de hogar "Casa Demo" y zona horaria
    Entonces llego a "/plan" con el plan semanal en borrador
    # Caso borde observado: completar onboarding dos veces crea un segundo hogar
    # con el mismo nombre → membresías activas duplicadas. Resuelto marcando la
    # membresía extra como "left". Pendiente de producto: impedir el duplicado.

  Escenario: El logout nunca se ejecuta por prefetch
    Dado que estoy autenticado
    Cuando la página renderiza la navegación
    Entonces el control de logout es un formulario POST, no un enlace
    # Regresión evitada: un <Link> GET a /api/auth/federated-logout era
    # prefetcheado por Next.js y borraba la cookie de sesión sin clic del usuario.

  Escenario: Ciclo completo de receta con versión inmutable
    Dado el hogar "Casa Demo" con ingredientes "Pollo", "Arroz" y "Aceite de oliva"
    Cuando creo la receta "Arroz con pollo" y publico la versión 1
    Entonces la versión publicada es de solo lectura
    Cuando creo la versión 2 en borrador
    Y añado las líneas Pollo 800 g, Arroz 300 g, Aceite 30 ml
    Y guardo y publico la versión 2
    Entonces la receta ofrece "v1" y "v2" como versiones publicadas

  Escenario: Planificación, aprobación y demanda proyectada
    Dado un plan semanal en borrador
    Cuando añado "Arroz con pollo · v2" como almuerzo del martes con 4 raciones
    Y propongo y apruebo el plan
    Entonces "/forecast" muestra 3 ingredientes con demanda proyectada
    Y cada línea indica lo necesario, lo que hay en casa y el faltante
    # Caso borde: cocinar exige inventario suficiente — completar sin stock
    # devolvió "insufficient inventory for unit g: missing 800" (correcto).

  Escenario: Compra genera lotes y cocinar reconcilia inventario
    Dado el plan aprobado con faltantes proyectados
    Cuando genero la lista de compra para la ventana de la semana
    Entonces aparecen los 3 ingredientes faltantes como pendientes
    Cuando registro la compra de cada ítem
    Entonces cada compra crea un lote de inventario (movement "purchase")
    Cuando marco la comida como completada
    Entonces se descuentan exactamente 800 g pollo, 300 g arroz y 30 ml aceite
    Y todos los lotes quedan en 0
    # Verificado en base de datos: movements purchase +300/+30/+800 y
    # meal_consumption -800/-300/-30.

  Escenario: Responsive en móvil 375px
    Dado un viewport de 375x812
    Cuando navego a "/plan"
    Entonces no hay scroll horizontal
    Y el selector de día muestra los 7 días
    Y la barra de navegación inferior sustituye al sidebar

  Escenario: Rutas protegidas tras logout
    Dado que acabo de cerrar sesión
    Cuando navego a "/inventario" o "/plan"
    Entonces soy redirigido a "/login" con returnTo
    # Verificado: POST logout → borrado de cookie → proxy 307 → /login.
