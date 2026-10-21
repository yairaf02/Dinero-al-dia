# Requisitos de Dinero al Día

## 1. Objetivo

Dinero al Día es una aplicación web estática en español para registrar
ingresos y gastos personales, consultar el balance de un período y ver
conversiones estimadas a otras monedas.

## 2. Alcance del MVP

La aplicación debe permitir:

- Registrar ingresos y gastos con descripción, monto y fecha.
- Crear una cuenta e iniciar y cerrar sesión.
- Guardar los movimientos en una base de datos, separados por cuenta.
- Consultar ingresos, gastos y balance.
- Filtrar el resumen por todo el tiempo o por el mes actual.
- Mostrar movimientos del más reciente al más antiguo.
- Convertir el balance a bolívares (VES) y euros (EUR) usando tasas
  referenciales basadas en el BCV.
- Mantener la interfaz clara, responsive y accesible.

No forma parte del alcance actual:

- Tasas de cambio en tiempo real.
- Presupuestos, categorías, reportes avanzados o exportación.
- Edición o eliminación de movimientos.

## 3. Modelo de datos

Cada movimiento debe tener esta forma:

```text
{
  id: string,
  user_id: string,
  type: "income" | "expense",
  description: string,
  amount: number,
  date: "YYYY-MM-DD"
}
```

Reglas:

- `amount` representa una cantidad positiva en USD y se guarda con máximo dos
  decimales.
- `user_id` identifica la cuenta propietaria y debe corresponder a la sesión
  autenticada.
- El tipo determina si el monto se suma como ingreso o se resta como gasto.
- Los datos guardados son sensibles y solo deben ser accesibles por la cuenta
  propietaria mediante políticas de seguridad en la base de datos.

## 4. Requisitos funcionales

### RF-01: Registrar un movimiento

**Dado** que la persona está en el formulario de nuevo movimiento  
**Cuando** selecciona un tipo, escribe una descripción, un monto válido,
elige una fecha y envía el formulario  
**Entonces** el movimiento se guarda en la cuenta autenticada y aparece en la
lista.

### RF-02: Validar el monto

**Dado** que la persona está completando el formulario  
**Cuando** el monto está vacío, no es numérico, es cero o es negativo  
**Entonces** el movimiento no se guarda y se muestra un mensaje de validación
en español.

### RF-03: Validar campos requeridos

**Dado** que la persona está completando el formulario  
**Cuando** falta el tipo, la descripción o la fecha  
**Entonces** el movimiento no se guarda y se indica que debe completar los
campos requeridos.

### RF-04: Persistir movimientos

**Dado** que existen movimientos guardados, **cuando** la persona inicia sesión
en su cuenta, **entonces** sus movimientos siguen disponibles y no se muestran
los de otras cuentas.

### RF-12: Administrar una cuenta

**Dado** que la persona no ha iniciado sesión, **cuando** crea una cuenta o
inicia sesión con credenciales válidas, **entonces** puede acceder a sus propios
movimientos y se informa si debe confirmar su correo electrónico.

**Cuando** cierra sesión, **entonces** los movimientos dejan de mostrarse y la
aplicación solicita autenticación para volver a consultarlos.

### RF-13: Aislar datos por cuenta

**Dado** que una persona autenticada consulta o guarda movimientos, **cuando**
la base de datos procesa la operación, **entonces** las políticas RLS permiten
únicamente leer o insertar registros cuyo propietario coincide con la cuenta
autenticada.

### RF-14: Recuperar contraseña

**Dado** que la persona no puede iniciar sesión, **cuando** escribe su correo y
solicita recuperar la contraseña, **entonces** recibe un enlace para restablecerla
sin que la interfaz revele si el correo está registrado.

**Cuando** abre un enlace de recuperación válido, **entonces** puede escribir y
confirmar una contraseña nueva de al menos 8 caracteres y recibe un mensaje
accesible que confirma el resultado.

### RF-15: Personalizar el saludo de la cuenta

**Dado** que una persona crea una cuenta, **cuando** ingresa su nombre para
mostrar, **entonces** se guarda en los metadatos de su perfil y se presenta como
saludo al iniciar sesión.

Las cuentas sin nombre guardado conservan un título genérico, y el texto del
nombre se inserta de forma segura en la interfaz.

### RF-05: Calcular el resumen

**Dado** un conjunto de movimientos  
**Cuando** se muestra el resumen  
**Entonces**:

- ingresos es la suma de los movimientos `income`;
- gastos es la suma de los movimientos `expense`;
- balance es ingresos menos gastos;
- cada cantidad se muestra con dos decimales.

### RF-06: Filtrar por período

**Dado** que existen movimientos de distintos períodos  
**Cuando** se selecciona “Este mes”  
**Entonces** el resumen y la lista consideran únicamente movimientos del mes
actual.

**Cuando** se selecciona “Todo el tiempo”  
**Entonces** se consideran todos los movimientos guardados.

### RF-07: Ordenar movimientos

**Dado** que existen varios movimientos  
**Cuando** se muestra la lista  
**Entonces** los movimientos aparecen ordenados del más reciente al más
antiguo.

### RF-08: Mostrar estado vacío

**Dado** que no existen movimientos para el período seleccionado  
**Cuando** se muestra la lista  
**Entonces** aparece un mensaje claro en español indicando que todavía no hay
movimientos.

### RF-09: Consultar tasas basadas en BCV

**Dado** que la aplicación puede acceder al servicio intermediario de tasas  
**Cuando** se carga la aplicación  
**Entonces** consulta las tasas oficiales vigentes del BCV y muestra las tasas
de bolívares por dólar y por euro, junto con su fuente y fecha de vigencia.

Si la consulta no está disponible, la aplicación usa la última tasa válida
guardada localmente o una tasa de respaldo manual claramente identificada.

### RF-10: Convertir monedas

**Dado** un balance válido en USD y tasas válidas configuradas  
**Cuando** se muestra el resumen  
**Entonces** se muestran conversiones derivadas a VES y EUR, con su etiqueta,
símbolo y dos decimales.

Las conversiones nunca deben modificar los montos base almacenados.

### RF-11: Manejar tasas inválidas

**Dado** que una tasa no existe, no es numérica o es menor o igual a cero  
**Cuando** se calculan conversiones  
**Entonces** se omite únicamente esa conversión y se muestra un aviso útil sin
romper el balance principal.

## 5. Requisitos de accesibilidad y experiencia

- La página debe declarar `lang="es"`.
- Todos los controles deben tener etiquetas visibles o asociadas.
- La interfaz debe poder usarse con teclado.
- El foco debe ser visible.
- El color no debe ser la única forma de distinguir ingresos y gastos.
- Los mensajes de validación y cambios relevantes deben comunicarse a
  tecnologías de asistencia.
- La interfaz debe conservar contraste suficiente en texto, controles y
  estados financieros.
- Los textos visibles deben estar en español claro y sin lenguaje
  estigmatizante.

## 6. Requisitos técnicos y de privacidad

- Usar HTML5, CSS3 y JavaScript nativo sin frameworks externos.
- Mantener la consulta, el respaldo y las tasas en una fuente configurable y
  separada de la lógica de movimientos.
- Usar Supabase Auth para gestionar sesiones y PostgreSQL con políticas RLS
  para persistir transacciones por usuario.
- No guardar transacciones financieras en `localStorage`; el SDK de Auth puede
  mantener la sesión localmente.
- No incluir claves `service_role` ni secretos en el cliente.
- No incluir montos o descripciones financieras en mensajes de error técnicos.
- Mantener el renderizado responsive con al menos 1.000 movimientos.
- No introducir un paso de build obligatorio.

## 7. Criterios de aceptación del MVP

El MVP se considera listo cuando:

1. Se puede crear una cuenta, iniciar sesión y cerrar sesión.
2. Se pueden registrar ingresos y gastos válidos desde una sesión activa.
3. Se rechazan montos inválidos sin guardar datos incorrectos.
4. Los movimientos de cada cuenta persisten y no se exponen a otras cuentas.
5. Los totales y el balance coinciden con los movimientos visibles.
6. El filtro mensual cambia correctamente la lista y el resumen.
7. Las conversiones usan tasas basadas en BCV o un respaldo identificado y no
   alteran el balance base.
8. Los estados vacío, error y éxito son claros y accesibles.
9. La aplicación funciona en pantalla pequeña y grande.
10. La sintaxis JavaScript y las comprobaciones disponibles pasan sin errores.
11. Al crear una cuenta se pide un nombre para mostrar y la sesión lo usa en el
    saludo; cuentas previas sin nombre conservan el título genérico.
12. El resumen muestra las tasas BCV de USD/VES y EUR/VES y su fecha; la caché
    o el respaldo manual se distinguen de una consulta en vivo.
