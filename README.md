# chivacare.com

Built with [Astro](https://astro.build), [Bun](https://bun.sh) and [Tailwind CSS](https://tailwindcss.com).

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `bun install`     | Install dependencies                        |
| `bun dev`         | Start dev server at `localhost:4321`        |
| `bun run build`   | Build the production site to `./dist/`      |
| `bun preview`     | Preview the build locally                   |

## Content

The public site is a static rebuild of the legacy CodeIgniter site. Content comes from the legacy MySQL dump, exported to JSON in `src/data/db/` (public tables only; member, order, appointment, invoice and contact tables are never read):

```sh
python scripts/import-sql.py <cp392652_chivacare_db.sql>            # tables -> src/data/db/*.json
python scripts/copy-uploads.py <legacy site root>/chivacare.com      # referenced images -> public/assets/
```

## Forms

The site is static, so the forms post JSON to an external endpoint set at build time:

| Variable                      | Used by                                   |
| :---------------------------- | :---------------------------------------- |
| `PUBLIC_APPOINTMENT_ENDPOINT` | Appointment wizard (`/th/appointment`)    |
| `PUBLIC_CONTACT_ENDPOINT`     | Contact form on `/th/page/{id}` pages     |

When a variable is unset, that form shows the clinic phone numbers and LINE link instead.

## Deploy

Pushes to `main` deploy to Portainer (`.github/workflows/portainer.yml`). The Docker image runs `server.ts`, which serves `dist/` and handles `POST /api/appointment` (the image's default `PUBLIC_APPOINTMENT_ENDPOINT`) by posting the booking to the Discord webhook in `APPOINTMENT_WEBHOOK`. Set that as a GitHub secret or as a Portainer stack env var. Test with `bun test`.
