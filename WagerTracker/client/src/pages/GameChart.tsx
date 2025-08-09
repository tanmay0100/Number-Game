import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChartResult } from "@shared/schema";

interface WeeklyData {
  weekNumber: number;
  year: number;
  days: {
    [key: string]: any | null;
  };
}

interface DatabaseChartResult {
  id: number;
  game_name: string;
  result_date: string;
  day_of_week: string;
  week_number: number;
  year: number;
  open_panna: string | null;
  jodi: string | null;
  close_panna: string | null;
  created_at: string;
  updated_at: string;
}

export default function GameChart() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const gameName = params.gameName?.toUpperCase().replace(/-/g, ' ') || '';

  const { data: chartData = [], isLoading } = useQuery<DatabaseChartResult[]>({
    queryKey: [`/api/charts/${params.gameName}`],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when user comes back to the page
  });

  // Group data by weeks
  const weeklyData: WeeklyData[] = [];
  const groupedByWeek = chartData.reduce((acc, result) => {
    const key = `${result.year}-${result.week_number}`;
    if (!acc[key]) {
      acc[key] = {
        weekNumber: result.week_number,
        year: result.year,
        days: {}
      };
    }
    acc[key].days[result.day_of_week] = result;
    return acc;
  }, {} as { [key: string]: WeeklyData });

  Object.values(groupedByWeek).forEach(week => weeklyData.push(week));
  // Sort weeks in ascending order (old data first/top, latest data last/bottom)
  weeklyData.sort((a, b) => a.year - b.year || a.weekNumber - b.weekNumber);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Smart helper function to calculate week range from actual data
  const getWeekDateRange = (weekData: WeeklyData) => {
    const daysWithData = Object.values(weekData.days).filter(day => day !== null) as DatabaseChartResult[];
    
    if (daysWithData.length === 0) return "No data";
    
    // Get all dates from the week and find the Monday-Saturday range
    const dates = daysWithData.map(day => new Date(day.result_date));
    dates.sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate Monday of the week from first date
    const firstDate = dates[0];
    const dayOfWeek = firstDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    
    const monday = new Date(firstDate);
    monday.setDate(firstDate.getDate() + mondayOffset);
    
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    
    // Format dates as DD/MM/YYYY
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `${formatDate(monday)} to ${formatDate(saturday)}`;
  };

  // Fallback function for legacy week calculation  
  const getLegacyWeekDateRange = (weekNumber: number, year: number) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7 - firstDayOfYear.getDay() + 1;
    const monday = new Date(year, 0, 1 + daysToAdd);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `${formatDate(monday)} to ${formatDate(saturday)}`;
  };

  const formatResultStack = (result: DatabaseChartResult | null) => {
    if (!result) {
      return (
        <div className="text-center text-gray-400 text-xs">
          <div className="grid grid-cols-3 gap-1 mb-1">
            <span>-</span><span>-</span><span>-</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-1">
            <span>-</span><span className="font-bold">--</span><span>-</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span>-</span><span>-</span><span>-</span>
          </div>
        </div>
      );
    }

    const openPanna = result.open_panna || '';
    const closePanna = result.close_panna || '';
    const jodi = result.jodi || '';

    // Split panna into individual digits
    const openDigits = openPanna.length === 3 ? openPanna.split('') : ['', '', ''];
    const closeDigits = closePanna.length === 3 ? closePanna.split('') : ['', '', ''];
    
    // Get center ank from jodi
    const centerAnk = jodi.length === 2 ? jodi : '';

    return (
      <div className="text-center text-xs font-medium leading-none">
        {/* Open Panna Column */}
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col gap-0.5 text-black w-3 sm:w-4">
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{openDigits[0]}</span>
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{openDigits[1]}</span>
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{openDigits[2]}</span>
          </div>
          
          {/* Center Jodi */}
          <div className="text-red-600 font-extrabold text-sm sm:text-lg tracking-wider mx-1">
            {centerAnk}
          </div>
          
          {/* Close Panna Column */}
          <div className="flex flex-col gap-0.5 text-black w-3 sm:w-4">
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{closeDigits[0]}</span>
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{closeDigits[1]}</span>
            <span className="h-2.5 sm:h-3 flex items-center justify-center text-xs font-medium">{closeDigits[2]}</span>
          </div>
        </div>
      </div>
    );
  };

  const formatResultInline = (result: DatabaseChartResult | null) => {
    if (!result) return <span className="text-gray-400 text-xs">-</span>;
    
    const openPanna = result.open_panna || '';
    const closePanna = result.close_panna || '';
    const jodi = result.jodi || '';
    
    // Split panna into individual digits
    const openDigits = openPanna.length === 3 ? openPanna.split('') : ['', '', ''];
    const closeDigits = closePanna.length === 3 ? closePanna.split('') : ['', '', ''];
    
    // Get center ank from jodi
    const centerAnk = jodi.length === 2 ? jodi : '';

    return (
      <div className="text-center text-xs font-medium leading-none min-h-[50px] sm:min-h-[50px] flex items-center justify-center">
        <div className="flex items-center justify-center gap-1 w-full">
          <div className="flex flex-col gap-0.5 text-black">
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{openDigits[0]}</span>
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{openDigits[1]}</span>
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{openDigits[2]}</span>
          </div>
          
          {/* Center Jodi */}
          <div className="text-red-600 font-bold text-[18px] sm:text-[32px] tracking-normal" style={{fontFamily: "'Racing Sans One', sans-serif"}}>
            {centerAnk}
          </div>
          
          {/* Close Panna Column */}
          <div className="flex flex-col gap-0.5 text-black">
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{closeDigits[0]}</span>
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{closeDigits[1]}</span>
            <span className="h-3 sm:h-4 flex items-center justify-center text-[12px] sm:text-[16px] font-black" style={{fontWeight: 900}}>{closeDigits[2]}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setLocation('/')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft size={20} />
                Back to Home
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {gameName} Chart
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Complete result history with weekly view</p>
              </div>
            </div>
            <Calendar className="text-red-600" size={24} />
          </div>
        </div>

        {/* Chart Content */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading chart data...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No chart data available for {gameName}</div>
            </div>
          ) : (
            <div className="font-mono">
              {/* Header Row with Day Names */}
              <div className="flex items-center text-sm mb-2 pb-2 border-b border-gray-200">
                <div className="w-10 sm:w-20 mr-0.5 sm:mr-4 text-gray-600 font-medium text-[8px] sm:text-xs">
                  Week Range
                </div>
                <div className="flex items-center justify-start flex-1 gap-1">
                  {dayOrder.map(day => (
                    <div key={day} className="text-center flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs text-gray-700 font-bold uppercase">
                        {day.slice(0, 3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Data Rows - Traditional Format */}
              <div className="space-y-1">
                {weeklyData.map((week, index) => (
                  <div key={`${week.year}-${week.weekNumber}`} className="flex items-center text-sm">
                    {/* Week Date Range */}
                    <div className="w-10 sm:w-20 text-black font-medium mr-0.5 sm:mr-4 text-[9px] sm:text-xs leading-tight">
                      <div>{getWeekDateRange(week).split(' to ')[0]}</div>
                      <div className="text-center text-[7px] sm:text-xs">to</div>
                      <div>{getWeekDateRange(week).split(' to ')[1]}</div>
                    </div>

                    {/* Days Data in horizontal line - Left to Right */}
                    <div className="flex items-center justify-start flex-1 gap-1">
                      {dayOrder.map(day => {
                        const dayData = week.days[day];
                        return (
                          <div key={day} className="text-center flex-1 min-w-0">
                            {formatResultInline(dayData || null)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          <h3 className="font-bold text-gray-800 mb-2">Legend:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-black font-medium">Open Panna (Left)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-red-600 font-medium">Jodi (Center)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-black font-medium">Close Panna (Right)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}