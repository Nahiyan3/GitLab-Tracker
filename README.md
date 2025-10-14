# GitLab Final

A full-stack application with React + TypeScript frontend and Express + TypeScript backend.

## Project Structure

```
gitlab-final/
├── client/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── types/
│   └── package.json
└── package.json     # Root package with scripts
```

## Getting Started

### Installation

Install all dependencies for both client and server:

```bash
npm run install:all
```

Or install separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd client && npm install
```

### Development

Run both client and server in development mode:

```bash
npm run dev
```

Or run separately:

```bash
# Run server only (http://localhost:5000)
npm run dev:server

# Run client only (http://localhost:8080)
npm run dev:client
```

### Building

Build both client and server:

```bash
npm run build
```

### Production

Start the production server:

```bash
npm start
```

## Environment Variables

### Server (.env in server/)

```
PORT=5000
CLIENT_URL=http://localhost:8080
```

### Client (.env in client/)

```
VITE_API_URL=/api
```

## API Endpoints

- `GET /` - Server info
- `GET /api/health` - Health check
- `GET /api/projects` - Get all projects (placeholder)

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend
- Express
- TypeScript
- CORS

## Development Notes

- Frontend runs on port 8080
- Backend runs on port 5000
- API requests are proxied from `/api` to `http://localhost:5000/api`

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/a7b36fb0-860f-4266-a735-40402ec69451

- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a7b36fb0-860f-4266-a735-40402ec69451) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
