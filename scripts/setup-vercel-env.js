#!/usr/bin/env node

/**
 * Script para validar que todas las variables de entorno necesarias
 * estén configuradas correctamente.
 * 
 * Uso:
 *   npm run setup:check-env
 *   node scripts/setup-vercel-env.js
 */

const requiredEnvVars = {
    DATABASE_URL: {
        description: 'Connection string de Neon PostgreSQL',
        example: 'postgresql://user:password@host.neon.tech/dbname?sslmode=require',
        validate: (value) => {
            if (!value) return false
            return value.startsWith('postgresql://') || value.startsWith('postgres://')
        }
    },
    NEXTAUTH_SECRET: {
        description: 'Secret para NextAuth (generar con: openssl rand -base64 32)',
        example: 'tu-secret-base64-generado',
        validate: (value) => {
            if (!value) return false
            return value.length >= 32 // Mínimo recomendado
        }
    },
    NEXTAUTH_URL: {
        description: 'URL de la aplicación (ej: https://tu-proyecto.vercel.app)',
        example: 'https://tu-proyecto.vercel.app',
        validate: (value) => {
            if (!value) return false
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        }
    }
}

const optionalEnvVars = {
    BLOB_READ_WRITE_TOKEN: {
        description: 'Token para Vercel Blob Storage (se configura automáticamente al crear Blob Store)',
        example: 'vercel_blob_rw_xxx...',
        validate: (value) => {
            if (!value) return false
            return value.startsWith('vercel_blob_')
        }
    }
}

function checkEnvVars() {
    console.log('🔍 Verificando variables de entorno...\n')

    let hasErrors = false
    let hasWarnings = false

    // Verificar variables requeridas
    console.log('📋 Variables Requeridas:')
    console.log('─'.repeat(60))

    for (const [varName, config] of Object.entries(requiredEnvVars)) {
        const value = process.env[varName]

        if (!value) {
            console.log(`❌ ${varName}`)
            console.log(`   Descripción: ${config.description}`)
            console.log(`   Ejemplo: ${config.example}`)
            console.log(`   Estado: NO CONFIGURADA\n`)
            hasErrors = true
        } else if (!config.validate(value)) {
            console.log(`⚠️  ${varName}`)
            console.log(`   Descripción: ${config.description}`)
            console.log(`   Valor actual: ${maskSensitiveValue(varName, value)}`)
            console.log(`   Estado: VALOR INVÁLIDO\n`)
            hasErrors = true
        } else {
            console.log(`✅ ${varName}`)
            console.log(`   Valor: ${maskSensitiveValue(varName, value)}`)
            console.log(`   Estado: CONFIGURADA CORRECTAMENTE\n`)
        }
    }

    // Verificar variables opcionales
    console.log('\n📋 Variables Opcionales:')
    console.log('─'.repeat(60))

    for (const [varName, config] of Object.entries(optionalEnvVars)) {
        const value = process.env[varName]

        if (!value) {
            console.log(`⚪ ${varName}`)
            console.log(`   Descripción: ${config.description}`)
            console.log(`   Estado: NO CONFIGURADA (opcional)\n`)
            hasWarnings = true
        } else if (!config.validate(value)) {
            console.log(`⚠️  ${varName}`)
            console.log(`   Descripción: ${config.description}`)
            console.log(`   Valor actual: ${maskSensitiveValue(varName, value)}`)
            console.log(`   Estado: VALOR INVÁLIDO\n`)
            hasWarnings = true
        } else {
            console.log(`✅ ${varName}`)
            console.log(`   Valor: ${maskSensitiveValue(varName, value)}`)
            console.log(`   Estado: CONFIGURADA CORRECTAMENTE\n`)
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(60))
    if (hasErrors) {
        console.log('❌ ERROR: Hay variables requeridas faltantes o inválidas')
        console.log('\n💡 Para configurar variables en Vercel:')
        console.log('   1. Ve a tu proyecto en vercel.com')
        console.log('   2. Settings > Environment Variables')
        console.log('   3. Agrega las variables faltantes')
        console.log('\n💡 Para desarrollo local:')
        console.log('   1. Crea un archivo .env.local')
        console.log('   2. Agrega las variables necesarias')
        console.log('   3. O usa: vercel env pull .env.local')
        process.exit(1)
    } else if (hasWarnings) {
        console.log('⚠️  ADVERTENCIA: Algunas variables opcionales no están configuradas')
        console.log('   Esto no impedirá el funcionamiento, pero algunas características pueden no estar disponibles')
        process.exit(0)
    } else {
        console.log('✅ Todas las variables están configuradas correctamente')
        process.exit(0)
    }
}

function maskSensitiveValue(varName, value) {
    // Enmascarar valores sensibles para mostrar en consola
    const sensitiveVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'BLOB_READ_WRITE_TOKEN']

    if (sensitiveVars.includes(varName)) {
        if (varName === 'DATABASE_URL') {
            // Mostrar solo el host y database, ocultar credenciales
            try {
                const url = new URL(value)
                return `${url.protocol}//***:***@${url.host}${url.pathname}${url.search}`
            } catch {
                return '***'
            }
        } else {
            // Mostrar solo los primeros y últimos caracteres
            if (value.length > 20) {
                return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
            }
            return '***'
        }
    }

    return value
}

// Ejecutar validación
checkEnvVars()


