# Complaint Classification System

This document describes the complete complaint classification and assignment system for the AI agent server.

## Overview

The classification system automatically routes complaints to the correct ministry officials using AI-powered classification with semantic fallback matching. It's designed to be deterministic, reliable, and extensible.

## Architecture

### Core Components

1. **ClassificationEngine** (`classification-core.ts`)
   - Handles OpenAI API calls for primary classification
   - Uses structured JSON responses with confidence scoring
   - Validates results against known ministries/categories

2. **SemanticMatcher** (`semantic-matcher.ts`)
   - Provides fallback when AI confidence is low
   - Uses keyword matching and Levenshtein distance
   - Ensures no undefined ministry/category

3. **ComplaintClassificationService** (`classification-engine.ts`)
   - Orchestrates the entire classification process
   - Manages database taxonomy and caching
   - Handles automatic complaint updates

4. **AI Tool Integration** (`classification-tools.ts`)
   - Provides `classify_complaint` tool for the AI agent
   - Single point of classification logic for the agent

## Classification Process

### 1. Primary AI Classification
```typescript
const classification = await classificationEngine.classify(
  complaintText,
  availableMinistries,
  availableCategories
);
```

- Uses OpenAI GPT-4o-mini with structured JSON output
- Returns ministry, category, confidence, and reasoning
- Validates against known database entries

### 2. Confidence Threshold Check
- If confidence < 0.6 OR results are null → use semantic fallback
- Otherwise proceed with validation

### 3. Semantic Fallback (if needed)
```typescript
const fallback = await semanticMatcher.findBestMatch(
  complaintText,
  ministries,
  categories,
  primaryResult
);
```

- Keyword matching for common Sierra Leone government terms
- Fuzzy string matching using Levenshtein distance
- Always returns a valid ministry/category

### 4. Database Validation
- Ensures ministry exists in database
- Finds closest match if AI returns unknown ministry
- Never leaves ministry/category undefined

### 5. Automatic Complaint Update
```typescript
await classificationService.updateComplaintClassification(
  complaintId,
  classification
);
```

## AI Agent Integration

### classify_complaint Tool
The AI agent has exactly ONE classification tool:

```typescript
{
  name: "classify_complaint",
  description: "Classify a complaint into ministry and category. This is the ONLY tool for classification.",
  parameters: {
    complaintText: string
  }
}
```

### Usage by Agent
The agent calls this tool whenever:
- A new complaint is created
- Classification is needed for routing
- Manual classification is requested

## Automatic Classification in Complaint Creation

When a complaint is created via `create_complaint` tool:

1. Extract complaint description from session
2. Auto-classify using the classification service
3. Update complaint record with classification results
4. Update conversation session with classification data
5. Log classification details for audit

## Database Schema Integration

### Complaint Table Updates
```sql
UPDATE complaint SET
  ministry = :classifiedMinistry,
  category = :classifiedCategory
WHERE id = :complaintId;
```

### Session Table Updates
```sql
UPDATE conversation_session SET
  classifiedMinistry = :ministry,
  classifiedCategory = :category,
  ministry = :ministry,
  category = :category
WHERE sessionId = :sessionId;
```

## Configuration

### ClassificationConfig
```typescript
{
  confidenceThreshold: 0.6,      // Minimum confidence for AI classification
  enableSemanticFallback: true,   // Enable semantic matching
  maxSemanticDistance: 0.3       // Maximum distance for fuzzy matching
}
```

### Environment Variables
```env
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

## Keyword Mappings

### Ministry Keywords
- **Health**: health, hospital, doctor, nurse, medical, clinic, sanitation, disease
- **Education**: school, teacher, student, education, classroom, university, college
- **Works**: road, bridge, construction, building, infrastructure, public works
- **Police**: police, security, crime, arrest, law enforcement, officer
- **Finance**: money, budget, finance, tax, revenue, funding, treasury

### Category Keywords
- **service_delivery**: service, delivery, poor service, slow service, inefficient
- **misconduct**: misconduct, corruption, bribe, unethical, abuse, harassment
- **negligence**: negligent, careless, irresponsible, failure, ignored
- **bureaucracy**: bureaucracy, red tape, paperwork, procedure, process
- **infrastructure**: infrastructure, building, road, bridge, construction

## Error Handling

### Primary Classification Failure
- Returns emergency fallback (Health + service_delivery)
- Logs error for investigation
- Never blocks complaint creation

### Database Validation Failure
- Uses closest string match
- Falls back to first available option
- Maintains system reliability

### Semantic Fallback Failure
- Returns default ministry/category
- Low confidence score (0.1)
- Marks as fallback used

## Performance Optimizations

### Caching
- Database taxonomy cached for 5 minutes
- Reduces database queries during classification
- Automatic cache invalidation

### Parallel Processing
- Ministries and categories fetched concurrently
- Classification and validation run in sequence
- Optimized for response time

## Extensibility

### Adding New Ministries
1. Add ministry to database via migration
2. Update keyword mappings in SemanticMatcher
3. Cache automatically refreshes

### Adding New Categories
1. Add category to database via migration
2. Update keyword mappings in SemanticMatcher
3. No code changes required

### Upgrading Classification Model
1. Modify ClassificationEngine class
2. Maintain same interface
3. Update prompt and validation logic

## Monitoring and Logging

### Classification Events
- Classification start/end with text length
- Primary result with confidence scores
- Fallback usage with match types
- Database updates with complaint IDs

### Error Events
- API failures with error details
- Database connection issues
- Validation failures with context

## Testing

### Unit Tests
- Test each component independently
- Mock OpenAI API responses
- Validate semantic matching algorithms

### Integration Tests
- End-to-end classification flow
- Database integration
- Error scenarios

### Performance Tests
- Classification response time
- Concurrent classification requests
- Cache effectiveness

## Security Considerations

### API Key Protection
- OpenAI API key stored in environment variables
- No hardcoded credentials
- Rate limiting considerations

### Data Privacy
- Complaint text sent to OpenAI API
- No personal data in classification prompts
- Audit logging for compliance

## Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Check complaint text quality
   - Verify ministry/category lists are current
   - Review keyword mappings

2. **Incorrect Ministry Assignment**
   - Update keyword mappings
   - Add new ministries to database
   - Check semantic matching logic

3. **Classification Timeouts**
   - Verify OpenAI API connectivity
   - Check API rate limits
   - Review timeout configurations

### Debug Mode
Enable debug logging:
```env
DEBUG=classification:*
```

## Future Enhancements

### Planned Improvements
1. **Vector Embeddings**: Use embeddings for semantic similarity
2. **Machine Learning**: Train custom classification models
3. **Multi-language**: Support for local languages
4. **Confidence Learning**: Adaptive threshold tuning

### Integration Points
1. **Workflow Automation**: Route to specific officials
2. **Analytics Dashboard**: Classification statistics
3. **Quality Assurance**: Manual review workflow
4. **Performance Metrics**: Classification accuracy tracking

This classification system ensures all complaints are automatically and reliably routed to the appropriate ministry officials with full audit trails and fallback mechanisms.
