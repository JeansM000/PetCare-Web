# Diseño de PetCare

## Respuestas para la sustentación

### 1. Cambios frente al diagrama de clases

La implementación no usa Entity Framework Core: el proyecto es una aplicación Blazor Web con SQL Server y `Microsoft.Data.SqlClient`. Por eso no existe un `DbContext`, ni configuraciones `OnModelCreating`, ni migraciones EF. El esquema se crea y amplía mediante `Database/PetCareWeb.sql` y `Database/PetCareWeb_Migration_Operaciones.sql`.

Sí se agregaron elementos de apoyo que no necesariamente aparecían en el diagrama: `PetCareDataService` para centralizar consultas, transacciones, validaciones y autorización; modelos de entrada como `ProductInput`, `AppointmentInput` e `InvoiceLineInput`; y registros de salida como `ProductRow`, `ServiceRow` e `InvoiceRow`. También se creó el componente reutilizable `ServiceForm`, que recibe parámetros y devuelve datos mediante `EventCallback`. Estos cambios separan la interfaz de la persistencia y evitan que las páginas creen conexiones directamente.

### 2. Jerarquías y renglones de factura

No se implementó una jerarquía de clases de factura. La factura se guarda en `dbo.Facturas` y cada renglón en `dbo.LineasFactura`. La restricción `CHK_OrigenExclusivo` obliga a que un renglón tenga exactamente un `ServicioId` o un `ProductoId`. El cliente pagador se identifica con `ClienteId` y el usuario que genera el recibo con `UsuarioEmisorId`.

Al crear una factura, `CreateInvoiceAsync` en `Data/PetCareDataService.cs` abre una transacción, inserta la cabecera y después inserta cada renglón. Para un medicamento verifica vencimiento y existencias, descuenta la cantidad y guarda el precio; para un servicio guarda el servicio y su precio calculado. En memoria, la página mantiene los renglones en `Lines` y los limpia cuando la operación termina correctamente.

Al anular, `CancelInvoiceAsync` cambia `Facturas.EstaAnulada` a `1` y suma nuevamente al lote la cantidad de cada renglón de producto. Los servicios no se eliminan ni se modifican; por eso pueden volver a facturarse. Los renglones permanecen en la base de datos para conservar el historial. La eliminación en cascada de renglones solo se aplicaría si se eliminara la factura físicamente, operación que el sistema no utiliza para anular.

### 3. Pilares de la programación orientada a objetos

- **Abstracción:** `PetCareDataService` expone operaciones como `CreateInvoiceAsync` y oculta conexiones, comandos SQL, transacciones y parámetros. La página solo conoce la operación de negocio.
- **Encapsulamiento:** en `Facturas.razor`, `Lines`, `Draft`, `NewLine` y los mensajes son campos privados. La interfaz solo los modifica mediante métodos como `AddLine`, `CreateAsync` y `CancelAsync`.
- **Herencia:** las páginas Razor heredan indirectamente de la infraestructura de componentes de Blazor (`ComponentBase`) y usan componentes como `EditForm`, `InputSelect` e `InputNumber`. No se creó una jerarquía propia de entidades.
- **Polimorfismo:** el código no tiene una jerarquía de clases con métodos virtuales sobrescritos. La variación de comportamiento se resuelve con condiciones, por ejemplo `NewLine.Kind` distingue `Servicio` y `Producto`. Por tanto, este es un punto que no se implementó con polimorfismo clásico.

### 4. Polimorfismo dinámico y sobrecarga de `AgregarLinea`

No existe una línea de polimorfismo dinámico ni un método sobrecargado `AgregarLinea` en la versión actual. El método real es `AddLine()` en `Components/Pages/Facturas.razor`, línea 52. Allí un `if` decide si se procesa un servicio o un producto; la decisión la toma el valor de `NewLine.Kind`, no el runtime mediante despacho virtual.

Tampoco existe una sobrecarga de `AgregarLinea`: solo hay un método sin parámetros y los datos se toman de `NewLine`. En un diseño futuro, dos sobrecargas tipadas, por ejemplo `AddLine(ServiceRow service)` y `AddLine(ProductRow product, int quantity)`, serían preferibles a un parámetro opcional porque expresan reglas distintas, evitan combinaciones inválidas y hacen más clara la validación.

### 5. Recorrido del botón Anular

En `Facturas.razor`, el botón `Anular` asigna `ConfirmCancelId`; después el botón de confirmación ejecuta `CancelAsync(row.Id)`. Ese manejador llama a `Data.CancelInvoiceAsync(ActorRole, invoiceId)`. El servicio valida el rol mediante `EnsureAdmin`, que solo permite `Director`. Luego abre una transacción, marca la factura como anulada y repone las cantidades de productos mediante un `UPDATE` sobre `Productos` basado en `LineasFactura`. Si todo funciona hace `Commit`; ante un error hace `Rollback` y la página muestra el mensaje de dominio.

### 6. Incorporación de vacunación y alimentos

Se crearían las clases o modelos `Vaccine`, `VaccinationRecord`, `FoodProduct` y sus modelos de entrada y salida. También se añadirían páginas `Vacunaciones.razor` y `Alimentos.razor`, junto con métodos específicos en `PetCareDataService`.

En la base de datos se crearían tablas de vacunas, aplicaciones de vacunas y alimentos o, si se reutiliza el inventario, se ampliaría `Productos` con una clasificación, unidad y reglas de vencimiento apropiadas. También se necesitarían claves hacia mascota, cliente, usuario y lote.

Sí habría que modificar elementos existentes: `NavMenu.razor` para mostrar las nuevas pantallas según el rol; `PetCareDataService` para las consultas y transacciones; el menú y permisos; y posiblemente `Productos.razor` si alimentos y medicamentos comparten inventario. No conviene reutilizar ciegamente las reglas actuales porque los medicamentos requieren control de lotes y vencimiento, mientras que las vacunas necesitan registrar aplicación, mascota, fecha y próxima dosis.

## Arquitectura y reglas implementadas

La aplicación usa Blazor Web con renderizado interactivo de servidor. Las páginas Razor reciben `PetCareDataService` por inyección de dependencias y no crean conexiones desde la interfaz. Las contraseñas usan PBKDF2-SHA256 con sal aleatoria y comparación en tiempo constante.

Las citas requieren entre 15 y 180 minutos. Los lotes vencidos no se pueden registrar y tampoco se pueden facturar. Solo el Director cambia roles y anula facturas. La persistencia usa comandos parametrizados y transacciones SQL, no Entity Framework Core.
