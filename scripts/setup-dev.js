#!/usr/bin/env node

/**
 * Script de setup automático para desarrollo local
 * Genera .env.local con valores por defecto y configura todo
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env.example')

// Valores por defecto para desarrollo
const defaultEnv = {
    DATABASE_URL: 'postgresql://openshelter:openshelter@localhost:5433/openshelter',
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('base64'),
    NEXTAUTH_URL: 'http://localhost:3000',
    NODE_ENV: 'development'
}

function generateEnvFile() {
    // Si ya existe .env.local, no sobrescribir
    if (fs.existsSync(envPath)) {
        console.log('✅ .env.local ya existe, no se sobrescribirá')
        return
    }

    // Intentar leer .env.example si existe
    let envContent = ''
    if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf-8')
    }

    // Generar contenido del .env.local
    const lines = []
    lines.push('# Configuración generada automáticamente para desarrollo')
    lines.push('# Puedes editar este archivo según tus necesidades\n')

    // Agregar valores por defecto
    Object.entries(defaultEnv).forEach(([key, value]) => {
        lines.push(`${key}=${value}`)
    })

    // Si había .env.example, agregar comentarios adicionales
    if (envContent) {
        lines.push('\n# Variables adicionales del .env.example:')
        envContent.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#') && !line.includes('=')) {
                lines.push(`# ${line}`)
            }
        })
    }

    fs.writeFileSync(envPath, lines.join('\n'))
    console.log('✅ .env.local creado con valores por defecto')
    console.log(`   DATABASE_URL: ${defaultEnv.DATABASE_URL}`)
    console.log(`   NEXTAUTH_SECRET: [generado automáticamente]`)
    console.log(`   NEXTAUTH_URL: ${defaultEnv.NEXTAUTH_URL}`)
}

function checkDocker() {
    const { execSync } = require('child_process')
    try {
        execSync('docker --version', { stdio: 'ignore' })
        execSync('docker-compose --version', { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

function main() {
    console.log('🚀 Configurando OpenShelter para desarrollo...\n')

    // Verificar Docker
    if (!checkDocker()) {
        console.error('❌ Docker y Docker Compose no están instalados')
        console.error('   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop')
        process.exit(1)
    }

    // Generar .env.local
    generateEnvFile()

    console.log('\n✅ Setup completado!')
    console.log('\n📝 Próximos pasos:')
    console.log('   1. Inicia la base de datos: npm run dev:db')
    console.log('   2. Ejecuta migraciones: npm run db:push')
    console.log('   3. Inicia el servidor: npm run dev')
    console.log('\n   O simplemente: npm run dev:up (hace todo automáticamente)')
}

main()

