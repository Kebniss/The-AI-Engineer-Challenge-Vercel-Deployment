import numpy as np
from collections import defaultdict
from typing import List, Tuple, Callable
from aimakerspace.openai_utils.embedding import EmbeddingModel
import asyncio


def cosine_similarity(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the cosine similarity between two vectors."""
    dot_product = np.dot(vector_a, vector_b)
    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)
    return dot_product / (norm_a * norm_b)


class VectorDatabase:
    def __init__(self, embedding_model: EmbeddingModel = None):
        self.vectors = defaultdict(np.array)
        self.embedding_model = embedding_model or EmbeddingModel()

    def insert(self, key: str, vector: np.array) -> None:
        self.vectors[key] = vector

    def search(
        self,
        query_vector: np.array,
        k: int,
        distance_measure: Callable = cosine_similarity,
    ) -> List[Tuple[str, float]]:
        scores = [
            (key, distance_measure(query_vector, vector))
            for key, vector in self.vectors.items()
        ]
        return sorted(scores, key=lambda x: x[1], reverse=True)[:k]

    def search_by_text(
        self,
        query_text: str,
        k: int,
        distance_measure: Callable = cosine_similarity,
        return_as_text: bool = False,
    ) -> List[Tuple[str, float]]:
        query_vector = self.embedding_model.get_embedding(query_text)
        results = self.search(query_vector, k, distance_measure)
        return [result[0] for result in results] if return_as_text else results

    def retrieve_from_key(self, key: str) -> np.array:
        return self.vectors.get(key, None)

    def _estimate_tokens(self, text: str) -> int:
        """Rough estimation of token count (4 characters per token is a common approximation)"""
        return len(text) // 4

    def _get_batch_size(self, texts: List[str], max_tokens_per_batch: int = 250000) -> int:
        """Calculate optimal batch size to stay under token limit"""
        if not texts:
            return 0
        
        # Estimate tokens for first few texts to determine batch size
        sample_size = min(5, len(texts))
        total_estimated_tokens = sum(self._estimate_tokens(text) for text in texts[:sample_size])
        avg_tokens_per_text = total_estimated_tokens / sample_size
        
        # Calculate how many texts we can process in one batch
        batch_size = max(1, int(max_tokens_per_batch / avg_tokens_per_text))
        
        # Ensure we don't exceed the actual number of texts
        return min(batch_size, len(texts))

    async def abuild_from_list(self, list_of_text: List[str]) -> "VectorDatabase":
        """Build vector database from list of texts, processing in batches to avoid token limits"""
        if not list_of_text:
            return self
        
        # Calculate optimal batch size
        batch_size = self._get_batch_size(list_of_text)
        
        # Process texts in batches
        for i in range(0, len(list_of_text), batch_size):
            batch = list_of_text[i:i + batch_size]
            
            # Estimate tokens for this batch
            batch_tokens = sum(self._estimate_tokens(text) for text in batch)
            print(f"Processing batch {i//batch_size + 1}, estimated tokens: {batch_tokens}")
            
            try:
                embeddings = await self.embedding_model.async_get_embeddings(batch)
                for text, embedding in zip(batch, embeddings):
                    self.insert(text, np.array(embedding))
                print(f"Successfully processed batch {i//batch_size + 1} ({len(batch)} chunks)")
            except Exception as e:
                print(f"Error processing batch {i//batch_size + 1}: {str(e)}")
                # If batch fails, try processing one by one
                for text in batch:
                    try:
                        embedding = await self.embedding_model.async_get_embedding(text)
                        self.insert(text, np.array(embedding))
                    except Exception as single_error:
                        print(f"Failed to process text chunk: {str(single_error)}")
                        continue
        
        return self


if __name__ == "__main__":
    list_of_text = [
        "I like to eat broccoli and bananas.",
        "I ate a banana and spinach smoothie for breakfast.",
        "Chinchillas and kittens are cute.",
        "My sister adopted a kitten yesterday.",
        "Look at this cute hamster munching on a piece of broccoli.",
    ]

    vector_db = VectorDatabase()
    vector_db = asyncio.run(vector_db.abuild_from_list(list_of_text))
    k = 2

    searched_vector = vector_db.search_by_text("I think fruit is awesome!", k=k)
    print(f"Closest {k} vector(s):", searched_vector)

    retrieved_vector = vector_db.retrieve_from_key(
        "I like to eat broccoli and bananas."
    )
    print("Retrieved vector:", retrieved_vector)

    relevant_texts = vector_db.search_by_text(
        "I think fruit is awesome!", k=k, return_as_text=True
    )
    print(f"Closest {k} text(s):", relevant_texts)
