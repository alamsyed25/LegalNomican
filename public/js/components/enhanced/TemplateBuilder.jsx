// frontend/src/components/enhanced/TemplateBuilder.jsx
import React, { useState, useEffect } from 'react';
import { enhancedDocumentService } from '../../services/enhancedDocumentService';

const TemplateBuilder = ({ onTemplateCreated, editingTemplate = null }) => {
  const [template, setTemplate] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    tags: [],
    format: 'html',
    isPublic: false,
    variables: [],
    sections: []
  });

  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    loadPopularTags();
    
    if (editingTemplate) {
      setTemplate(editingTemplate);
    }
  }, [editingTemplate]);

  const loadCategories = async () => {
    try {
      const response = await enhancedDocumentService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadPopularTags = async () => {
    try {
      const response = await enhancedDocumentService.getPopularTags();
      setPopularTags(response.data || []);
    } catch (error) {
      console.error('Failed to load popular tags:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addVariable = () => {
    const newVariable = {
      name: '',
      type: 'text',
      label: '',
      description: '',
      required: false,
      defaultValue: ''
    };
    
    setTemplate(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }));
  };

  const updateVariable = (index, field, value) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const validateTemplate = () => {
    const newErrors = {};
    
    if (!template.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!template.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!template.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTemplate()) return;
    
    setIsLoading(true);
    try {
      let response;
      if (editingTemplate) {
        response = await enhancedDocumentService.updateTemplate(editingTemplate._id, template);
      } else {
        response = await enhancedDocumentService.createTemplate(template);
      }
      
      onTemplateCreated?.(response.data);
    } catch (error) {
      console.error('Failed to save template:', error);
      setErrors({ general: 'Failed to save template. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const insertVariable = (varName) => {
    const textarea = document.getElementById('template-content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = template.content.substring(0, start);
    const textAfter = template.content.substring(end);
    const newContent = `${textBefore}{{${varName}}}${textAfter}`;
    
    handleInputChange('content', newContent);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + varName.length + 4; // +4 for {{}}
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Render methods for different parts of the form
  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={template.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Enter template title"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={template.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Describe what this template is for..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderTags = () => (
    <div>
      <label className="block text-sm font-medium mb-1">Tags</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {template.tags.map(tag => (
          <span key={tag} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
            {tag}
            <button 
              onClick={() => removeTag(tag)}
              className="ml-1 text-gray-500 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          className="flex-1 p-2 border border-gray-300 rounded"
          placeholder="Add a tag"
        />
        <button 
          onClick={addTag}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Add
        </button>
      </div>
      
      {popularTags.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-1">Popular tags:</p>
          <div className="flex flex-wrap gap-1">
            {popularTags.map(({ tag }) => (
              <span 
                key={tag}
                onClick={() => {
                  if (!template.tags.includes(tag)) {
                    setTemplate(prev => ({
                      ...prev,
                      tags: [...prev.tags, tag]
                    }));
                  }
                }}
                className="inline-block px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderVariables = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Template Variables</h3>
      
      {template.variables.map((variable, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Variable Name</label>
              <input
                type="text"
                value={variable.name}
                onChange={(e) => updateVariable(index, 'name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="variableName"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                value={variable.label}
                onChange={(e) => updateVariable(index, 'label', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Display label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={variable.type}
                onChange={(e) => updateVariable(index, 'type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => insertVariable(variable.name)}
              disabled={!variable.name}
              className={`px-3 py-1 text-sm ${variable.name ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 cursor-not-allowed'} rounded`}
            >
              Insert into Template
            </button>
            <button
              onClick={() => removeVariable(index)}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      
      <button 
        onClick={addVariable}
        className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
      >
        Add Variable
      </button>
    </div>
  );

  const renderContent = () => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium">Content *</label>
        <div className="flex space-x-2">
          <select
            value={template.format}
            onChange={(e) => handleInputChange('format', e.target.value)}
            className="p-1 text-sm border border-gray-300 rounded"
          >
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="text">Plain Text</option>
          </select>
        </div>
      </div>
      
      <textarea
        id="template-content"
        value={template.content}
        onChange={(e) => handleInputChange('content', e.target.value)}
        className={`w-full p-3 border ${errors.content ? 'border-red-500' : 'border-gray-300'} rounded font-mono`}
        placeholder="Enter your template content here. Use {{variableName}} for dynamic content."
        rows={15}
      />
      {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      <p className="text-sm text-gray-600 mt-2">
        Use double curly braces for variables: <code className="bg-gray-100 px-1 rounded">{`{{variableName}}`}</code>
      </p>
    </div>
  );

  const renderCategoryAndVisibility = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Category *</label>
        <div className="relative">
          <select
            value={template.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full p-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="_new">+ Add New Category</option>
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={template.isPublic}
          onChange={(e) => handleInputChange('isPublic', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
          Make this template public
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {editingTemplate ? 'Edit Template' : 'Create New Template'}
      </h2>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {errors.general}
        </div>
      )}
      
      <div className="space-y-6">
        {renderBasicInfo()}
        {renderCategoryAndVisibility()}
        {renderTags()}
        {renderVariables()}
        {renderContent()}
        
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading 
              ? 'Saving...' 
              : editingTemplate 
                ? 'Update Template' 
                : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
