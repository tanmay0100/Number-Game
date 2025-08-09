import { ArrowLeft, Target, Dice1, Palette, Trophy, AlertTriangle, Clock, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function HowToPlay() {
  const { user } = useAuth();

  const handleBackToDashboard = () => {
    window.history.back();
  };

  const gameTypes = [
    {
      name: "Single Digit",
      description: "Choose any single digit from 0-9",
      example: "Example: If you choose 5 and result is 567, you win!",
      payout: "10 का 95",
      icon: Target
    },
    {
      name: "Jodi",
      description: "Choose a 2-digit number from 00-99",
      example: "Example: If you choose 23 and jodi result is 23, you win!",
      payout: "10 का 900",
      icon: Dice1
    },
    {
      name: "Single Pana",
      description: "Choose a 3-digit number where all digits are different",
      example: "Example: 123, 456, 789 (no repeated digits)",
      payout: "10 का 1400",
      icon: Calculator
    },
    {
      name: "Double Pana",
      description: "Choose a 3-digit number where 2 digits are same",
      example: "Example: 112, 223, 556 (two digits same)",
      payout: "10 का 2800",
      icon: Target
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Register & Login",
      description: "Create your account and login to start playing",
      color: "bg-blue-500"
    },
    {
      step: "2", 
      title: "Add Money",
      description: "Add money to your wallet using UPI, Net Banking or Cards",
      color: "bg-green-500"
    },
    {
      step: "3",
      title: "Choose Game",
      description: "Select from Matka, Color King, or Dice Game",
      color: "bg-purple-500"
    },
    {
      step: "4",
      title: "Place Bet",
      description: "Enter your bet amount and choose your numbers",
      color: "bg-orange-500"
    },
    {
      step: "5",
      title: "Wait for Results",
      description: "Results are declared at specific times for each game",
      color: "bg-red-500"
    },
    {
      step: "6",
      title: "Claim Winnings",
      description: "If you win, money is automatically added to your wallet",
      color: "bg-yellow-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">How To Play</h1>

          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">सट्टा मटका कैसे खेलें</h2>
            <p className="text-gray-600 text-lg">Learn how to play Satta Matka and win big prizes!</p>
          </div>

          {/* Steps to Play */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              खेलने के आसान तरीके (Easy Steps to Play)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step) => (
                <div key={step.step} className="bg-gray-50 rounded-lg p-4">
                  <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center text-white font-bold mb-3`}>
                    {step.step}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Game Types */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">खेल के प्रकार (Game Types)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gameTypes.map((game, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <game.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{game.name}</h4>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{game.description}</p>
                  <p className="text-blue-600 text-sm mb-3 italic">{game.example}</p>
                  
                  <div className="bg-green-50 rounded-lg p-2">
                    <span className="text-green-800 font-semibold text-sm">Payout: {game.payout}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result Timings */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              रिजल्ट का समय (Result Timings)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "KALYAN", time: "03:45 PM" },
                { name: "MAIN MUMBAI", time: "09:30 PM" },
                { name: "RAJDHANI DAY", time: "01:00 PM" },
                { name: "MILAN DAY", time: "02:45 PM" }
              ].map((game, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">{game.name}</h4>
                  <div className="text-blue-600 font-bold">{game.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hindi Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">हिंदी में निर्देश (Instructions in Hindi)</h3>
            
            <div className="space-y-4 text-gray-700">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">1. रजिस्ट्रेशन करें</h4>
                <p>सबसे पहले अपना अकाउंट बनाएं और लॉगिन करें।</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold mb-2">2. पैसे जोड़ें</h4>
                <p>अपने वॉलेट में UPI, नेट बैंकिंग या कार्ड से पैसे जोड़ें।</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold mb-2">3. गेम चुनें</h4>
                <p>मटका, कलर किंग या डाइस गेम में से कोई भी चुनें।</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold mb-2">4. बेट लगाएं</h4>
                <p>अपना नंबर चुनें और बेट की रकम डालें।</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold mb-2">5. रिजल्ट का इंतजार करें</h4>
                <p>तय समय पर रिजल्ट देखें और जीतने पर पैसा मिलेगा।</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-3">महत्वपूर्ण सूचना (Important Notice)</h3>
                <ul className="space-y-2 text-red-800 text-sm">
                  <li>• यह एक जुआ खेल है। केवल 18 साल से ऊपर के लोग खेल सकते हैं।</li>
                  <li>• सिर्फ उतना पैसा लगाएं जितना खोने की आप हैसियत रखते हैं।</li>
                  <li>• This is a gambling game. Only 18+ people can play.</li>
                  <li>• Play responsibly and only bet what you can afford to lose.</li>
                  <li>• सभी लेन-देन सुरक्षित और एन्क्रिप्टेड हैं।</li>
                  <li>• All transactions are secure and encrypted.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}