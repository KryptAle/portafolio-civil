# Panel de administración

API serverless (Cloudflare Worker) para editar `src/data/sitio.json`, subir imágenes/iconos e IFC, y publicar los cambios como commits en GitHub.

## 1. Crear el token de GitHub

1. GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens**.
2. Repository access: solo `KryptAle/portafolio-civil`.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Copia el token; no lo pegues en el repositorio.

## 2. Desplegar el Worker

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Anota la URL resultante, por ejemplo:

```
https://portafolio-admin.tuusuario.workers.dev
```

## 3. Configurar secretos

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GITHUB_TOKEN
```

- `ADMIN_PASSWORD`: la contraseña del panel. Vive solo en Cloudflare.
- `SESSION_SECRET`: cadena aleatoria larga (por ejemplo, 40+ caracteres).
- `GITHUB_TOKEN`: el token fine-grained del paso 1.

Las variables públicas están en `wrangler.toml`:

```toml
GITHUB_REPO = "KryptAle/portafolio-civil"
GITHUB_BRANCH = "main"
ALLOWED_ORIGIN = "https://kryptale.github.io"
```

Si más adelante usas un dominio propio, cambia `ALLOWED_ORIGIN` por ese dominio (puedes separar varios con coma).

## 4. Usar el panel

Abre:

```
https://kryptale.github.io/portafolio-civil/admin/
```

Introduce la URL del Worker y la contraseña. Al guardar:

1. El Worker hace un commit de `src/data/sitio.json`.
2. GitHub Actions reconstruye el sitio.
3. En unos 40 segundos los cambios están publicados.

## Límites y criterios

- El Worker acepta archivos de hasta **9 MB**; por eso los IFC deben quedar por debajo de ese peso.
- Las imágenes se guardan en `public/uploads/`; los IFC en `public/modelos/`.
- El campo `peso` de cada modelo debe coincidir con el tamaño real del IFC para que el progreso de descarga sea correcto.
- El contenido es un único JSON: si borras una sección, revisa que no quede referenciada en `nav.items`.
- El panel no guarda la contraseña ni el token en el navegador; solo el token de sesión firmado (12 h).
