import { FREE_MODELS, DEFAULT_MODEL, type OpenRouterModel } from "@/lib/openrouter";

export const AIModelsOptions = FREE_MODELS.map((model: OpenRouterModel, index: number) => ({
    id: index + 1,
    name: model.name,
    description: model.description,
    ModelApi: model.id,
}));

export { DEFAULT_MODEL };
