/**
 * Módulo de Filtros
 * Maneja la lógica de selección, aplicación y persistencia de filtros
 */

import { CONFIG, appState, updateAppState } from './config.js';
import { getElement, getElements, debounce } from './utils.js';
import { refreshDashboard } from './dashboard.js';

// Estado local de filtros
let localFilters = { ...CONFIG.initialFilters };

/**
 * Inicializa los event listeners para los filtros
 */
export function initFilters() {
    setupMultiselects();
    setupDatePickers();
    setupFilterButtons();
    loadPersistedFilters();
}

/**
 * Configura los selectores múltiples (cultivos, variedades, centros de costo)
 */
function setupMultiselects() {
    const multiselects = [
        { id: 'cultivos', options: CONFIG.filterOptions.cultivos },
        { id: 'variedades', options: CONFIG.filterOptions.variedades },
        { id: 'centros-costo', options: CONFIG.filterOptions.centrosCosto, key: 'centrosCosto' }
    ];

    multiselects.forEach(({ id, options, key }) => {
        const container = getElement(`#${id}-multiselect`);
        if (!container) return;

        // Crear chips iniciales
        renderSelectedChips(container, id, key || id);

        // Event listener para abrir/cerrar dropdown
        const trigger = container.querySelector('.multiselect-trigger');
        if (trigger) {
            trigger.addEventListener('click', () => {
                const dropdown = container.querySelector('.multiselect-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('active');
                }
            });

            // Cerrar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    const dropdown = container.querySelector('.multiselect-dropdown');
                    if (dropdown) {
                        dropdown.classList.remove('active');
                    }
                }
            });
        }

        // Configurar opciones del dropdown
        const dropdown = container.querySelector('.multiselect-options');
        if (dropdown) {
            dropdown.innerHTML = '';
            options.forEach(option => {
                const label = document.createElement('label');
                label.className = 'multiselect-option';
                label.innerHTML = `
                    <input type="checkbox" value="${option}" data-filter="${key || id}">
                    <span class="checkbox-custom"></span>
                    <span class="option-text">${option}</span>
                `;
                dropdown.appendChild(label);
            });

            // Event listeners para checkboxes
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    handleMultiselectChange(e, key || id);
                });
            });
        }
    });
}

/**
 * Renderiza los chips seleccionados
 */
function renderSelectedChips(container, filterKey, stateKey) {
    const chipsContainer = container.querySelector('.selected-chips');
    if (!chipsContainer) return;

    const selectedValues = localFilters[stateKey] || [];
    
    if (selectedValues.length === 0) {
        chipsContainer.innerHTML = '<span class="placeholder-text">Seleccionar...</span>';
        return;
    }

    chipsContainer.innerHTML = '';
    selectedValues.forEach(value => {
        const chip = document.createElement('div');
        chip.className = 'chip chip-removable';
        chip.innerHTML = `
            <span>${value}</span>
            <button type="button" class="chip-remove" data-value="${value}" data-filter="${stateKey}">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        const removeBtn = chip.querySelector('.chip-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFilterValue(stateKey, value);
        });
        
        chipsContainer.appendChild(chip);
    });
}

/**
 * Maneja cambios en multiselect
 */
function handleMultiselectChange(e, filterKey) {
    const value = e.target.value;
    const isChecked = e.target.checked;

    if (isChecked) {
        addFilterValue(filterKey, value);
    } else {
        removeFilterValue(filterKey, value);
    }

    // Actualizar UI del contenedor padre
    const container = e.target.closest('.multiselect-container');
    if (container) {
        renderSelectedChips(container, filterKey, filterKey);
    }
}

/**
 * Agrega un valor al filtro
 */
export function addFilterValue(filterKey, value) {
    if (!localFilters[filterKey]) {
        localFilters[filterKey] = [];
    }
    
    if (!localFilters[filterKey].includes(value)) {
        localFilters[filterKey] = [...localFilters[filterKey], value];
        persistFilters();
    }
}

/**
 * Remueve un valor del filtro
 */
export function removeFilterValue(filterKey, value) {
    if (localFilters[filterKey]) {
        localFilters[filterKey] = localFilters[filterKey].filter(v => v !== value);
        
        // Actualizar checkbox correspondiente
        const checkbox = document.querySelector(`input[type="checkbox"][value="${value}"][data-filter="${filterKey}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        persistFilters();
    }
}

/**
 * Configura los date pickers
 */
function setupDatePickers() {
    const fechaInicio = getElement('#fecha-inicio');
    const fechaFin = getElement('#fecha-fin');

    if (fechaInicio) {
        fechaInicio.addEventListener('change', (e) => {
            localFilters.fechaInicio = e.target.value;
            persistFilters();
        });
    }

    if (fechaFin) {
        fechaFin.addEventListener('change', (e) => {
            localFilters.fechaFin = e.target.value;
            persistFilters();
        });
    }
}

/**
 * Configura botones de aplicar y limpiar filtros
 */
function setupFilterButtons() {
    const btnApply = getElement('#btn-aplicar-filtros');
    const btnClear = getElement('#btn-limpiar-filtros');

    if (btnApply) {
        btnApply.addEventListener('click', () => {
            applyFilters();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            clearFilters();
        });
    }
}

/**
 * Aplica los filtros actuales y refresca el dashboard
 */
export function applyFilters() {
    updateAppState({ filters: { ...localFilters } });
    persistFilters();
    
    // Animación de carga
    showLoadingState();
    
    // Refrescar dashboard con debounce
    setTimeout(() => {
        refreshDashboard();
        hideLoadingState();
    }, 300);
}

/**
 * Limpia todos los filtros
 */
export function clearFilters() {
    localFilters = { ...CONFIG.initialFilters };
    
    // Resetear UI
    resetMultiselectsUI();
    resetDatePickersUI();
    
    updateAppState({ filters: { ...localFilters } });
    persistFilters();
    
    showLoadingState();
    
    setTimeout(() => {
        refreshDashboard();
        hideLoadingState();
    }, 300);
}

/**
 * Resetea UI de multiselects
 */
function resetMultiselectsUI() {
    const containers = getElements('.multiselect-container');
    containers.forEach(container => {
        const chipsContainer = container.querySelector('.selected-chips');
        if (chipsContainer) {
            chipsContainer.innerHTML = '<span class="placeholder-text">Seleccionar...</span>';
        }
        
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        const dropdown = container.querySelector('.multiselect-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    });
}

/**
 * Resetea UI de date pickers
 */
function resetDatePickersUI() {
    const fechaInicio = getElement('#fecha-inicio');
    const fechaFin = getElement('#fecha-fin');
    
    if (fechaInicio) fechaInicio.value = '';
    if (fechaFin) fechaFin.value = '';
}

/**
 * Muestra estado de carga
 */
function showLoadingState() {
    const kpisContainer = getElement('#kpis-container');
    if (kpisContainer) {
        kpisContainer.style.opacity = '0.5';
        kpisContainer.style.pointerEvents = 'none';
    }
}

/**
 * Oculta estado de carga
 */
function hideLoadingState() {
    const kpisContainer = getElement('#kpis-container');
    if (kpisContainer) {
        kpisContainer.style.opacity = '1';
        kpisContainer.style.pointerEvents = 'auto';
    }
}

/**
 * Persiste filtros en localStorage
 */
function persistFilters() {
    try {
        localStorage.setItem('agroBI_filters', JSON.stringify(localFilters));
    } catch (e) {
        console.warn('No se pudo persistir los filtros:', e);
    }
}

/**
 * Carga filtros persistidos
 */
function loadPersistedFilters() {
    try {
        const saved = localStorage.getItem('agroBI_filters');
        if (saved) {
            const parsed = JSON.parse(saved);
            localFilters = { ...localFilters, ...parsed };
            
            // Restaurar UI
            restoreFiltersUI();
            
            // Aplicar filtros cargados
            updateAppState({ filters: { ...localFilters } });
        }
    } catch (e) {
        console.warn('No se pudieron cargar los filtros guardados:', e);
    }
}

/**
 * Restaura UI con filtros guardados
 */
function restoreFiltersUI() {
    // Restaurar multiselects
    Object.entries(localFilters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
            const container = getElement(`#${key}-multiselect`);
            if (container) {
                // Marcar checkboxes
                values.forEach(value => {
                    const checkbox = container.querySelector(`input[type="checkbox"][value="${value}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                
                // Renderizar chips
                renderSelectedChips(container, key, key);
            }
        }
    });
    
    // Restaurar fechas
    if (localFilters.fechaInicio) {
        const fechaInicio = getElement('#fecha-inicio');
        if (fechaInicio) fechaInicio.value = localFilters.fechaInicio;
    }
    
    if (localFilters.fechaFin) {
        const fechaFin = getElement('#fecha-fin');
        if (fechaFin) fechaFin.value = localFilters.fechaFin;
    }
}

/**
 * Obtiene los filtros actuales
 */
export function getCurrentFilters() {
    return { ...localFilters };
}

export default {
    initFilters,
    applyFilters,
    clearFilters,
    addFilterValue,
    removeFilterValue,
    getCurrentFilters
};
