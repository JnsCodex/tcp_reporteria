/**
 * Utilidades Generales
 * Funciones helper para formateo, DOM y operaciones comunes
 */

import { CONFIG } from './config.js';

/**
 * Formatea un número como moneda
 */
export function formatCurrency(value, currency = 'COP') {
    return new Intl.NumberFormat(CONFIG.ui.currencyFormat, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat(CONFIG.ui.dateFormat, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formatea una fecha
 */
export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Intl.DateTimeFormat(CONFIG.ui.dateFormat, { ...defaultOptions, ...options }).format(new Date(date));
}

/**
 * Formatea fecha corta (MMM DD)
 */
export function formatDateShort(date) {
    return new Intl.DateTimeFormat(CONFIG.ui.dateFormat, {
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

/**
 * Genera un ID único
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce para funciones que se ejecutan frecuentemente
 */
export function debounce(func, wait = CONFIG.ui.debounceDelay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para limitar ejecución
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Obtiene un elemento del DOM de forma segura
 */
export function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Elemento no encontrado: ${selector}`);
    }
    return element;
}

/**
 * Obtiene múltiples elementos del DOM
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Crea un elemento DOM con atributos
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    });

    if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }

    return element;
}

/**
 * Inserta HTML de forma segura
 */
export function setInnerHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Calcula el porcentaje de cambio entre dos valores
 */
export function calculatePercentChange(current, previous) {
    if (previous === 0 || previous === null || previous === undefined) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
}

/**
 * Determina si un valor es positivo o negativo para tendencias
 */
export function getTrendDirection(value) {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'neutral';
}

/**
 * Clona un objeto profundamente
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Verifica si un objeto está vacío
 */
export function isEmpty(obj) {
    return obj === null || obj === undefined || 
           (typeof obj === 'object' && Object.keys(obj).length === 0);
}

/**
 * Obtiene el valor máximo de un array de objetos
 */
export function getMaxValue(data, key) {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item[key]));
}

/**
 * Obtiene el valor mínimo de un array de objetos
 */
export function getMinValue(data, key) {
    if (!data || data.length === 0) return 0;
    return Math.min(...data.map(item => item[key]));
}

/**
 * Agrupa datos por una clave específica
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Ordena un array de objetos
 */
export function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (typeof aVal === 'string') {
            return order === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }
        
        return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
}

/**
 * Filtra un array por múltiples criterios
 */
export function filterBy(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return true;
            }
            
            if (Array.isArray(value)) {
                return value.includes(item[key]);
            }
            
            return item[key] === value;
        });
    });
}

/**
 * Suma los valores de una clave específica
 */
export function sumBy(array, key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
}

/**
 * Promedio de valores de una clave
 */
export function averageBy(array, key) {
    if (!array || array.length === 0) return 0;
    return sumBy(array, key) / array.length;
}

export default {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateShort,
    generateId,
    debounce,
    throttle,
    getElement,
    getElements,
    createElement,
    setInnerHTML,
    calculatePercentChange,
    getTrendDirection,
    deepClone,
    isEmpty,
    getMaxValue,
    getMinValue,
    groupBy,
    sortBy,
    filterBy,
    sumBy,
    averageBy
};
