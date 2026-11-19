# Apklis Stats

A clean, open-source dashboard for **developers** who publish apps on [Apklis](https://www.apklis.cu), the Cuban Android app store. It is a lighter view of the download stats you get in the [Apklis developer console](https://console.apklis.cu).

**Try it live:** <https://apklis-downloads-stats.vercel.app/>

Sign in with your Apklis developer account (the one you use on `console.apklis.cu`) and see, at a glance:

- **Total downloads** of all your apps.
- **Last 365, 30 and 7 days, and today**, each compared with the previous period of the same length.
- **The last 7 days** day by day, with your best day highlighted.
- **Today's stats by app**: your apps with downloads today, with today vs. yesterday and the last 7 days vs. the 7 before.

It is built with React, TypeScript and plain CSS — no UI framework, no tracking, no backend of its own. Spanish and English, light and dark themes.

## How it works

The app talks directly to the official Apklis API (`api.apklis.cu`), the same one the developer console uses:

1. You sign in with your Apklis username and password. They are sent to the Apklis OAuth endpoint and **never stored**.
2. Only the resulting session token is saved in your browser (`localStorage`) and refreshed automatically when it expires.
3. Stats come from two endpoints:
   - `/v3/dashboard/histogram/` — daily downloads of the whole account, and the same broken down by app for the given package ids.
   - `/v3/dashboard/resume/` — the account summary, used only to find your package ids (taken from the app icon URLs).

> The summary lists your top 10 apps by downloads and your top 10 by releases, so if you have more apps than that, the ones outside both lists won't appear in **Today's stats by app**.

Days follow Cuba's time zone (`America/Havana`), as Apklis does: "today" is the current date in Cuba wherever you open the dashboard.

The Apklis API does not allow cross-origin requests, so the browser calls `/apklis/*` on the same origin and that path is proxied to `https://api.apklis.cu/*`: by Vite during development and by the hosting provider in production (see [Deployment](#deployment)).

> This project is not affiliated with or endorsed by Apklis.

## Getting started

Requirements: [Node.js](https://nodejs.org) 20.19 or later.

```bash
git clone https://github.com/leandrotorressilva/apklis-downloads-stats.git
cd apklis-downloads-stats
npm install
npm run dev
```

Open the URL printed by Vite (usually <http://localhost:5173>) and sign in. There is nothing to configure.

## Scripts

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the development server with the proxy |
| `npm run build`   | Type-check and build for production in `dist/` |
| `npm run preview` | Serve the production build locally (with the proxy) |
| `npm run lint`    | Lint the code with [Oxlint](https://oxc.rs) |

## Deployment

The output in `dist/` is a static site. The only requirement is a rewrite from `/apklis/*` to `https://api.apklis.cu/*`.

### Vercel

Import the repository in Vercel. The rewrites are already defined in [`vercel.json`](vercel.json).

### Other hosts

Configure an equivalent reverse proxy. For example, with nginx:

```nginx
location /apklis/ {
    proxy_pass https://api.apklis.cu/;
    proxy_set_header Host api.apklis.cu;
    proxy_ssl_server_name on;
}
```

## Project structure

```text
src/
├── api.ts         Apklis API client and session storage
├── stats.ts       Pure functions that turn the histogram into stats
├── i18n.ts        Spanish and English messages and formatting helpers
├── theme.ts       Light / dark / system theme
├── ui.tsx         Shared components: shell, theme menu, trend pill, status panel
├── icons.tsx      Inline SVG icons
├── Login.tsx      Sign-in screen
├── Dashboard.tsx  Stats screen
└── index.css      Design tokens and styles
```

The visual identity — flat, matte, squircle corners, violet and lime — is documented in [`DESIGN.md`](DESIGN.md) (in Spanish). Please follow it when changing the UI.

## Contributing

Issues and pull requests are welcome. Before opening a pull request:

1. Keep the project lean: avoid new dependencies unless they are really needed.
2. Add every visible text to both languages in `src/i18n.ts`.
3. Check your change on mobile and desktop, in light and dark mode.
4. Make sure `npm run lint` and `npm run build` pass.

## Acknowledgements

- Icons drawn after [Lucide](https://lucide.dev) (ISC License).
- Typeface: [Montserrat](https://github.com/JulietaUla/Montserrat) (SIL Open Font License), self-hosted through [Fontsource](https://fontsource.org).

## License

[MIT](LICENSE) © Leo Silva
