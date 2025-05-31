import React from 'react';
import Card from '../components/ui/Card';
import { FlaskConical, Users, Brain, Stethoscope } from 'lucide-react';

const HomePage = ({ onPageChange }) => {
  const suites = [
    {
      title: "Provider Suite",
      icon: FlaskConical,
      description: "Comprehensive neurological tests with AI-powered analysis for professional use.",
      page: 'providerSuite',
      features: [
        "10 neurological tests",
        "MediaPipe & OpenCV analysis",
        "Detailed clinical reports",
        "Session history tracking"
      ]
    },
    {
      title: "Patient Home Suite",
      icon: Users,
      description: "Simplified tests with computer vision analysis for patients at home.",
      page: 'patientHomeSuite',
      features: [
        "4 simplified tests",
        "Real-time feedback",
        "Easy-to-understand results",
        "Progress tracking"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Brain size={80} className="text-blue-400" />
        </div>
        <h1 className="text-5xl font-extrabold mb-6 text-blue-300">
          NeuroExam Suite
        </h1>
        <h2 className="text-2xl font-semibold text-slate-200 mb-8">
          Your Twin Avatar Project Companion
        </h2>
        <p className="text-xl text-center max-w-3xl mx-auto text-slate-300 leading-relaxed">
          Advanced computer vision analysis of neurological examinations using 
          <span className="text-blue-400 font-semibold"> MediaPipe</span> and 
          <span className="text-green-400 font-semibold"> OpenCV</span>. 
          Building the foundation for accurate Twin Avatar representation.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-800 p-6 rounded-lg text-center">
          <Stethoscope size={48} className="text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Clinical Grade</h3>
          <p className="text-slate-300">Real quantitative measurements for neurological assessment</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg text-center">
          <Brain size={48} className="text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
          <p className="text-slate-300">Advanced computer vision with MediaPipe and OpenCV</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg text-center">
          <Users size={48} className="text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Twin Avatar</h3>
          <p className="text-slate-300">Building digital representations for personalized care</p>
        </div>
      </div>

      {/* Test Suites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {suites.map(suite => (
          <Card
            key={suite.page}
            title={suite.title}
            icon={suite.icon}
            description={suite.description}
            onClick={() => onPageChange(suite.page)}
            className="h-full"
          >
            <div className="mt-4 w-full">
              <h4 className="text-sm font-semibold text-blue-300 mb-3">Features:</h4>
              <ul className="text-sm text-slate-300 space-y-1 text-left">
                {suite.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <div className="mt-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-lg">
        <h3 className="text-2xl font-bold text-white mb-4">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">1</div>
            <h4 className="font-semibold text-white mb-1">Choose Your Suite</h4>
            <p className="text-slate-300">Select Provider Suite for comprehensive testing or Patient Home Suite for simplified assessments.</p>
          </div>
          <div>
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">2</div>
            <h4 className="font-semibold text-white mb-1">Run Tests</h4>
            <p className="text-slate-300">Allow camera access and follow the instructions for each neurological test.</p>
          </div>
          <div>
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-2">3</div>
            <h4 className="font-semibold text-white mb-1">View Results</h4>
            <p className="text-slate-300">Get detailed analysis and track your progress over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;