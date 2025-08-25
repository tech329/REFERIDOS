// Configuración de la aplicación
window.AppConfig = {
    // Configuración de Directus
    directus: {
        url: 'https://directus.luispinta.com',
        collection: 'matriz',
        // Timeout para requests en millisegundos
        timeout: 10000
    },
    
    // Configuración de la aplicación
    app: {
        // Número máximo de socios por fundador
        maxSociosPorFundador: 5,
        
        // Título de la aplicación
        title: 'Sistema de Referidos',
        
        // Valores para el campo "completo"
        estadosCompleto: {
            completo: ['Sí', 'Si', 'si', 'YES', 'yes', '1', 'true'],
            incompleto: ['No', 'no', 'NO', '0', 'false']
        },
        
        // Configuración de formatos
        formatos: {
            // Formato para cédula: XXXX-XXXXXXX
            cedula: {
                pattern: /(\d{4})(\d{7})/,
                format: '$1-$2'
            },
            // Formato para teléfono: XXXX-XXX-XXXX
            telefono: {
                pattern: /(\d{4})(\d{3})(\d{4})/,
                format: '$1-$2-$3'
            }
        },
        
        // Configuración de validación
        validacion: {
            // Longitud mínima para campos de texto
            longitudMinima: {
                nombre: 3,
                direccion: 5,
                telefono: 10,
                cedula: 10
            },
            
            // Patrones de validación
            patrones: {
                telefono: /^\d{10,11}$/,
                cedula: /^\d{10,11}$/,
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
        }
    },
    
    // Configuración de UI
    ui: {
        // Tiempo para mostrar mensajes de error (ms)
        tiempoMensajeError: 5000,
        
        // Tiempo para auto-refresh de datos (ms) - 0 para deshabilitar
        autoRefresh: 0,
        
        // Animaciones
        animaciones: {
            duracionModal: 300,
            duracionFade: 200
        },
        
        // Paginación (para futuras implementaciones)
        paginacion: {
            itemsPorPagina: 50
        }
    },
    
    // Configuración de desarrollo
    dev: {
        // Habilitar logs en consola
        debug: true,
        
        // Datos de prueba para desarrollo
        datosDemo: false
    }
};

// Función para obtener configuración con fallback
window.getConfig = function(path, defaultValue = null) {
    const keys = path.split('.');
    let current = window.AppConfig;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }
    
    return current;
};

// Función para verificar si un proceso está completo
window.isCompleto = function(valor) {
    const estadosCompleto = getConfig('app.estadosCompleto.completo', ['Sí', 'Si', 'si']);
    return estadosCompleto.includes(valor);
};

// Función para log de desarrollo
window.devLog = function(...args) {
    if (getConfig('dev.debug', false)) {
        console.log('[DEBUG]', ...args);
    }
};

// Función para formatear valores según configuración
window.formatValue = function(tipo, valor) {
    if (!valor) return '';
    
    const formato = getConfig(`app.formatos.${tipo}`);
    if (formato && formato.pattern && formato.format) {
        return valor.replace(formato.pattern, formato.format);
    }
    
    return valor;
};

// Función para validar campos según configuración
window.validateField = function(tipo, valor) {
    const patron = getConfig(`app.validacion.patrones.${tipo}`);
    const longitudMinima = getConfig(`app.validacion.longitudMinima.${tipo}`, 0);
    
    if (!valor || valor.length < longitudMinima) {
        return {
            valido: false,
            mensaje: `El campo debe tener al menos ${longitudMinima} caracteres`
        };
    }
    
    if (patron && !patron.test(valor)) {
        return {
            valido: false,
            mensaje: `El formato del ${tipo} no es válido`
        };
    }
    
    return { valido: true };
};
