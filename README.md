# collaborative-code-editor

Run `npm install`, then `npm run dev` to start both the Socket.IO backend on
port 5000 and the Vite frontend. Open the frontend URL printed by Vite.

For separate terminals, use `npm run server:dev` and `npm run client:dev`.
Leave `VITE_BACKEND_URL` empty in `client/.env` to use the local Vite proxy.
For a separately hosted production frontend, set `VITE_BACKEND_URL` to the
backend's HTTPS origin before building.
