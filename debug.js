// Archivo de utilidades para testing y depuración
window.DebugUtils = {
    // Probar conexión a Directus
    async testConnection() {
        console.log('🔍 Probando conexión a Directus...');
        const url = getConfig('directus.url', 'https://directus.luispinta.com');
        
        try {
            const response = await fetch(`${url}/server/ping`);
            if (response.ok) {
                console.log('✅ Conexión exitosa a Directus');
                return true;
            } else {
                console.log('❌ Error de conexión:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ Error de red:', error.message);
            return false;
        }
    },

    // Probar login con credenciales
    async testLogin(email, password) {
        console.log('🔍 Probando login...');
        const api = new DirectusAPI(getConfig('directus.url'));
        const result = await api.login(email, password);
        
        if (result.success) {
            console.log('✅ Login exitoso:', result);
        } else {
            console.log('❌ Error de login:', result.error);
        }
        
        return result;
    },

    // Probar obtención de datos
    async testGetData() {
        console.log('🔍 Probando obtención de datos...');
        
        if (!api.token) {
            console.log('❌ No hay token de autenticación');
            return false;
        }

        const result = await api.getSocios();
        
        if (result.success) {
            console.log('✅ Datos obtenidos exitosamente:', result.data.length, 'socios');
            console.log('📊 Muestra de datos:', result.data.slice(0, 3));
        } else {
            console.log('❌ Error al obtener datos:', result.error);
        }
        
        return result;
    },

    // Verificar estructura de datos
    verifyDataStructure(socios) {
        console.log('🔍 Verificando estructura de datos...');
        
        if (!Array.isArray(socios) || socios.length === 0) {
            console.log('❌ No hay datos para verificar');
            return false;
        }

        const sample = socios[0];
        const requiredFields = ['idsocio', 'nombre', 'cedula', 'direccion', 'telefono', 'fundador', 'completo'];
        const missingFields = requiredFields.filter(field => !(field in sample));
        
        if (missingFields.length === 0) {
            console.log('✅ Estructura de datos correcta');
            console.log('📋 Campos encontrados:', Object.keys(sample));
            return true;
        } else {
            console.log('❌ Campos faltantes:', missingFields);
            console.log('📋 Campos encontrados:', Object.keys(sample));
            return false;
        }
    },

    // Mostrar configuración actual
    showConfig() {
        console.log('⚙️ Configuración actual:');
        console.log('🌐 URL Directus:', getConfig('directus.url'));
        console.log('📦 Colección:', getConfig('directus.collection'));
        console.log('👥 Máx. socios por fundador:', getConfig('app.maxSociosPorFundador'));
        console.log('🎨 Debug habilitado:', getConfig('dev.debug'));
    },

    // Limpiar localStorage y recargar
    reset() {
        console.log('🔄 Reiniciando aplicación...');
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    },

    // Simular datos de prueba
    createTestData() {
        return [
            {
                idsocio: 1,
                nombre: 'Juan Pérez',
                cedula: '1234567890',
                direccion: 'Calle Principal 123',
                telefono: '0987654321',
                fundador: 'María García',
                completo: 'Sí'
            },
            {
                idsocio: 2,
                nombre: 'Ana López',
                cedula: '0987654321',
                direccion: 'Avenida Central 456',
                telefono: '0912345678',
                fundador: 'María García',
                completo: 'No'
            },
            {
                idsocio: 3,
                nombre: 'Carlos Ruiz',
                cedula: '1122334455',
                direccion: 'Plaza Mayor 789',
                telefono: '0998877665',
                fundador: 'Pedro Sánchez',
                completo: 'Sí'
            }
        ];
    },

    // Cargar datos de prueba (solo para desarrollo)
    async loadTestData() {
        if (!getConfig('dev.debug', false)) {
            console.log('❌ Datos de prueba solo disponibles en modo debug');
            return;
        }

        console.log('🧪 Cargando datos de prueba...');
        appState.socios = this.createTestData();
        handlers.updateDashboard();
        handlers.updateFoundersView();
        console.log('✅ Datos de prueba cargados');
    }
};

// Función de ayuda para abrir consola de debug
window.openDebugConsole = function() {
    console.log(`
🐛 CONSOLA DE DEBUG - Sistema de Referidos
==========================================

Comandos disponibles:

📊 DebugUtils.showConfig()          - Mostrar configuración
🔍 DebugUtils.testConnection()      - Probar conexión a Directus
🔐 DebugUtils.testLogin(email, pass) - Probar login
📥 DebugUtils.testGetData()         - Probar obtención de datos
✅ DebugUtils.verifyDataStructure()  - Verificar estructura de datos
🧪 DebugUtils.loadTestData()        - Cargar datos de prueba
🔄 DebugUtils.reset()               - Reiniciar aplicación

Estados actuales:
- Token: ${appState.token ? '✅ Presente' : '❌ Ausente'}
- Usuario: ${appState.user ? '✅ Logueado' : '❌ No logueado'}
- Socios: ${appState.socios.length} registros

Para más ayuda, escribe: DebugUtils.showConfig()
    `);
};

// Auto-ejecutar en modo debug
if (getConfig('dev.debug', false)) {
    console.log('🐛 Modo debug activado');
    openDebugConsole();
}
