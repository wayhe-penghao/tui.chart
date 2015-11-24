/**
 * @fileoverview ChartBase
 * @author NHN Ent.
 *         FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';

var chartConst = require('../const'),
    dom = require('../helpers/domHandler'),
    renderUtil = require('../helpers/renderUtil'),
    dataConverter = require('../helpers/dataConverter'),
    boundsMaker = require('../helpers/boundsMaker'),
    UserEventListener = require('../helpers/userEventListener');

var ChartBase = tui.util.defineClass(/** @lends ChartBase.prototype */ {
    /**
     * Chart base.
     * @constructs ChartBase
     * @param {object} params parameters
     *      @param {object} params.bounds chart bounds
     *      @param {object} params.theme chart theme
     *      @param {{yAxis: obejct, xAxis: object}} axesData axes data
     *      @param {object} params.options chart options
     *      @param {boolean} param.isVertical whether vertical or not
     */
    init: function(params) {
        /**
         * converted data
         * @type {object}
         */
        this.convertedData = this._makeConvertedData(params);

        /**
         * component array
         * @type {array}
         */
        this.components = [];

        /**
         * component instance map
         * @type {object}
         */
        this.componentMap = {};

        /**
         * data for rendering
         * @type {object}
         */
        this.renderingData = {};

        /**
         * theme
         * @type {object}
         */
        this.theme = params.theme;

        /**
         * options
         * @type {object}
         */
        this.options = params.options;

        /**
         * whether chart has axes or not
         * @type {boolean}
         */
        this.hasAxes = params.hasAxes;

        /**
         * whether vertical or not
         * @type {boolean}
         */
        this.isVertical = !!params.isVertical;

        /**
         * whether chart has group tooltip or not
         * @type {*|boolean}
         */
        this.hasGroupTooltip = params.options.tooltip && params.options.tooltip.grouped;

        /**
         * user event listener
         * @type {object}
         */
        this.userEvent = this._initUserEventListener();

        this._addGroupedEventHandleLayer();
    },

    /**
     * To make converted data.
     * @param {object} params parameters
     *      @params {object} userData user data
     *      @params {{chart: object, chartType: string}} options chart options
     *      @params {array} seriesChartTypes series chart types
     * @returns {object} converted data
     * @private
     */
    _makeConvertedData: function(params) {
        var options = params.options,
            convertedData = dataConverter.convert(params.userData, options.chart, options.chartType, params.seriesChartTypes);

        return convertedData;
    },

    /**
     * To make chart id.
     * @returns {string} chart id
     * @private
     */
    _makeChartId: function() {
        return chartConst.CHAR_ID_PREFIX + '-' + (new Date()).getTime();
    },

    /**
     * Initialize user event listener.
     * @returns {object} userEvent object
     * @private
     */
    _initUserEventListener: function() {
        return new UserEventListener();
    },

    /**
     * Add grouped event handler layer.
     * @param {{yAxis: obejct, xAxis: object}} axesData axes data
     * @param {string} chartType chart type
     * @param {boolean} isVertical whether vertical or not
     * @private
     * @abstract
     */
    _addGroupedEventHandleLayer: function() {},

    /**
     * To make baes data.
     * @param {array | object} userData user data
     * @param {object} theme chart theme
     * @param {object} options chart options
     * @param {object} params add params
     * @returns {{convertedData: object, bounds: object}} base data
     */
    makeBaseData: function(userData, theme, options, params) {
        var seriesChartTypes = params ? params.seriesChartTypes : [],
            convertedData = dataConverter.convert(userData, options.chart, options.chartType, seriesChartTypes),
            bounds = boundsMaker.make(tui.util.extend({
                chartType: options.chartType,
                convertedData: convertedData,
                theme: theme,
                options: options
            }, params));

        return {
            convertedData: convertedData,
            bounds: bounds
        };
    },

    /**
     * Add component.
     * @param {string} name component name
     * @param {function} Component component function
     * @param {object} params parameters
     */
    addComponent: function(name, Component, params) {
        var commonParams = {},
            options, index, theme, component;

        params = params || {};

        options = params.options || this.options[params && params.componentType || name];
        theme = params.theme || this.theme[params && params.componentType || name];
        index = params && params.index || 0;

        commonParams.theme = tui.util.isArray(theme) ? theme[index] : theme;
        commonParams.options = tui.util.isArray(options) ? options[index] : options || {};

        params = tui.util.extend(params, commonParams);

        component = new Component(params);

        this.components.push({
            name: name,
            componentType: params.componentType,
            instance: component
        });
        this.componentMap[name] = component;
    },

    /**
     * Attach custom evnet.
     * @private
     * @abstract
     */
    _attachCustomEvent: function() {},

    /**
     * To make bounds.
     * @param {object} boundsParams parameters for making bounds
     * @returns {object} chart bounds
     * @private
     */
    _makeBounds: function(boundsParams) {
        return boundsMaker.make(tui.util.extend({
            convertedData: this.convertedData,
            theme: this.theme,
            options: this.options,
            hasAxes: this.hasAxes,
            isVertical: this.isVertical
        }, boundsParams));
    },

    /**
     * Set rendering data for axis type chart.
     * @param {object} bounds chart bounds
     * @param {object} convertedData convertedData
     * @param {object} options options
     * @private
     * @abstract
     */
    _setRenderingData: function() {},

    /**
     * Render chart.
     * @param {object} boundsParams parameters for making bounds
     * @returns {HTMLElement} chart element
     */
    render: function(boundsParams) {
        var el = dom.create('DIV', this.className),
            bounds;

        if (boundsParams) {
            this._makeBounds = tui.util.bind(this._makeBounds, this, boundsParams);
        }

        dom.addClass(el, 'tui-chart');
        this.bounds = bounds = this._makeBounds();
        this._setRenderingData(bounds, this.convertedData, this.options);

        this._renderTitle(el);
        renderUtil.renderDimension(el, bounds.chart.dimension);
        renderUtil.renderBackground(el, this.theme.chart.background);
        renderUtil.renderFontFamily(el, this.theme.chart.fontFamily);
        this._renderComponents(el, this.components);
        this._attachCustomEvent();
        this.elChart = el;

        return el;
    },

    /**
     * Render title.
     * @param {HTMLElement} el target element
     * @private
     */
    _renderTitle: function(el) {
        var chartOptions = this.options.chart || {},
            elTitle = renderUtil.renderTitle(chartOptions.title, this.theme.title, 'tui-chart-title');
        dom.append(el, elTitle);
    },

    _findBound: function(name, componentType) {
        return this.bounds[name] || (componentType && this.bounds[componentType]);
    },

    /**
     * Render components.
     * @param {HTMLElement} container container element
     * @param {array.<object>} components components
     * @param {object} paper object for graph drawing
     * @private
     */
    _renderComponents: function(container, components) {
        var paper, elements;
        elements = tui.util.map(components, function(component) {
            var name = component.name,
                bound = this._findBound(name, component.componentType),
                data = this.renderingData[name],
                elComponent;

            if (!bound) {
                return null;
            }

            elComponent = component.instance.render(bound, data, paper);
            if (!paper && component.instance.getPaper) {
                paper = component.instance.getPaper();
            }

            return elComponent;
        }, this);
        dom.append(container, elements);
    },

    /**
     * To make event name for animation.
     * @param {string} chartType chart type
     * @param {string} prefix prefix
     * @returns {string} event name
     * @private
     */
    _makeAnimationEventName: function(chartType, prefix) {
        return prefix + chartType.substring(0, 1).toUpperCase() + chartType.substring(1) + 'Animation';
    },

    /**
     * Attach custom event
     * @private
     */
    _attachTooltipEvent: function() {
        var tooltip = this.componentMap.tooltip,
            serieses = tui.util.filter(this.componentMap, function(component) {
                return component.componentType === 'series';
            });
        tui.util.forEach(serieses, function(series) {
            series.on('showTooltip', tooltip.onShow, tooltip);
            series.on('hideTooltip', tooltip.onHide, tooltip);

            if (series.onShowAnimation) {
                tooltip.on(renderUtil.makeCustomEventName('show', series.chartType, 'animation'), series.onShowAnimation, series);
                tooltip.on(renderUtil.makeCustomEventName('hide', series.chartType, 'animation'), series.onHideAnimation, series);
            }
        }, this);
    },

    /**
     * Animate chart.
     */
    animateChart: function() {
        tui.util.forEachArray(this.components, function(component) {
            if (component.instance.animateComponent) {
                component.instance.animateComponent();
            }
        });
    },

    /**
     * To register of user event.
     * @param {string} eventName event name
     * @param {function} func event callback
     */
    on: function(eventName, func) {
        this.userEvent.register(eventName, func);
    },

    /**
     * Update dimension.
     * @param {{width: number, height: number}} dimension dimension
     * @returns {boolean} whether changed or not
     * @private
     */
    _updateDimension: function(dimension) {
        var changed = false;
        if (dimension.width) {
            this.options.chart.width = dimension.width;
            changed = true;
        }

        if (dimension.height) {
            this.options.chart.height = dimension.height;
            changed = true;
        }

        return changed;
    },

    /**
     * Resize components.
     * @param {array.<{name: string, instance: object}>} components components
     * @private
     */
    _resizeComponents: function(components) {
        tui.util.forEachArray(components, function(component) {
            var name = component.name,
                bound = this._findBound(name, component.componentType),
                data = this.renderingData[name];

            if (!component.instance.resize) {
                return;
            }

            component.instance.resize(bound, data);
        }, this);
    },

    /**
     * Public API for resizable.
     * @param {{width: number, height: number}} dimension dimension
     */
    resize: function(dimension) {
        var changed, bounds;

        if (!dimension) {
            return;
        }

        changed = this._updateDimension(dimension);

        if (!changed) {
            return;
        }

        this.bounds = bounds = this._makeBounds();
        this._setRenderingData(bounds, this.convertedData, this.options);
        renderUtil.renderDimension(this.elChart, bounds.chart.dimension);
        this._resizeComponents(this.components);
    }
});

module.exports = ChartBase;