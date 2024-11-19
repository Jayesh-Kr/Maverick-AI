import { ArrowLeft, Download } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { DropdownButton } from '../components/DropdownButton';
import { jsPDF } from "jspdf";

interface Flag {
  word: string;
  type: 'offensive' | 'spam' | 'inappropriate' | 'hate_speech' | 'profanity' | 'threat' | 'personal_attack' | 'emotional_content';
  reason: string;
  confidence: number;
  context?: string;
}

interface LocationState {
  text: string;
  flags: Flag[];
  overallToxicity: number;
}

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { text, flags, overallToxicity } = location.state as LocationState;

  const getTypeColor = (type: Flag['type']) => {
    switch (type) {
      case 'offensive': return 'bg-red-500/20 text-red-400';
      case 'spam': return 'bg-yellow-500/20 text-yellow-400';
      case 'inappropriate': return 'bg-blue-500/20 text-blue-400';
      case 'hate_speech': return 'bg-purple-500/20 text-purple-400';
      case 'emotional_content': return 'bg-green-500/20 text-green-400';
      case 'threat': return 'bg-orange-500/20 text-orange-400';
      case 'personal_attack': return 'bg-pink-500/20 text-pink-400';
      case 'profanity': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getToxicityLevel = (score: number) => {
    if (score >= 0.8) return 'High Risk';
    if (score >= 0.5) return 'Medium Risk';
    return 'Low Risk';
  };

  const getToxicityColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleDownload = (format: 'pdf' | 'json') => {
    if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Content Moderation Report', 20, 20);
      
      // Add analyzed text
      doc.setFontSize(12);
      doc.text('Analyzed Text:', 20, 40);
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 50);
      
      // Add flags
      doc.setFontSize(12);
      doc.text('Detected Issues:', 20, 90);
      flags.forEach((flag, index) => {
        const yPos = 100 + (index * 10);
        doc.setFontSize(10);
        doc.text(`${flag.type}: ${flag.reason} (${Math.round(flag.confidence * 100)}% confidence)`, 20, yPos);
      });
      
      // Add summary
      doc.setFontSize(12);
      doc.text(`Overall Toxicity: ${Math.round(overallToxicity * 100)}%`, 20, 200);
      
      doc.save('moderation-report.pdf');
    } else {
      // JSON download
      const jsonData = JSON.stringify({ text, flags, overallToxicity }, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moderation-report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/moderate-text')}
        >
          Back to Input
        </Button>
        
        <DropdownButton
          icon={Download}
          items={[
            { 
              label: 'Download PDF', 
              onClick: () => handleDownload('pdf')
            },
            { 
              label: 'Download JSON', 
              onClick: () => handleDownload('json')
            }
          ]}
        >
          Download Report
        </DropdownButton>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Moderation Results</h1>
          <div className="flex items-center space-x-2">
            <p className="text-gray-400">
              Found {flags.length} potential {flags.length === 1 ? 'issue' : 'issues'}
            </p>
            <span className="text-gray-400">•</span>
            <p className={`${getToxicityColor(overallToxicity)}`}>
              {getToxicityLevel(overallToxicity)} ({Math.round(overallToxicity * 100)}% toxicity)
            </p>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Analyzed Text</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>

        <div className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Flagged Content</h2>
          <div className="space-y-4">
            {flags.map((flag, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5"
              >
                <div className={`px-3 py-1 rounded-full text-sm ${getTypeColor(flag.type)}`}>
                  {flag.type.replace('_', ' ')}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">"{flag.word}"</p>
                  <p className="text-sm text-gray-400">{flag.reason}</p>
                </div>
                <div className={`text-sm ${getToxicityColor(flag.confidence)}`}>
                  {Math.round(flag.confidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}