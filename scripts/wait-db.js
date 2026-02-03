#!/usr/bin/env node

/**
 * Espera a que PostgreSQL esté listo antes de continuar
 */

const { execSync } = require('child_process')

function waitForPostgres(maxAttempts = 30) {
    console.log('⏳ Esperando a que PostgreSQL esté listo...')

    for (let i = 0; i < maxAttempts; i++) {
        try {
            execSync('docker exec openshelter-db-dev pg_isready -U openshelter -p 5432', {
                stdio: 'ignore'
            })
            console.log('✅ PostgreSQL está listo!')
            return true
        } catch {
            process.stdout.write('.')
            // Esperar 1 segundo
            const start = Date.now()
            while (Date.now() - start < 1000) { }
        }
    }

    console.log('\n❌ PostgreSQL no respondió a tiempo')
    return false
}

if (!waitForPostgres()) {
    process.exit(1)
}

