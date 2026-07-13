/**
 * Módulo de Tabla
 * Maneja renderizado, ordenamiento, búsqueda y paginación
 */

import { CONFIG, appState } from './config.js';
import { formatCurrency, formatNumber, formatDate, debounce, sortBy } from './utils.js';

// Datos simulados para la tabla
const mockTableData = [
    { id: 1, fecha: '2024-04-01', cultivo: 'Aguacate', variedad: 'Hass', centroCosto: 'Finca La Esperanza', kgCosecha: 45000, kgEmpaque: 42000, costoTotal: 18500000, costoKg: 411, rendimiento: 48.5, estado: 'cerrado' },
    { id: 2, fecha: '2024-04-02', cultivo: 'Café', variedad: 'Variedad 1', centroCosto: 'Finca El Roble', kgCosecha: 32000, kgEmpaque: 30500, costoTotal: 12800000, costoKg: 400, rendimiento: 42.3, estado: 'cerrado' },
    { id: 3, fecha: '2024-04-03', cultivo: 'Cacao', variedad: 'Variedad 2', centroCosto: 'Finca San José', kgCosecha: 28000, kgEmpaque: 26800, costoTotal: 11200000, costoKg: 400, rendimiento: 38.7, estado: 'proceso' },
    { id: 4, fecha: '2024-04-04', cultivo: 'Palma', variedad: 'Variedad 3', centroCosto: 'Planta Empaque Norte', kgCosecha: 52000, kgEmpaque: 50200, costoTotal: 9800000, costoKg: 188, rendimiento: 55.2, estado: 'cerrado' },
    { id: 5, fecha: '2024-04-05', cultivo: 'Banano', variedad: 'Variedad 4', centroCosto: 'Planta Empaque Sur', kgCosecha: 68000, kgEmpaque: 65500, costoTotal: 8500000, costoKg: 125, rendimiento: 62.1, estado: 'pendiente' },
    { id: 6, fecha: '2024-04-06', cultivo: 'Aguacate', variedad: 'Hass', centroCosto: 'Finca La Esperanza', kgCosecha: 43500, kgEmpaque: 41200, costoTotal: 17800000, costoKg: 409, rendimiento: 47.8, estado: 'cerrado' },
    { id: 7, fecha: '2024-04-07', cultivo: 'Café', variedad: 'Variedad 1', centroCosto: 'Finca El Roble', kgCosecha: 31500, kgEmpaque: 30000, costoTotal: 12500000, costoKg: 397, rendimiento: 41.9, estado: 'proceso' },
    { id: 8, fecha: '2024-04-08', cultivo: 'Cacao', variedad: 'Variedad 2', centroCosto: 'Finca San José', kgCosecha: 27500, kgEmpaque: 26200, costoTotal: 10900000, costoKg: 396, rendimiento: 38.2, estado: 'cerrado' },
    { id: 9, fecha: '2024-04-09', cultivo: 'Palma', variedad: 'Variedad 3', centroCosto: 'Planta Empaque Norte', kgCosecha: 51000, kgEmpaque: 49500, costoTotal: 9500000, costoKg: 186, rendimiento: 54.8, estado: 'cerrado' },
    { id: 10, fecha: '2024-04-10', cultivo: 'Piña', variedad: 'Variedad 4', centroCosto: 'Planta Empaque Sur', kgCosecha: 72000, kgEmpaque: 69000, costoTotal: 9200000, costoKg: 128, rendimiento: 58.5, estado: 'pendiente' },
    { id: 11, fecha: '2024-04-11', cultivo: 'Aguacate', variedad: 'Hass', centroCosto: 'Finca La Esperanza', kgCosecha: 46000, kgEmpaque: 43500, costoTotal: 19200000, costoKg: 417, rendimiento: 49.2, estado: 'proceso' },
    { id: 12, fecha: '2024-04-12', cultivo: 'Café', variedad: 'Variedad 2', centroCosto: 'Finca El Roble', kgCosecha: 33000, kgEmpaque: 31200, costoTotal: 13100000, costoKg: 397, rendimiento: 43.1, estado: 'cerrado' },
    { id: 13, fecha: '2024-04-13', cultivo: 'Cacao', variedad: 'Variedad 3', centroCosto: 'Finca San José', kgCosecha: 29000, kgEmpaque: 27500, costoTotal: 11500000, costoKg: 397, rendimiento: 39.5, estado: 'cerrado' },
    { id: 14, fecha: '2024-04-14', cultivo: 'Palma', variedad: 'Variedad 4', centroCosto: 'Planta Empaque Norte', kgCosecha: 53000, kgEmpaque: 51000, costoTotal: 10100000, costoKg: 191, rendimiento: 56.0, estado: 'pendiente' },
    { id: 15, fecha: '2024-04-15', cultivo: 'Banano', variedad: 'Hass', centroCosto: 'Planta Empaque Sur', kgCosecha: 69500, kgEmpaque: 67000, costoTotal: 8700000, costoKg: 125, rendimiento: 63.2, estado: 'cerrado' }
];

// Estado local
let currentPage = 1;
let currentSort = { column: 'fecha', order: 'desc' };
let searchQuery = '';
let filteredData = [...mockTableData];

/**
 * Inicializa la tabla
 */
export function initTable() {
    setupSearch();
    setupSorting();
    setupPagination();
    renderTable();
}

/**
 * Configura la búsqueda en la tabla
 */
function setupSearch() {
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            currentPage = 1;
            applyFiltersAndRender();
        }, 300));
    }
}

/**
 * Configura el ordenamiento por columnas
 */
function setupSorting() {
    const headers = document.querySelectorAll('.table-header-sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (!column) return;
            
            // Toggle orden
            if (currentSort.column === column) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.order = 'asc';
            }
            
            // Actualizar UI de headers
            updateSortIndicators();
            
            // Aplicar ordenamiento
            applyFiltersAndRender();
        });
    });
}

/**
 * Actualiza indicadores visuales de ordenamiento
 */
function updateSortIndicators() {
    const headers = document.querySelectorAll('.table-header-sortable');
    headers.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (!icon) return;
        
        if (header.dataset.sort === currentSort.column) {
            icon.style.opacity = '1';
            icon.innerHTML = currentSort.order === 'asc' 
                ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.333v9.334m0-9.334L5.333 6m2.667-2.667L10.667 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12.667V3.333m0 9.334L5.333 10m2.667 2.667L10.667 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else {
            icon.style.opacity = '0.3';
            icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.333v9.334m0-9.334L5.333 6m2.667-2.667L10.667 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
    });
}

/**
 * Configura paginación
 */
function setupPagination() {
    // Los botones se actualizan dinámicamente en renderPagination
}

/**
 * Aplica filtros y renderiza la tabla
 */
function applyFiltersAndRender() {
    // Filtrar por búsqueda
    filteredData = mockTableData.filter(row => {
        if (!searchQuery) return true;
        
        const searchableFields = [
            row.fecha,
            row.cultivo,
            row.variedad,
            row.centroCosto,
            row.estado
        ].map(f => f.toLowerCase());
        
        return searchableFields.some(field => field.includes(searchQuery));
    });
    
    // Filtrar por filtros globales del dashboard
    const filters = appState.filters;
    
    if (filters.cultivos && filters.cultivos.length > 0) {
        filteredData = filteredData.filter(row => filters.cultivos.includes(row.cultivo));
    }
    
    if (filters.variedades && filters.variedades.length > 0) {
        filteredData = filteredData.filter(row => filters.variedades.includes(row.variedad));
    }
    
    if (filters.centrosCosto && filters.centrosCosto.length > 0) {
        filteredData = filteredData.filter(row => filters.centrosCosto.includes(row.centroCosto));
    }
    
    // Ordenar
    filteredData = sortBy(filteredData, currentSort.column, currentSort.order);
    
    renderTable();
    renderPagination();
}

/**
 * Renderiza la tabla completa
 */
export function renderTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    const startIndex = (currentPage - 1) * CONFIG.ui.itemsPerPage;
    const endIndex = startIndex + CONFIG.ui.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr class="table-empty-row">
                <td colspan="10">
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" class="empty-state-icon">
                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M16 16h16M16 24h12M16 32h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <p class="empty-state-title">No hay datos disponibles</p>
                        <p class="empty-state-description">Intenta ajustar los filtros o la búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageData.map(row => `
        <tr class="table-row" data-id="${row.id}">
            <td class="table-cell">${formatDate(new Date(row.fecha))}</td>
            <td class="table-cell">${row.cultivo}</td>
            <td class="table-cell">${row.variedad}</td>
            <td class="table-cell table-cell-truncate" title="${row.centroCosto}">${row.centroCosto}</td>
            <td class="table-cell text-right">${formatNumber(row.kgCosecha, 0)}</td>
            <td class="table-cell text-right">${formatNumber(row.kgEmpaque, 0)}</td>
            <td class="table-cell text-right">${formatCurrency(row.costoTotal)}</td>
            <td class="table-cell text-right">${formatCurrency(row.costoKg)}</td>
            <td class="table-cell text-right">${formatNumber(row.rendimiento, 1)}</td>
            <td class="table-cell">
                <span class="badge badge-${getEstadoClass(row.estado)} badge-sm">
                    ${getEstadoLabel(row.estado)}
                </span>
            </td>
        </tr>
    `).join('');
    
    // Actualizar contador
    updateTableCount();
}

/**
 * Renderiza la paginación
 */
export function renderPagination() {
    const paginationContainer = document.getElementById('table-pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredData.length / CONFIG.ui.itemsPerPage);
    const startIndex = (currentPage - 1) * CONFIG.ui.itemsPerPage + 1;
    const endIndex = Math.min(currentPage * CONFIG.ui.itemsPerPage, filteredData.length);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let pages = [];
    
    // Página anterior
    pages.push({
        type: 'prev',
        disabled: currentPage === 1,
        label: 'Anterior'
    });
    
    // Páginas numéricas
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push({ type: 'number', value: i, active: i === currentPage });
        }
    } else {
        if (currentPage <= 3) {
            for (let i = 1; i <= 3; i++) {
                pages.push({ type: 'number', value: i, active: i === currentPage });
            }
            pages.push({ type: 'ellipsis' });
            pages.push({ type: 'number', value: totalPages });
        } else if (currentPage >= totalPages - 2) {
            pages.push({ type: 'number', value: 1 });
            pages.push({ type: 'ellipsis' });
            for (let i = totalPages - 2; i <= totalPages; i++) {
                pages.push({ type: 'number', value: i, active: i === currentPage });
            }
        } else {
            pages.push({ type: 'number', value: 1 });
            pages.push({ type: 'ellipsis' });
            pages.push({ type: 'number', value: currentPage, active: true });
            pages.push({ type: 'ellipsis' });
            pages.push({ type: 'number', value: totalPages });
        }
    }
    
    // Página siguiente
    pages.push({
        type: 'next',
        disabled: currentPage === totalPages,
        label: 'Siguiente'
    });
    
    paginationContainer.innerHTML = `
        <div class="pagination-info">
            Mostrando <strong>${startIndex}-${endIndex}</strong> de <strong>${filteredData.length}</strong> registros
        </div>
        <div class="pagination-controls">
            ${pages.map(page => {
                if (page.type === 'ellipsis') {
                    return '<span class="pagination-ellipsis">...</span>';
                }
                
                const baseClass = page.type === 'number' 
                    ? `pagination-btn ${page.active ? 'active' : ''}`
                    : `pagination-btn pagination-btn-${page.type}`;
                
                return `
                    <button 
                        class="${baseClass}" 
                        ${page.disabled ? 'disabled' : ''}
                        data-page="${page.type === 'number' ? page.value : (page.type === 'prev' ? currentPage - 1 : currentPage + 1)}"
                    >
                        ${page.label || page.value}
                    </button>
                `;
            }).join('')}
        </div>
    `;
    
    // Agregar event listeners
    const buttons = paginationContainer.querySelectorAll('.pagination-btn:not([disabled])');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page && page >= 1 && page <= totalPages) {
                currentPage = page;
                renderTable();
                renderPagination();
            }
        });
    });
}

/**
 * Actualiza el contador de registros
 */
function updateTableCount() {
    const countElement = document.getElementById('table-count');
    if (countElement) {
        countElement.textContent = `${filteredData.length} registros`;
    }
}

/**
 * Obtiene la clase CSS para el estado
 */
function getEstadoClass(estado) {
    const classes = {
        cerrado: 'success',
        proceso: 'warning',
        pendiente: 'neutral'
    };
    return classes[estado] || 'neutral';
}

/**
 * Obtiene la etiqueta legible para el estado
 */
function getEstadoLabel(estado) {
    const labels = {
        cerrado: 'Cerrado',
        proceso: 'En Proceso',
        pendiente: 'Pendiente'
    };
    return labels[estado] || estado;
}

/**
 * Actualiza la tabla cuando cambian los filtros globales
 */
export function updateTableFromFilters() {
    currentPage = 1;
    applyFiltersAndRender();
}

/**
 * Exporta la tabla a CSV
 */
export function exportTableToCSV() {
    const headers = ['Fecha', 'Cultivo', 'Variedad', 'Centro Costo', 'Kg Cosecha', 'Kg Empaque', 'Costo Total', 'Costo/Kg', 'Rendimiento', 'Estado'];
    const rows = filteredData.map(row => [
        row.fecha,
        row.cultivo,
        row.variedad,
        row.centroCosto,
        row.kgCosecha,
        row.kgEmpaque,
        row.costoTotal,
        row.costoKg,
        row.rendimiento,
        row.estado
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_costos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

export default {
    initTable,
    renderTable,
    renderPagination,
    updateTableFromFilters,
    exportTableToCSV
};
