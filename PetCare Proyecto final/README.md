# PetCare Web

Aplicación Blazor Web App sobre .NET 10 para gestionar usuarios, servicios veterinarios, hospitalizaciones, inventario y facturación.

## Requisitos

- .NET 10 SDK.
- SQL Server local accesible como `localhost`.
- Ejecutar `Database/PetCareWeb.sql` y después `Database/PetCareWeb_Migration_Operaciones.sql` en SQL Server.
- Comprobar la cadena de conexión en `appsettings.json`.

## Usuarios de prueba (solo desarrollo)

La migración crea estas cuentas si todavía no existen:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin2026!` | Director (administrador) |
| `recepcion` | `Recepcion2026!` | Recepcionista |

## Ejecución

```powershell
dotnet restore
dotnet run --project "PetCare Proyecto final/PetCare Proyecto final.csproj" --launch-profile https
```

Abrir `https://localhost:7154`.

## Escenario de demostración

1. Intentar iniciar sesión con una contraseña incorrecta.
2. Entrar como recepcionista.
3. Registrar una cita de 45 minutos y confirmar el veterinario desde la tabla.
4. Registrar una hospitalización con fecha de hace tres días y darle de alta.
5. Registrar un lote vigente y otro vencido; ambos aparecen y el vencido queda marcado.
6. Crear una factura: el nombre se toma del usuario autenticado; añadir la consulta, la hospitalización y dos unidades del medicamento vigente.
7. Abrir el detalle y comprobar descripciones, subtotales y total.
8. Intentar añadir el lote vencido y comprobar el mensaje de rechazo.
9. Verificar que la recepcionista no puede anular; entrar como Director y anular con confirmación.
10. Buscar por número y por nombre usando Enter; la factura anulada permanece marcada.
11. Reiniciar la aplicación y comprobar que los datos persisten.

## Seguridad

Las contraseñas se almacenan con PBKDF2-SHA256 y las operaciones sensibles se validan también en el servicio de datos, no solo en la interfaz.
