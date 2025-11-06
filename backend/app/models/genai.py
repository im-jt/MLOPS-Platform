from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, Boolean, Text
from datetime import datetime
import enum
from app.db.base import Base


class LLMProvider(str, enum.Enum):
    """LLM provider."""
    OPENAI = "3p_openai"
    ANTHROPIC = "3p_anthropic"
    GOOGLE = "3p_google"
    IN_HOUSE = "in_house"


class LLMStatus(str, enum.Enum):
    """LLM model status."""
    AVAILABLE = "available"
    TRAINING = "training"
    DEPRECATED = "deprecated"


class FineTuningStatus(str, enum.Enum):
    """Fine-tuning job status."""
    PREPARING = "preparing"
    TRAINING = "training"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class LLMModel(Base):
    """LLM model catalog."""
    __tablename__ = "llm_models"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    provider = Column(Enum(LLMProvider), nullable=False, index=True)
    base_model = Column(String, nullable=False)
    version = Column(String)
    
    # Model specs
    size = Column(String)  # small, medium, large, xlarge
    parameter_count = Column(Float)  # In billions
    context_window = Column(Integer, nullable=False)
    
    # Costs
    cost_per_input_token = Column(Float)
    cost_per_output_token = Column(Float)
    
    # Performance
    latency_p50 = Column(Float)
    
    # Capabilities
    capabilities = Column(JSON, nullable=False)
    
    # Fine-tuning
    fine_tuned = Column(Boolean, default=False)
    fine_tune_base_model = Column(String)
    fine_tune_dataset_id = Column(String)
    
    status = Column(Enum(LLMStatus), default=LLMStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.utcnow)


class PromptTemplate(Base):
    """Prompt template management."""
    __tablename__ = "prompt_templates"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    template = Column(Text, nullable=False)
    variables = Column(JSON, default=list)
    
    examples = Column(JSON, default=list)
    category = Column(String, nullable=False, index=True)
    tags = Column(JSON, default=list)
    
    version = Column(String, nullable=False)
    usage_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=False)


class FineTuningJob(Base):
    """LLM fine-tuning job."""
    __tablename__ = "finetuning_jobs"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, nullable=False, index=True)
    base_model_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    
    status = Column(Enum(FineTuningStatus), default=FineTuningStatus.PREPARING, index=True)
    dataset_id = Column(String, nullable=False)
    
    # Training config
    training_config = Column(JSON, nullable=False)
    
    # Resources
    gpu_type = Column(String, nullable=False)
    gpu_count = Column(Integer, nullable=False)
    
    # Progress
    progress = Column(Float, default=0.0)
    metrics = Column(JSON)
    
    # Costs
    estimated_cost = Column(Float)
    actual_cost = Column(Float)
    
    # Results
    resulting_model_id = Column(String)
    error_message = Column(Text)
    
    # Timestamps
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    created_by = Column(String, nullable=False)


class GenAIUsageLog(Base):
    """GenAI usage tracking."""
    __tablename__ = "genai_usage_logs"
    
    id = Column(String, primary_key=True, index=True)
    model_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    project_id = Column(String, index=True)
    
    prompt_tokens = Column(Integer, nullable=False)
    completion_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    latency = Column(Float, nullable=False)
    
    success = Column(Boolean, default=True)
    error_type = Column(String)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
