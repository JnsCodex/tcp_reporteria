/**
 * Configuración Global del Dashboard
 * Centraliza constantes, colores y estado inicial
 */

export const CONFIG = {
    // Colores del sistema (coinciden con CSS variables)
    colors: {
        primary: '#0066CC',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827'
        }
    },

    // Endpoints simulados (en producción serían APIs reales)
    endpoints: {
        kpis: '/api/kpis',
        charts: '/api/charts',
        table: '/api/data'
    },

    // Constantes de UI
    ui: {
        animationDuration: 300,
        debounceDelay: 300,
        itemsPerPage: 10,
        dateFormat: 'es-ES',
        currencyFormat: 'es-CO',
        maxSparklinePoints: 30
    },

    // Estado inicial de filtros
    initialFilters: {
        cultivos: [],
        variedades: [],
        centrosCosto: [],
        fechaInicio: null,
        fechaFin: null
    },

    // Opciones disponibles para filtros
    filterOptions: {
        cultivos: ['Aguacate', 'Café', 'Cacao', 'Palma', 'Banano', 'Piña'],
        variedades: ['Hass', 'Variedad 1', 'Variedad 2', 'Variedad 3', 'Variedad 4'],
        centrosCosto: ['Finca La Esperanza', 'Finca El Roble', 'Finca San José', 'Planta Empaque Norte', 'Planta Empaque Sur']
    }
};

// Estado global de la aplicación
export let appState = {
    filters: { ...CONFIG.initialFilters },
    data: null,
    isLoading: false,
    lastUpdate: null
};

export function updateAppState(newState) {
    appState = { ...appState, ...newState };
    return appState;
}

export default CONFIG;
