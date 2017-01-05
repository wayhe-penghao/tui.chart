/**
 * @fileoverview Map chart.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var ChartBase = require('./chartBase');
var mapManager = require('../factories/mapManager');
var MapChartMapModel = require('./mapChartMapModel');
var ColorSpectrum = require('./colorSpectrum');
var MapChartDataProcessor = require('../models/data/mapChartDataProcessor');

var MapChart = tui.util.defineClass(ChartBase, /** @lends MapChart.prototype */ {
    /**
     * Map chart.
     * @constructs MapChart
     * @extends ChartBase
     * @param {Array.<Array>} rawData raw data
     * @param {object} theme chart theme
     * @param {object} options chart options
     */
    init: function(rawData, theme, options) {
        /**
         * class name
         * @type {string}
         */
        this.className = 'tui-map-chart';

        options.map = mapManager.get(options.map);
        options.tooltip = options.tooltip || {};
        options.legend = options.legend || {};

        ChartBase.call(this, {
            rawData: rawData,
            theme: theme,
            options: options,
            DataProcessor: MapChartDataProcessor
        });
    },

    /**
     * Add components.
     * @override
     * @private
     */
    addComponents: function() {
        var options = this.options;
        var seriesTheme = this.theme.series[this.chartType];
        var colorSpectrum = new ColorSpectrum(seriesTheme.startColor, seriesTheme.endColor);
        var mapModel = new MapChartMapModel(this.dataProcessor, this.options.map);

        options.legend = options.legend || {};

        if (options.legend.visible) {
            this.componentManager.register('legend', {
                colorSpectrum: colorSpectrum,
                classType: 'spectrumLegend'
            });
        }

        this.componentManager.register('tooltip', tui.util.extend({
            mapModel: mapModel
        }, this.makeTooltipData('mapChartTooltip')));

        this.componentManager.register('mapSeries', {
            libType: options.libType,
            chartType: options.chartType,
            componentType: 'series',
            classType: 'mapSeries',
            mapModel: mapModel,
            colorSpectrum: colorSpectrum
        });

        this.componentManager.register('zoom', {
            classType: 'zoom'
        });

        this.componentManager.register('mouseEventDetector', {
            chartType: this.chartType,
            classType: 'mapChartEventDetector'
        });
    },

    /**
     * Get scale option.
     * @returns {{legend: boolean}}
     * @override
     */
    getScaleOption: function() {
        return {
            legend: true
        };
    },

    /**
     * Add data ratios.
     * @override
     */
    addDataRatios: function(limitMap) {
        this.dataProcessor.addDataRatios(limitMap.legend);
    }
});

module.exports = MapChart;
