// frontend/src/components/enhanced/DocumentComparison.jsx
import React, { useState, useRef } from 'react';
import { enhancedDocumentService } from '../../services/enhancedDocumentService';

const DocumentComparison = () => {
  const [doc1, setDoc1] = useState('');
  const [doc2, setDoc2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    ignoreWhitespace: false,
    ignoreCase: false,
    comparisonType: 'text'
  });
  const [selectedDiffType, setSelectedDiffType] = useState('wordDiff');
  const [error, setError] = useState(null);

  const fileInput1 = useRef(null);
  const fileInput2 = useRef(null);

  const handleFileUpload = async (file, setDoc) => {
    if (!file) return;
    
    try {
      const text = await file.text();
      setDoc(text);
      setError(null);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file. Please try again.');
    }
  };

  const compareDocuments = async () => {
    if (!doc1.trim() || !doc2.trim()) {
      setError('Please provide both documents for comparison');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await enhancedDocumentService.compareDocuments(
        { content: doc1, title: 'Document 1' },
        { content: doc2, title: 'Document 2' },
        options,
        true // Save result
      );
      
      setComparisonResult(response.data);
    } catch (err) {
      console.error('Comparison failed:', err);
      setError('Failed to compare documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportComparison = async (format) => {
    if (!comparisonResult) return;

    try {
      const data = await enhancedDocumentService.exportComparison(
        comparisonResult.id, 
        format
      );
      
      // Create a blob and download link
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data], 
        { type: format === 'json' ? 'application/json' : 'text/plain' }
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-${comparisonResult.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export comparison. Please try again.');
    }
  };

  const renderDiffView = () => {
    if (!comparisonResult) return null;

    const diff = comparisonResult.comparison[selectedDiffType];
    if (!diff) return null;

    return (
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold">Comparison Result</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select 
              value={selectedDiffType} 
              onChange={(e) => setSelectedDiffType(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            >
              <option value="wordDiff">Word Diff</option>
              <option value="lineDiff">Line Diff</option>
              <option value="characterDiff">Character Diff</option>
              <option value="sentenceDiff">Sentence Diff</option>
            </select>
            <button 
              onClick={() => exportComparison('html')} 
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
            >
              Export HTML
            </button>
            <button 
              onClick={() => exportComparison('json')} 
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
            >
              Export JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {comparisonResult.statistics.similarity}%
              </div>
              <div className="text-sm text-gray-600">Similarity</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comparisonResult.statistics.additionsCount}
              </div>
              <div className="text-sm text-gray-600">Additions</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {comparisonResult.statistics.deletionsCount}
              </div>
              <div className="text-sm text-gray-600">Deletions</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {comparisonResult.statistics.totalChanges}
              </div>
              <div className="text-sm text-gray-600">Total Changes</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="p-4 border-b">
            <h4 className="font-semibold">{diff.type} Comparison</h4>
          </div>
          <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {diff.changes.map((change, index) => (
                <span
                  key={index}
                  className={`inline-block ${
                    change.added
                      ? 'bg-green-100 text-green-800'
                      : change.removed
                      ? 'bg-red-100 text-red-800 line-through'
                      : ''
                  }`}
                >
                  {change.content}
                </span>
              ))}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentInput = (docNumber, doc, setDoc, fileInputRef) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">Document {docNumber}</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.html,.docx,.pdf"
          onChange={(e) => handleFileUpload(e.target.files[0], setDoc)}
          className="hidden"
        />
      </div>
      <textarea
        value={doc}
        onChange={(e) => setDoc(e.target.value)}
        placeholder={`Paste or type document ${docNumber} here...`}
        className="w-full p-3 border border-gray-300 rounded font-mono text-sm h-40"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Document Comparison</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.ignoreWhitespace}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                ignoreWhitespace: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Ignore Whitespace</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                ignoreCase: e.target.checked
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Ignore Case</span>
          </label>
          
          <div>
            <select
              value={options.comparisonType}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                comparisonType: e.target.value
              }))}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="text">Plain Text</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {renderDocumentInput(1, doc1, setDoc1, fileInput1)}
          {renderDocumentInput(2, doc2, setDoc2, fileInput2)}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={compareDocuments}
            disabled={isLoading || !doc1.trim() || !doc2.trim()}
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
              isLoading || !doc1.trim() || !doc2.trim() 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isLoading ? 'Comparing...' : 'Compare Documents'}
          </button>
        </div>
      </div>

      {renderDiffView()}
    </div>
  );
};

export default DocumentComparison;
