import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import { EMA } from 'technicalindicators';

function calculateSMA(data, period = 14) {
    let smaValues = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        smaValues.push({ time: data[i].time, value: sum / period });
    }
    return smaValues;
}

function calculateEMA(data, period = 36) {
    return EMA.calculate({
        period,
        values: data.map(item => item.close)
    }).map((value, index) => ({
        time: data[index + period - 1].time, // Offset to match the period
        value
    }));
}


function BTCChart() {
    const [timeframe, setTimeframe] = useState('1d'); // Default to '1d' for pivot point calculation relevance
    const [chartData, setChartData] = useState([]);
    const chartContainerRef = useRef(null);
    const chart = useRef(null);
    const candleSeriesRef = useRef(null);
    const smaSeriesRef = useRef(null);
    const emaSeriesRef = useRef(null);
    const pivotPointsRef = useRef([]);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
                    params: {
                        symbol: 'BTCUSDT',
                        interval: timeframe,
                        limit: 1000
                    }
                });
                const formattedData = response.data.map(data => ({
                    time: data[0] / 1000,
                    open: parseFloat(data[1]),
                    high: parseFloat(data[2]),
                    low: parseFloat(data[3]),
                    close: parseFloat(data[4])
                }));
                setChartData(formattedData);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchChartData();
    }, [timeframe]);

    useEffect(() => {
        if (chartContainerRef.current && !chart.current) {
            chart.current = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 400,
                layout: {
                    backgroundColor: '#ffffff',
                    textColor: '#333',
                },
                grid: {
                    vertLines: {
                        color: '#e1ecf1',
                    },
                    horzLines: {
                        color: '#e1ecf1',
                    },
                },
                priceScale: {
                    borderVisible: false,
                },
                timeScale: {
                    borderVisible: false,
                },
            });

            candleSeriesRef.current = chart.current.addCandlestickSeries();
            smaSeriesRef.current = chart.current.addLineSeries({
                color: 'blue',
                lineWidth: 2,
            });
            emaSeriesRef.current = chart.current.addLineSeries({
                color: 'purple',
                lineWidth: 2,
            });

            // Initialize pivot point series for each level
            ['pivot', 'r1', 's1', 'r2', 's2', 'r3', 's3'].forEach((level, idx) => {
                pivotPointsRef.current[idx] = chart.current.addLineSeries({
                    color: ['red', 'green', 'blue', 'purple', 'orange', 'grey', 'brown'][idx],
                    lineWidth: 1,
                    title: level.toUpperCase(),
                });
            });
        }
    }, []);

    useEffect(() => {
        if (candleSeriesRef.current && chartData.length) {
            candleSeriesRef.current.setData(chartData);
            const smaData = calculateSMA(chartData, 14);
            const emaData = calculateEMA(chartData, 36);

            smaSeriesRef.current.setData(smaData);
            emaSeriesRef.current.setData(emaData);

        }
    }, [chartData]);

    useEffect(() => {
        return () => {
            if (chart.current) {
                chart.current.remove();
                chart.current = null;
            }
        };
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => setTimeframe('1m')}>1m</button>
                <button onClick={() => setTimeframe('3m')}>3m</button>
                <button onClick={() => setTimeframe('5m')}>5m</button>
                <button onClick={() => setTimeframe('15m')}>15m</button>
                <button onClick={() => setTimeframe('30m')}>30m</button>
                <button onClick={() => setTimeframe('1h')}>1h</button>
                <button onClick={() => setTimeframe('4h')}>4h</button>
                <button onClick={() => setTimeframe('1d')}>1d</button>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
        </div>
    );
}

export default BTCChart;
