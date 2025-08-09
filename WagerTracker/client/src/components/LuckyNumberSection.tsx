import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LuckyNumber {
  id: number;
  numberType: string;
  numberValue: string;
  displayOrder: number;
  isActive: boolean;
}

export default function LuckyNumberSection() {
  const { data: luckyNumbers = [], isLoading } = useQuery<LuckyNumber[]>({
    queryKey: ["/api/lucky-numbers"],
    refetchOnWindowFocus: true, // Only refetch when user returns to page
    staleTime: 30 * 60 * 1000, // Lucky numbers don't change often - fresh for 30 minutes
  });

  // Group numbers by type
  const groupedNumbers = luckyNumbers.reduce((acc, number) => {
    if (!acc[number.numberType]) {
      acc[number.numberType] = [];
    }
    acc[number.numberType].push(number.numberValue);
    return acc;
  }, {} as Record<string, string[]>);

  const formatNumbers = (numbers: string[]) => numbers.join("-");

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-md p-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            <Star className="inline mr-2 text-yellow-600" size={20} />
            Today's Lucky Numbers
          </h3>
          <div className="animate-pulse bg-yellow-600 h-8 rounded mx-auto w-48"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-md p-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          <Star className="inline mr-2 text-yellow-600" size={20} />
          Today's Lucky Numbers
        </h3>
        <div className="text-2xl md:text-3xl font-bold text-gray-800">
          {groupedNumbers.single ? (
            <>Ank (शुभांक): {formatNumbers(groupedNumbers.single)}</>
          ) : (
            <>Ank (शुभांक): Loading...</>
          )}
        </div>
      </div>
    </section>
  );
}
