# TransferApp

TransferApp is a front-end-only schematic simulation of a vault transfer from a private network into a public blockchain. It uses mocked data, timers, and a local browser database (`localStorage`) only. No real wallet provider, blockchain, API, backend, or funds are involved.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The production build can be checked with `npm run build` and started with `npm run start`.

## Deploy to Vercel

Push this directory to GitHub, import the repository in Vercel, and use the default Next.js settings. No environment variables or additional configuration are required.

## Edit mock data

Mock vaults, transfer stages, durations, permissions, the configured admin wallet, and the 18-hour bridge window are in `lib/config.ts`. Shared persisted state and per-wallet transfer records are in `store/transfer-store.ts` under the `transferapp-local-db` localStorage key. The Admin page's **Reset Demo** button clears the simulation state.
