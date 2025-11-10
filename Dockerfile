# Test
FROM node:18-alpine as test-target
ENV NODE_ENV=development
ENV PATH $PATH:/usr/src/app/node_modules/.bin

WORKDIR /usr/src/app

COPY package*.json prisma/ ./

# CI and release builds should use npm ci to fully respect the lockfile.
# Local development may use npm install for opportunistic package updates.
ARG npm_install_command=ci
RUN npm $npm_install_command

COPY . .

# Build
FROM test-target as build-target
ENV NODE_ENV=production

# Accept build arguments for environment variables needed at build time
ARG OPENAI_API_KEY
ARG ANTHROPIC_API_KEY
ARG OPENROUTER_API_KEY
ARG AZURE_OPENAI_API_KEY
ARG AZURE_OPENAI_API_ENDPOINT
ARG ELEVENLABS_API_KEY
ARG PRODIA_API_KEY
ARG GOOGLE_CLOUD_API_KEY
ARG GOOGLE_CSE_ID
ARG MONGODB_PRISMA_URL
ARG MONGODB_URL_NON_POOLING
ARG PINECONE_API_KEY
ARG PINECONE_ASSISTANT_NAME

# Set environment variables for the build
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENV AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY
ENV AZURE_OPENAI_API_ENDPOINT=$AZURE_OPENAI_API_ENDPOINT
ENV ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY
ENV PRODIA_API_KEY=$PRODIA_API_KEY
ENV GOOGLE_CLOUD_API_KEY=$GOOGLE_CLOUD_API_KEY
ENV GOOGLE_CSE_ID=$GOOGLE_CSE_ID
ENV MONGODB_PRISMA_URL=$MONGODB_PRISMA_URL
ENV MONGODB_URL_NON_POOLING=$MONGODB_URL_NON_POOLING
ENV PINECONE_API_KEY=$PINECONE_API_KEY
ENV PINECONE_ASSISTANT_NAME=$PINECONE_ASSISTANT_NAME

# Use build tools, installed as development packages, to produce a release build.
RUN npm run build

# Reduce installed packages to production-only.
RUN npm prune --production

# Archive
FROM node:18-alpine as archive-target
ENV NODE_ENV=production
ENV PATH $PATH:/usr/src/app/node_modules/.bin

WORKDIR /usr/src/app

# Include only the release build and production packages.
COPY --from=build-target /usr/src/app/node_modules node_modules
COPY --from=build-target /usr/src/app/.next .next
COPY --from=build-target /usr/src/app/public public

# Expose port 3000 for the application to listen on
EXPOSE 3000

CMD ["next", "start"]
