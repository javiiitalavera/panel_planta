# Pacientes Javi

Aplicación web local para mantener una vista resumida de los pacientes activos: ingreso, antecedentes relevantes, situación clínica, plan terapéutico y plan social.

## Características

- Vista configurable en dos o tres columnas desde un menú compacto.
- Crear, editar, archivar, reactivar y eliminar pacientes.
- Formato de texto en negrita, subrayado y color en los campos clínicos.
- Orden manual mediante arrastrar y soltar.
- Búsqueda por cualquier texto de la ficha.
- Exportación de pacientes activos a Word (`.docx`).
- Formato básico de texto (negrita, subrayado y una paleta breve de colores), conservado en Word.
- Copia de seguridad e importación en JSON.
- Almacenamiento exclusivamente local en IndexedDB.
- Sin backend, usuarios, API ni base de datos remota.

## Importante sobre los datos

GitHub y Vercel alojan únicamente el código. Los datos introducidos se guardan en el navegador concreto en el que se utiliza la aplicación.

- Otro navegador u ordenador no verá las fichas.
- Borrar los datos del navegador puede eliminar las fichas.
- Conviene exportar periódicamente una copia JSON.
- La importación reemplaza el contenido local existente.

## Requisitos

- Node.js 22 recomendado (`.nvmrc` incluido).
- npm 10 o superior.

## Uso local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Comprobaciones

```bash
npm run lint
npm run build
```

El proyecto usa exportación estática de Next.js. Tras `npm run build`, la versión estática queda en la carpeta `out`.

## Subir a GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Actualización de Pacientes Javi"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

## Desplegar en Vercel

1. Importar el repositorio desde Vercel.
2. Vercel detectará Next.js automáticamente.
3. No hay que crear variables de entorno.
4. Desplegar.

## Estructura principal

```text
app/                    Página y estilos globales
components/             Dashboard, fichas, barra y editor
lib/db.ts               Base local IndexedDB con Dexie
lib/export-docx.ts      Generación del Word
lib/backup.ts           Exportación e importación JSON
lib/types.ts            Modelo de datos
```
