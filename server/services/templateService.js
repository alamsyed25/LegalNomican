const Template = require('../models/Template');
const User = require('../models/User');
const { marked } = require('marked');
const handlebars = require('handlebars');

class TemplateService {
  constructor() {
    this.registerHandlebarsHelpers();
  }

  // Register custom Handlebars helpers for conditional logic
  registerHandlebarsHelpers() {
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    handlebars.registerHelper('ne', function(a, b) {
      return a !== b;
    });

    handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });
    
    handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });
    
    handlebars.registerHelper('gte', function(a, b) {
      return a >= b;
    });
    
    handlebars.registerHelper('lte', function(a, b) {
      return a <= b;
    });

    handlebars.registerHelper('and', function() {
      return Array.prototype.every.call(arguments, Boolean);
    });

    handlebars.registerHelper('or', function() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    });

    handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        return d.toLocaleDateString();
      }
    });

    handlebars.registerHelper('currency', function(amount, currency = 'USD') {
      if (!amount && amount !== 0) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });
  }

  // Extract variables from content ({{variableName}} syntax)
  extractVariablesFromContent(content) {
    if (!content) return [];
    const variableRegex = /\{\{([\w\.]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      // Skip helper expressions like {{formatDate date}}
      if (!match[1].includes(' ') && !variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }
  
  // Create a new template
  async createTemplate(templateData, userId) {
    try {
      // Validate template structure
      const validation = this.validateTemplate(templateData);
      if (!validation.isValid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Ensure sections have proper order if not already specified
      if (templateData.sections && templateData.sections.length > 0) {
        templateData.sections.forEach((section, index) => {
          if (section.order === undefined) {
            section.order = index;
          }
        });
      }

      const template = new Template({
        ...templateData,
        createdBy: userId,
        version: 1,
        isActive: true,
        usageCount: 0,
        metadata: {
          ...templateData.metadata,
          language: templateData.metadata?.language || 'en'
        }
      });

      await template.save();
      return template;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  // Get all templates for a user (including public ones)
  async getUserTemplates(userId, options = {}) {
    try {
      const { category, tags, isPublic, searchTerm, sortBy, limit = 50, complexity } = options;
      
      // If searchTerm is provided, use the model's static search method
      if (searchTerm) {
        return await Template.searchTemplates(searchTerm, { 
          userId, 
          category, 
          tags 
        });
      }
      
      const query = {
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ],
        isActive: true
      };

      if (category) {
        query.category = category;
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (isPublic !== undefined) {
        query.isPublic = isPublic;
      }
      
      if (complexity) {
        query['metadata.complexity'] = complexity;
      }

      // Determine sort order
      let sortOptions = { updatedAt: -1 };
      if (sortBy === 'popular') {
        sortOptions = { usageCount: -1, 'rating.average': -1 };
      } else if (sortBy === 'rating') {
        sortOptions = { 'rating.average': -1 };
      } else if (sortBy === 'newest') {
        sortOptions = { createdAt: -1 };
      }

      const templates = await Template.find(query)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .limit(limit);

      return templates;
    } catch (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  // Get a specific template by ID
  async getTemplate(templateId, userId) {
    try {
      const template = await Template.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ],
        isActive: true
      }).populate('createdBy', 'name email');

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }
  }

  // Update a template (creates new version)
  async updateTemplate(templateId, updateData, userId) {
    try {
      const existingTemplate = await Template.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!existingTemplate) {
        throw new Error('Template not found or access denied');
      }

      // Create new version
      const newVersion = new Template({
        ...existingTemplate.toObject(),
        ...updateData,
        _id: undefined,
        version: existingTemplate.version + 1,
        parentTemplate: existingTemplate._id,
        updatedAt: new Date()
      });

      // Deactivate old version
      existingTemplate.isActive = false;
      await existingTemplate.save();

      // Save new version
      await newVersion.save();

      return newVersion;
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  // Get template version history
  async getTemplateVersions(templateId, userId) {
    try {
      const template = await Template.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      });

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      // Get all versions (including inactive ones)
      const versions = await Template.find({
        $or: [
          { _id: templateId },
          { parentTemplate: templateId }
        ]
      }).sort({ version: -1 });

      return versions;
    } catch (error) {
      throw new Error(`Failed to get template versions: ${error.message}`);
    }
  }

  // Generate document from template
  async generateDocument(templateId, variables, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);
      
      // Validate variables against template requirements
      const missingRequiredVars = [];
      template.variables.forEach(varDef => {
        if (varDef.required && (variables[varDef.name] === undefined || variables[varDef.name] === null)) {
          missingRequiredVars.push(varDef.name);
        }
      });
      
      if (missingRequiredVars.length > 0) {
        throw new Error(`Missing required variables: ${missingRequiredVars.join(', ')}`);
      }

      // Process main content
      const compiledTemplate = handlebars.compile(template.content);
      let processedContent = compiledTemplate(variables);

      // Process sections if they exist
      let processedSections = [];
      if (template.sections && template.sections.length > 0) {
        // Filter sections based on conditions
        const applicableSections = template.sections.filter(section => {
          // If no conditions or not optional, include it
          if (!section.isOptional || !section.conditions || section.conditions.size === 0) {
            return true;
          }
          
          // Evaluate conditions (simple implementation)
          // For more complex conditions, this would need more logic
          for (const [key, value] of section.conditions) {
            if (variables[key] !== value) {
              return false;
            }
          }
          
          return true;
        });
        
        // Process each applicable section
        processedSections = applicableSections.map(section => {
          const compiledSection = handlebars.compile(section.content);
          let sectionContent = compiledSection(variables);
          
          return {
            id: section.id,
            title: section.title,
            content: sectionContent,
            order: section.order
          };
        }).sort((a, b) => a.order - b.order);
      }

      // Process Markdown if template uses it
      if (template.format === 'markdown') {
        processedContent = marked(processedContent);
        processedSections = processedSections.map(section => {
          return {
            ...section,
            content: marked(section.content)
          };
        });
      }

      // Create document record
      const document = {
        title: this.processString(template.title, variables),
        content: processedContent,
        sections: processedSections,
        templateId: template._id,
        templateVersion: template.version,
        variables: variables,
        generatedBy: userId,
        generatedAt: new Date(),
        format: template.format || 'html',
        metadata: template.metadata
      };

      // Increment template usage count
      await this.incrementTemplateUsage(templateId);

      return document;
    } catch (error) {
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  }

  // Process string with variables (simple replacement)
  processString(template, variables) {
    if (!template || !variables) return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  // Delete template (soft delete)
  async deleteTemplate(templateId, userId) {
    try {
      const template = await Template.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!template) {
        throw new Error('Template not found or access denied');
      }

      template.isActive = false;
      template.deletedAt = new Date();
      await template.save();

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  // Clone template for user
  async cloneTemplate(templateId, userId, customizations = {}) {
    try {
      const originalTemplate = await this.getTemplate(templateId, userId);
      
      const clonedTemplate = new Template({
        ...originalTemplate.toObject(),
        _id: undefined,
        title: `${originalTemplate.title} (Copy)`,
        createdBy: userId,
        version: 1,
        parentTemplate: undefined,
        isPublic: false,
        ...customizations
      });

      await clonedTemplate.save();
      return clonedTemplate;
    } catch (error) {
      throw new Error(`Failed to clone template: ${error.message}`);
    }
  }

  // Get template categories
  async getCategories() {
    try {
      const categories = await Template.distinct('category', { isActive: true });
      return categories.filter(cat => cat); // Remove null/undefined values
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  // Increment template usage count
  async incrementTemplateUsage(templateId) {
    try {
      await Template.updateOne({ _id: templateId }, { $inc: { usageCount: 1 } }).exec();
    } catch (err) {
      console.error(`Error incrementing usage count for template ${templateId}:`, err);
      // Depending on requirements, you might want to re-throw or handle differently if the template is not found.
      // For now, we'll just log the error if it occurs.
    }
  }

  // Add rating to template
  async rateTemplate(templateId, rating, userId) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const template = await this.getTemplate(templateId, userId);
      await template.addRating(rating);
      return template;
    } catch (error) {
      throw new Error(`Failed to rate template: ${error.message}`);
    }
  }

  // Get popular templates
  async getPopularTemplates(limit = 10) {
    try {
      return await Template.findPopular(limit);
    } catch (error) {
      throw new Error(`Failed to get popular templates: ${error.message}`);
    }
  }

  // Get popular tags
  async getPopularTags(limit = 20) {
    try {
      const pipeline = [
        { $match: { isActive: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ];

      const tags = await Template.aggregate(pipeline);
      return tags;
    } catch (error) {
      throw new Error(`Failed to get popular tags: ${error.message}`);
    }
  }

  // Validate template structure and variables/sections
  validateTemplate(templateData) {
    const requiredFields = ['title', 'content', 'category'];
    const errors = [];

    requiredFields.forEach(field => {
      if (!templateData[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Validate Handlebars syntax for main content
    try {
      handlebars.compile(templateData.content);
    } catch (error) {
      errors.push(`Invalid template syntax in main content: ${error.message}`);
    }

    // Validate sections if provided
    if (templateData.sections && templateData.sections.length > 0) {
      templateData.sections.forEach((section, index) => {
        if (!section.id) {
          errors.push(`Section ${index + 1} is missing an ID`);
        }
        if (!section.title) {
          errors.push(`Section ${index + 1} is missing a title`);
        }
        if (!section.content) {
          errors.push(`Section ${index + 1} is missing content`);
        }
        
        // Validate section content syntax
        try {
          handlebars.compile(section.content);
        } catch (error) {
          errors.push(`Invalid template syntax in section '${section.title || index + 1}': ${error.message}`);
        }
      });

      // Validate section IDs are unique
      const sectionIds = templateData.sections.map(s => s.id);
      const uniqueSectionIds = new Set(sectionIds);
      if (sectionIds.length !== uniqueSectionIds.size) {
        errors.push('Section IDs must be unique');
      }
    }

    // Validate variables if provided
    if (templateData.variables && templateData.variables.length > 0) {
      const variableNames = new Set();
      
      templateData.variables.forEach((variable, index) => {
        if (!variable.name) {
          errors.push(`Variable ${index + 1} is missing a name`);
        } else {
          // Check for duplicate variable names
          if (variableNames.has(variable.name)) {
            errors.push(`Duplicate variable name: ${variable.name}`);
          } else {
            variableNames.add(variable.name);
          }
        }

        if (!variable.label) {
          errors.push(`Variable ${variable.name || index + 1} is missing a label`);
        }

        // Type-specific validations
        if (variable.type === 'select' && (!variable.options || variable.options.length === 0)) {
          errors.push(`Select variable '${variable.name || index + 1}' must have options`);
        }

        if (variable.type === 'number') {
          if (variable.validation) {
            if (typeof variable.validation.min === 'number' && 
                typeof variable.validation.max === 'number' && 
                variable.validation.min > variable.validation.max) {
              errors.push(`Variable '${variable.name || index + 1}': min value cannot be greater than max value`);
            }
          }
        }
      });

      // Check if all variables in the content are defined
      const contentVariables = this.extractVariablesFromContent(templateData.content);
      
      // Check sections content too
      if (templateData.sections && templateData.sections.length > 0) {
        templateData.sections.forEach(section => {
          const sectionVars = this.extractVariablesFromContent(section.content);
          sectionVars.forEach(name => {
            if (!contentVariables.includes(name)) {
              contentVariables.push(name);
            }
          });
        });
      }

      // Check for undefined variables in content
      contentVariables.forEach(name => {
        if (!variableNames.has(name)) {
          errors.push(`Variable '${name}' is used in template but not defined`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new TemplateService();
