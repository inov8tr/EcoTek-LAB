FROM node:20

WORKDIR /app

# Copy only package manifests
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies but skip postinstall scripts (Prisma)
RUN pnpm install --ignore-scripts

# Copy the rest of the project (includes prisma/)
COPY . .

# Generate Prisma client AFTER schema is available
RUN pnpm exec prisma generate

# For development (edit as needed)
CMD ["pnpm", "dev"]
