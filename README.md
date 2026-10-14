# Dinero al Día

Aplicación web estática en español para registrar ingresos y gastos personales,
consultar balances y ver conversiones estimadas a bolívares y euros. Las cuentas
y transacciones se administran con Supabase Auth y PostgreSQL.

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor del proyecto, pega el contenido de `supabase/schema.sql`
   y ejecútalo. Esto crea la tabla `public.transactions` y activa políticas RLS
   para que cada cuenta solo pueda leer o agregar sus propios movimientos.
3. En `supabase-client.js`, reemplaza `SUPABASE_URL` y `SUPABASE_ANON_KEY` por
   la URL del proyecto y su clave pública `anon` (o `publishable`) de la API.
   Estas credenciales públicas se usan en el navegador; nunca pongas una clave
   `service_role` en la aplicación.
4. En Supabase, configura la URL del sitio y las URL de redirección de Auth
   para el origen desde el que servirás la aplicación. El registro puede
   requerir confirmar el correo antes de iniciar sesión, según la configuración
   de confirmación de correo del proyecto.

## Ejecución local

Sirve la carpeta por HTTP, por ejemplo con una extensión de servidor local o
`python -m http.server 8000`, y abre `http://localhost:8000`. No abras
`index.html` directamente como archivo: la autenticación y los módulos
JavaScript requieren un origen HTTP(S).

Las transacciones nuevas se guardan en Supabase por cuenta y se sincronizan
cuando esa cuenta inicia sesión. Los movimientos que se hubieran guardado antes
en `localStorage` no se importan. El cierre de sesión retira los datos de la
cuenta de la pantalla.

## Compartir en GitHub Pages

El sitio se publicará en
<https://yairaf02.github.io/Dinero-al-dia/> cuando el workflow
`.github/workflows/deploy-pages.yml` se ejecute correctamente. El workflow se
activa al actualizar `main` o manualmente desde la pestaña **Actions**.

En **Settings > Pages**, selecciona **GitHub Actions** como fuente de
publicación. El repositorio fuente puede seguir siendo privado si el plan de
GitHub de la cuenta permite Pages para repositorios privados; el sitio
publicado será accesible públicamente. No cambies el repositorio a público si
quieres mantener privado su código.

Antes de compartir la aplicación:

1. Configura la URL y la clave pública de Supabase en `supabase-client.js`.
   No uses una clave `service_role`.
2. En Supabase Auth, establece como URL del sitio
   `https://yairaf02.github.io/Dinero-al-dia/` y agrega
   `https://yairaf02.github.io/Dinero-al-dia/**` a las URL de redirección
   permitidas.
3. Ejecuta el workflow y espera a que el despliegue termine correctamente.

## Estructura

- `index.html`: estructura semántica, acceso a cuenta y controles de la app.
- `styles.css`: estilos responsive, contraste y estados de foco.
- `script.js`: autenticación, carga/guardado por usuario, validación y cálculos.
- `supabase-client.js`: configuración del cliente oficial `supabase-js`.
- `.github/workflows/deploy-pages.yml`: despliegue estático a GitHub Pages.
- `supabase/schema.sql`: tabla y políticas de seguridad por fila (RLS).
- `currency.js`: consulta de tasas BCV, respaldo local y formato/conversión.

Al abrir la aplicación, consulta automáticamente
`https://bcv.today/api/v1/rate.json`, un servicio intermediario que publica
tasas basadas en el BCV. Si la consulta falla, usa la última tasa válida
guardada localmente o una tasa de respaldo manual. La fecha y el origen de la
tasa se muestran en el resumen. El historial muestra cada movimiento en
dólares y sus equivalentes en bolívares y euros cuando las tasas están
disponibles. Las conversiones son una vista derivada: no modifican los montos
guardados.
