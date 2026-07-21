import yaml
from langchain_core.language_models.chat_models import BaseChatModel


def load_options(path: str) -> any:
    ''' Loads an options file '''

    with open(path, "r") as f:
        options = yaml.safe_load(f)
    
    return options

def disable_thinking(model: BaseChatModel) -> BaseChatModel:
    """Modular function to turn off reasoning across all top LLM providers."""
    provider = model.__class__.__name__.lower()
    
    if "openai" in provider:
        return model.bind(reasoning_effort="minimal")
        
    elif "google" in provider or "gemini" in provider:
        return model.bind(thinking_budget=0)
        
    elif "ollama" in provider:
        return model.bind(reasoning=False)
        
    elif "anthropic" in provider:
        return model.bind(extra_body={"thinking": {"type": "disabled"}})
        
    elif "nvidia" in provider:
        if hasattr(model, "with_thinking_mode"):
            return model.with_thinking_mode(enabled=False)
        return model.bind(thinking_mode=False)
        
    return model