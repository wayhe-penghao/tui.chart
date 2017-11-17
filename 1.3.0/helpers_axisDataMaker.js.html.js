ne.util.defineNamespace("fedoc.content", {});
fedoc.content["helpers_axisDataMaker.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Axis Data Maker\n * @author NHN Ent.\n *         FE Development Team &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar chartConst = require('../const'),\n    predicate = require('./predicate'),\n    calculator = require('./calculator');\n\nvar abs = Math.abs,\n    concat = Array.prototype.concat;\n\n/**\n * Axis data maker.\n * @module axisDataMaker\n */\nvar axisDataMaker = {\n    /**\n     * To make labels.\n     * @param {array.&lt;string>} labels labels\n     * @param {number} labelInterval label interval\n     * @returns {array.&lt;string>} labels\n     * @private\n     */\n    _makeLabels: function(labels, labelInterval) {\n        var lastIndex;\n        if (!labelInterval) {\n            return labels;\n        }\n\n        lastIndex = labels.length - 1;\n        return tui.util.map(labels, function(label, index) {\n            if (index > 0 &amp;&amp; index &lt; lastIndex &amp;&amp; (index % labelInterval) > 0) {\n                label = chartConst.EMPTY_AXIS_LABEL;\n            }\n            return label;\n        });\n    },\n\n    /**\n     * To make data about label axis.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {array.&lt;string>} labels chart labels\n     *      @param {boolean} isVertical whether vertical or not\n     * @returns {{\n     *      labels: array.&lt;string>,\n     *      tickCount: number,\n     *      validTickCount: number,\n     *      isLabelAxis: boolean,\n     *      isVertical: boolean\n     * }} axis data\n     */\n    makeLabelAxisData: function(params) {\n        var tickCount = params.labels.length,\n            options = params.options || {};\n        if (!params.aligned) {\n            tickCount += 1;\n        }\n\n        return {\n            labels: this._makeLabels(params.labels, options.labelInterval),\n            tickCount: tickCount,\n            validTickCount: 0,\n            isLabelAxis: true,\n            isVertical: !!params.isVertical,\n            aligned: !!params.aligned\n        };\n    },\n\n    /**\n     * To make data about value axis.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {array.&lt;array.&lt;number>>} params.values chart values\n     *      @param {{width:number, height:number}} params.seriesDimension series dimension\n     *      @param {array.&lt;function>} params.formatFunctions format functions\n     *      @param {string} params.stacked stacked option\n     *      @param {string} params.options axis options\n     * @returns {{\n     *      labels: array.&lt;string>,\n     *      tickCount: number,\n     *      validTickCount: number,\n     *      isLabelAxis: boolean,\n     *      scale: {min: number, max: number},\n     *      isVertical: boolean\n     * }} axis data\n     */\n    makeValueAxisData: function(params) {\n        var options = params.options || {},\n            isVertical = !!params.isVertical,\n            isPositionRight = !!params.isPositionRight,\n            formatFunctions = params.formatFunctions,\n            tickInfo;\n        if (params.stacked === 'percent') {\n            tickInfo = chartConst.PERCENT_STACKED_TICK_INFO;\n            formatFunctions = [];\n        } else {\n            tickInfo = this._getTickInfo({\n                values: this._makeBaseValues(params.values, params.stacked),\n                seriesDimension: params.seriesDimension,\n                isVertical: isVertical,\n                isPositionRight: isPositionRight,\n                chartType: params.chartType\n            }, options);\n        }\n\n        return {\n            labels: this.formatLabels(tickInfo.labels, formatFunctions),\n            tickCount: tickInfo.tickCount,\n            validTickCount: tickInfo.tickCount,\n            scale: tickInfo.scale,\n            step: tickInfo.step,\n            isVertical: isVertical,\n            isPositionRight: isPositionRight,\n            aligned: !!params.aligned\n        };\n    },\n\n    /**\n     * To make base values.\n     * @memberOf module:axisDataMaker\n     * @param {array.&lt;number>} groupValues group values\n     * @param {string} stacked stacked option.\n     * @returns {array.&lt;number>} base values\n     * @private\n     */\n    _makeBaseValues: function(groupValues, stacked) {\n        var baseValues = concat.apply([], groupValues); // flatten array\n        if (stacked === chartConst.STACKED_NORMAL_TYPE) {\n            baseValues = baseValues.concat(tui.util.map(groupValues, function(values) {\n                var plusValues = tui.util.filter(values, function(value) {\n                    return value > 0;\n                });\n                return tui.util.sum(plusValues);\n            }));\n        }\n        return baseValues;\n    },\n\n    /**\n     * Get base size for get candidate tick counts.\n     * @memberOf module:axisDataMaker\n     * @param {{width: number, height: number}} dimension chat dimension\n     * @param {boolean} isVertical whether vertical or not\n     * @returns {number} base size\n     * @private\n     */\n    _getBaseSize: function(dimension, isVertical) {\n        var baseSize;\n        if (isVertical) {\n            baseSize = dimension.height;\n        } else {\n            baseSize = dimension.width;\n        }\n        return baseSize;\n    },\n\n    /**\n     * Get candidate tick counts.\n     * @memberOf module:axisDataMaker\n     * @param {{width: number, height: number}} chartDimension chat dimension\n     * @param {boolean} isVertical whether vertical or not\n     * @returns {array.&lt;number>} tick counts\n     * @private\n     */\n    _getCandidateTickCounts: function(chartDimension, isVertical) {\n        var baseSize = this._getBaseSize(chartDimension, isVertical),\n            start = tui.util.max([3, parseInt(baseSize / chartConst.MAX_PIXEL_TYPE_STEP_SIZE, 10)]),\n            end = tui.util.max([start, parseInt(baseSize / chartConst.MIN_PIXEL_TYPE_STEP_SIZE, 10)]) + 1,\n            tickCounts = tui.util.range(start, end);\n        return tickCounts;\n    },\n\n    /**\n     * Get comparing value.\n     * @memberOf module:axisDataMaker\n     * @param {number} min minimum value of user data\n     * @param {number} max maximum value of user data\n     * @param {{scale: {min: number, max: number}, step: number}} tickInfo tick info\n     * @returns {number} comparing value\n     * @private\n     */\n    _getComparingValue: function(min, max, tickInfo) {\n        var diffMax = abs(tickInfo.scale.max - max),\n            diffMin = abs(min - tickInfo.scale.min),\n            weight = Math.pow(10, tui.util.lengthAfterPoint(tickInfo.step));\n        return (diffMax + diffMin) * weight;\n    },\n\n    /**\n     * Select tick info.\n     * @memberOf module:axisDataMaker\n     * @param {number} min minimum value of user data\n     * @param {number} max maximum value of user data\n     * @param {array.&lt;object>} candidates tick info candidates\n     * @returns {{scale: {min: number, max: number}, tickCount: number, step: number, labels: array.&lt;number>}} selected tick info\n     * @private\n     */\n    _selectTickInfo: function(min, max, candidates) {\n        var getComparingValue = tui.util.bind(this._getComparingValue, this, min, max),\n            tickInfo = tui.util.min(candidates, getComparingValue);\n        return tickInfo;\n    },\n\n    /**\n     * Get tick count and scale.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {number} params.values base values\n     *      @param {{width: number, height: number}} params.seriesDimension chat dimension\n     *      @param {boolean} params.isVertical whether vertical or not\n     *      @param {string} params.chartType chat type\n     * @param {{min: number, max:number}} options axis options\n     * @returns {{tickCount: number, scale: object}} tick info\n     * @private\n     */\n    _getTickInfo: function(params, options) {\n        var min = tui.util.min(params.values),\n            max = tui.util.max(params.values),\n            intTypeInfo, tickCounts, candidates, tickInfo;\n        // 01. min, max, options 정보를 정수형으로 변경\n        intTypeInfo = this._makeIntegerTypeInfo(min, max, options);\n\n        // 02. tick count 후보군 얻기\n        tickCounts = params.tickCount ? [params.tickCount] : this._getCandidateTickCounts(params.seriesDimension, params.isVertical);\n\n        // 03. tick info 후보군 계산\n        candidates = this._getCandidateTickInfos({\n            min: intTypeInfo.min,\n            max: intTypeInfo.max,\n            tickCounts: tickCounts,\n            chartType: params.chartType\n        }, intTypeInfo.options);\n\n        // 04. tick info 후보군 중 하나 선택\n        tickInfo = this._selectTickInfo(intTypeInfo.min, intTypeInfo.max, candidates);\n\n        // 05. 정수형으로 변경했던 tick info를 원래 형태로 변경\n        tickInfo = this._revertOriginalTypeTickInfo(tickInfo, intTypeInfo.divideNum);\n        return tickInfo;\n    },\n\n    /**\n     * To make integer type info\n     * @memberOf module:axisDataMaker\n     * @param {number} min minimum value of user data\n     * @param {number} max maximum value of user data\n     * @param {{min: number, max: number}} options axis options\n     * @returns {{min: number, max: number, options: {min: number, max: number}, divideNum: number}} integer type info\n     * @private\n     */\n    _makeIntegerTypeInfo: function(min, max, options) {\n        var multipleNum, changedOptions;\n\n        if (abs(min) >= 1 || abs(max) >= 1) {\n            return {\n                min: min,\n                max: max,\n                options: options,\n                divideNum: 1\n            };\n        }\n\n        multipleNum = tui.util.findMultipleNum(min, max);\n        changedOptions = {};\n\n        if (!tui.util.isUndefined(options.min)) {\n            changedOptions.min = options.min * multipleNum;\n        }\n\n        if (!tui.util.isUndefined(options.max)) {\n            changedOptions.max = options.max * multipleNum;\n        }\n\n        return {\n            min: min * multipleNum,\n            max: max * multipleNum,\n            options: changedOptions,\n            divideNum: multipleNum\n        };\n    },\n\n    /**\n     * Revert tick info to original type.\n     * @memberOf module:axisDataMaker\n     * @param {{step: number, scale: {min: number, max: number}, labels: array.&lt;number>}} tickInfo tick info\n     * @param {number} divideNum divide num\n     * @returns {{step: number, scale: {min: number, max: number}, labels: array.&lt;number>}} divided tick info\n     * @private\n     */\n    _revertOriginalTypeTickInfo: function(tickInfo, divideNum) {\n        if (divideNum === 1) {\n            return tickInfo;\n        }\n\n        tickInfo.step = tui.util.division(tickInfo.step, divideNum);\n        tickInfo.scale.min = tui.util.division(tickInfo.scale.min, divideNum);\n        tickInfo.scale.max = tui.util.division(tickInfo.scale.max, divideNum);\n        tickInfo.labels = tui.util.map(tickInfo.labels, function(label) {\n            return tui.util.division(label, divideNum);\n        });\n\n        return tickInfo;\n    },\n\n    /**\n     * Normalize step.\n     * @memberOf module:axisDataMaker\n     * @param {number} step original step\n     * @returns {number} normalized step\n     * @private\n     */\n    _normalizeStep: function(step) {\n        return calculator.normalizeAxisNumber(step);\n    },\n\n    /**\n     * To minimize tick scale.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {number} params.userMin user min\n     *      @param {number} params.userMax user max\n     *      @param {{tickCount: number, scale: object}} params.tickInfo tick info\n     *      @param {{min: number, max:number}} params.options axis options\n     * @returns {{tickCount: number, scale: object, labels: array}} corrected tick info\n     * @private\n     */\n    _minimizeTickScale: function(params) {\n        var tickInfo = params.tickInfo,\n            ticks = tui.util.range(1, tickInfo.tickCount),\n            options = params.options,\n            step = tickInfo.step,\n            scale = tickInfo.scale,\n            tickMax = scale.max,\n            tickMin = scale.min,\n            isUndefinedMin = tui.util.isUndefined(options.min),\n            isUndefinedMax = tui.util.isUndefined(options.max),\n            labels;\n        tui.util.forEachArray(ticks, function(tickIndex) {\n            var curStep = (step * tickIndex),\n                curMin = tickMin + curStep,\n                curMax = tickMax - curStep;\n\n            // 더이상 변경이 필요 없을 경우\n            if (params.userMin &lt;= curMin &amp;&amp; params.userMax >= curMax) {\n                return false;\n            }\n\n            // min 값에 변경 여유가 있을 경우\n            if ((isUndefinedMin &amp;&amp; params.userMin > curMin) ||\n                (!isUndefinedMin &amp;&amp; options.min >= curMin)) {\n                scale.min = curMin;\n            }\n\n            // max 값에 변경 여유가 있을 경우\n            if ((isUndefinedMin &amp;&amp; params.userMax &lt; curMax) ||\n                (!isUndefinedMax &amp;&amp; options.max &lt;= curMax)) {\n                scale.max = curMax;\n            }\n        });\n\n        labels = calculator.makeLabelsFromScale(scale, step);\n        tickInfo.labels = labels;\n        tickInfo.step = step;\n        tickInfo.tickCount = labels.length;\n        return tickInfo;\n    },\n\n    /**\n     * To divide tick step.\n     * @memberOf module:axisDataMaker\n     * @param {{scale: {min: number, max: number}, tickCount: number, step: number, labels: array.&lt;number>}} tickInfo tick info\n     * @param {number} orgTickCount original tickCount\n     * @returns {{scale: {min: number, max: number}, tickCount: number, step: number, labels: array.&lt;number>}} tick info\n     * @private\n     */\n    _divideTickStep: function(tickInfo, orgTickCount) {\n        var step = tickInfo.step,\n            scale = tickInfo.scale,\n            tickCount = tickInfo.tickCount;\n        // step 2의 배수 이면서 변경된 tickCount의 두배수-1이 tickCount보다 orgTickCount와 차이가 덜나거나 같으면 step을 반으로 변경한다.\n        if ((step % 2 === 0) &amp;&amp;\n            abs(orgTickCount - ((tickCount * 2) - 1)) &lt;= abs(orgTickCount - tickCount)) {\n            step = step / 2;\n            tickInfo.labels = calculator.makeLabelsFromScale(scale, step);\n            tickInfo.tickCount = tickInfo.labels.length;\n            tickInfo.step = step;\n        }\n        return tickInfo;\n    },\n\n    /**\n     * To make tick info\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {number} params.tickCount tick count\n     *      @param {number} params.min scale min\n     *      @param {number} params.max scale max\n     *      @param {number} params.userMin minimum value of user data\n     *      @param {number} params.userMax maximum value of user data\n     *      @param {boolean} params.isMinus whether scale is minus or not\n     *      @param {string} params.chartType chart type\n     *      @param {{min: number, max: number}} params.options axis options\n     * @returns {{\n     *      scale: {min: number, max: number},\n     *      tickCount: number,\n     *      step: number,\n     *      labels: array.&lt;number>\n     * }} tick info\n     * @private\n     */\n    _makeTickInfo: function(params) {\n        var scale = params.scale,\n            step, tickInfo;\n\n        // 01. 기본 scale 정보로 step 얻기\n        step = calculator.getScaleStep(scale, params.tickCount);\n\n        // 02. step 정규화 시키기 (ex: 0.3 --> 0.5, 7 --> 10)\n        step = this._normalizeStep(step);\n\n        // 03. scale 정규화 시키기\n        scale = this._normalizeScale(scale, step, params.tickCount);\n\n        // 04. line차트의 경우 사용자의 min값이 scale의 min값과 같을 경우, min값을 1 step 감소 시킴\n        scale.min = this._addMinPadding({\n            min: scale.min,\n            step: step,\n            userMin: params.userMin,\n            minOption: params.options.min,\n            chartType: params.chartType\n        });\n\n        // 04. 사용자의 max값이 scael max와 같을 경우, max값을 1 step 증가 시킴\n        scale.max = this._addMaxPadding({\n            max: scale.max,\n            step: step,\n            userMax: params.userMax,\n            maxOption: params.options.max,\n            chartType: params.chartType\n        });\n\n        // 05. axis scale이 사용자 min, max와 거리가 멀 경우 조절\n        tickInfo = this._minimizeTickScale({\n            userMin: params.userMin,\n            userMax: params.userMax,\n            tickInfo: {scale: scale, step: step, tickCount: params.tickCount},\n            options: params.options\n        });\n\n        tickInfo = this._divideTickStep(tickInfo, params.tickCount);\n        return tickInfo;\n    },\n\n    /**\n     * Add scale min padding.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @prams {number} params.min scale min\n     *      @param {number} params.userMin minimum value of user data\n     *      @param {number} params.minOption min option\n     *      @param {number} params.step tick step\n     * @returns {number} scale min\n     * @private\n     */\n    _addMinPadding: function(params) {\n        var min = params.min;\n\n        if ((!predicate.isLineChart(params.chartType) &amp;&amp; params.userMin >= 0) || !tui.util.isUndefined(params.minOption)) {\n            return min;\n        }\n        // normalize된 scale min값이 user min값과 같을 경우 step 감소\n        if (params.min === params.userMin) {\n            min -= params.step;\n        }\n        return min;\n    },\n\n    /**\n     * Add scale max padding.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @prams {number} params.max scale max\n     *      @param {number} params.userMax maximum value of user data\n     *      @param {number} params.maxOption max option\n     *      @param {number} params.step tick step\n     * @returns {number} scale max\n     * @private\n     */\n    _addMaxPadding: function(params) {\n        var max = params.max;\n\n        if ((!predicate.isLineChart(params.chartType) &amp;&amp; params.userMax &lt;= 0) || !tui.util.isUndefined(params.maxOption)) {\n            return max;\n        }\n\n        // normalize된 scale max값이 user max값과 같을 경우 step 증가\n        if (tui.util.isUndefined(params.maxOption) &amp;&amp; (params.max === params.userMax)) {\n            max += params.step;\n        }\n        return max;\n    },\n\n    /**\n     * To normalize min.\n     * @memberOf module:axisDataMaker\n     * @param {number} min original min\n     * @param {number} step tick step\n     * @returns {number} normalized min\n     * @private\n     */\n    _normalizeMin: function(min, step) {\n        var mod = tui.util.mod(min, step),\n            normalized;\n\n        if (mod === 0) {\n            normalized = min;\n        } else {\n            normalized = tui.util.subtraction(min, (min >= 0 ? mod : step + mod));\n        }\n        return normalized;\n    },\n\n    /**\n     * To make normalized max.\n     * @memberOf module:axisDataMaker\n     * @param {{min: number, max: number}} scale scale\n     * @param {number} step tick step\n     * @param {number} tickCount tick count\n     * @returns {number} normalized max\n     * @private\n     */\n    _makeNormalizedMax: function(scale, step, tickCount) {\n        var minMaxDiff = tui.util.multiplication(step, tickCount - 1),\n            normalizedMax = tui.util.addition(scale.min, minMaxDiff),\n            maxDiff = scale.max - normalizedMax,\n            modDiff, divideDiff;\n        // normalize된 max값이 원래의 max값 보다 작을 경우 step을 증가시켜 큰 값으로 만들기\n        if (maxDiff > 0) {\n            modDiff = maxDiff % step;\n            divideDiff = Math.floor(maxDiff / step);\n            normalizedMax += step * (modDiff > 0 ? divideDiff + 1 : divideDiff);\n        }\n        return normalizedMax;\n    },\n\n    /**\n     * To normalize scale.\n     * @memberOf module:axisDataMaker\n     * @param {{min: number, max: number}} scale base scale\n     * @param {number} step tick step\n     * @param {number} tickCount tick count\n     * @returns {{min: number, max: number}} normalized scale\n     * @private\n     */\n    _normalizeScale: function(scale, step, tickCount) {\n        scale.min = this._normalizeMin(scale.min, step);\n        scale.max = this._makeNormalizedMax(scale, step, tickCount);\n        return scale;\n    },\n\n    /**\n     * Get candidates about tick info.\n     * @memberOf module:axisDataMaker\n     * @param {object} params parameters\n     *      @param {number} params.min minimum value of user data\n     *      @param {number} params.max maximum value of user data\n     *      @param {array.&lt;number>} params.tickCounts tick counts\n     *      @param {string} params.chartType chart type\n     * @param {{min: number, max:number}} options axis options\n     * @returns {array} candidates about tick info\n     * @private\n     */\n    _getCandidateTickInfos: function(params, options) {\n        var userMin = params.min,\n            userMax = params.max,\n            min = params.min,\n            max = params.max,\n            scale, candidates;\n\n        // min, max만으로 기본 scale 얻기\n        scale = this._makeBaseScale(min, max, options);\n\n        candidates = tui.util.map(params.tickCounts, function(tickCount) {\n            return this._makeTickInfo({\n                tickCount: tickCount,\n                scale: tui.util.extend({}, scale),\n                userMin: userMin,\n                userMax: userMax,\n                chartType: params.chartType,\n                options: options\n            });\n        }, this);\n        return candidates;\n    },\n\n    /**\n     * To make base scale\n     * @memberOf module:axisDataMaker\n     * @param {number} min minimum value of user data\n     * @param {number} max maximum value of user data\n     * @param {{min: number, max: number}} options axis options\n     * @returns {{min: number, max: number}} base scale\n     * @private\n     */\n    _makeBaseScale: function(min, max, options) {\n        var isMinus = false,\n            tmpMin, scale;\n\n        if (min &lt; 0 &amp;&amp; max &lt;= 0) {\n            isMinus = true;\n            tmpMin = min;\n            min = -max;\n            max = -tmpMin;\n        }\n\n        scale = calculator.calculateScale(min, max);\n\n        if (isMinus) {\n            tmpMin = scale.min;\n            scale.min = -scale.max;\n            scale.max = -tmpMin;\n        }\n\n        scale.min = !tui.util.isUndefined(options.min) ? options.min : scale.min;\n        scale.max = !tui.util.isUndefined(options.max) ? options.max : scale.max;\n\n        return scale;\n    },\n\n    /**\n     * Format labels.\n     * @memberOf module:axisDataMaker\n     * @param {string[]} labels target labels\n     * @param {function[]} formatFunctions format functions\n     * @returns {string[]} formatted labels\n     */\n    formatLabels: function(labels, formatFunctions) {\n        var result;\n        if (!formatFunctions || !formatFunctions.length) {\n            return labels;\n        }\n        result = tui.util.map(labels, function(label) {\n            var fns = concat.apply([label], formatFunctions);\n            return tui.util.reduce(fns, function(stored, fn) {\n                return fn(stored);\n            });\n        });\n        return result;\n    }\n};\n\nmodule.exports = axisDataMaker;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"