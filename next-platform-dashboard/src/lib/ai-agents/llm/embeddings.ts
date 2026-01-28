/**
 * Embeddings Service
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Generates embeddings for semantic memory search.
 */

import OpenAI from 'openai'

export class EmbeddingsService {
  private client: OpenAI
  private model: string

  constructor(config: {
    apiKey?: string
    model?: string
  } = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY
    })
    this.model = config.model || 'text-embedding-3-small'
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text
    })
    return response.data[0].embedding
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts
    })
    
    // Sort by index to maintain order
    return response.data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((d: { embedding: number[] }) => d.embedding)
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Find most similar embeddings from a list
   */
  findMostSimilar(
    queryEmbedding: number[],
    embeddings: { id: string; embedding: number[] }[],
    topK: number = 5
  ): { id: string; similarity: number }[] {
    const similarities = embeddings.map(e => ({
      id: e.id,
      similarity: this.cosineSimilarity(queryEmbedding, e.embedding)
    }))
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }
}

// Singleton instance
let embeddingsService: EmbeddingsService | null = null

export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsService) {
    embeddingsService = new EmbeddingsService()
  }
  return embeddingsService
}
