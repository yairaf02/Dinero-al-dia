# Dinero al Día

Aplicación web estática para registrar ingresos y gastos personales, consultar
el balance y ver conversiones estimadas a bolívares y euros con tasas
referenciales basadas en el BCV.

## Uso local

Abre `index.html` en un navegador moderno. Los movimientos se guardan
localmente en el navegador mediante `localStorage`; no se envían a ningún
servidor.

## Estructura

- `index.html`: estructura semántica y controles de la interfaz.
- `styles.css`: estilos responsive, contraste y estados de foco.
- `script.js`: estado de movimientos, validación, cálculos y renderizado.
- `currency.js`: consulta de tasas BCV, respaldo local y formateo/conversión de
  monedas.

La aplicación consulta `https://bcv.today/api/v1/rate.json`, un servicio
intermediario que publica tasas basadas en el BCV. Si la consulta falla, usa la
última tasa válida guardada localmente o una tasa de respaldo manual. La fecha
y el origen de la tasa se muestran en el resumen. Las conversiones son una
vista derivada: no modifican los montos guardados.
