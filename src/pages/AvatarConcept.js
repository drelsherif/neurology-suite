import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { 
  ArrowLeft, 
  User, 
  Brain, 
  Eye, 
  Hand, 
  Activity, 
  Cpu, 
  Database, 
  Zap,
  Target,
  GitBranch,
  Layers
} from 'lucide-react';

const AvatarConcept = ({ onPageChange }) => {
  const [activeDemo, setActiveDemo] = useState(null);
  const [showTechModal, setShowTechModal] = useState(false);

  const avatarComponents = [
    {
      title: "Facial Expression Engine",
      icon: Eye,
      description: "Real-time facial landmark mapping drives avatar expressions and eye movements",
      technology: "MediaPipe FaceMesh (468 landmarks)",
      applications: ["Facial symmetry visualization", "Eye tracking representation", "Blink pattern display"],
      dataPoints: "30 FPS landmark tracking",
      accuracy: "Sub-pixel precision"
    },
    {
      title: "Hand Movement System",
      icon: Hand,
      description: "Precise hand and finger tracking controls avatar hand movements and gestures",
      technology: "MediaPipe Hands (21 landmarks per hand)",
      applications: ["Finger tap visualization", "Tremor pattern display", "Coordination assessment"],
      dataPoints: "Bilateral hand tracking",
      accuracy: "3D coordinate mapping"
    },
    {
      title: "Pose & Gait Engine",
      icon: Activity,
      description: "Full body pose estimation drives avatar posture and movement patterns",
      technology: "MediaPipe Pose (33 body landmarks)",
      applications: ["Gait analysis", "Arm drift visualization", "Balance assessment"],
      dataPoints: "Full body tracking",
      accuracy: "Real-time pose estimation"
    },
    {
      title: "Neurological State Mapping",
      icon: Brain,
      description: "Advanced AI algorithms translate test results into avatar behavioral patterns",
      technology: "Custom neural networks + OpenCV",
      applications: ["Symptom visualization", "Progress tracking", "Predictive modeling"],
      dataPoints: "Multi-modal data fusion",
      accuracy: "Clinical-grade analysis"
    }
  ];

  const technicalSpecs = [
    {
      category: "Data Collection",
      icon: Database,
      specs: [
        "468 facial landmarks at 30 FPS",
        "21 hand landmarks per hand at 30 FPS", 
        "33 pose landmarks at 30 FPS",
        "Pupil size and response metrics",
        "Audio features for speech analysis"
      ]
    },
    {
      category: "Processing Pipeline",
      icon: Cpu,
      specs: [
        "Real-time MediaPipe inference",
        "OpenCV computer vision algorithms",
        "Time-series analysis and filtering",
        "Statistical pattern recognition",
        "Machine learning classification"
      ]
    },
    {
      category: "Avatar Rendering",
      icon: Layers,
      specs: [
        "Three.js 3D rendering engine",
        "React Three Fiber integration",
        "Real-time animation blending",
        "Physically-based materials",
        "Responsive design optimization"
      ]
    }
  ];

  const useCases = [
    {
      title: "Clinical Assessment",
      description: "Healthcare providers can visualize patient neurological state in real-time",
      benefits: ["Objective measurement visualization", "Progress tracking over time", "Remote monitoring capabilities"]
    },
    {
      title: "Patient Education", 
      description: "Patients can better understand their condition through visual representation",
      benefits: ["Enhanced patient engagement", "Improved treatment compliance", "Reduced anxiety through understanding"]
    },
    {
      title: "Research & Development",
      description: "Researchers can analyze large-scale neurological data patterns",
      benefits: ["Population-level analysis", "Treatment efficacy studies", "Biomarker discovery"]
    }
  ];

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
          <h1 className="text-3xl font-bold text-blue-300">Twin Avatar Concept</h1>
          <p className="text-slate-300 mt-1">Digital representation technology for personalized neurological care</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-8 rounded-lg mb-12">
        <div className="text-center">
          <User size={80} className="text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">The Future of Personalized Healthcare</h2>
          <p className="text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed">
            The Twin Avatar project creates a digital representation of each patient that accurately reflects 
            their neurological and physiological state. Using advanced computer vision and AI, we transform 
            raw sensor data into an interactive 3D avatar that evolves with the patient's health over time.
          </p>
        </div>
      </div>

      {/* Vision & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Target size={24} className="text-green-400 mr-2" />
            Project Vision
          </h3>
          <p className="text-slate-300 leading-relaxed mb-4">
            To create a comprehensive digital twin that serves as a continuous health monitor, 
            providing real-time insights into neurological function and enabling personalized 
            treatment approaches.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Real-time neurological state visualization
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Predictive health modeling
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Personalized treatment optimization
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Remote monitoring capabilities
            </li>
          </ul>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Zap size={24} className="text-yellow-400 mr-2" />
            Key Innovations
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">Multi-Modal Data Fusion</h4>
              <p className="text-sm text-slate-300">Combining facial, hand, pose, and speech data for comprehensive analysis</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">Real-Time Processing</h4>
              <p className="text-sm text-slate-300">Instant analysis and feedback using WebAssembly and GPU acceleration</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">Clinical Integration</h4>
              <p className="text-sm text-slate-300">Standards-compliant data formats for seamless EHR integration</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">Privacy-First Design</h4>
              <p className="text-sm text-slate-300">Local processing with encrypted data transmission and storage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Components */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <GitBranch size={28} className="text-purple-400 mr-3" />
          Avatar System Components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {avatarComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <Card
                key={index}
                title={component.title}
                icon={Icon}
                description={component.description}
                onClick={() => setActiveDemo(component)}
                className="h-full"
              >
                <div className="mt-4 w-full space-y-3 text-left">
                  <div>
                    <div className="text-xs font-semibold text-blue-300 mb-1">Technology:</div>
                    <p className="text-xs text-slate-300">{component.technology}</p>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-green-300 mb-1">Data Collection:</div>
                    <p className="text-xs text-slate-300">{component.dataPoints}</p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-purple-300 mb-1">Accuracy:</div>
                    <p className="text-xs text-slate-300">{component.accuracy}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <Cpu size={28} className="text-blue-400 mr-3" />
            Technical Specifications
          </h3>
          <Button variant="outline" onClick={() => setShowTechModal(true)}>
            View Full Specs
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {technicalSpecs.map((spec, index) => {
            const Icon = spec.icon;
            return (
              <div key={index} className="bg-slate-800 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Icon size={24} className="text-blue-400 mr-2" />
                  <h4 className="font-semibold text-white">{spec.category}</h4>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {spec.specs.slice(0, 3).map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2"></span>
                      {item}
                    </li>
                  ))}
                  {spec.specs.length > 3 && (
                    <li className="text-slate-400 text-xs">+{spec.specs.length - 3} more...</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-6">Clinical Applications</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-slate-800 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-300 mb-3">{useCase.title}</h4>
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">{useCase.description}</p>
              <div>
                <h5 className="text-xs font-semibold text-green-300 mb-2">Benefits:</h5>
                <ul className="space-y-1">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="text-xs text-slate-300 flex items-center">
                      <span className="w-1 h-1 bg-green-400 rounded-full mr-2"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Current Implementation Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✓</div>
            <div className="text-sm text-slate-300">Data Collection</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✓</div>
            <div className="text-sm text-slate-300">Analysis Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">⚠</div>
            <div className="text-sm text-slate-300">3D Avatar Engine</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">◐</div>
            <div className="text-sm text-slate-300">Clinical Integration</div>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          The NeuroExam app currently provides the foundation for Twin Avatar development with robust 
          data collection and analysis capabilities. The next phase involves implementing the 3D avatar 
          rendering engine and establishing clinical workflow integration.
        </p>
      </div>

      {/* Component Demo Modal */}
      <Modal
        isOpen={!!activeDemo}
        title={activeDemo?.title || "Component Demo"}
        onClose={() => setActiveDemo(null)}
        size="large"
      >
        {activeDemo && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Technology Stack</h4>
              <p className="text-blue-300 font-mono text-sm">{activeDemo.technology}</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Applications</h4>
              <ul className="space-y-1">
                {activeDemo.applications.map((app, index) => (
                  <li key={index} className="text-slate-300 flex items-center text-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {app}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Technical Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-slate-400">Data Points:</span>
                 <p className="text-white">{activeDemo.dataPoints}</p>
               </div>
               <div>
                 <span className="text-slate-400">Accuracy:</span>
                 <p className="text-white">{activeDemo.accuracy}</p>
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
             <h4 className="font-semibold text-blue-300 mb-2">🚀 Future Implementation</h4>
             <p className="text-slate-300 text-sm">
               This component will be integrated with Three.js to provide real-time 3D avatar 
               animation driven by the collected neurological data. The avatar will serve as 
               an intuitive visualization tool for both patients and healthcare providers.
             </p>
           </div>
         </div>
       )}
     </Modal>

     {/* Technical Specifications Modal */}
     <Modal
       isOpen={showTechModal}
       title="Complete Technical Specifications"
       onClose={() => setShowTechModal(false)}
       size="xlarge"
     >
       <div className="space-y-6">
         {technicalSpecs.map((spec, index) => {
           const Icon = spec.icon;
           return (
             <div key={index}>
               <div className="flex items-center mb-3">
                 <Icon size={24} className="text-blue-400 mr-2" />
                 <h4 className="text-lg font-semibold text-white">{spec.category}</h4>
               </div>
               <div className="bg-slate-900 p-4 rounded-lg">
                 <ul className="space-y-2 text-sm text-slate-300">
                   {spec.specs.map((item, itemIndex) => (
                     <li key={itemIndex} className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                       {item}
                     </li>
                   ))}
                 </ul>
               </div>
             </div>
           );
         })}

         <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg">
           <h4 className="text-lg font-semibold text-white mb-3">Implementation Roadmap</h4>
           <div className="space-y-3 text-sm">
             <div className="flex items-center">
               <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
               <span className="text-slate-300">Phase 1: Data Collection & Analysis (Current) ✓</span>
             </div>
             <div className="flex items-center">
               <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
               <span className="text-slate-300">Phase 2: 3D Avatar Engine Development (In Progress)</span>
             </div>
             <div className="flex items-center">
               <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
               <span className="text-slate-300">Phase 3: Clinical Integration & Validation (Planned)</span>
             </div>
             <div className="flex items-center">
               <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
               <span className="text-slate-300">Phase 4: AI Enhancement & Predictive Modeling (Future)</span>
             </div>
           </div>
         </div>
       </div>
     </Modal>
   </div>
 );
};

export default AvatarConcept;