# Sarhni

> *A cozy corner for honest words, anonymous whispers, and everything in between.*

![Sarhni](https://img.shields.io/badge/Sarhni-Confess_Freely-8B5CF6) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## What is Sarhni?

Sarhni is an anonymous messaging and confession platform where users can share a personal profile link to receive anonymous or public messages from friends, followers, or anyone who knows their link. Think of it as a digital mailbox for secrets, compliments, roasts, confessions, and everything people are too shy to say face-to-face.

**Why "Sarhni"?** In Arabic, *Sarhni* means "confide in me" or "open up to me" — exactly what this platform is all about.

---

## Features

| Feature | Description |
|---------|-------------|
| **Anonymous Messages** | Senders can choose to remain anonymous or reveal themselves |
| **Public Messages** | Messages that are visible to everyone on your profile |
| **Reply System** | Respond to messages you receive (anonymously or publicly) |
| **Pin Favorites** | Pin up to 3 special messages to showcase them |
| **Sticker Generation** | Turn any message into a shareable image/sticker |
| **User Discovery** | Search and find other users on the platform |
| **Real-time Updates** | Optimistic UI updates for a snappy experience |
| **Speed Insights** | Powered by Vercel Speed Insights for performance monitoring |
| **Dark Mode Ready** | Built with a beautiful leather-textured dark theme |

---

## Tech Stack

```
Frontend & Backend
├── Next.js 16 (App Router)
├── TypeScript
├── Tailwind CSS
├── Framer Motion (animations)
└── Lucide React (icons)

Database & Auth
├── PostgreSQL
├── Prisma ORM
├── NextAuth.js v5
└── JWT session strategy

Infrastructure
├── Vercel (production hosting)
├── Docker Compose (self-hosted option)
└── Vercel Blob (file storage)
```

---

## Quick Start

Choose your adventure:

### Option A: Local Development (Recommended)

```bash
# Clone the repo
git clone https://github.com/ezzuldinSt/Sarhni.git
cd Sarhni

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Start the dev server
npm run dev
```

Visit `http://localhost:3000` and start confessing!

### Option B: Docker Compose (Full Stack)

```bash
# Clone the repo
git clone https://github.com/ezzuldinSt/Sarhni.git
cd Sarhni

# Create .env file
cp .env.example .env
# Edit with your credentials

# Start everything (app + database)
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop everything
docker compose down
```

### Option C: One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ezzuldinSt/Sarhni)

---

## Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sarhni"
DIRECT_URL="postgresql://user:password@localhost:5432/sarhni"

# App URLs
NEXT_PUBLIC_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Auth
AUTH_SECRET="generate-a-random-secret-here"
AUTH_TRUST_HOST=true

# Admin
OWNER_USERNAME="your-username"

# Vercel Blob (optional, for file uploads)
BLOB_READ_WRITE_TOKEN="your-token-here"
```

**Generate an AUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Database

### Schema Overview

```
User           Message         Reply
├── id         ├── id          ├── id
├── username   ├── content     ├── content
├── password   ├── isPublic    └── messageId
├── role       ├── isAnon
├── isBanned   └── userId
└── pinned
```

### Running Migrations

**Development (create & apply):**
```bash
npm run prisma:migrate:dev -- --name describe_your_changes
```

**Production (apply pending):**
```bash
npm run prisma:migrate:deploy
```

**Generate Prisma Client:**
```bash
npm run prisma:generate
```

---

## Deployment

### Vercel (Production)

The project is configured for Vercel deployment. See `VERCEL_PREVIEW_WORKFLOW.md` for the complete feature development workflow.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker (Self-Hosted)

Build and deploy the Docker image:

```bash
# Build the image
docker build -t sarhni .

# Run the container
docker run -p 3000:3000 --env-file .env sarhni
```

---

## Usage Examples

### Sending a Message

1. Visit a user's profile: `https://sarhni.vercel.app/u/username`
2. Type your message
3. Choose: **Anonymous** or **Public**
4. Hit send!

### Replying to a Message

1. Go to your dashboard
2. Find the message
3. Click reply
4. Choose your visibility setting

### Generating a Sticker

1. Pin a message (up to 3)
2. Click the sticker icon
3. Download and share!

---

## Project Structure

```
sarhni/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── u/                 # User profile pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/
│   ├── actions/          # Server Actions
│   ├── auth.ts           # NextAuth config
│   └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration files
├── public/               # Static assets
└── Dockerfile            # Container image
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linters: `npm run lint`
5. Commit your changes: `git commit -m "Add amazing feature"`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## Development Workflow

This project uses Vercel Preview deployments for testing changes before merging:

1. Create a feature branch
2. Push your changes
3. Vercel automatically builds a preview URL
4. Test the preview deployment
5. Merge when satisfied

See `VERCEL_PREVIEW_WORKFLOW.md` for detailed instructions.

---

## Rate Limiting

To keep things fair and spam-free:

| Action | Limit | Duration |
|--------|-------|----------|
| Send message | 5 | 60 seconds |
| Search users | 20 | 60 seconds |

Based on IP address via the `x-vercel-forwarded-for` header (set by Vercel's infrastructure, cannot be spoofed).

---

## Roadmap

- [ ] Real-time notifications
- [ ] Message reactions
- [ ] Theme customization
- [ ] Mobile apps (React Native)
- [ ] Multi-language support
- [ ] Enhanced moderation tools

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

Built with love and Next.js. Powered by [Vercel](https://vercel.com).

---

<div align="center">

**Made with** :purple_heart: **by ezzuldinSt**

**[Live Demo](https://sarhni.zhrworld.com)** • **[Report a Bug](https://github.com/ezzuldinSt/Sarhni/issues)** • **[Request a Feature](https://github.com/ezzuldinSt/Sarhni/issues)**

</div>
