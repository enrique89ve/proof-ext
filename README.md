# Proof Existence

Aplicación Astro para crear y verificar pruebas de existencia de documentos en
Hive. El hash se calcula localmente y la verificación consulta la blockchain
desde el navegador; no se suben los documentos a este proyecto.

## Desarrollo

```sh
pnpm install
pnpm dev
```

## Comprobaciones

```sh
pnpm check
pnpm build
pnpm preview
```

## Despliegue en Vercel

El proyecto está configurado como sitio estático (`output: "static"`, valor
predeterminado de Astro). Vercel detecta Astro automáticamente al importar el
repositorio y configura el build; no necesita `@astrojs/vercel` mientras las
rutas sigan siendo prerenderizadas.

En Vercel:

1. Importa el repositorio.
2. Mantén el directorio raíz en `/`.
3. Deja que Vercel detecte Astro y conserva los valores detectados.
4. Despliega.

Los valores equivalentes son:

| Ajuste | Valor |
| --- | --- |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

Para desplegar desde la terminal, instala la CLI de Vercel y ejecuta `vercel`
desde la raíz del proyecto. Para habilitar SSR o endpoints de Astro en el
futuro, habrá que añadir el adaptador oficial `@astrojs/vercel` y cambiar el
output a `server`.

## Estructura del proyecto

Astro expone cada archivo `.astro` de `src/pages/` como una ruta. Los assets
estáticos viven en `public/` y los componentes React en `src/components/`.

Documentación: [Astro](https://docs.astro.build) ·
[Astro en Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
