import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Eye, Hand, Mic, Brain } from 'lucide-react';

const ProviderSuite = ({ onPageChange, onTestSelect }) => {
  const tests = [
    {
      name: 'Face Symmetry',
      icon: Eye,
      type: 'faceSymmetry',
      description: 'Analyze facial landmark symmetry using MediaPipe FaceMesh.',
      duration: '2-3 min',
      difficulty: 'Easy',
      technology: ['MediaPipe', 'FaceMesh'],
      measures: ['Facial symmetry score', 'Left/right comparison', 'Landmark analysis']
    },
    {
      name: 'Eye Tracking',
      icon: Eye,
      type: 'eyeTracking',
      description: 'Track eye movement and gaze patterns with target following.',
      duration: '3-4 min',
      difficulty: 'Medium',
      technology: ['MediaPipe', 'Eye landmarks'],
      measures: ['Gaze accuracy', 'Tracking stability', 'Eye coordination']
    },
    {
      name: 'Pupil Response',
      icon: Eye,
      type: 'pupilResponse',
      description: 'Advanced pupil analysis using OpenCV with light response testing.',
      duration: '2-3 min',
      difficulty: 'Medium',
      technology: ['OpenCV', 'HoughCircles', 'MediaPipe'],
      measures: ['Pupil size', 'Light response', 'Constriction rate']
    },
    {
      name: 'Finger Tap Speed',
      icon: Hand,
      type: 'fingerTapSpeed',
      description: 'Measure finger tapping speed and coordination using hand tracking.',
      duration: '1-2 min',
      difficulty: 'Easy',
      technology: ['MediaPipe', 'Hand landmarks'],
      measures: ['Tap count', 'Speed analysis', 'Rhythm consistency']
    },
    {
      name: 'Sequential Finger Taps',
      icon: Hand,
      type: 'sequentialFingerTaps',
      description: 'Assess fine motor control with sequential finger movements.',
      duration: '2-3 min',
      difficulty: 'Medium',
      technology: ['MediaPipe', 'Hand tracking'],
      measures: ['Sequence accuracy', 'Timing precision', 'Motor control']
    },
    {
      name: 'Visual Tremor',
      icon: Hand,
      type: 'visualTremor',
      description: 'Detect and analyze hand tremor using computer vision.',
      duration: '2-3 min',
      difficulty: 'Medium',
      technology: ['MediaPipe', 'Motion analysis'],
      measures: ['Tremor magnitude', 'Frequency analysis', 'Stability score']
    },
    {
      name: 'Arm Drift',
      icon: Hand,
      type: 'armDrift',
      description: 'Monitor arm position drift using pose detection.',
      duration: '3-4 min',
      difficulty: 'Easy',
      technology: ['MediaPipe', 'Pose landmarks'],
      measures: ['Position drift', 'Left/right comparison', 'Stability over time']
    },
    {
      name: 'Finger to Nose',
      icon: Hand,
      type: 'fingerToNose',
      description: 'Assess coordination with finger-to-nose movement tracking.',
      duration: '2-3 min',
      difficulty: 'Medium',
      technology: ['MediaPipe', 'Hand + Face'],
      measures: ['Coordination accuracy', 'Movement smoothness', 'Target precision']
    },
    {
      name: 'Gait Assessment',
      icon: Brain,
      type: 'gaitAssessment',
      description: 'Analyze walking patterns and balance using full-body pose tracking.',
      duration: '3-5 min',
      difficulty: 'Hard',
      technology: ['MediaPipe', 'Pose tracking'],
      measures: ['Gait symmetry', 'Balance analysis', 'Movement patterns']
    },
    {
      name: 'Speech Collection',
      icon: Mic,
      type: 'speechCollection',
      description: 'Record and analyze speech patterns for neurological assessment.',
      duration: '2-3 min',
      difficulty: 'Easy',
      technology: ['Audio API', 'Recording'],
      measures: ['Audio quality', 'Speech patterns', 'Voice analysis']
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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
          <h1 className="text-3xl font-bold text-blue-300">Provider Suite</h1>
          <p className="text-slate-300 mt-1">Comprehensive neurological testing with advanced AI analysis</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{tests.length}</div>
          <div className="text-sm text-slate-300">Total Tests</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">3</div>
          <div className="text-sm text-slate-300">AI Technologies</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">20+</div>
          <div className="text-sm text-slate-300">Measurements</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">2-5</div>
          <div className="text-sm text-slate-300">Minutes Each</div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {/* Duration and Difficulty */}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration: <span className="text-white">{test.duration}</span></span>
                <span className="text-slate-400">
                  Difficulty: <span className={getDifficultyColor(test.difficulty)}>{test.difficulty}</span>
                </span>
              </div>

              {/* Technology */}
              <div>
                <div className="text-xs font-semibold text-blue-300 mb-1">Technology:</div>
                <div className="flex flex-wrap gap-1">
                  {test.technology.map((tech, index) => (
                    <span key={index} className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Measurements */}
              <div>
                <div className="text-xs font-semibold text-green-300 mb-1">Measures:</div>
                <ul className="text-xs text-slate-300 space-y-0.5">
                  {test.measures.slice(0, 2).map((measure, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-green-400 rounded-full mr-2"></span>
                      {measure}
                    </li>
                  ))}
                  {test.measures.length > 2 && (
                    <li className="text-slate-400">+{test.measures.length - 2} more...</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderSuite;