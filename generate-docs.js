#!/usr/bin/env node

/**
 * Automated Technical Documentation Generator
 * 
 * This script orchestrates the complete process of analyzing a codebase
 * and generating comprehensive technical documentation using AI.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Import analyzers
const TechStackAnalyzer = require('./analyzers/tech-stack-analyzer');
const ArchitectureAnalyzer = require('./analyzers/architecture-analyzer');
const CodeExtractor = require('./analyzers/code-extractor');
const FileStructureAnalyzer = require('./analyzers/file-structure-analyzer');

// Import validators
const AccuracyValidator = require('./validators/accuracy-validator');
const CompletenessValidator = require('./validators/completeness-validator');
const ConsistencyValidator = require('./validators/consistency-validator');

// Import AI client
const AIClient = require('./ai-client');

class DocumentationGenerator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.configPath = options.configPath || './config/analysis-config.json';
    this.outputPath = options.outputPath || './output/generated-docs';
    this.config = null;
    this.analysis = null;
    this.aiClient = null;
  }

  async initialize() {
    console.log('🚀 Initializing Documentation Generator...');
    
    // Load configuration
    this.config = await this.loadConfig();
    
    // Initialize AI client
    this.aiClient = new AIClient(this.config.ai);
    
    // Ensure output directory exists
    await fs.mkdir(this.outputPath, { recursive: true });
    
    console.log('✅ Initialization complete');
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      process.exit(1);
    }
  }

  async analyzeCodebase() {
    console.log('🔍 Analyzing codebase...');
    
    const startTime = Date.now();
    
    // Initialize analyzers
    const techStackAnalyzer = new TechStackAnalyzer(this.config);
    const architectureAnalyzer = new ArchitectureAnalyzer(this.config);
    const codeExtractor = new CodeExtractor(this.config);
    const fileStructureAnalyzer = new FileStructureAnalyzer(this.config);

    // Run analysis in parallel where possible
    const [
      techStack,
      architecture,
      codeExamples,
      fileStructure
    ] = await Promise.all([
      techStackAnalyzer.analyze(this.projectRoot),
      architectureAnalyzer.analyze(this.projectRoot),
      codeExtractor.extract(this.projectRoot),
      fileStructureAnalyzer.analyze(this.projectRoot)
    ]);

    // Compile analysis results
    this.analysis = {
      project: {
        name: await this.detectProjectName(),
        description: await this.detectProjectDescription(),
        structure: fileStructure,
        technologies: techStack
      },
      analysis: {
        techStack,
        architecture,
        patterns: architecture.patterns,
        examples: codeExamples,
        configurations: techStack.configurations
      },
      metadata: {
        confidence: this.calculateConfidenceScores(techStack, architecture, codeExamples),
        completeness: this.calculateCompletenessScores(architecture, codeExamples),
        timestamp: new Date().toISOString(),
        analysisTime: Date.now() - startTime
      }
    };

    console.log(`✅ Analysis complete (${Math.round(this.analysis.metadata.analysisTime / 1000)}s)`);
    
    // Save analysis results for debugging
    await this.saveAnalysisResults();
    
    return this.analysis;
  }

  async detectProjectName() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      return packageJson.name || path.basename(this.projectRoot);
    } catch {
      return path.basename(this.projectRoot);
    }
  }

  async detectProjectDescription() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      return packageJson.description || 'No description available';
    } catch {
      return 'No description available';
    }
  }

  calculateConfidenceScores(techStack, architecture, codeExamples) {
    const scores = {};
    
    // Calculate confidence for each domain
    const domains = [
      'authentication', 'components', 'state', 'backgroundJobs',
      'fileStorage', 'database', 'errorHandling', 'testing',
      'integration', 'deployment'
    ];

    domains.forEach(domain => {
      const hasPatterns = architecture.patterns[domain]?.length > 0;
      const hasExamples = codeExamples[domain]?.length > 0;
      const hasConfig = techStack.configurations[domain] !== undefined;
      
      let score = 0;
      if (hasPatterns) score += 0.4;
      if (hasExamples) score += 0.4;
      if (hasConfig) score += 0.2;
      
      scores[domain] = Math.min(score, 1.0);
    });

    return scores;
  }

  calculateCompletenessScores(architecture, codeExamples) {
    const scores = {};
    
    Object.keys(architecture.patterns).forEach(domain => {
      const patterns = architecture.patterns[domain] || [];
      const examples = codeExamples[domain] || [];
      
      // Calculate completeness based on pattern coverage
      const completeness = patterns.length > 0 ? 
        Math.min(examples.length / Math.max(patterns.length, 1), 1.0) : 0;
      
      scores[domain] = completeness;
    });

    return scores;
  }

  async saveAnalysisResults() {
    const analysisPath = path.join(this.outputPath, 'analysis-results.json');
    await fs.writeFile(
      analysisPath, 
      JSON.stringify(this.analysis, null, 2), 
      'utf8'
    );
    console.log(`📊 Analysis results saved to ${analysisPath}`);
  }

  async generateDocumentation() {
    console.log('📝 Generating documentation...');
    
    if (!this.analysis) {
      throw new Error('Analysis must be completed before generating documentation');
    }

    // Load master prompt
    const masterPrompt = await this.loadMasterPrompt();
    
    // Define the 10 essential guides
    const guides = [
      { name: 'authentication-architecture', priority: 1 },
      { name: 'component-architecture', priority: 1 },
      { name: 'state-management-architecture', priority: 1 },
      { name: 'background-jobs-architecture', priority: 2 },
      { name: 'file-storage-architecture', priority: 2 },
      { name: 'database-architecture', priority: 2 },
      { name: 'error-handling-architecture', priority: 3 },
      { name: 'testing-architecture', priority: 3 },
      { name: 'integration-architecture', priority: 3 },
      { name: 'deployment-architecture', priority: 3 }
    ];

    // Sort guides by priority and confidence
    const sortedGuides = guides.sort((a, b) => {
      const aConfidence = this.analysis.metadata.confidence[a.name.replace('-architecture', '')] || 0;
      const bConfidence = this.analysis.metadata.confidence[b.name.replace('-architecture', '')] || 0;
      
      // Primary sort by priority, secondary by confidence
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return bConfidence - aConfidence;
    });

    // Generate each guide
    const results = [];
    for (const guide of sortedGuides) {
      try {
        console.log(`📄 Generating ${guide.name}...`);
        
        const content = await this.generateGuide(guide.name, masterPrompt);
        const filePath = path.join(this.outputPath, `${guide.name}.md`);
        
        await fs.writeFile(filePath, content, 'utf8');
        
        results.push({
          guide: guide.name,
          status: 'success',
          path: filePath,
          confidence: this.analysis.metadata.confidence[guide.name.replace('-architecture', '')] || 0
        });
        
        console.log(`✅ Generated ${guide.name}`);
        
        // Rate limiting delay
        await this.delay(this.config.ai.rateLimitDelay || 100);
        
      } catch (error) {
        console.error(`❌ Failed to generate ${guide.name}:`, error.message);
        results.push({
          guide: guide.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Generate index file
    await this.generateIndex(results);
    
    console.log('✅ Documentation generation complete');
    return results;
  }

  async loadMasterPrompt() {
    const promptPath = path.join(__dirname, 'prompts', 'master-prompt.md');
    return await fs.readFile(promptPath, 'utf8');
  }

  async generateGuide(guideName, masterPrompt) {
    // Prepare context for this specific guide
    const guideContext = {
      ...this.analysis,
      targetGuide: guideName,
      focusArea: guideName.replace('-architecture', '')
    };

    // Create guide-specific prompt
    const guidePrompt = `${masterPrompt}

## Current Task
Generate the "${guideName}" documentation guide for the analyzed codebase.

## Analysis Context
${JSON.stringify(guideContext, null, 2)}

## Instructions
1. Focus specifically on the "${guideName.replace('-architecture', '')}" architectural domain
2. Use only the provided analysis data and code examples
3. Follow the standard guide structure and format requirements
4. Include confidence scores and review flags where appropriate
5. Generate complete, accurate documentation based on the actual codebase

Generate the complete documentation guide now:`;

    // Call AI to generate the guide
    const response = await this.aiClient.generateContent(guidePrompt);
    
    return response;
  }

  async generateIndex(results) {
    const indexContent = this.createIndexContent(results);
    const indexPath = path.join(this.outputPath, 'README.md');
    await fs.writeFile(indexPath, indexContent, 'utf8');
    console.log(`📋 Generated documentation index at ${indexPath}`);
  }

  createIndexContent(results) {
    const successfulGuides = results.filter(r => r.status === 'success');
    const failedGuides = results.filter(r => r.status === 'error');
    
    return `# Technical Documentation - ${this.analysis.project.name}

## Overview
This documentation was automatically generated on ${new Date().toISOString()} using the Automated Technical Documentation Generator.

**Project**: ${this.analysis.project.name}
**Description**: ${this.analysis.project.description}
**Technologies**: ${Object.keys(this.analysis.analysis.techStack.frameworks || {}).join(', ')}

## Generated Guides

### Successfully Generated (${successfulGuides.length})
${successfulGuides.map(guide => {
  const confidence = (guide.confidence * 100).toFixed(0);
  const confidenceEmoji = confidence >= 80 ? '🟢' : confidence >= 60 ? '🟡' : '🔴';
  return `- [${guide.guide.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}](${guide.guide}.md) ${confidenceEmoji} ${confidence}% confidence`;
}).join('\n')}

${failedGuides.length > 0 ? `### Failed to Generate (${failedGuides.length})
${failedGuides.map(guide => `- ${guide.guide}: ${guide.error}`).join('\n')}` : ''}

## Analysis Summary
- **Analysis Time**: ${Math.round(this.analysis.metadata.analysisTime / 1000)}s
- **Files Analyzed**: ${this.analysis.project.structure.totalFiles || 'Unknown'}
- **Technologies Detected**: ${Object.keys(this.analysis.analysis.techStack.frameworks || {}).length}
- **Patterns Identified**: ${Object.values(this.analysis.analysis.patterns || {}).flat().length}

## Quality Metrics
${Object.entries(this.analysis.metadata.confidence).map(([domain, confidence]) => {
  const percentage = (confidence * 100).toFixed(0);
  const emoji = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴';
  return `- **${domain.charAt(0).toUpperCase() + domain.slice(1)}**: ${emoji} ${percentage}%`;
}).join('\n')}

## Next Steps
1. Review generated documentation for accuracy
2. Add project-specific context where needed
3. Validate code examples in your environment
4. Set up documentation maintenance process

---
*Generated by Automated Technical Documentation Generator*`;
  }

  async validateDocumentation() {
    console.log('🔍 Validating generated documentation...');
    
    const accuracyValidator = new AccuracyValidator(this.config);
    const completenessValidator = new CompletenessValidator(this.config);
    const consistencyValidator = new ConsistencyValidator(this.config);

    const validationResults = await Promise.all([
      accuracyValidator.validate(this.outputPath),
      completenessValidator.validate(this.outputPath),
      consistencyValidator.validate(this.outputPath)
    ]);

    console.log('✅ Validation complete');
    return validationResults;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.initialize();
      await this.analyzeCodebase();
      const results = await this.generateDocumentation();
      await this.validateDocumentation();
      
      console.log('🎉 Documentation generation completed successfully!');
      console.log(`📁 Output directory: ${this.outputPath}`);
      
      return results;
    } catch (error) {
      console.error('❌ Documentation generation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  const generator = new DocumentationGenerator(options);
  generator.run();
}

module.exports = DocumentationGenerator;
