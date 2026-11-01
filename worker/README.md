# Panel de administración

API serverless (Cloudflare Worker) para editar `src/data/sitio.json`, subir imágenes/iconos e IFC, y publicar los cambios como commits en GitHub.

**Worker desplegado:** https://portafolio-admin.ale-aguilera-ve.workers.dev

## Configurar los secretos (lo único que falta)

Ejecuta el script desde PowerShell:

```powershell
cd "C:\Users\Ale-PC\Documents\deepseek-harness\default-workspace\web-civil\worker"
powershell -ExecutionPolicy Bypass -File .\configurar-secretos.ps1
```

Te pedirá, en orden:

1. `ADMIN_PASSWORD`: la contraseña del panel.
2. `SESSION_SECRET`: una cadena larga; el script te sugiere una.
3. `GITHUB_TOKEN`: el token fine-grained con **Contents: Read and write**.

Los valores se escriben en la terminal y quedan como secretos de Cloudflare; no se guardan en el repositorio.

## Crear el token de GitHub

1. GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens**.
2. Repository access: solo `KryptAle/portafolio-civil`.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Copia el token; no lo pegues en el repositorio.

## Variables del Worker

Están en `wrangler.toml`:

```toml
GITHUB_REPO = "KryptAle/portafolio-civil"
GITHUB_BRANCH = "main"
ALLOWED_ORIGIN = "https://kryptale.github.io"
```

Si más adelante usas un dominio propio, cambia `ALLOWED_ORIGIN` por ese dominio (puedes separar varios con coma) y vuelve a desplegar:

```powershell
cd worker
npx wrangler deploy
```

## Usar el panel

Abre:

```
https://kryptale.github.io/portafolio-civil/admin/
```

Introduce la URL del Worker y la contraseña. Al guardar:

1. El Worker hace un commit de `src/data/sitio.json`.
2. GitHub Actions reconstruye el sitio.
3. En unos 40 segundos los cambios están publicados.

## Límites y criterios

- El Worker acepta archivos de hasta **12 MB**; los IFC deben quedar por debajo de ese peso.
- Las imágenes se guardan en `public/uploads/`; los IFC en `public/modelos/`.
- El campo `peso` de cada modelo debe coincidir con el tamaño real del IFC para que el progreso de descarga sea correcto.
- El contenido es un único JSON: si borras una sección, revisa que no quede referenciada en `nav.items`.
- El panel no guarda la contraseña ni el token de GitHub; solo el token de sesión firmado (12 h).
