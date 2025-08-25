// Configuración de Directus
const DIRECTUS_CONFIG = {
    url: 'https://directus.luispinta.com',
    collection: 'matriz'
};

// Estado global de la aplicación
let appState = {
    user: null,
    token: null,
    socios: [],
    fundadores: [],
    currentFounder: null,
    isLoading: false
};

// Elementos del DOM
const elements = {
    // Login
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    loginLoading: document.getElementById('loginLoading'),
    
    // App principal
    appScreen: document.getElementById('appScreen'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Navegación
    dashboardBtn: document.getElementById('dashboardBtn'),
    foundersBtn: document.getElementById('foundersBtn'),
    dashboardView: document.getElementById('dashboardView'),
    foundersView: document.getElementById('foundersView'),
    
    // Dashboard
    totalSocios: document.getElementById('totalSocios'),
    totalFundadores: document.getElementById('totalFundadores'),
    sociosCompletos: document.getElementById('sociosCompletos'),
    sociosPendientes: document.getElementById('sociosPendientes'),
    foundersStatsContainer: document.getElementById('foundersStatsContainer'),
    
    // Fundadores
    foundersGrid: document.getElementById('foundersGrid'),
    
    // Modales
    sociosModal: document.getElementById('sociosModal'),
    editSocioModal: document.getElementById('editSocioModal'),
    modalFounderName: document.getElementById('modalFounderName'),
    sociosContainer: document.getElementById('sociosContainer'),
    addSocioContainer: document.getElementById('addSocioContainer'),
    completedMessage: document.getElementById('completedMessage'),
    addSocioBtn: document.getElementById('addSocioBtn'),
    
    // Formulario de socio
    socioForm: document.getElementById('socioForm'),
    editModalTitleText: document.getElementById('editModalTitleText'),
    
    // Modal de pendientes
    pendientesCard: document.getElementById('pendientesCard'),
    pendientesModal: document.getElementById('pendientesModal'),
    pendientesContainer: document.getElementById('pendientesContainer'),
    noPendientesMessage: document.getElementById('noPendientesMessage'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Clase para manejar la API de Directus
class DirectusAPI {
    constructor(url) {
        this.baseURL = url;
        this.token = null;
    }

    async login(email, password) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.errors?.[0]?.message || 'Credenciales inválidas');
            }

            this.token = data.data.access_token;
            
            return {
                success: true,
                token: this.token,
                user: data.data.user || null
            };
        } catch (error) {
            console.error('Error en login:', error);
            
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Tiempo de espera agotado. Verifica tu conexión a internet.'
                };
            }
            
            if (error.message.includes('Failed to fetch')) {
                return {
                    success: false,
                    error: 'No se puede conectar al servidor. Verifica la URL de Directus.'
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSocios() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.baseURL}/items/${DIRECTUS_CONFIG.collection}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errors?.[0]?.message || 'Error al obtener socios');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || []
            };
        } catch (error) {
            console.error('Error en getSocios:', error);
            
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Tiempo de espera agotado al cargar datos.'
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSocio(socioData) {
        try {
            const response = await fetch(`${this.baseURL}/items/${DIRECTUS_CONFIG.collection}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(socioData)
            });

            if (!response.ok) {
                throw new Error('Error al crear socio');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateSocio(id, socioData) {
        try {
            const response = await fetch(`${this.baseURL}/items/${DIRECTUS_CONFIG.collection}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(socioData)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar socio');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    logout() {
        this.token = null;
    }
}

// Instancia de la API
const api = new DirectusAPI(DIRECTUS_CONFIG.url);

// Funciones de utilidad
const utils = {
    showLoading() {
        elements.loadingOverlay.classList.remove('hidden');
    },

    hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    },

    showError(message, container = elements.loginError) {
        container.textContent = message;
        container.style.display = 'block';
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    },

    // Función para verificar si un socio está completo
    isCompleto(valor) {
        // Acepta "Sí" como valor principal, pero también variaciones para compatibilidad
        return valor === 'Sí' || valor === 'Si' || valor === 'si' || valor === 'YES' || valor === 'yes';
    },

    formatPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    },

    formatCedula(cedula) {
        if (!cedula) return '';
        return cedula.replace(/(\d{4})(\d{7})/, '$1-$2');
    },

    getUniqueFounders(socios) {
        const fundadores = [...new Set(socios.map(socio => socio.fundador))];
        return fundadores.filter(fundador => fundador && fundador.trim() !== '');
    },

    getSociosByFounder(socios, fundador) {
        return socios.filter(socio => socio.fundador === fundador);
    },

    calculateStats(socios) {
        const total = socios.length;
        const completos = socios.filter(socio => utils.isCompleto(socio.completo)).length;
        const pendientes = total - completos;
        const fundadores = utils.getUniqueFounders(socios);

        return {
            total,
            completos,
            pendientes,
            totalFundadores: fundadores.length,
            fundadores
        };
    }
};

// Manejadores de eventos
const handlers = {
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        elements.loginLoading.style.display = 'block';
        elements.loginError.style.display = 'none';

        const result = await api.login(email, password);

        elements.loginLoading.style.display = 'none';

        if (result.success) {
            console.log('Login exitoso:', result); // Debug log
            appState.token = result.token;
            appState.user = result.user;
            
            // Manejar diferentes estructuras de usuario de Directus
            let displayName = email; // Fallback al email usado para login
            if (result.user) {
                displayName = result.user.first_name || 
                            result.user.name || 
                            result.user.email || 
                            displayName;
            }
            elements.userName.textContent = displayName;
            
            await handlers.loadData();
            handlers.showApp();
        } else {
            utils.showError(result.error);
        }
    },

    async loadData() {
        utils.showLoading();
        
        const result = await api.getSocios();
        
        if (result.success) {
            appState.socios = result.data;
            handlers.updateDashboard();
            handlers.updateFoundersView();
        } else {
            utils.showError('Error al cargar datos: ' + result.error);
        }
        
        utils.hideLoading();
    },

    showApp() {
        elements.loginScreen.classList.add('hidden');
        elements.appScreen.classList.remove('hidden');
    },

    hideApp() {
        elements.appScreen.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
        
        // Reset form
        elements.loginForm.reset();
        elements.loginError.style.display = 'none';
    },

    logout() {
        api.logout();
        appState.user = null;
        appState.token = null;
        appState.socios = [];
        handlers.hideApp();
    },

    showDashboard() {
        elements.dashboardBtn.classList.add('active');
        elements.foundersBtn.classList.remove('active');
        elements.dashboardView.classList.remove('hidden');
        elements.foundersView.classList.add('hidden');
    },

    showFounders() {
        elements.foundersBtn.classList.add('active');
        elements.dashboardBtn.classList.remove('active');
        elements.foundersView.classList.remove('hidden');
        elements.dashboardView.classList.add('hidden');
    },

    updateDashboard() {
        const stats = utils.calculateStats(appState.socios);
        
        elements.totalSocios.textContent = stats.total;
        elements.totalFundadores.textContent = stats.totalFundadores;
        elements.sociosCompletos.textContent = stats.completos;
        elements.sociosPendientes.textContent = stats.pendientes;

        // Actualizar estadísticas por fundador
        handlers.updateFoundersStats(stats.fundadores);
    },

    updateFoundersStats(fundadores) {
        elements.foundersStatsContainer.innerHTML = '';

        fundadores.forEach(fundador => {
            const sociosFundador = utils.getSociosByFounder(appState.socios, fundador);
            const completos = sociosFundador.filter(s => utils.isCompleto(s.completo)).length;
            const progress = (sociosFundador.length / 5) * 100;

            const card = document.createElement('div');
            card.className = 'founder-stat-card';
            
            card.innerHTML = `
                <div class="founder-stat-header">
                    <div class="founder-name">${fundador}</div>
                    <div class="founder-count">${sociosFundador.length}/5</div>
                </div>
                <div class="founder-progress">
                    <div class="founder-progress-bar ${sociosFundador.length >= 5 ? 'complete' : ''}" 
                         style="width: ${Math.min(progress, 100)}%"></div>
                </div>
            `;

            elements.foundersStatsContainer.appendChild(card);
        });
    },

    updateFoundersView() {
        const fundadores = utils.getUniqueFounders(appState.socios);
        elements.foundersGrid.innerHTML = '';

        fundadores.forEach(fundador => {
            const sociosFundador = utils.getSociosByFounder(appState.socios, fundador);
            const progress = (sociosFundador.length / 5) * 100;
            const isCompleted = sociosFundador.length >= 5;

            const card = document.createElement('div');
            card.className = 'founder-card';
            card.onclick = () => handlers.openSociosModal(fundador);
            
            card.innerHTML = `
                <div class="founder-card-header">
                    <div class="founder-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div class="founder-card-title">
                        <h3>${fundador}</h3>
                        <p>Fundador</p>
                    </div>
                </div>
                <div class="founder-card-stats">
                    <div class="founder-card-count">${sociosFundador.length}/5 Socios</div>
                    <div class="founder-card-status ${isCompleted ? 'completed' : 'available'}">
                        ${isCompleted ? 'Completado' : 'Disponible'}
                    </div>
                </div>
                <div class="founder-card-progress">
                    <div class="founder-card-progress-bar ${isCompleted ? 'complete' : ''}" 
                         style="width: ${Math.min(progress, 100)}%"></div>
                </div>
            `;

            elements.foundersGrid.appendChild(card);
        });
    },

    openSociosModal(fundador) {
        appState.currentFounder = fundador;
        const sociosFundador = utils.getSociosByFounder(appState.socios, fundador);
        
        elements.modalFounderName.textContent = fundador;
        elements.sociosContainer.innerHTML = '';

        // Mostrar socios existentes
        sociosFundador.forEach(socio => {
            const socioElement = document.createElement('div');
            socioElement.className = 'socio-item';
            
            socioElement.innerHTML = `
                <div class="socio-info">
                    <div class="socio-name">${socio.nombre}</div>
                    <div class="socio-details">
                        <span><i class="fas fa-id-card"></i> ${utils.formatCedula(socio.cedula)}</span>
                        <span><i class="fas fa-phone"></i> ${utils.formatPhone(socio.telefono)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${socio.direccion}</span>
                    </div>
                </div>
                <div class="socio-actions">
                    <div class="socio-status ${utils.isCompleto(socio.completo) ? 'completo' : 'pendiente'}">
                        ${utils.isCompleto(socio.completo) ? 'Completo' : 'Pendiente'}
                    </div>
                    <button class="edit-socio-btn" onclick="handlers.editSocio(${socio.idsocio})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            `;

            elements.sociosContainer.appendChild(socioElement);
        });

        // Mostrar botón para añadir o mensaje de completado
        if (sociosFundador.length < 5) {
            elements.addSocioContainer.classList.remove('hidden');
            elements.completedMessage.classList.add('hidden');
        } else {
            elements.addSocioContainer.classList.add('hidden');
            elements.completedMessage.classList.remove('hidden');
        }

        elements.sociosModal.classList.remove('hidden');
    },

    closeSociosModal() {
        elements.sociosModal.classList.add('hidden');
        appState.currentFounder = null;
    },

    openAddSocioModal() {
        elements.editModalTitleText.textContent = 'Añadir Nuevo Socio';
        elements.socioForm.reset();
        document.getElementById('socioFundador').value = appState.currentFounder;
        document.getElementById('socioId').value = '';
        elements.editSocioModal.classList.remove('hidden');
    },

    editSocio(socioId) {
        const socio = appState.socios.find(s => s.idsocio === socioId);
        if (!socio) return;

        elements.editModalTitleText.textContent = 'Editar Socio';
        
        document.getElementById('socioNombre').value = socio.nombre || '';
        document.getElementById('socioCedula').value = socio.cedula || '';
        document.getElementById('socioDireccion').value = socio.direccion || '';
        document.getElementById('socioTelefono').value = socio.telefono || '';
        document.getElementById('socioCompleto').value = socio.completo || 'No';
        document.getElementById('socioFundador').value = socio.fundador || '';
        document.getElementById('socioId').value = socio.idsocio;

        elements.editSocioModal.classList.remove('hidden');
    },

    closeEditSocioModal() {
        elements.editSocioModal.classList.add('hidden');
    },

    async handleSocioSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.socioForm);
        const socioData = {
            nombre: formData.get('nombre'),
            cedula: formData.get('cedula'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            completo: formData.get('completo'),
            fundador: formData.get('fundador')
        };

        const socioId = formData.get('id');
        
        utils.showLoading();

        let result;
        if (socioId) {
            // Actualizar socio existente
            result = await api.updateSocio(socioId, socioData);
        } else {
            // Crear nuevo socio
            result = await api.createSocio(socioData);
        }

        utils.hideLoading();

        if (result.success) {
            handlers.closeEditSocioModal();
            await handlers.loadData();
            
            // Sí estamos en el modal de socios, actualizar la vista
            if (appState.currentFounder) {
                handlers.openSociosModal(appState.currentFounder);
            }
        } else {
            utils.showError('Error al guardar socio: ' + result.error);
        }
    },

    // Funciones para el modal de pendientes
    openPendientesModal() {
        const sociosPendientes = appState.socios.filter(socio => !utils.isCompleto(socio.completo));
        
        elements.pendientesContainer.innerHTML = '';
        
        if (sociosPendientes.length === 0) {
            elements.pendientesContainer.classList.add('hidden');
            elements.noPendientesMessage.classList.remove('hidden');
        } else {
            elements.pendientesContainer.classList.remove('hidden');
            elements.noPendientesMessage.classList.add('hidden');
            
            sociosPendientes.forEach(socio => {
                const pendienteElement = document.createElement('div');
                pendienteElement.className = 'pendiente-item';
                
                pendienteElement.innerHTML = `
                    <div class="pendiente-header">
                        <div class="pendiente-name">${socio.nombre}</div>
                        <div class="pendiente-badge">Pendiente</div>
                    </div>
                    
                    <div class="pendiente-fundador">
                        <i class="fas fa-crown"></i> ${socio.fundador}
                    </div>
                    
                    <div class="pendiente-details">
                        <div class="pendiente-detail">
                            <i class="fas fa-id-card"></i>
                            <span>${utils.formatCedula(socio.cedula)}</span>
                        </div>
                        <div class="pendiente-detail">
                            <i class="fas fa-phone"></i>
                            <span>${utils.formatPhone(socio.telefono)}</span>
                        </div>
                        <div class="pendiente-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${socio.direccion}</span>
                        </div>
                    </div>
                    
                    <div class="pendiente-actions">
                        <button class="complete-process-btn" onclick="handlers.completeProcess(${socio.idsocio})">
                            <i class="fas fa-check"></i>
                            Completar Proceso
                        </button>
                        <button class="edit-pendiente-btn" onclick="handlers.editSocio(${socio.idsocio})">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                    </div>
                `;
                
                elements.pendientesContainer.appendChild(pendienteElement);
            });
        }
        
        elements.pendientesModal.classList.remove('hidden');
    },

    closePendientesModal() {
        elements.pendientesModal.classList.add('hidden');
    },

    async completeProcess(socioId) {
        const socio = appState.socios.find(s => s.idsocio === socioId);
        if (!socio) return;

        const confirmMessage = `¿Está seguro de que desea marcar como COMPLETADO el proceso de inscripción de ${socio.nombre}?`;
        
        if (confirm(confirmMessage)) {
            utils.showLoading();
            
            const result = await api.updateSocio(socioId, { completo: 'Sí' });
            
            utils.hideLoading();
            
            if (result.success) {
                await handlers.loadData();
                handlers.openPendientesModal(); // Refrescar el modal
            } else {
                utils.showError('Error al completar proceso: ' + result.error);
            }
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login
    elements.loginForm.addEventListener('submit', handlers.handleLogin);
    
    // Navegación
    elements.dashboardBtn.addEventListener('click', handlers.showDashboard);
    elements.foundersBtn.addEventListener('click', handlers.showFounders);
    elements.logoutBtn.addEventListener('click', handlers.logout);
    
    // Modales
    document.getElementById('closeModal').addEventListener('click', handlers.closeSociosModal);
    document.getElementById('closeEditModal').addEventListener('click', handlers.closeEditSocioModal);
    document.getElementById('closePendientesModal').addEventListener('click', handlers.closePendientesModal);
    elements.addSocioBtn.addEventListener('click', handlers.openAddSocioModal);
    document.getElementById('cancelSocioBtn').addEventListener('click', handlers.closeEditSocioModal);
    
    // Card de pendientes clickeable
    elements.pendientesCard.addEventListener('click', handlers.openPendientesModal);
    
    // Formulario de socio
    elements.socioForm.addEventListener('submit', handlers.handleSocioSubmit);
    
    // Cerrar modales al hacer click fuera
    elements.sociosModal.addEventListener('click', (e) => {
        if (e.target === elements.sociosModal) {
            handlers.closeSociosModal();
        }
    });
    
    elements.editSocioModal.addEventListener('click', (e) => {
        if (e.target === elements.editSocioModal) {
            handlers.closeEditSocioModal();
        }
    });
    
    elements.pendientesModal.addEventListener('click', (e) => {
        if (e.target === elements.pendientesModal) {
            handlers.closePendientesModal();
        }
    });
});

// Hacer funciones disponibles globalmente para onclick
window.handlers = handlers;
