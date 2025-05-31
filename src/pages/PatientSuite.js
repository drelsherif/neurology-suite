import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Eye, Hand, Brain, Heart } from 'lucide-react';

const PatientSuite = ({ onPageChange, onTestSelect }) => {
  const tests = [
    {
      name: 'Eye Tracking',
      icon: Eye,
      type: 'eyeTracking',
      description: 'Follow a moving dot with your eyes to test eye coordination.',
      duration: '2 min',
      difficulty: 'Easy',
      benefits: ['Eye coordination', 'Focus ability', 'Visual tracking'],
      instructions: 'Simply follow the red dot with your eyes while keeping your head still.'
    },
    {
      name: 'Finger Tap Test',
      icon: Hand,
      type: 'fingerTapSpeed',
      description: 'Tap your fingers together to measure hand coordination.',
      duration: '1 min',
      difficulty: 'Easy',
      benefits: ['Hand coordination', 'Motor skills', 'Reaction time'],
      instructions: 'Tap your thumb and index finger together as quickly as possible.'
    },
    {
      name: 'Steadiness Test',
      icon: Hand,
      type: 'visualTremor',
      description: 'Hold your hands steady to check for tremors or shaking.',
      duration: '2 min',
      difficulty: 'Easy',
      benefits: ['Hand stability', 'Tremor detection', 'Motor control'],
      instructions: 'Hold your hands out in front of you and keep them as still as possible.'
    },
    {
      name: 'Reaction Time',
      icon: Brain,
      type: 'reactionTime',
      description: 'Test how quickly you can respond to visual signals.',
      duration: '2 min',
      difficulty: 'Easy',
      benefits: ['Mental alertness', 'Response speed', 'Cognitive function'],
      instructions: 'Tap the screen as quickly as possible when it turns green.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          onClick={() => onPageChange('home')}
          variant="secondary"
          className="mr-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-blue-300">Patient Home Suite</h1>
          <p className="text-slate-300 mt-1">Simple tests you can do at home to monitor your health</p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-900/30 to-green-900/30 p-6 rounded-lg mb-8">
        <div className="flex items-center mb-4">
          <Heart size={32} className="text-red-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Welcome to Your Personal Health Monitor</h2>
        </div>
        <p className="text-slate-200 leading-relaxed">
          These simple tests help you track your neurological health from the comfort of your home. 
          Each test takes just a few minutes and provides immediate feedback about your motor skills, 
          coordination, and cognitive function. Regular testing can help you and your healthcare provider 
          monitor changes over time.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{tests.length}</div>
          <div className="text-sm text-slate-300">Quick Tests</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">5</div>
          <div className="text-sm text-slate-300">Minutes Total</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">Easy</div>
          <div className="text-sm text-slate-300">Difficulty</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">Home</div>
          <div className="text-sm text-slate-300">Testing</div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {tests.map(test => (
          <Card
            key={test.type}
            title={test.name}
            icon={test.icon}
            description={test.description}
            onClick={() => onTestSelect ? onTestSelect(test.type) : onPageChange(test.type)}
            className="h-full"
          >
            <div className="mt-4 w-full space-y-3 text-left">
              {/* Duration */}
              <div className="text-sm text-slate-400">
                Duration: <span className="text-white font-medium">{test.duration}</span>
              </div>

              {/* Instructions */}
              <div>
                <div className="text-xs font-semibold text-blue-300 mb-1">How to do it:</div>
                <p className="text-xs text-slate-300 leading-relaxed">{test.instructions}</p>
              </div>

              {/* Benefits */}
              <div>
                <div className="text-xs font-semibold text-green-300 mb-1">What it measures:</div>
                <div className="flex flex-wrap gap-1">
                  {test.benefits.map((benefit, index) => (
                    <span key={index} className="text-xs bg-green-900/30 text-green-200 px-2 py-1 rounded">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Getting Started Guide */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">How to Get Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mx-auto mb-3 text-lg">1</div>
            <h4 className="font-semibold text-white mb-2">Prepare Your Space</h4>
            <p className="text-sm text-slate-300">Find a quiet, well-lit area with your camera at eye level. Make sure you have enough space to move your hands freely.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mx-auto mb-3 text-lg">2</div>
            <h4 className="font-semibold text-white mb-2">Follow Instructions</h4>
            <p className="text-sm text-slate-300">Each test will guide you through simple movements. Take your time and follow the on-screen instructions carefully.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mx-auto mb-3 text-lg">3</div>
            <h4 className="font-semibold text-white mb-2">View Your Results</h4>
            <p className="text-sm text-slate-300">Get instant feedback on your performance and track your progress over time. Share results with your healthcare provider if needed.</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
          <h4 className="font-semibold text-blue-300 mb-2">💡 Tips for Best Results</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Test at the same time each day for consistency</li>
            <li>• Make sure you're well-rested and alert</li>
            <li>• Use good lighting so the camera can see you clearly</li>
            <li>• Complete all tests in one session when possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientSuite;