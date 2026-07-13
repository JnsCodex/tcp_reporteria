/**
 * Módulo de Gráficos
 * Renderizado nativo de gráficos SVG sin librerías externas
 */

import { CONFIG, appState } from './config.js';
import { formatCurrency, formatNumber, formatDateShort, getMaxValue } from './utils.js';

// Colores para series de datos
const CHART_COLORS = [
    '#0066CC', // Primary blue
    '#10B981', // Success green
    '#F59E0B', // Warning amber
    '#EF4444', // Danger red
    '#3B82F6', // Info blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4'  // Cyan
];

/**
 * Datos simulados para gráficos
 */
const mockChartData = {
    evolucionMensual: [
        { mes: 'Ene', costo: 420000000, produccion: 380000 },
        { mes: 'Feb', costo: 435000000, produccion: 395000 },
        { mes: 'Mar', costo: 445000000, produccion: 410000 },
        { mes: 'Abr', costo: 458750000, produccion: 425000 }
    ],
    costoPorCultivo: [
        { cultivo: 'Aguacate', valor: 185000000, porcentaje: 40 },
        { cultivo: 'Café', valor: 137500000, porcentaje: 30 },
        { cultivo: 'Cacao', valor: 91750000, porcentaje: 20 },
        { cultivo: 'Palma', valor: 45750000, porcentaje: 10 }
    ],
    costoPorVariedad: [
        { variedad: 'Hass', valor: 125000000 },
        { variedad: 'Variedad 1', valor: 98000000 },
        { variedad: 'Variedad 2', valor: 87500000 },
        { variedad: 'Variedad 3', valor: 65000000 },
        { variedad: 'Variedad 4', valor: 42000000 }
    ],
    distribucionCosechaEmpaque: {
        cosecha: 65,
        empaque: 35
    },
    rankingCostoKg: [
        { item: 'Cacao', valor: 425 },
        { item: 'Aguacate', valor: 385 },
        { item: 'Café', valor: 312 },
        { item: 'Palma', valor: 198 },
        { item: 'Banano', valor: 156 }
    ],
    tendenciaRendimiento: [
        { mes: 'Ene', rendimiento: 42.5 },
        { mes: 'Feb', rendimiento: 43.8 },
        { mes: 'Mar', rendimiento: 44.2 },
        { mes: 'Abr', rendimiento: 45.5 }
    ]
};

/**
 * Inicializa todos los gráficos
 */
export function initCharts() {
    renderEvolucionMensual();
    renderCostoPorCultivo();
    renderCostoPorVariedad();
    renderDistribucionCosechaEmpaque();
    renderRankingCostoKg();
    renderTendenciaRendimiento();
}

/**
 * Gráfico de Evolución Mensual (Líneas combinadas)
 */
export function renderEvolucionMensual() {
    const container = document.getElementById('chart-evolucion');
    if (!container) return;
    
    const data = applyFiltersToData(mockChartData.evolucionMensual);
    const width = container.clientWidth || 600;
    const height = 280;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxCosto = getMaxValue(data, 'costo') * 1.1;
    const maxProduccion = getMaxValue(data, 'produccion') * 1.1;
    
    // Escalas
    const xScale = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
    const yScaleCosto = (value) => padding.top + chartHeight - (value / maxCosto) * chartHeight;
    const yScaleProduccion = (value) => padding.top + chartHeight - (value / maxProduccion) * chartHeight;
    
    // Generar paths
    const costoPoints = data.map((d, i) => `${xScale(i)},${yScaleCosto(d.costo)}`).join(' ');
    const produccionPoints = data.map((d, i) => `${xScale(i)},${yScaleProduccion(d.produccion)}`).join(' ');
    
    // Ejes Y labels
    const yLabels = [0, maxCosto * 0.5, maxCosto].map(v => formatCurrency(v));
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Grid lines -->
            <g class="chart-grid">
                ${[0, 0.5, 1].map((ratio, i) => `
                    <line 
                        x1="${padding.left}" 
                        y1="${padding.top + chartHeight * ratio}" 
                        x2="${width - padding.right}" 
                        y2="${padding.top + chartHeight * ratio}"
                        stroke="#E5E7EB"
                        stroke-dasharray="4,4"
                    />
                `).join('')}
            </g>
            
            <!-- Y Axis -->
            <g class="chart-axis chart-axis-y">
                ${yLabels.map((label, i) => `
                    <text 
                        x="${padding.left - 10}" 
                        y="${padding.top + chartHeight - (i / 2) * chartHeight + 4}"
                        text-anchor="end"
                        class="axis-label"
                    >${label}</text>
                `).join('')}
            </g>
            
            <!-- X Axis -->
            <g class="chart-axis chart-axis-x">
                ${data.map((d, i) => `
                    <text 
                        x="${xScale(i)}" 
                        y="${height - 10}"
                        text-anchor="middle"
                        class="axis-label"
                    >${d.mes}</text>
                `).join('')}
            </g>
            
            <!-- Lines -->
            <polyline 
                points="${costoPoints}" 
                class="chart-line line-costo"
                fill="none"
                stroke="${CHART_COLORS[0]}"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            
            <polyline 
                points="${produccionPoints}" 
                class="chart-line line-produccion"
                fill="none"
                stroke="${CHART_COLORS[1]}"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            
            <!-- Points Costo -->
            ${data.map((d, i) => `
                <circle 
                    cx="${xScale(i)}" 
                    cy="${yScaleCosto(d.costo)}"
                    r="5"
                    class="chart-point point-costo"
                    fill="${CHART_COLORS[0]}"
                    data-tooltip="${formatCurrency(d.costo)}"
                />
            `).join('')}
            
            <!-- Points Producción -->
            ${data.map((d, i) => `
                <circle 
                    cx="${xScale(i)}" 
                    cy="${yScaleProduccion(d.produccion)}"
                    r="5"
                    class="chart-point point-produccion"
                    fill="${CHART_COLORS[1]}"
                    data-tooltip="${formatNumber(d.produccion, 0)} kg"
                />
            `).join('')}
            
            <!-- Legend -->
            <g class="chart-legend">
                <rect x="${width - 180}" y="5" width="12" height="12" rx="2" fill="${CHART_COLORS[0]}"/>
                <text x="${width - 165}" y="15" class="legend-label">Costo Mano de Obra</text>
                
                <rect x="${width - 180}" y="25" width="12" height="12" rx="2" fill="${CHART_COLORS[1]}"/>
                <text x="${width - 165}" y="35" class="legend-label">Producción (kg)</text>
            </g>
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Gráfico de Barras - Costo por Cultivo
 */
export function renderCostoPorCultivo() {
    const container = document.getElementById('chart-cultivo');
    if (!container) return;
    
    const data = applyFiltersToData(mockChartData.costoPorCultivo, 'cultivo');
    const width = container.clientWidth || 300;
    const height = 280;
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = getMaxValue(data, 'valor') * 1.1;
    const barWidth = (chartWidth / data.length) * 0.7;
    const barGap = (chartWidth / data.length) * 0.3;
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Bars -->
            ${data.map((d, i) => {
                const barHeight = (d.valor / maxValue) * chartHeight;
                const x = padding.left + i * (barWidth + barGap) + barGap / 2;
                const y = padding.top + chartHeight - barHeight;
                
                return `
                    <g class="chart-bar-group">
                        <rect 
                            x="${x}" 
                            y="${y}" 
                            width="${barWidth}" 
                            height="${barHeight}"
                            rx="4"
                            class="chart-bar"
                            fill="${CHART_COLORS[i % CHART_COLORS.length]}"
                            data-tooltip="${formatCurrency(d.valor)}"
                        />
                        <text 
                            x="${x + barWidth / 2}" 
                            y="${height - 35}"
                            text-anchor="middle"
                            class="axis-label bar-label"
                        >${d.cultivo.substring(0, 8)}</text>
                        <text 
                            x="${x + barWidth / 2}" 
                            y="${y - 8}"
                            text-anchor="middle"
                            class="bar-value"
                        >${d.porcentaje}%</text>
                    </g>
                `;
            }).join('')}
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Gráfico de Barras Horizontales - Costo por Variedad
 */
export function renderCostoPorVariedad() {
    const container = document.getElementById('chart-variedad');
    if (!container) return;
    
    const data = applyFiltersToData(mockChartData.costoPorVariedad, 'variedad');
    const width = container.clientWidth || 300;
    const height = 280;
    const padding = { top: 20, right: 80, bottom: 20, left: 100 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = getMaxValue(data, 'valor') * 1.1;
    const barHeight = Math.min(24, (chartHeight / data.length) * 0.8);
    const barGap = (chartHeight - barHeight * data.length) / (data.length + 1);
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Bars -->
            ${data.map((d, i) => {
                const barWidth = (d.valor / maxValue) * chartWidth;
                const y = padding.top + i * (barHeight + barGap);
                
                return `
                    <g class="chart-bar-group horizontal">
                        <text 
                            x="${padding.left - 10}" 
                            y="${y + barHeight / 2 + 4}"
                            text-anchor="end"
                            class="axis-label bar-label"
                        >${d.variedad}</text>
                        <rect 
                            x="${padding.left}" 
                            y="${y}" 
                            width="${barWidth}" 
                            height="${barHeight}"
                            rx="4"
                            class="chart-bar"
                            fill="${CHART_COLORS[i % CHART_COLORS.length]}"
                            data-tooltip="${formatCurrency(d.valor)}"
                        />
                        <text 
                            x="${padding.left + barWidth + 8}" 
                            y="${y + barHeight / 2 + 4}"
                            class="bar-value"
                        >${formatCurrency(d.valor).replace('$', '')}</text>
                    </g>
                `;
            }).join('')}
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Gráfico Donut - Distribución Cosecha vs Empaque
 */
export function renderDistribucionCosechaEmpaque() {
    const container = document.getElementById('chart-distribucion');
    if (!container) return;
    
    const data = mockChartData.distribucionCosechaEmpaque;
    const width = container.clientWidth || 300;
    const height = 280;
    const centerX = width / 2;
    const centerY = height / 2 - 20;
    const radius = 80;
    const innerRadius = 50;
    
    // Calcular ángulos
    const cosechaAngle = (data.cosecha / 100) * 360;
    
    // Crear path para arco
    function createArc(startAngle, endAngle, r, innerR) {
        const start = polarToCartesian(centerX, centerY, r, startAngle);
        const end = polarToCartesian(centerX, centerY, r, endAngle);
        const innerStart = polarToCartesian(centerX, centerY, innerR, startAngle);
        const innerEnd = polarToCartesian(centerX, centerY, innerR, endAngle);
        
        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
        
        return `
            M ${start.x} ${start.y}
            A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
            Z
        `;
    }
    
    const cosechaPath = createArc(-90, -90 + cosechaAngle, radius, innerRadius);
    const empaquePath = createArc(-90 + cosechaAngle, 270, radius, innerRadius);
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Donut segments -->
            <path 
                d="${cosechaPath}" 
                fill="${CHART_COLORS[0]}"
                class="donut-segment"
                data-tooltip="Cosecha: ${data.cosecha}%"
            />
            <path 
                d="${empaquePath}" 
                fill="${CHART_COLORS[1]}"
                class="donut-segment"
                data-tooltip="Empaque: ${data.empaque}%"
            />
            
            <!-- Center text -->
            <text 
                x="${centerX}" 
                y="${centerY - 5}"
                text-anchor="middle"
                class="donut-center-label"
            >Total</text>
            <text 
                x="${centerX}" 
                y="${centerY + 15}"
                text-anchor="middle"
                class="donut-center-value"
            >100%</text>
            
            <!-- Legend -->
            <g class="chart-legend" transform="translate(${width/2 - 60}, ${height - 40})">
                <rect x="0" y="0" width="12" height="12" rx="2" fill="${CHART_COLORS[0]}"/>
                <text x="18" y="10" class="legend-label">Cosecha (${data.cosecha}%)</text>
                
                <rect x="70" y="0" width="12" height="12" rx="2" fill="${CHART_COLORS[1]}"/>
                <text x="88" y="10" class="legend-label">Empaque (${data.empaque}%)</text>
            </g>
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Convierte coordenadas polares a cartesianas
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
    };
}

/**
 * Gráfico de Líneas - Ranking Costo/Kg
 */
export function renderRankingCostoKg() {
    const container = document.getElementById('chart-ranking');
    if (!container) return;
    
    const data = applyFiltersToData(mockChartData.rankingCostoKg);
    const width = container.clientWidth || 300;
    const height = 280;
    const padding = { top: 20, right: 60, bottom: 60, left: 50 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = getMaxValue(data, 'valor') * 1.1;
    const barWidth = 40;
    const barGap = (chartWidth - barWidth * data.length) / (data.length + 1);
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Bars verticales -->
            ${data.map((d, i) => {
                const barHeight = (d.valor / maxValue) * chartHeight;
                const x = padding.left + i * (barWidth + barGap) + barGap;
                const y = padding.top + chartHeight - barHeight;
                
                return `
                    <g class="chart-bar-group">
                        <rect 
                            x="${x}" 
                            y="${y}" 
                            width="${barWidth}" 
                            height="${barHeight}"
                            rx="4"
                            class="chart-bar"
                            fill="${CHART_COLORS[3]}"
                            data-tooltip="${formatCurrency(d.valor)}/kg"
                        />
                        <text 
                            x="${x + barWidth / 2}" 
                            y="${height - 35}"
                            text-anchor="middle"
                            class="axis-label bar-label"
                            transform="rotate(-45, ${x + barWidth / 2}, ${height - 35})"
                        >${d.item.substring(0, 10)}</text>
                        <text 
                            x="${x + barWidth / 2}" 
                            y="${y - 8}"
                            text-anchor="middle"
                            class="bar-value"
                        >${d.valor}</text>
                    </g>
                `;
            }).join('')}
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Gráfico de Líneas - Tendencia Rendimiento
 */
export function renderTendenciaRendimiento() {
    const container = document.getElementById('chart-tendencia');
    if (!container) return;
    
    const data = applyFiltersToData(mockChartData.tendenciaRendimiento);
    const width = container.clientWidth || 300;
    const height = 280;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const minValue = Math.min(...data.map(d => d.rendimiento)) * 0.95;
    const maxValue = Math.max(...data.map(d => d.rendimiento)) * 1.05;
    
    const xScale = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
    const yScale = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    
    const points = data.map((d, i) => `${xScale(i)},${yScale(d.rendimiento)}`).join(' ');
    
    // Área bajo la curva
    const areaPoints = `${xScale(0)},${padding.top + chartHeight} ${points} ${xScale(data.length - 1)},${padding.top + chartHeight}`;
    
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            <!-- Grid -->
            <g class="chart-grid">
                ${[0, 0.5, 1].map((ratio) => `
                    <line 
                        x1="${padding.left}" 
                        y1="${padding.top + chartHeight * ratio}" 
                        x2="${width - padding.right}" 
                        y2="${padding.top + chartHeight * ratio}"
                        stroke="#E5E7EB"
                        stroke-dasharray="4,4"
                    />
                `).join('')}
            </g>
            
            <!-- Area -->
            <polygon 
                points="${areaPoints}"
                fill="url(#gradient-rendimiento)"
                opacity="0.3"
            />
            
            <defs>
                <linearGradient id="gradient-rendimiento" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${CHART_COLORS[2]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${CHART_COLORS[2]};stop-opacity:0" />
                </linearGradient>
            </defs>
            
            <!-- Line -->
            <polyline 
                points="${points}" 
                class="chart-line"
                fill="none"
                stroke="${CHART_COLORS[2]}"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            
            <!-- Points -->
            ${data.map((d, i) => `
                <circle 
                    cx="${xScale(i)}" 
                    cy="${yScale(d.rendimiento)}"
                    r="5"
                    class="chart-point"
                    fill="${CHART_COLORS[2]}"
                    data-tooltip="${d.rendimiento} kg/h"
                />
            `).join('')}
            
            <!-- X Axis -->
            <g class="chart-axis chart-axis-x">
                ${data.map((d, i) => `
                    <text 
                        x="${xScale(i)}" 
                        y="${height - 10}"
                        text-anchor="middle"
                        class="axis-label"
                    >${d.mes}</text>
                `).join('')}
            </g>
            
            <!-- Y Axis labels -->
            <g class="chart-axis chart-axis-y">
                <text x="${padding.left - 10}" y="${padding.top + 4}" text-anchor="end" class="axis-label">${maxValue.toFixed(1)}</text>
                <text x="${padding.left - 10}" y="${padding.top + chartHeight/2 + 4}" text-anchor="end" class="axis-label">${((maxValue + minValue)/2).toFixed(1)}</text>
                <text x="${padding.left - 10}" y="${padding.top + chartHeight + 4}" text-anchor="end" class="axis-label">${minValue.toFixed(1)}</text>
            </g>
        </svg>
    `;
    
    container.innerHTML = svg;
    setupChartTooltips(container);
}

/**
 * Aplica filtros a los datos (simulación)
 */
function applyFiltersToData(data, filterKey = null) {
    const filters = appState.filters;
    let filteredData = [...data];
    
    // Simulación simple de filtrado
    if (filters.cultivos && filters.cultivos.length > 0 && filterKey === 'cultivo') {
        filteredData = filteredData.filter(d => filters.cultivos.includes(d.cultivo));
    }
    
    if (filters.variedades && filters.variedades.length > 0 && filterKey === 'variedad') {
        filteredData = filteredData.filter(d => filters.variedades.includes(d.variedad));
    }
    
    return filteredData.length > 0 ? filteredData : data;
}

/**
 * Configura tooltips interactivos para gráficos
 */
function setupChartTooltips(container) {
    const points = container.querySelectorAll('.chart-point, .chart-bar, .donut-segment');
    
    points.forEach(point => {
        point.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.dataset.tooltip;
            if (tooltipText) {
                showTooltip(e, tooltipText);
            }
        });
        
        point.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        point.addEventListener('mousemove', (e) => {
            moveTooltip(e);
        });
    });
}

/**
 * Muestra un tooltip
 */
function showTooltip(event, content) {
    let tooltip = document.getElementById('chart-tooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.className = 'chart-tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = content;
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    moveTooltip(event);
}

/**
 * Mueve el tooltip siguiendo el cursor
 */
function moveTooltip(event) {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        const x = event.clientX + 12;
        const y = event.clientY - 12;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }
}

/**
 * Oculta el tooltip
 */
function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }
}

/**
 * Actualiza todos los gráficos
 */
export function updateAllCharts() {
    renderEvolucionMensual();
    renderCostoPorCultivo();
    renderCostoPorVariedad();
    renderDistribucionCosechaEmpaque();
    renderRankingCostoKg();
    renderTendenciaRendimiento();
}

export default {
    initCharts,
    updateAllCharts,
    renderEvolucionMensual,
    renderCostoPorCultivo,
    renderCostoPorVariedad,
    renderDistribucionCosechaEmpaque,
    renderRankingCostoKg,
    renderTendenciaRendimiento
};
