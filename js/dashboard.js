/**
 * Dashboard Principal - Orquestador
 * Inicializa y coordina todos los módulos del dashboard
 */

import { updateAppState } from './config.js';
import { initFilters, applyFilters } from './filters.js';
import { updateAllKPIs } from './kpis.js';
import { initCharts, updateAllCharts } from './charts.js';
import { initTable, updateTableFromFilters, exportTableToCSV } from './table.js';

// Estado de inicialización
let isInitialized = false;

/**
 * Inicializa el dashboard completo
 */
export function initDashboard() {
    if (isInitialized) {
        console.warn('El dashboard ya está inicializado');
        return;
    }

    console.log('Inicializando dashboard...');
    
    // Mostrar estado de carga inicial
    showInitialLoading();
    
    // Simular carga de datos asíncrona
    setTimeout(() => {
        // Inicializar todos los módulos
        initFilters();
        initCharts();
        initTable();
        
        // Actualizar KPIs iniciales
        updateAllKPIs();
        
        // Ocultar loading y mostrar contenido
        hideInitialLoading();
        
        // Configurar event listeners globales
        setupGlobalListeners();
        
        isInitialized = true;
        
        console.log('Dashboard inicializado correctamente');
        
        // Disparar evento de inicialización completa
        window.dispatchEvent(new CustomEvent('dashboard:ready'));
    }, 800);
}

/**
 * Refresca todo el dashboard (llamado desde filtros)
 */
export function refreshDashboard() {
    if (!isInitialized) return;
    
    console.log('Refrescando dashboard...');
    
    // Actualizar KPIs
    updateAllKPIs();
    
    // Actualizar gráficos
    updateAllCharts();
    
    // Actualizar tabla
    updateTableFromFilters();
    
    // Disparar evento de actualización
    window.dispatchEvent(new CustomEvent('dashboard:refreshed'));
}

/**
 * Configura event listeners globales
 */
function setupGlobalListeners() {
    // Botón de exportar
    const btnExport = document.getElementById('btn-exportar');
    if (btnExport) {
        btnExport.addEventListener('click', handleExport);
    }
    
    // Botón de actualizar
    const btnRefresh = document.getElementById('btn-actualizar');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            showLoadingState();
            setTimeout(() => {
                refreshDashboard();
                hideLoadingState();
            }, 500);
        });
    }
    
    // Toggle sidebar en móvil
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
    
    // Cerrar sidebar al hacer click fuera en móvil
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            if (!sidebar.contains(e.target) && !btnToggleSidebar.contains(e.target)) {
                sidebar.classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        }
    });
    
    // Handle resize para gráficos responsive
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateAllCharts();
        }, 250);
    });
}

/**
 * Maneja la exportación de datos
 */
function handleExport() {
    const format = prompt('Selecciona formato:\n1. CSV\n2. JSON\n\nIngresa el número de opción:', '1');
    
    if (format === '1') {
        exportTableToCSV();
        showToast('Reporte CSV exportado exitosamente', 'success');
    } else if (format === '2') {
        exportToJSON();
        showToast('Reporte JSON exportado exitosamente', 'success');
    }
}

/**
 * Exporta datos a JSON
 */
function exportToJSON() {
    // En producción, esto obtendría los datos reales del estado
    const data = {
        fechaExportacion: new Date().toISOString(),
        filtros: JSON.parse(localStorage.getItem('agroBI_filters') || '{}'),
        reporte: 'Costos de Mano de Obra'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_costos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

/**
 * Muestra toast notification
 */
function showToast(message, type = 'info') {
    // Remover toasts existentes
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-notification`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Animación de entrada
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    
    // Auto-remove después de 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateY(-100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Obtiene icono para toast según tipo
 */
function getToastIcon(type) {
    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5L13.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4m0 4h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l7 12H3L10 3z" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v4m0 4h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 8v6m0-8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };
    return icons[type] || icons.info;
}

/**
 * Muestra estado de carga inicial
 */
function showInitialLoading() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '0.6';
        mainContent.style.pointerEvents = 'none';
    }
}

/**
 * Oculta estado de carga inicial
 */
function hideInitialLoading() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.transition = 'opacity 0.3s ease';
        mainContent.style.opacity = '1';
        mainContent.style.pointerEvents = 'auto';
    }
}

/**
 * Muestra estado de carga durante actualizaciones
 */
function showLoadingState() {
    const kpisContainer = document.getElementById('kpis-container');
    if (kpisContainer) {
        kpisContainer.style.transition = 'opacity 0.2s ease';
        kpisContainer.style.opacity = '0.5';
    }
}

/**
 * Oculta estado de carga
 */
function hideLoadingState() {
    const kpisContainer = document.getElementById('kpis-container');
    if (kpisContainer) {
        kpisContainer.style.opacity = '1';
    }
}

/**
 * Obtiene el estado actual del dashboard
 */
export function getDashboardState() {
    return {
        isInitialized,
        filters: JSON.parse(localStorage.getItem('agroBI_filters') || '{}'),
        lastUpdate: new Date().toISOString()
    };
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

export default {
    initDashboard,
    refreshDashboard,
    getDashboardState
};
