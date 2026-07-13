/**
 * Módulo de KPIs
 * Calcula y actualiza los indicadores clave de desempeño
 */

import { appState } from './config.js';
import { formatCurrency, formatNumber, calculatePercentChange, getTrendDirection, sumBy, averageBy } from './utils.js';

/**
 * Datos simulados para KPIs (en producción vendrían de una API)
 */
const mockKPIData = {
    costoTotalManoObra: 458750000,
    costoManoObraCosecha: 298500000,
    costoManoObraEmpaque: 160250000,
    kgTotales: 1250000,
    costoPorKgTotal: 367,
    costoPorKgCosecha: 239,
    costoPorKgEmpaque: 128,
    rendimiento: 45.5,
    
    // Datos históricos para tendencias
    historico: {
        costoTotalManoObra: [420000000, 435000000, 445000000, 458750000],
        costoManoObraCosecha: [275000000, 285000000, 292000000, 298500000],
        costoManoObraEmpaque: [145000000, 150000000, 153000000, 160250000],
        kgTotales: [1180000, 1210000, 1235000, 1250000],
        costoPorKgTotal: [356, 360, 361, 367],
        costoPorKgCosecha: [233, 236, 237, 239],
        costoPorKgEmpaque: [123, 124, 124, 128],
        rendimiento: [42.5, 43.8, 44.2, 45.5]
    }
};

/**
 * Calcula todos los KPIs basados en los filtros actuales
 */
export function calculateKPIs() {
    const filters = appState.filters;
    
    // En producción, aquí se haría una llamada a la API con los filtros
    // Por ahora usamos datos simulados con variaciones basadas en filtros
    
    let data = { ...mockKPIData };
    
    // Aplicar factores de filtro (simulación)
    if (filters.cultivos && filters.cultivos.length > 0) {
        const factor = 1 - (filters.cultivos.length * 0.1);
        data = applyFactor(data, factor);
    }
    
    if (filters.variedades && filters.variedades.length > 0) {
        const factor = 1 - (filters.variedades.length * 0.05);
        data = applyFactor(data, factor);
    }
    
    return data;
}

/**
 * Aplica un factor de reducción a los datos numéricos
 */
function applyFactor(data, factor) {
    const result = { ...data };
    
    Object.keys(result).forEach(key => {
        if (typeof result[key] === 'number' && key !== 'historico') {
            result[key] = Math.round(result[key] * factor * 100) / 100;
        }
    });
    
    return result;
}

/**
 * Calcula la tendencia vs periodo anterior
 */
export function calculateTrend(currentData, historicalData) {
    const trends = {};
    
    Object.keys(currentData).forEach(key => {
        if (key !== 'historico' && typeof currentData[key] === 'number') {
            const history = historicalData[key];
            if (history && history.length > 1) {
                const previous = history[history.length - 2];
                const current = currentData[key];
                const change = calculatePercentChange(current, previous);
                
                trends[key] = {
                    value: change,
                    direction: getTrendDirection(change),
                    formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
                };
            } else {
                trends[key] = {
                    value: 0,
                    direction: 'neutral',
                    formatted: '0%'
                };
            }
        }
    });
    
    return trends;
}

/**
 * Genera datos para sparklines
 */
export function generateSparklineData(key, points = 12) {
    const baseData = mockKPIData.historico[key];
    
    if (!baseData) {
        return Array(points).fill(0).map(() => Math.random() * 100);
    }
    
    // Interpolar datos para tener más puntos
    const result = [];
    const step = baseData.length / points;
    
    for (let i = 0; i < points; i++) {
        const index = Math.floor(i * step);
        const nextIndex = Math.min(index + 1, baseData.length - 1);
        const fraction = (i * step) - index;
        
        const interpolated = baseData[index] + (baseData[nextIndex] - baseData[index]) * fraction;
        result.push(interpolated);
    }
    
    return result;
}

/**
 * Renderiza un KPI individual en el DOM
 */
export function renderKPI(elementId, kpiData, trend, sparklineData) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const isCurrency = elementId.includes('costo') || elementId.includes('Costo');
    const isPercentage = elementId.includes('rendimiento') || elementId.includes('Rendimiento');
    
    let formattedValue;
    if (isCurrency) {
        formattedValue = formatCurrency(kpiData);
    } else if (isPercentage) {
        formattedValue = `${formatNumber(kpiData, 1)} kg/h`;
    } else if (kpiData > 1000000) {
        formattedValue = `${(kpiData / 1000000).toFixed(1)}M`;
    } else if (kpiData > 1000) {
        formattedValue = `${(kpiData / 1000).toFixed(0)}K`;
    } else {
        formattedValue = formatNumber(kpiData, 2);
    }
    
    const trendClass = trend.direction === 'up' ? 'badge-success' : 
                       trend.direction === 'down' ? 'badge-danger' : 'badge-neutral';
    
    const trendIcon = trend.direction === 'up' ? '↑' : 
                      trend.direction === 'down' ? '↓' : '→';
    
    // Generar SVG sparkline
    const sparklineSVG = generateSparklineSVG(sparklineData, trend.direction);
    
    element.innerHTML = `
        <div class="kpi-sparkline">
            ${sparklineSVG}
        </div>
        <div class="kpi-content">
            <span class="kpi-label">${getKPILabel(elementId)}</span>
            <span class="kpi-value">${formattedValue}</span>
            <div class="kpi-trend">
                <span class="badge ${trendClass} badge-sm">
                    ${trendIcon} ${trend.formatted}
                </span>
                <span class="kpi-period">vs mes anterior</span>
            </div>
        </div>
    `;
}

/**
 * Genera SVG para sparkline
 */
function generateSparklineSVG(data, trend) {
    if (!data || data.length === 0) return '';
    
    const width = 80;
    const height = 30;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');
    
    const strokeColor = trend === 'up' ? '#10B981' : 
                        trend === 'down' ? '#EF4444' : '#6B7280';
    
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline 
                points="${points}" 
                stroke="${strokeColor}" 
                stroke-width="2" 
                fill="none" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            />
        </svg>
    `;
}

/**
 * Obtiene la etiqueta legible para un KPI
 */
function getKPILabel(elementId) {
    const labels = {
        'kpi-costo-total': 'Costo Total Mano de Obra',
        'kpi-costo-cosecha': 'Costo Mano de Obra Cosecha',
        'kpi-costo-empaque': 'Costo Mano de Obra Empaque',
        'kpi-kg-totales': 'Kg Totales',
        'kpi-costo-kg-total': 'Costo/Kg Total',
        'kpi-costo-kg-cosecha': 'Costo/Kg Cosecha',
        'kpi-costo-kg-empaque': 'Costo/Kg Empaque',
        'kpi-rendimiento': 'Rendimiento'
    };
    
    return labels[elementId] || elementId;
}

/**
 * Actualiza todos los KPIs en el dashboard
 */
export function updateAllKPIs() {
    const kpiData = calculateKPIs();
    const trends = calculateTrend(kpiData, mockKPIData.historico);
    
    // Mapeo de IDs de elementos a claves de datos
    const kpiMapping = {
        'kpi-costo-total': 'costoTotalManoObra',
        'kpi-costo-cosecha': 'costoManoObraCosecha',
        'kpi-costo-empaque': 'costoManoObraEmpaque',
        'kpi-kg-totales': 'kgTotales',
        'kpi-costo-kg-total': 'costoPorKgTotal',
        'kpi-costo-kg-cosecha': 'costoPorKgCosecha',
        'kpi-costo-kg-empaque': 'costoPorKgEmpaque',
        'kpi-rendimiento': 'rendimiento'
    };
    
    Object.entries(kpiMapping).forEach(([elementId, dataKey]) => {
        const sparklineData = generateSparklineData(dataKey);
        renderKPI(elementId, kpiData[dataKey], trends[dataKey], sparklineData);
    });
    
    return kpiData;
}

export default {
    calculateKPIs,
    calculateTrend,
    generateSparklineData,
    renderKPI,
    updateAllKPIs
};
