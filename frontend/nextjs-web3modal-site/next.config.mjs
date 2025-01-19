// next.config.mjs

import dotenv from 'dotenv'

// Load environment variables from ".env" in the root
dotenv.config({ path: './.env' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  },
}

export default nextConfig
