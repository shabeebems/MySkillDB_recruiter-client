import React, { useState, useEffect } from 'react';
import { getRequest } from '../../../api/apiRequests';

/**
 * DepartmentMetricsChart
 * 
 * Performance-style dashboard showing metrics:
 * - Jobs Created
 * - Interview Planners
 * - Active Chats
 * - CVs Created
 * - LinkedIn Posts
 */
const DepartmentMetricsChart = ({ organizationId }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [dateRange, setDateRange] = useState('14days');
  const [metrics, setMetrics] = useState({
    jobs: { total: 0, data: [] },
    skillPlanners: { total: 0, data: [] },
    activeChats: { total: 0, data: [] },
    cvs: { total: 0, data: [] },
    linkedInPosts: { total: 0, data: [] }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(['jobs', 'skillPlanners']);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Metric definitions
  const metricConfig = {
    jobs: { 
      label: 'Jobs', 
      color: '#6366f1', // indigo
      lightColor: 'rgba(99, 102, 241, 0.1)',
      icon: 'fas fa-briefcase'
    },
    skillPlanners: { 
      label: 'Interview Planners', 
      color: '#10b981', // emerald
      lightColor: 'rgba(16, 185, 129, 0.1)',
      icon: 'fas fa-tasks'
    },
    activeChats: { 
      label: 'Active Chats', 
      color: '#ec4899', // pink
      lightColor: 'rgba(236, 72, 153, 0.1)',
      icon: 'fas fa-comments'
    },
    cvs: { 
      label: 'CVs Created', 
      color: '#f59e0b', // amber
      lightColor: 'rgba(245, 158, 11, 0.1)',
      icon: 'fas fa-file-alt'
    },
    linkedInPosts: { 
      label: 'LinkedIn Posts', 
      color: '#0ea5e9', // sky
      lightColor: 'rgba(14, 165, 233, 0.1)',
      icon: 'fab fa-linkedin'
    }
  };

  // Generate date labels based on range
  const getDaysFromRange = () => {
    switch (dateRange) {
      case '7days': return 7;
      case '14days': return 14;
      case '30days': return 30;
      case '45days': return 45;
      case '65days': return 65;
      default: return 14;
    }
  };

  const getDateLabels = () => {
    const days = getDaysFromRange();
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  };

  // Download CSV function
  const downloadCSV = () => {
    const days = getDaysFromRange();
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Build CSV header
    const headers = ['Date', ...Object.values(metricConfig).map(m => m.label)];
    
    // Build CSV rows
    const rows = dates.map((date, idx) => {
      const row = [date];
      Object.keys(metricConfig).forEach(key => {
        row.push(metrics[key]?.data?.[idx] || 0);
      });
      return row;
    });

    // Add totals row
    const totalsRow = ['TOTAL'];
    Object.keys(metricConfig).forEach(key => {
      totalsRow.push(metrics[key]?.total || 0);
    });
    rows.push(totalsRow);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `performance_metrics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await getRequest(`/organization-setup/departments/${organizationId}`);
      if (response.data?.success && response.data?.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Generate mock time-series data
  const generateMockData = () => {
    const days = getDaysFromRange();
    
    const generateTrend = (base, variance, trend = 'stable') => {
      const data = [];
      let current = base;
      for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.5) * variance;
        if (trend === 'up') current += Math.abs(change) * 0.3;
        else if (trend === 'down') current -= Math.abs(change) * 0.3;
        current = Math.max(0, current + change);
        data.push(Math.round(current));
      }
      return data;
    };

    return {
      jobs: { 
        total: 45, 
        data: generateTrend(3, 2, 'up'),
        change: '+12%'
      },
      skillPlanners: { 
        total: 128, 
        data: generateTrend(8, 4, 'up'),
        change: '+23%'
      },
      activeChats: { 
        total: 342, 
        data: generateTrend(25, 10, 'stable'),
        change: '+5%'
      },
      cvs: { 
        total: 67, 
        data: generateTrend(5, 3, 'up'),
        change: '+18%'
      },
      linkedInPosts: { 
        total: 89, 
        data: generateTrend(6, 4, 'stable'),
        change: '+8%'
      }
    };
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await getRequest(`/analytics/organization/${organizationId}/metrics`);
      const mockData = generateMockData();
      setMetrics(mockData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchMetrics();
    }
  }, [organizationId, selectedDepartment, dateRange]);

  // Toggle metric visibility
  const toggleMetric = (metricKey) => {
    setActiveMetrics(prev => {
      if (prev.includes(metricKey)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(m => m !== metricKey);
      }
      return [...prev, metricKey];
    });
  };

  // Get max value for Y-axis scaling
  const getMaxValue = () => {
    let max = 0;
    activeMetrics.forEach(key => {
      const metricMax = Math.max(...(metrics[key]?.data || [0]));
      if (metricMax > max) max = metricMax;
    });
    return Math.ceil(max * 1.2) || 10;
  };

  // Calculate Y-axis labels
  const getYAxisLabels = () => {
    const max = getMaxValue();
    return [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];
  };

  const dateLabels = getDateLabels();
  const maxValue = getMaxValue();
  const yAxisLabels = getYAxisLabels();

  // SVG Chart dimensions
  const chartWidth = 100; // percentage
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  // Generate SVG path for a metric
  const generatePath = (data) => {
    if (!data || data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // Generate area path (for fill)
  const generateAreaPath = (data) => {
    if (!data || data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    });
    
    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Performance</h2>
            <span className="text-sm text-slate-500">
              Last {getDaysFromRange()} days
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="14days">Last 14 days</option>
              <option value="30days">Last 30 days</option>
              <option value="45days">Last 45 days</option>
              <option value="65days">Last 65 days</option>
            </select>
            
            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Download CSV Button */}
            <button
              onClick={downloadCSV}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download data as CSV"
            >
              <i className="fas fa-download text-slate-500"></i>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
            <p className="text-slate-500">Loading metrics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-b border-slate-100">
            {Object.entries(metricConfig).map(([key, config]) => {
              const metric = metrics[key];
              const isActive = activeMetrics.includes(key);
              
              return (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`p-4 text-left border-r border-slate-100 last:border-r-0 transition-all hover:bg-slate-50 ${
                    isActive ? '' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      {config.label}
                      <i className="fas fa-chevron-down text-[10px] text-slate-400"></i>
                    </span>
                    <i className="fas fa-info-circle text-slate-300 text-xs"></i>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: isActive ? config.color : '#cbd5e1' }}
                    ></span>
                    <span className={`text-xl font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {metric?.total?.toLocaleString() || 0}
                    </span>
                  </div>
                  {metric?.change && (
                    <span className={`text-xs font-medium ${
                      metric.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {metric.change} vs previous
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chart Area */}
          <div className="p-4 sm:p-6">
            <div className="relative" style={{ height: `${chartHeight}px` }}>
              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-3">
                {yAxisLabels.map((label, idx) => (
                  <span key={idx} className="text-xs text-slate-400">{label}</span>
                ))}
              </div>

              {/* Chart Container */}
              <div className="ml-12 h-full relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '30px' }}>
                  {yAxisLabels.map((_, idx) => (
                    <div key={idx} className="border-t border-slate-100 w-full"></div>
                  ))}
                </div>

                {/* SVG Chart */}
                <svg 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                  className="w-full absolute top-0 left-0"
                  style={{ height: 'calc(100% - 30px)' }}
                >
                  {/* Area fills */}
                  {activeMetrics.map(key => {
                    const config = metricConfig[key];
                    const data = metrics[key]?.data || [];
                    return (
                      <path
                        key={`area-${key}`}
                        d={generateAreaPath(data)}
                        fill={config.lightColor}
                        opacity="0.5"
                      />
                    );
                  })}
                  
                  {/* Lines */}
                  {activeMetrics.map(key => {
                    const config = metricConfig[key];
                    const data = metrics[key]?.data || [];
                    return (
                      <path
                        key={`line-${key}`}
                        d={generatePath(data)}
                        fill="none"
                        stroke={config.color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}

                  {/* Invisible hover areas for tooltips */}
                  {activeMetrics.map(key => {
                    const data = metrics[key]?.data || [];
                    return data.map((value, idx) => {
                      const x = (idx / (data.length - 1)) * 100;
                      const y = 100 - (value / maxValue) * 100;
                      return (
                        <circle
                          key={`hover-${key}-${idx}`}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint({ key, idx, value, x, y })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    });
                  })}

                  {/* Visible dot on hover */}
                  {hoveredPoint && (
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="1.5"
                      fill={metricConfig[hoveredPoint.key].color}
                      stroke="white"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap"
                    style={{ 
                      left: `${hoveredPoint.x}%`, 
                      top: `calc(${(hoveredPoint.y / 100) * (chartHeight - 30)}px)`,
                      transform: 'translate(-50%, -140%)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: metricConfig[hoveredPoint.key].color }}
                      ></span>
                      <span className="font-medium">{metricConfig[hoveredPoint.key].label}</span>
                    </div>
                    <div className="text-lg font-bold">{hoveredPoint.value}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">{dateLabels[hoveredPoint.idx]}</div>
                  </div>
                )}

                {/* X-Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 h-8 flex justify-between items-end">
                  {dateLabels.filter((_, idx) => {
                    // Show fewer labels on mobile
                    const step = dateLabels.length > 14 ? 5 : dateLabels.length > 7 ? 2 : 1;
                    return idx % step === 0 || idx === dateLabels.length - 1;
                  }).map((label, idx) => (
                    <span key={idx} className="text-xs text-slate-400">{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
              {activeMetrics.map(key => {
                const config = metricConfig[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span 
                      className="w-4 h-1 rounded-full"
                      style={{ backgroundColor: config.color }}
                    ></span>
                    <span className="text-xs text-slate-600">{config.label}</span>
                  </div>
                );
              })}
              <span className="text-xs text-slate-400 ml-auto">
                Click metrics above to show/hide
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default DepartmentMetricsChart;
