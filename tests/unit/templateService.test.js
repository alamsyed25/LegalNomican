const mongoose = require('mongoose');
const Template = require('../../server/models/Template');
const templateService = require('../../server/services/templateService');
const { setupTestDB, teardownTestDB } = require('../setup');

describe('Template Service', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Template.deleteMany({});
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const templateData = {
        title: 'Test Template',
        content: 'This is a test template with {{variable}}',
        category: 'test',
        variables: [
          {
            name: 'variable',
            label: 'Test Variable',
            type: 'text',
            description: 'Test variable',
            required: true
          }
        ]
      };

      const userId = new mongoose.Types.ObjectId();
      const template = await templateService.createTemplate(templateData, userId);

      expect(template).toBeDefined();
      expect(template.title).toBe(templateData.title);
      expect(template.content).toBe(templateData.content);
      expect(template.createdBy.toString()).toBe(userId.toString());
      expect(template.isActive).toBe(true);
      expect(template.version).toBe(1);
    });
  });

  describe('getTemplate', () => {
    it('should get a template by ID', async () => {
      const templateData = {
        title: 'Get Template Test',
        content: 'Template content',
        category: 'test',
        isPublic: true
      };

      const userId = new mongoose.Types.ObjectId();
      const createdTemplate = await Template.create({ ...templateData, createdBy: userId });
      
      const template = await templateService.getTemplate(createdTemplate._id, userId);
      
      expect(template).toBeDefined();
      expect(template._id.toString()).toBe(createdTemplate._id.toString());
      expect(template.title).toBe(templateData.title);
    });
  });

  describe('generateDocument', () => {
    it('should generate a document from a template', async () => {
      console.log('Starting generateDocument test...');
      
      // First create a template
      const templateData = {
        title: 'Document Generation Test',
        content: 'Hello, {{name}}! This is a test document.',
        category: 'test',
        isPublic: true,
        variables: [
          {
            name: 'name',
            label: 'Full Name',
            type: 'text',
            required: true
          }
        ]
      };

      console.log('Creating test template...');
      const userId = new mongoose.Types.ObjectId();
      let createdTemplate;
      
      try {
        createdTemplate = await templateService.createTemplate(templateData, userId);
        console.log('Template created:', createdTemplate);
      } catch (error) {
        console.error('Error creating template:', error);
        throw error;
      }
      
      // Verify the template was created
      expect(createdTemplate).toBeDefined();
      expect(createdTemplate._id).toBeDefined();
      
      // Now use the created template's ID to generate a document
      console.log('Generating document from template...');
      const variables = { name: 'Test User' };
      
      try {
        const document = await templateService.generateDocument(createdTemplate._id, variables, userId);
        console.log('Document generated successfully:', document);
        
        expect(document).toBeDefined();
        expect(document.title).toBe(createdTemplate.title);
        expect(document.content).toContain('Hello, Test User!');
      } catch (error) {
        console.error('Error generating document:', error);
        throw error;
      }
    });
  });
});
